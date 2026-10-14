import type { Coordinates, GPSReading } from '../types';

/**
 * Earth radius in meters
 */
const EARTH_RADIUS_METERS = 6371000;

/**
 * Calculate great-circle distance between two coordinates using the Haversine formula.
 * Returns distance in meters.
 */
export function calculateHaversineDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const dLat = toRadians(coord2.lat - coord1.lat);
  const dLng = toRadians(coord2.lng - coord1.lng);

  const lat1 = toRadians(coord1.lat);
  const lat2 = toRadians(coord2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Format meters into clean human readable string
 */
export function formatDistance(meters: number | null | undefined): string {
  if (meters === null || meters === undefined || isNaN(meters)) {
    return '--';
  }

  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  const km = meters / 1000;
  if (km < 10) {
    return `${km.toFixed(2)} km`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Calculate initial bearing between two coordinates in degrees (0 - 360)
 */
export function calculateBearing(start: Coordinates, dest: Coordinates): number {
  const startLat = toRadians(start.lat);
  const startLng = toRadians(start.lng);
  const destLat = toRadians(dest.lat);
  const destLng = toRadians(dest.lng);

  const y = Math.sin(destLng - startLng) * Math.cos(destLat);
  const x =
    Math.cos(startLat) * Math.sin(destLat) -
    Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);

  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  bearing = (bearing + 360) % 360;
  return bearing;
}

/**
 * Interpolate coordinate between start and destination for simulation
 * progress ranges from 0.0 (start) to 1.0 (destination)
 */
export function interpolateCoordinates(
  start: Coordinates,
  destination: Coordinates,
  progress: number
): Coordinates {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  return {
    lat: start.lat + (destination.lat - start.lat) * clampedProgress,
    lng: start.lng + (destination.lng - start.lng) * clampedProgress,
  };
}

/**
 * Calculate estimated time of arrival in minutes/seconds
 */
export function formatETA(distanceMeters: number, speedMps: number | null): string {
  if (!speedMps || speedMps < 0.5) {
    // Default estimated transit speed (~30 km/h = 8.33 m/s) when stationary or speed unavailable
    const fallbackMps = 8.33;
    const totalSecs = Math.round(distanceMeters / fallbackMps);
    return formatDuration(totalSecs) + ' (est)';
  }

  const seconds = Math.round(distanceMeters / speedMps);
  return formatDuration(seconds);
}

function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 60) {
    return `${Math.max(1, totalSeconds)}s`;
  }
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins < 60) {
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
}

/**
 * Evaluates whether a stream of GPS readings warrants an arrival trigger.
 * Prevents false alarms due to GPS drift or single inaccurate outlier jumps.
 */
export function verifyArrivalCondition(
  recentReadings: GPSReading[],
  destination: Coordinates,
  radiusMeters: number,
  consecutiveRequired = 2,
  maxAllowedAccuracy = 150
): {
  isArrived: boolean;
  consecutiveCount: number;
  filteredReadingsCount: number;
  lastDistance: number;
} {
  if (recentReadings.length === 0) {
    return { isArrived: false, consecutiveCount: 0, filteredReadingsCount: 0, lastDistance: Infinity };
  }

  let consecutiveInside = 0;
  let filteredCount = 0;
  let latestDistance = Infinity;

  // Read newest to oldest
  for (let i = recentReadings.length - 1; i >= 0; i--) {
    const reading = recentReadings[i];
    
    // Ignore readings with excessively poor accuracy (GPS drift spikes)
    if (reading.accuracy > maxAllowedAccuracy) {
      filteredCount++;
      continue;
    }

    const dist = calculateHaversineDistance(
      { lat: reading.lat, lng: reading.lng },
      destination
    );

    if (latestDistance === Infinity) {
      latestDistance = dist;
    }

    if (dist <= radiusMeters) {
      consecutiveInside++;
      if (consecutiveInside >= consecutiveRequired) {
        return {
          isArrived: true,
          consecutiveCount: consecutiveInside,
          filteredReadingsCount: filteredCount,
          lastDistance: latestDistance,
        };
      }
    } else {
      // Reading was outside radius
      break;
    }
  }

  return {
    isArrived: false,
    consecutiveCount: consecutiveInside,
    filteredReadingsCount: filteredCount,
    lastDistance: latestDistance,
  };
}
