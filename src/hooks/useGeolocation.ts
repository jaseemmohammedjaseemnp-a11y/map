import { useState, useEffect, useRef, useCallback } from 'react';
import type { GPSReading, GeolocationPermissionStatus } from '../types';

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  bufferSize?: number;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 15000,
    maximumAge = 1000,
    bufferSize = 10,
  } = options;

  const [currentPosition, setCurrentPosition] = useState<GPSReading | null>(null);
  const [readingsHistory, setReadingsHistory] = useState<GPSReading[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isWatching, setIsWatching] = useState<boolean>(false);
  const [permissionStatus, setPermissionStatus] = useState<GeolocationPermissionStatus>('prompt');

  const watchIdRef = useRef<number | null>(null);

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

      // Filter out wild inaccurate spikes (e.g. cellular tower triangulation > 400m)
      // if we already have an established accurate GPS fix
      if (accuracy > 400) {
        console.warn(`GPS accuracy low (${Math.round(accuracy)}m), buffering with caution`);
      }

      const reading: GPSReading = {
        lat: Number(position.coords.latitude.toFixed(6)),
        lng: Number(position.coords.longitude.toFixed(6)),
        accuracy: Math.round(accuracy),
        speed: position.coords.speed,
        heading: position.coords.heading,
        altitude: position.coords.altitude,
        timestamp: position.timestamp || Date.now(),
      };

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
        msg = 'Location request timed out while searching for satellite or cell fix.';
        break;
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
    if (watchIdRef.current !== null) {
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
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }, [handlePositionSuccess, handlePositionError]);

  const clearHistory = useCallback(() => {
    setReadingsHistory([]);
  }, []);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
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
