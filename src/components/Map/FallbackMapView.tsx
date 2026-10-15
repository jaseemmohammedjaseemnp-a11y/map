import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { Navigation } from 'lucide-react';
import type { Coordinates, Destination, GPSReading, MapTileStyle, TravelMode } from '../../types';
import type { RouteResult } from '../../services/routingService';
import { getGeoapifyApiKey } from '../../services/geoapifyService';

interface FallbackMapViewProps {
  currentPosition: GPSReading | null;
  origin?: Destination | null;
  destination: Destination | null;
  stops?: Destination[];
  routeCoordinates?: [number, number][] | null;
  routeInfo?: RouteResult | null;
  radiusMeters: number;
  isArrived: boolean;
  onSelectCoordinates: (coords: Coordinates) => void;
  geoapifyApiKey?: string;
  mapStyle?: MapTileStyle;
  className?: string;
  isTraveling?: boolean;
  travelMode?: TravelMode;
  travelingCoords?: Coordinates | null;
  travelingHeading?: number;
}

export const FallbackMapView: React.FC<FallbackMapViewProps> = ({
  currentPosition,
  origin,
  destination,
  stops = [],
  routeCoordinates,
  routeInfo,
  radiusMeters,
  isArrived,
  onSelectCoordinates,
  geoapifyApiKey = '',
  mapStyle = 'osm-carto',
  className = '',
  isTraveling = false,
  travelMode = 'transit',
  travelingCoords = null,
  travelingHeading = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const roadsLayerRef = useRef<L.TileLayer | null>(null);
  const labelsLayerRef = useRef<L.TileLayer | null>(null);

  // Layer references
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userAccuracyCircleRef = useRef<L.Circle | null>(null);
  const originMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const destRadiusCircleRef = useRef<L.Circle | null>(null);
  const stopMarkersRef = useRef<L.Marker[]>([]);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const routeGlowRef = useRef<L.Polyline | null>(null);
  const midRouteMarkerRef = useRef<L.Marker | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);

  // Camera & Tracking state
  const [followVehicle, setFollowVehicle] = useState<boolean>(true);
  const lastFittedRouteKeyRef = useRef<string>('');
  const lastPanTimeRef = useRef<number>(0);
  const initialCenteredRef = useRef<boolean>(false);

  const resolvedGeoapifyKey = getGeoapifyApiKey(geoapifyApiKey);
  const isUsingGeoapify = Boolean(resolvedGeoapifyKey && resolvedGeoapifyKey.trim().length > 0);

  const onSelectCoordinatesRef = useRef(onSelectCoordinates);
  useEffect(() => {
    onSelectCoordinatesRef.current = onSelectCoordinates;
  }, [onSelectCoordinates]);

  const isTravelingRef = useRef(isTraveling);
  useEffect(() => {
    isTravelingRef.current = isTraveling;
  }, [isTraveling]);

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current) return;

    // Default center to Kerala / South India region
    const initialLat = 11.2588;
    const initialLng = 75.7804;

    const map = L.map(containerRef.current, {
      center: [initialLat, initialLng],
      zoom: 11,
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true, // High performance 60fps canvas rendering for lines and circles
    });

    // Handle map clicks for precise destination selection
    map.on('click', (e: L.LeafletMouseEvent) => {
      const lat = Number(e.latlng.lat.toFixed(6));
      const lng = Number(e.latlng.lng.toFixed(6));
      if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 85) {
        onSelectCoordinatesRef.current({ lat, lng });
      }
    });

    // Detect user manual dragging to pause automatic camera snapping
    map.on('dragstart', () => {
      if (isTravelingRef.current) {
        setFollowVehicle(false);
      }
    });

    mapRef.current = map;

    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);


  // Update Tile Layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }
    if (roadsLayerRef.current) {
      map.removeLayer(roadsLayerRef.current);
      roadsLayerRef.current = null;
    }
    if (labelsLayerRef.current) {
      map.removeLayer(labelsLayerRef.current);
      labelsLayerRef.current = null;
    }

    if (mapStyle === 'satellite') {
      // 1. Base Satellite Imagery (ArcGIS World Imagery)
      const satUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      const satLayer = L.tileLayer(satUrl, {
        maxZoom: 19,
        minZoom: 2,
        tileSize: 256,
        zoomOffset: 0,
      });
      satLayer.addTo(map);
      tileLayerRef.current = satLayer;

      // 2. High-contrast Roads & Highways Overlay
      const roadsUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}';
      const roadsLayer = L.tileLayer(roadsUrl, {
        maxZoom: 19,
        minZoom: 2,
        tileSize: 256,
        zoomOffset: 0,
        opacity: 0.9,
      });
      roadsLayer.addTo(map);
      roadsLayerRef.current = roadsLayer;

      // 3. Clear Place Names, Cities, Towns, and Landmark Labels Overlay
      const labelsUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';
      const labelsLayer = L.tileLayer(labelsUrl, {
        maxZoom: 19,
        minZoom: 2,
        tileSize: 256,
        zoomOffset: 0,
        opacity: 1.0,
      });
      labelsLayer.addTo(map);
      labelsLayerRef.current = labelsLayer;
    } else if (isUsingGeoapify && mapStyle !== 'osm-carto') {
      const url = `https://maps.geoapify.com/v1/tile/${mapStyle}/{z}/{x}/{y}@2x.png?apiKey=${resolvedGeoapifyKey}`;
      const tileLayer = L.tileLayer(url, {
        maxZoom: 19,
        minZoom: 2,
        tileSize: 512,
        zoomOffset: -1,
      });
      tileLayer.addTo(map);
      tileLayerRef.current = tileLayer;
    } else {
      const url = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      const tileLayer = L.tileLayer(url, {
        maxZoom: 19,
        minZoom: 2,
      });
      tileLayer.addTo(map);
      tileLayerRef.current = tileLayer;
    }

    const tilePane = containerRef.current?.querySelector('.leaflet-tile-pane') as HTMLElement | null;
    if (tilePane) {
      tilePane.style.filter = mapStyle === 'satellite' ? 'contrast(1.03) brightness(0.98)' : 'none';
    }
  }, [mapStyle, resolvedGeoapifyKey, isUsingGeoapify]);

  // Update User Position & Accuracy Circle with high accuracy anchor
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (
      !currentPosition ||
      isNaN(currentPosition.lat) ||
      isNaN(currentPosition.lng) ||
      Math.abs(currentPosition.lat) > 85
    ) {
      if (userMarkerRef.current) {
        map.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }
      if (userAccuracyCircleRef.current) {
        map.removeLayer(userAccuracyCircleRef.current);
        userAccuracyCircleRef.current = null;
      }
      return;
    }

    const userLatLng: L.LatLngTuple = [currentPosition.lat, currentPosition.lng];

    // Auto-center map on user's first valid GPS fix if no route is loaded yet
    if (!initialCenteredRef.current && !routeCoordinates && !destination) {
      initialCenteredRef.current = true;
      map.setView(userLatLng, 15);
    }

    // High accuracy centered user icon with directional cone if heading is known
    const headingCone = currentPosition.heading !== null && currentPosition.heading !== undefined ? `
      <div style="position: absolute; width: 36px; height: 36px; border-radius: 9999px; transform: rotate(${currentPosition.heading}deg); display: flex; justify-content: center; pointer-events: none;">
        <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 10px solid #2563eb; margin-top: -8px;"></div>
      </div>
    ` : '';

    const userIcon = L.divIcon({
      className: 'bg-transparent border-none',
      html: `
        <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; pointer-events: none;">
          <span style="position: absolute; width: 40px; height: 40px; border-radius: 9999px; background: rgba(37, 99, 235, 0.22); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
          ${headingCone}
          <div style="width: 16px; height: 16px; border-radius: 9999px; background: #2563eb; border: 3px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.4); z-index: 2;"></div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker(userLatLng, { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
    } else {
      userMarkerRef.current.setLatLng(userLatLng);
      userMarkerRef.current.setIcon(userIcon);
    }

    const accuracyM = Math.max(10, Math.min(currentPosition.accuracy || 20, 1500));
    if (!userAccuracyCircleRef.current) {
      userAccuracyCircleRef.current = L.circle(userLatLng, {
        radius: accuracyM,
        color: '#2563eb',
        weight: 1,
        fillColor: '#2563eb',
        fillOpacity: 0.1,
      }).addTo(map);
    } else {
      userAccuracyCircleRef.current.setLatLng(userLatLng);
      userAccuracyCircleRef.current.setRadius(accuracyM);
    }
  }, [currentPosition, routeCoordinates, destination]);

  // Update Origin Marker with needle tip anchor
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!origin || isNaN(origin.lat) || isNaN(origin.lng) || Math.abs(origin.lat) > 85) {
      if (originMarkerRef.current) {
        map.removeLayer(originMarkerRef.current);
        originMarkerRef.current = null;
      }
      return;
    }

    const originLatLng: L.LatLngTuple = [origin.lat, origin.lng];

    // Origin pin: 30px width x 40px height with tip anchored exactly at [15, 40]
    const originIcon = L.divIcon({
      className: 'bg-transparent border-none',
      html: `
        <div style="position: relative; width: 30px; height: 40px; pointer-events: none;">
          <!-- Origin label badge above the pin -->
          <div style="position: absolute; bottom: 44px; left: 50%; transform: translateX(-50%); font-weight: 800; font-size: 11px; color: #14221d; background: rgba(255,255,255,0.95); padding: 2px 8px; border-radius: 9999px; box-shadow: 0 2px 8px rgba(0,0,0,0.25); white-space: nowrap; border: 1px solid #ded5c5;">
            ${origin.name || 'Start'}
          </div>
          <!-- Precision SVG pin -->
          <svg width="30" height="40" viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35));">
            <path d="M15 0C6.71573 0 0 6.71573 0 15C0 24.2 13.5 38.6 14.1 39.2C14.6 39.7 15.4 39.7 15.9 39.2C16.5 38.6 30 24.2 30 15C30 6.71573 23.2843 0 15 0Z" fill="#2563eb"/>
            <circle cx="15" cy="15" r="6" fill="#ffffff"/>
            <circle cx="15" cy="15" r="3" fill="#1d4ed8"/>
          </svg>
        </div>
      `,
      iconSize: [30, 40],
      iconAnchor: [15, 40],
    });

    if (!originMarkerRef.current) {
      originMarkerRef.current = L.marker(originLatLng, { icon: originIcon, zIndexOffset: 950 }).addTo(map);
    } else {
      originMarkerRef.current.setLatLng(originLatLng);
      originMarkerRef.current.setIcon(originIcon);
    }
  }, [origin]);

  // Update Destination & Alarm Radius Circle with razor-sharp tip anchor
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (
      !destination ||
      isNaN(destination.lat) ||
      isNaN(destination.lng) ||
      Math.abs(destination.lat) > 85
    ) {
      if (destMarkerRef.current) {
        map.removeLayer(destMarkerRef.current);
        destMarkerRef.current = null;
      }
      if (destRadiusCircleRef.current) {
        map.removeLayer(destRadiusCircleRef.current);
        destRadiusCircleRef.current = null;
      }
      return;
    }

    const destLatLng: L.LatLngTuple = [destination.lat, destination.lng];

    // Precision Destination Teardrop Needle Pin: 32px width x 44px height, tip anchored exactly at [16, 44]
    const destIcon = L.divIcon({
      className: 'bg-transparent border-none',
      html: `
        <div style="position: relative; width: 32px; height: 44px; pointer-events: none;">
          <!-- Destination Name Pill above pin -->
          <div style="position: absolute; bottom: 48px; left: 50%; transform: translateX(-50%); font-weight: 800; font-size: 12px; color: #14221d; background: rgba(255,255,255,0.96); padding: 3px 10px; border-radius: 9999px; box-shadow: 0 3px 10px rgba(0,0,0,0.25); white-space: nowrap; border: 1.5px solid #dc2626; display: flex; align-items: center; gap: 4px;">
            <span style="color: #dc2626;">📍</span>
            <span>${destination.name || 'Destination'}</span>
          </div>
          <!-- Precision Red SVG Pin needle -->
          <svg width="32" height="44" viewBox="0 0 32 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.38));">
            <path d="M16 0C7.16344 0 0 7.16344 0 16C0 26.5 14.4 42.5 15.1 43.2C15.6 43.7 16.4 43.7 16.9 43.2C17.6 42.5 32 26.5 32 16C32 7.16344 24.8366 0 16 0Z" fill="#dc2626"/>
            <circle cx="16" cy="16" r="6.5" fill="#ffffff"/>
            <circle cx="16" cy="16" r="3.5" fill="#b91c1c"/>
          </svg>
        </div>
      `,
      iconSize: [32, 44],
      iconAnchor: [16, 44],
    });

    if (!destMarkerRef.current) {
      destMarkerRef.current = L.marker(destLatLng, { icon: destIcon, zIndexOffset: 980 }).addTo(map);
    } else {
      destMarkerRef.current.setLatLng(destLatLng);
      destMarkerRef.current.setIcon(destIcon);
    }

    const circleColor = isArrived ? '#ef4444' : '#c28b38';
    const circleFillOpacity = isArrived ? 0.35 : 0.12;

    if (!destRadiusCircleRef.current) {
      destRadiusCircleRef.current = L.circle(destLatLng, {
        radius: radiusMeters,
        color: circleColor,
        weight: isArrived ? 3 : 2,
        dashArray: isArrived ? undefined : '5, 5',
        fillColor: circleColor,
        fillOpacity: circleFillOpacity,
      }).addTo(map);
    } else {
      destRadiusCircleRef.current.setLatLng(destLatLng);
      destRadiusCircleRef.current.setRadius(radiusMeters);
      destRadiusCircleRef.current.setStyle({
        color: circleColor,
        fillColor: circleColor,
        fillOpacity: circleFillOpacity,
        weight: isArrived ? 3 : 2,
        dashArray: isArrived ? undefined : '5, 5',
      });
    }
  }, [destination, radiusMeters, isArrived]);

  // Update Intermediate Stop Markers along the route
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    stopMarkersRef.current.forEach((m) => map.removeLayer(m));
    stopMarkersRef.current = [];

    if (!stops || stops.length === 0) return;

    const newMarkers = stops.map((stopItem, idx) => {
      const stopLatLng: L.LatLngTuple = [stopItem.lat, stopItem.lng];
      const stopIcon = L.divIcon({
        className: 'bg-transparent border-none',
        html: `
          <div style="position: relative; width: 32px; height: 40px; pointer-events: none;">
            <div style="position: absolute; bottom: 44px; left: 50%; transform: translateX(-50%); font-weight: 800; font-size: 11px; color: #14221d; background: rgba(255,255,255,0.96); padding: 2px 8px; border-radius: 9999px; box-shadow: 0 2px 8px rgba(0,0,0,0.25); white-space: nowrap; border: 1.5px solid #d97706; display: flex; align-items: center; gap: 4px;">
              <span style="color: #d97706; font-weight: 900;">Stop ${idx + 1}:</span>
              <span>${stopItem.name}</span>
            </div>
            <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.32));">
              <path d="M16 0C7.16344 0 0 7.16344 0 16C0 25.5 14.4 38.8 15.1 39.4C15.6 39.9 16.4 39.9 16.9 39.4C17.6 38.8 32 25.5 32 16C32 7.16344 24.8366 0 16 0Z" fill="#d97706"/>
              <circle cx="16" cy="16" r="7.5" fill="#ffffff"/>
              <text x="16" y="20" text-anchor="middle" font-size="11" font-weight="900" fill="#d97706">${idx + 1}</text>
            </svg>
          </div>
        `,
        iconSize: [32, 40],
        iconAnchor: [16, 40],
      });
      return L.marker(stopLatLng, { icon: stopIcon, zIndexOffset: 960 }).addTo(map);
    });

    stopMarkersRef.current = newMarkers;
  }, [stops]);

  // Update Route Polyline & Mid-Route Duration Pill with stable bounds fitting
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    let pts: [number, number][] = [];

    if (routeCoordinates && routeCoordinates.length > 0) {
      pts = routeCoordinates;
    } else {
      const startPt = origin || currentPosition;
      if (startPt && destination) {
        pts = [
          [startPt.lat, startPt.lng],
          [destination.lat, destination.lng],
        ];
      }
    }

    if (pts.length >= 2) {
      // Glow underlay polyline
      if (!routeGlowRef.current) {
        routeGlowRef.current = L.polyline(pts, {
          color: '#0c2b21',
          weight: 7,
          opacity: 0.25,
        }).addTo(map);
      } else {
        routeGlowRef.current.setLatLngs(pts);
      }

      // Main dark forest green polyline matching the design
      if (!routeLineRef.current) {
        routeLineRef.current = L.polyline(pts, {
          color: '#0c2b21',
          weight: 5,
          opacity: 0.95,
        }).addTo(map);
      } else {
        routeLineRef.current.setLatLngs(pts);
      }

      // Mid-route duration pill on the map
      const midIndex = Math.floor(pts.length / 2);
      const midCoord = pts[midIndex];
      const durationText = routeInfo?.formattedDuration || 'Directions ready';
      const distanceText = routeInfo?.formattedDistance || '';
      const modeEmoji = travelMode === 'transit' ? '🚌' : travelMode === 'bike' ? '🚲' : travelMode === 'walking' ? '🚶' : '🚗';

      const midPillIcon = L.divIcon({
        className: 'bg-transparent border-none',
        html: `
          <div style="padding: 6px 12px; border-radius: 9999px; background: #0c2b21; color: #ffffff; font-size: 11px; font-weight: 800; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 14px rgba(12,43,33,0.35); white-space: nowrap; pointer-events: none;">
            <span>${modeEmoji}</span>
            <span>${durationText}</span>
            ${distanceText ? `<span style="opacity: 0.4;">•</span><span>${distanceText}</span>` : ''}
          </div>
        `,
        iconSize: [140, 32],
        iconAnchor: [70, 16],
      });

      if (!midRouteMarkerRef.current) {
        midRouteMarkerRef.current = L.marker(midCoord, { icon: midPillIcon, zIndexOffset: 920 }).addTo(map);
      } else {
        midRouteMarkerRef.current.setLatLng(midCoord);
        midRouteMarkerRef.current.setIcon(midPillIcon);
      }

      // FIT BOUNDS ONLY ONCE PER ROUTE (Avoid snapping camera back while traveling or tracking)
      const currentRouteKey = `${pts[0][0].toFixed(4)},${pts[0][1].toFixed(4)}->${pts[pts.length - 1][0].toFixed(4)},${pts[pts.length - 1][1].toFixed(4)}`;
      if (currentRouteKey !== lastFittedRouteKeyRef.current && !isTraveling) {
        lastFittedRouteKeyRef.current = currentRouteKey;
        try {
          const bounds = L.latLngBounds(pts);
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [80, 80], maxZoom: 14 });
          }
        } catch {
          // Fallback if bounds computation fails
        }
      }
    } else {
      if (routeLineRef.current) {
        map.removeLayer(routeLineRef.current);
        routeLineRef.current = null;
      }
      if (routeGlowRef.current) {
        map.removeLayer(routeGlowRef.current);
        routeGlowRef.current = null;
      }
      if (midRouteMarkerRef.current) {
        map.removeLayer(midRouteMarkerRef.current);
        midRouteMarkerRef.current = null;
      }
      lastFittedRouteKeyRef.current = '';
    }
  }, [routeCoordinates, origin, destination, routeInfo, isTraveling, travelMode, currentPosition]);

  // Update Traveling Vehicle Marker along the road with smooth camera tracking
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!isTraveling || !travelingCoords || isNaN(travelingCoords.lat) || isNaN(travelingCoords.lng)) {
      if (vehicleMarkerRef.current) {
        map.removeLayer(vehicleMarkerRef.current);
        vehicleMarkerRef.current = null;
      }
      return;
    }

    const vehicleLatLng: L.LatLngTuple = [travelingCoords.lat, travelingCoords.lng];
    const vehicleIconChar =
      travelMode === 'transit'
        ? '🚌'
        : travelMode === 'bike'
        ? '🚲'
        : travelMode === 'walking'
        ? '🚶'
        : '🚗';

    const vehicleIcon = L.divIcon({
      className: 'bg-transparent border-none',
      html: `
        <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; pointer-events: none;">
          <!-- Radar ring -->
          <span style="position: absolute; width: 48px; height: 48px; border-radius: 9999px; background: rgba(194, 139, 56, 0.3); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
          <!-- Heading direction indicator -->
          <div style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; transform: rotate(${travelingHeading}deg); display: flex; justify-content: center;">
            <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-bottom: 8px solid #c28b38; margin-top: -6px;"></div>
          </div>
          <!-- Vehicle circular badge -->
          <div style="position: relative; width: 34px; height: 34px; border-radius: 9999px; background: #0c2b21; border: 2.5px solid #ffffff; box-shadow: 0 4px 12px rgba(12,43,33,0.45); display: flex; align-items: center; justify-content: center; font-size: 16px; color: #ffffff;">
            ${vehicleIconChar}
          </div>
          <!-- Traveling badge tag -->
          <div style="position: absolute; bottom: -12px; background: #c28b38; color: #ffffff; font-size: 9px; font-weight: 800; padding: 1px 6px; border-radius: 9999px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.25);">
            LIVE
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    if (!vehicleMarkerRef.current) {
      vehicleMarkerRef.current = L.marker(vehicleLatLng, { icon: vehicleIcon, zIndexOffset: 1200 }).addTo(map);
    } else {
      vehicleMarkerRef.current.setLatLng(vehicleLatLng);
      vehicleMarkerRef.current.setIcon(vehicleIcon);
    }

    // Smooth camera follow during travel
    if (followVehicle) {
      const now = Date.now();
      if (now - lastPanTimeRef.current > 350) {
        lastPanTimeRef.current = now;
        const currentZoom = map.getZoom();
        if (currentZoom < 15) {
          map.setView(vehicleLatLng, 16, { animate: true });
        } else {
          map.panTo(vehicleLatLng, { animate: true, duration: 0.3 });
        }
      }
    }
  }, [isTraveling, travelingCoords, travelingHeading, travelMode, followVehicle]);

  const handleZoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut();
  };


  return (
    <div className={`relative w-full h-full overflow-hidden select-none bg-[#f2ede4] ${className}`}>
      <div ref={containerRef} className="w-full h-full z-0 cursor-crosshair" />

      {/* Map Controls on Right: Zoom In, Zoom Out, and Re-center / Follow GPS */}
      <div className="absolute right-4 top-24 z-20 flex flex-col gap-2">
        <div className="flex flex-col rounded-xl bg-[#FFF8ED] border border-[#ded5c5] shadow-sm overflow-hidden">
          <button
            onClick={handleZoomIn}
            className="w-9 h-9 flex items-center justify-center text-[#14221d] font-bold text-lg hover:bg-[#f5ecdc] transition-all cursor-pointer border-b border-[#ded5c5] active:bg-[#ebdcc7]"
            title="Zoom In"
            aria-label="Zoom In"
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            className="w-9 h-9 flex items-center justify-center text-[#14221d] font-bold text-lg hover:bg-[#f5ecdc] transition-all cursor-pointer active:bg-[#ebdcc7]"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            −
          </button>
          <button
            onClick={() => {
              setFollowVehicle(true);
              if (isTraveling && travelingCoords) {
                mapRef.current?.flyTo([travelingCoords.lat, travelingCoords.lng], 17, { duration: 0.5 });
              } else if (currentPosition) {
                mapRef.current?.flyTo([currentPosition.lat, currentPosition.lng], 16, { duration: 0.5 });
              }
            }}
            className={`w-9 h-9 flex items-center justify-center transition-all cursor-pointer border-t border-[#ded5c5] active:bg-[#ebdcc7] ${
              followVehicle ? 'text-emerald-700 bg-emerald-50' : 'text-[#14221d] hover:bg-[#f5ecdc]'
            }`}
            title={followVehicle ? "Following Live GPS" : "Re-center on My Location"}
            aria-label="Re-center on My Location"
          >
            <Navigation className={`w-4 h-4 ${followVehicle ? 'fill-emerald-600 text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Attribution Footer */}
      <div className="absolute right-3 bottom-2 z-20 text-[10px] text-[#687a71] bg-[#fffcf5]/85 px-2.5 py-1 rounded-md backdrop-blur-md border border-[#ded5c5] pointer-events-auto">
        <span>© OpenStreetMap contributors • OSRM • Geoapify</span>
      </div>
    </div>
  );
};
