import { useState, useEffect, useRef, useCallback } from 'react';
import type { GPSReading, GeolocationPermissionStatus } from '../types';
import { calculateHaversineDistance, calculateBearing } from '../utils/geo';

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  bufferSize?: number;
  autoStart?: boolean;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 27000,
    maximumAge = 2000,
    bufferSize = 20,
    autoStart = true,
  } = options;

  const [currentPosition, setCurrentPosition] = useState<GPSReading | null>(null);
  const [readingsHistory, setReadingsHistory] = useState<GPSReading[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isWatching, setIsWatching] = useState<boolean>(false);
  const [permissionStatus, setPermissionStatus] = useState<GeolocationPermissionStatus>('prompt');

  const watchIdRef = useRef<number | null>(null);
  const prevReadingRef = useRef<GPSReading | null>(null);
  const currentHeadingRef = useRef<number>(0);
  const compassHeadingRef = useRef<number | null>(null);
  const lastFixTimestampRef = useRef<number>(0);
  const watchdogTimerRef = useRef<number | null>(null);

  // Compass orientation listener (for mobile orientation when standing still)
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      // iOS Safari provides webkitCompassHeading directly (0-360 deg)
      const webkitHeading = (e as unknown as { webkitCompassHeading?: number }).webkitCompassHeading;
      if (typeof webkitHeading === 'number' && !isNaN(webkitHeading)) {
        compassHeadingRef.current = Math.round(webkitHeading);
        return;
      }
      // Standard Android/Chrome device orientation (alpha is counter-clockwise)
      if (e.alpha !== null && !isNaN(e.alpha)) {
        const compass = Math.round((360 - e.alpha) % 360);
        compassHeadingRef.current = compass;
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
      window.addEventListener('deviceorientation', handleOrientation as EventListener, true);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
        window.removeEventListener('deviceorientation', handleOrientation as EventListener, true);
      }
    };
  }, []);

  // Check initial permission status
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setPermissionStatus('unsupported');
      setError('Geolocation is not supported by your browser.');
      return;
    }

    if ('permissions' in navigator && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((permission) => {
          setPermissionStatus(permission.state as GeolocationPermissionStatus);
          permission.onchange = () => {
            setPermissionStatus(permission.state as GeolocationPermissionStatus);
          };
        })
        .catch(() => {
          setPermissionStatus('prompt');
        });
    }
  }, []);

  const handlePositionSuccess = useCallback(
    (position: GeolocationPosition) => {
      const accuracy = position.coords.accuracy;
      const now = position.timestamp || Date.now();
      lastFixTimestampRef.current = now;

      const newLat = Number(position.coords.latitude.toFixed(6));
      const newLng = Number(position.coords.longitude.toFixed(6));

      // 1. Determine Heading / Direction of Movement
      let computedHeading: number | null = null;

      // Prefer device GPS hardware heading if provided and valid
      if (
        position.coords.heading !== null &&
        position.coords.heading !== undefined &&
        !isNaN(position.coords.heading) &&
        position.coords.heading >= 0
      ) {
        computedHeading = Math.round(position.coords.heading);
        currentHeadingRef.current = computedHeading;
      } else if (prevReadingRef.current) {
        // Compute forward bearing from previous reading if user moved >= 1.5 meters
        const prev = prevReadingRef.current;
        const distMoved = calculateHaversineDistance(
          { lat: prev.lat, lng: prev.lng },
          { lat: newLat, lng: newLng }
        );

        if (distMoved >= 1.5) {
          computedHeading = Math.round(
            calculateBearing({ lat: prev.lat, lng: prev.lng }, { lat: newLat, lng: newLng })
          );
          currentHeadingRef.current = computedHeading;
        } else if (compassHeadingRef.current !== null) {
          // Stationary or slow drift: use phone's compass
          computedHeading = compassHeadingRef.current;
          currentHeadingRef.current = computedHeading;
        } else {
          // Keep last known valid heading
          computedHeading = currentHeadingRef.current;
        }
      } else if (compassHeadingRef.current !== null) {
        computedHeading = compassHeadingRef.current;
        currentHeadingRef.current = computedHeading;
      } else {
        computedHeading = currentHeadingRef.current;
      }

      // 2. Determine Speed (m/s)
      let computedSpeed: number | null = position.coords.speed;
      if (
        (computedSpeed === null || computedSpeed === undefined || isNaN(computedSpeed)) &&
        prevReadingRef.current
      ) {
        const prev = prevReadingRef.current;
        const timeDeltaSec = (now - prev.timestamp) / 1000;
        if (timeDeltaSec > 0.4 && timeDeltaSec < 15) {
          const distMoved = calculateHaversineDistance(
            { lat: prev.lat, lng: prev.lng },
            { lat: newLat, lng: newLng }
          );
          computedSpeed = Math.round((distMoved / timeDeltaSec) * 10) / 10;
        }
      }

      // Outlier protection: reject massive single GPS glitches if we already have a solid fix
      if (
        prevReadingRef.current &&
        prevReadingRef.current.accuracy <= 40 &&
        accuracy > 450
      ) {
        console.warn(`Filtering suspicious GPS spike: accuracy ${Math.round(accuracy)}m`);
      }

      const reading: GPSReading = {
        lat: newLat,
        lng: newLng,
        accuracy: Math.round(accuracy),
        speed: computedSpeed,
        heading: computedHeading,
        altitude: position.coords.altitude,
        timestamp: now,
      };

      prevReadingRef.current = reading;
      setCurrentPosition(reading);
      setError(null);
      setPermissionStatus('granted');

      setReadingsHistory((prev) => {
        const next = [...prev, reading];
        if (next.length > bufferSize) {
          return next.slice(next.length - bufferSize);
        }
        return next;
      });
    },
    [bufferSize]
  );

  const handlePositionError = useCallback((err: GeolocationPositionError) => {
    let msg = 'Unable to acquire location.';
    switch (err.code) {
      case err.PERMISSION_DENIED:
        msg = 'Location permission was denied. Please allow location access in your browser settings to track your journey.';
        setPermissionStatus('denied');
        break;
      case err.POSITION_UNAVAILABLE:
        msg = 'GPS signal is currently unavailable. Ensure your device has location turned on.';
        break;
      case err.TIMEOUT:
        // For timeouts during movement, do NOT crash the UI with a permanent error.
        // Attempt a soft fallback request
        console.warn('GPS position timeout: retrying satellite fix...');
        return;
      default:
        msg = err.message || 'Unknown GPS error occurred.';
    }
    setError(msg);
  }, []);

  const startWatching = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Geolocation API not available.');
      return;
    }

    if (watchIdRef.current !== null) {
      return;
    }

    setError(null);
    setIsWatching(true);

    try {
      watchIdRef.current = navigator.geolocation.watchPosition(
        handlePositionSuccess,
        handlePositionError,
        {
          enableHighAccuracy,
          timeout,
          maximumAge,
        }
      );
    } catch (e) {
      setError('Failed to start GPS tracking: ' + String(e));
      setIsWatching(false);
    }
  }, [enableHighAccuracy, timeout, maximumAge, handlePositionSuccess, handlePositionError]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsWatching(false);
  }, []);

  const requestCurrentLocation = useCallback((): Promise<GPSReading> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation unsupported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          handlePositionSuccess(pos);
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            speed: pos.coords.speed,
            heading: pos.coords.heading,
            altitude: pos.coords.altitude,
            timestamp: pos.timestamp || Date.now(),
          });
        },
        (err) => {
          handlePositionError(err);
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 3000 }
      );
    });
  }, [handlePositionSuccess, handlePositionError]);

  // Watchdog recovery: if watchPosition gets suspended by mobile OS, wake it up
  useEffect(() => {
    if (!isWatching) {
      if (watchdogTimerRef.current) clearInterval(watchdogTimerRef.current);
      return;
    }

    watchdogTimerRef.current = window.setInterval(() => {
      const now = Date.now();
      // If no GPS fix for over 30s while watching, ping a fresh fix
      if (lastFixTimestampRef.current > 0 && now - lastFixTimestampRef.current > 30000) {
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            handlePositionSuccess,
            () => {},
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
          );
        }
      }
    }, 15000);

    return () => {
      if (watchdogTimerRef.current) clearInterval(watchdogTimerRef.current);
    };
  }, [isWatching, handlePositionSuccess]);

  // Auto-start watching on mount if autoStart is true
  useEffect(() => {
    if (autoStart) {
      startWatching();
    }
    return () => {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [autoStart, startWatching]);

  const clearHistory = useCallback(() => {
    setReadingsHistory([]);
  }, []);

  return {
    currentPosition,
    readingsHistory,
    error,
    isWatching,
    permissionStatus,
    startWatching,
    stopWatching,
    requestCurrentLocation,
    clearHistory,
    setCurrentPosition,
  };
}

