import type { Coordinates, TravelMode, RouteStep } from '../types';
import { calculateHaversineDistance } from '../utils/geo';
import { getGeoapifyApiKey } from './geoapifyService';

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  coordinates: [number, number][]; // [lat, lng] array for Leaflet
  mode: TravelMode;
  formattedDistance: string;
  formattedDuration: string;
  steps: RouteStep[];
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = meters / 1000;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return 'Under 1 min';
  }
  const mins = Math.round(seconds / 60);
  if (mins < 60) {
    return `${mins} min${mins > 1 ? 's' : ''}`;
  }
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  if (remainingMins === 0) {
    return `${hours} hr${hours > 1 ? 's' : ''}`;
  }
  return `${hours} hr ${remainingMins} min${remainingMins > 1 ? 's' : ''}`;
}

export function generateFallbackSteps(distanceMeters: number): RouteStep[] {
  const dKm = distanceMeters / 1000;
  return [
    {
      instruction: 'Head toward main road and follow directions',
      distanceMeters: Math.round(distanceMeters * 0.05),
      durationSeconds: 300,
      icon: '⬆️',
    },
    {
      instruction: 'Merge onto primary connecting highway',
      distanceMeters: Math.round(distanceMeters * 0.25),
      durationSeconds: 1200,
      icon: '↗️',
    },
    {
      instruction: `Continue along the main corridor for ${(dKm * 0.45).toFixed(1)} km`,
      distanceMeters: Math.round(distanceMeters * 0.45),
      durationSeconds: 2400,
      icon: '⬆️',
    },
    {
      instruction: 'Take the exit toward destination junction',
      distanceMeters: Math.round(distanceMeters * 0.20),
      durationSeconds: 900,
      icon: '↘️',
    },
    {
      instruction: 'Arrive at destination alarm zone',
      distanceMeters: Math.round(distanceMeters * 0.05),
      durationSeconds: 120,
      icon: '🏁',
    },
  ];
}

// In-memory cache to eliminate duplicate network requests and prevent flickering
const routeCache = new Map<string, RouteResult>();

function getCacheKey(start: Coordinates, end: Coordinates, mode: TravelMode, waypoints: Coordinates[] = []): string {
  const wpStr = waypoints.map(w => `${w.lat.toFixed(5)},${w.lng.toFixed(5)}`).join('-');
  return `${start.lat.toFixed(5)},${start.lng.toFixed(5)}_${wpStr}_${end.lat.toFixed(5)},${end.lng.toFixed(5)}_${mode}`;
}

/**
 * Fetch directions and high-precision road geometry between points with optional intermediate stops
 * First attempts Geoapify Routing API; seamlessly falls back to OSRM road network.
 */
export async function getDirections(
  start: Coordinates,
  end: Coordinates,
  mode: TravelMode = 'transit',
  apiKey?: string,
  waypoints: Coordinates[] = []
): Promise<RouteResult> {
  const cacheKey = getCacheKey(start, end, mode, waypoints);
  const cached = routeCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const geoapifyKey = getGeoapifyApiKey(apiKey);
  const allPoints = [start, ...waypoints, end];

  // 1. Try Geoapify Routing API
  if (geoapifyKey) {
    try {
      const geoapifyMode =
        mode === 'walking'
          ? 'walk'
          : mode === 'bike'
          ? 'bicycle'
          : mode === 'transit'
          ? 'transit'
          : 'drive';

      const waypointsParam = allPoints.map(pt => `${pt.lat},${pt.lng}`).join('|');
      const url = `https://api.geoapify.com/v1/routing?waypoints=${waypointsParam}&mode=${geoapifyMode}&apiKey=${geoapifyKey}&details=instruction_details`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6500);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          const feat = data.features[0];
          const props = feat.properties;
          const geom = feat.geometry;

          let leafletCoords: [number, number][] = [];
          if (geom.type === 'MultiLineString') {
            leafletCoords = geom.coordinates.flat().map((pt: [number, number]) => [pt[1], pt[0]]);
          } else if (geom.type === 'LineString') {
            leafletCoords = geom.coordinates.map((pt: [number, number]) => [pt[1], pt[0]]);
          }

          const distanceMeters = props.distance || 0;
          const durationSeconds = Math.round(props.time || 0);

          let parsedSteps: RouteStep[] = [];
          if (props.legs && props.legs.length > 0) {
            props.legs.forEach((leg: any) => {
              if (leg.steps && leg.steps.length > 0) {
                leg.steps.forEach((st: any) => {
                  parsedSteps.push({
                    instruction: st.instruction?.text || 'Continue along the route',
                    distanceMeters: st.distance || 0,
                    durationSeconds: st.time || 0,
                    icon: st.instruction?.type === 'Turn' ? '↪️' : '⬆️',
                  });
                });
              }
            });
          }

          if (parsedSteps.length === 0) {
            parsedSteps = generateFallbackSteps(distanceMeters);
          }

          const result: RouteResult = {
            distanceMeters,
            durationSeconds,
            coordinates: leafletCoords,
            mode,
            formattedDistance: formatDistance(distanceMeters),
            formattedDuration: formatDuration(durationSeconds),
            steps: parsedSteps,
          };

          routeCache.set(cacheKey, result);
          return result;
        }
      }
    } catch (err) {
      console.warn('Geoapify Routing failed, attempting OSRM fallback:', err);
    }
  }

  // 2. High-precision OSRM Road Fallback
  const osrmProfile = mode === 'walking' ? 'walking' : mode === 'bike' ? 'bike' : 'driving';
  try {
    const osrmCoords = allPoints.map(pt => `${pt.lng},${pt.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/${osrmProfile}/${osrmCoords}?overview=full&geometries=geojson&steps=true`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const rawCoords: [number, number][] = route.geometry?.coordinates || [];
        const leafletCoords: [number, number][] = rawCoords.map((pt) => [pt[1], pt[0]]);

        let duration = route.duration || 0;
        if (mode === 'transit') {
          duration = Math.round(route.duration * 1.3);
        }

        let parsedSteps: RouteStep[] = [];
        if (route.legs && route.legs.length > 0) {
          route.legs.forEach((leg: any) => {
            if (leg.steps && leg.steps.length > 0) {
              leg.steps.forEach((st: any) => {
                parsedSteps.push({
                  instruction: st.maneuver?.instruction || `Head along ${st.name || 'the road'}`,
                  distanceMeters: Math.round(st.distance || 0),
                  durationSeconds: Math.round(st.duration || 0),
                  icon: st.maneuver?.type?.includes('turn') ? '↪️' : '⬆️',
                });
              });
            }
          });
        }

        if (parsedSteps.length === 0) {
          parsedSteps = generateFallbackSteps(route.distance);
        }

        const result: RouteResult = {
          distanceMeters: Math.round(route.distance),
          durationSeconds: Math.round(duration),
          coordinates: leafletCoords,
          mode,
          formattedDistance: formatDistance(route.distance),
          formattedDuration: formatDuration(duration),
          steps: parsedSteps,
        };

        routeCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    console.warn('OSRM routing failed, using haversine fallback:', err);
  }

  // 3. Haversine direct calculation fallback
  const straightMeters = Math.round(calculateHaversineDistance(start, end));
  const speeds: Record<TravelMode, number> = {
    driving: 11.1,
    transit: 8.3,
    bike: 4.5,
    walking: 1.4,
  };
  const duration = Math.round(straightMeters / speeds[mode]);

  const fallbackResult: RouteResult = {
    distanceMeters: straightMeters,
    durationSeconds: duration,
    coordinates: [
      [start.lat, start.lng],
      [end.lat, end.lng],
    ],
    mode,
    formattedDistance: formatDistance(straightMeters),
    formattedDuration: formatDuration(duration),
    steps: generateFallbackSteps(straightMeters),
  };

  return fallbackResult;
}
