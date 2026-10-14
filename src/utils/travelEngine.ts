import type { Coordinates, RouteStep } from '../types';
import { calculateHaversineDistance } from './geo';

export interface RouteGeometryData {
  coordinates: [number, number][];
  cumulativeDistances: number[];
  totalDistanceMeters: number;
}

/**
 * Calculates cumulative distances for each segment in the polyline
 */
export function buildRouteGeometry(coords: [number, number][]): RouteGeometryData {
  if (!coords || coords.length === 0) {
    return { coordinates: [], cumulativeDistances: [0], totalDistanceMeters: 0 };
  }

  const cumulativeDistances: number[] = [0];
  let runningTotal = 0;

  for (let i = 0; i < coords.length - 1; i++) {
    const p1: Coordinates = { lat: coords[i][0], lng: coords[i][1] };
    const p2: Coordinates = { lat: coords[i + 1][0], lng: coords[i + 1][1] };
    const segDist = calculateHaversineDistance(p1, p2);
    runningTotal += segDist;
    cumulativeDistances.push(runningTotal);
  }

  return {
    coordinates: coords,
    cumulativeDistances,
    totalDistanceMeters: Math.max(1, runningTotal),
  };
}

/**
 * Calculates compass heading / bearing between two points in degrees (0-360)
 */
export function calculateBearing(start: Coordinates, end: Coordinates): number {
  const startLatRad = (start.lat * Math.PI) / 180;
  const startLngRad = (start.lng * Math.PI) / 180;
  const endLatRad = (end.lat * Math.PI) / 180;
  const endLngRad = (end.lng * Math.PI) / 180;

  const dLng = endLngRad - startLngRad;
  const y = Math.sin(dLng) * Math.cos(endLatRad);
  const x =
    Math.cos(startLatRad) * Math.sin(endLatRad) -
    Math.sin(startLatRad) * Math.cos(endLatRad) * Math.cos(dLng);

  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  bearing = (bearing + 360) % 360;
  return Math.round(bearing);
}

/**
 * Interpolates vehicle coordinate and bearing along the route polyline at a given progress (0.0 to 1.0)
 */
export function getRoutePointAtProgress(
  geom: RouteGeometryData,
  progress: number
): { point: Coordinates; heading: number; distanceRemainingMeters: number } {
  const { coordinates, cumulativeDistances, totalDistanceMeters } = geom;

  if (coordinates.length === 0) {
    return { point: { lat: 0, lng: 0 }, heading: 0, distanceRemainingMeters: 0 };
  }
  if (coordinates.length === 1 || progress <= 0) {
    const p0: Coordinates = { lat: coordinates[0][0], lng: coordinates[0][1] };
    return { point: p0, heading: 0, distanceRemainingMeters: totalDistanceMeters };
  }
  if (progress >= 1) {
    const pLast: Coordinates = {
      lat: coordinates[coordinates.length - 1][0],
      lng: coordinates[coordinates.length - 1][1],
    };
    return { point: pLast, heading: 0, distanceRemainingMeters: 0 };
  }

  const targetMeters = progress * totalDistanceMeters;

  // Find the segment containing targetMeters
  let segIndex = 0;
  for (let i = 0; i < cumulativeDistances.length - 1; i++) {
    if (
      targetMeters >= cumulativeDistances[i] &&
      targetMeters <= cumulativeDistances[i + 1]
    ) {
      segIndex = i;
      break;
    }
  }

  const segStartDist = cumulativeDistances[segIndex];
  const segEndDist = cumulativeDistances[segIndex + 1];
  const segLen = Math.max(1, segEndDist - segStartDist);
  const segFraction = Math.max(0, Math.min(1, (targetMeters - segStartDist) / segLen));

  const p1: Coordinates = {
    lat: coordinates[segIndex][0],
    lng: coordinates[segIndex][1],
  };
  const p2: Coordinates = {
    lat: coordinates[segIndex + 1][0],
    lng: coordinates[segIndex + 1][1],
  };

  const currentLat = p1.lat + (p2.lat - p1.lat) * segFraction;
  const currentLng = p1.lng + (p2.lng - p1.lng) * segFraction;
  const heading = calculateBearing(p1, p2);
  const remaining = Math.max(0, totalDistanceMeters - targetMeters);

  return {
    point: { lat: currentLat, lng: currentLng },
    heading,
    distanceRemainingMeters: remaining,
  };
}

/**
 * Determine which turn-by-turn direction step corresponds to the current journey progress
 */
export function getActiveStepIndex(steps: RouteStep[], progress: number): number {
  if (!steps || steps.length === 0) return 0;
  if (progress >= 0.98) return steps.length - 1;

  const totalSteps = steps.length;
  const stepIndex = Math.min(
    totalSteps - 1,
    Math.floor(progress * totalSteps)
  );

  return stepIndex;
}
