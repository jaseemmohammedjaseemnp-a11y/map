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

/**
 * Projects a point onto a line segment [p1, p2].
 * Returns the nearest point on the segment, distance to the segment in meters, and segment fraction [0, 1].
 */
export function projectPointOntoSegment(
  point: Coordinates,
  p1: Coordinates,
  p2: Coordinates
): { projected: Coordinates; distanceMeters: number; fraction: number } {
  const dx = p2.lng - p1.lng;
  const dy = p2.lat - p1.lat;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    return {
      projected: p1,
      distanceMeters: calculateHaversineDistance(point, p1),
      fraction: 0,
    };
  }

  // Projection scalar t in range [0, 1]
  let t = ((point.lng - p1.lng) * dx + (point.lat - p1.lat) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projected: Coordinates = {
    lat: p1.lat + t * dy,
    lng: p1.lng + t * dx,
  };

  const distanceMeters = calculateHaversineDistance(point, projected);
  return { projected, distanceMeters, fraction: t };
}

export interface RouteMatchResult {
  snappedPoint: Coordinates;
  distanceToRouteMeters: number;
  distanceAlongRouteMeters: number;
  remainingDistanceMeters: number;
  routeProgress: number; // 0.0 to 1.0
  roadBearing: number;
  isOnRoute: boolean;
}

/**
 * Projects a user's GPS coordinate onto the polyline route geometry.
 * Finds the closest road segment, computes accurate distance traveled along the route,
 * remaining road distance, road bearing, and snapped coordinate for smooth car navigation.
 */
export function projectPositionOntoRoute(
  pos: Coordinates,
  geom: RouteGeometryData,
  snapThresholdMeters = 80
): RouteMatchResult {
  const { coordinates, cumulativeDistances, totalDistanceMeters } = geom;
  if (!coordinates || coordinates.length < 2) {
    return {
      snappedPoint: pos,
      distanceToRouteMeters: 0,
      distanceAlongRouteMeters: 0,
      remainingDistanceMeters: totalDistanceMeters,
      routeProgress: 0,
      roadBearing: 0,
      isOnRoute: true,
    };
  }

  let minDistance = Infinity;
  let bestProjected: Coordinates = pos;
  let bestDistanceAlong = 0;
  let bestBearing = 0;

  for (let i = 0; i < coordinates.length - 1; i++) {
    const p1: Coordinates = { lat: coordinates[i][0], lng: coordinates[i][1] };
    const p2: Coordinates = { lat: coordinates[i + 1][0], lng: coordinates[i + 1][1] };

    const proj = projectPointOntoSegment(pos, p1, p2);
    if (proj.distanceMeters < minDistance) {
      minDistance = proj.distanceMeters;
      bestProjected = proj.projected;
      const segStartDist = cumulativeDistances[i] || 0;
      const segEndDist = cumulativeDistances[i + 1] || segStartDist;
      bestDistanceAlong = segStartDist + proj.fraction * (segEndDist - segStartDist);
      bestBearing = calculateBearing(p1, p2);
    }
  }

  const remainingDistanceMeters = Math.max(0, totalDistanceMeters - bestDistanceAlong);
  const routeProgress = totalDistanceMeters > 0 ? Math.min(1, Math.max(0, bestDistanceAlong / totalDistanceMeters)) : 0;
  const isOnRoute = minDistance <= snapThresholdMeters;

  return {
    snappedPoint: isOnRoute ? bestProjected : pos,
    distanceToRouteMeters: Math.round(minDistance),
    distanceAlongRouteMeters: Math.round(bestDistanceAlong),
    remainingDistanceMeters: Math.round(remainingDistanceMeters),
    routeProgress,
    roadBearing: bestBearing,
    isOnRoute,
  };
}

export interface StepNavigationInfo {
  stepIndex: number;
  distanceToNextManeuverMeters: number;
  currentStep: RouteStep;
  nextStep?: RouteStep;
}

/**
 * Calculates accurate step progress and countdown distance to the next maneuver
 */
export function getStepNavigationInfo(
  steps: RouteStep[],
  distanceAlongRouteMeters: number,
  totalDistanceMeters: number
): StepNavigationInfo {
  if (!steps || steps.length === 0) {
    const dummy: RouteStep = {
      instruction: 'Head toward destination',
      distanceMeters: Math.max(0, totalDistanceMeters - distanceAlongRouteMeters),
      durationSeconds: 0,
      icon: '⬆️',
    };
    return {
      stepIndex: 0,
      distanceToNextManeuverMeters: dummy.distanceMeters,
      currentStep: dummy,
    };
  }

  let runningStepDist = 0;
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const stepLength = step.distanceMeters || 0;
    const stepEndDist = runningStepDist + stepLength;

    if (distanceAlongRouteMeters < stepEndDist || i === steps.length - 1) {
      const remainingInStep = Math.max(0, stepEndDist - distanceAlongRouteMeters);
      return {
        stepIndex: i,
        distanceToNextManeuverMeters: Math.round(remainingInStep),
        currentStep: step,
        nextStep: steps[i + 1],
      };
    }
    runningStepDist = stepEndDist;
  }

  const last = steps[steps.length - 1];
  return {
    stepIndex: steps.length - 1,
    distanceToNextManeuverMeters: 0,
    currentStep: last,
  };
}

