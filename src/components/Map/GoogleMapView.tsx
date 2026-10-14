import React, { useEffect, useRef, useCallback } from 'react';
import type { Coordinates, Destination, GPSReading } from '../../types';
import { DARK_FOREST_MAP_STYLE } from '../../services/googleMapsLoader';

interface GoogleMapViewProps {
  currentPosition: GPSReading | null;
  destination: Destination | null;
  radiusMeters: number;
  isArrived: boolean;
  onSelectCoordinates: (coords: Coordinates) => void;
  className?: string;
}

export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  currentPosition,
  destination,
  radiusMeters,
  isArrived,
  onSelectCoordinates,
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const userAccuracyCircleRef = useRef<google.maps.Circle | null>(null);
  const destinationMarkerRef = useRef<google.maps.Marker | null>(null);
  const radiusCircleRef = useRef<google.maps.Circle | null>(null);
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || !window.google?.maps) return;

    const initialCenter = currentPosition
      ? { lat: currentPosition.lat, lng: currentPosition.lng }
      : destination
      ? { lat: destination.lat, lng: destination.lng }
      : { lat: 37.7749, lng: -122.4194 };

    const map = new google.maps.Map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 15,
      styles: DARK_FOREST_MAP_STYLE,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: 'greedy',
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        onSelectCoordinates({
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
        });
      }
    });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current && window.google?.maps?.event) {
        google.maps.event.clearInstanceListeners(mapInstanceRef.current);
      }
    };
  }, []);

  // Update User Marker & Accuracy
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.google?.maps) return;

    if (!currentPosition) {
      if (userMarkerRef.current) userMarkerRef.current.setMap(null);
      if (userAccuracyCircleRef.current) userAccuracyCircleRef.current.setMap(null);
      return;
    }

    const pos = { lat: currentPosition.lat, lng: currentPosition.lng };

    const userIcon: google.maps.Symbol = {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: '#10b981',
      fillOpacity: 1,
      strokeColor: '#fbf7ee',
      strokeWeight: 2.5,
    };

    if (!userMarkerRef.current) {
      userMarkerRef.current = new google.maps.Marker({
        position: pos,
        map,
        icon: userIcon,
        title: 'Current Position',
        zIndex: 10,
      });
    } else {
      userMarkerRef.current.setPosition(pos);
      userMarkerRef.current.setMap(map);
    }

    if (currentPosition.accuracy && currentPosition.accuracy > 0) {
      if (!userAccuracyCircleRef.current) {
        userAccuracyCircleRef.current = new google.maps.Circle({
          strokeColor: '#34d399',
          strokeOpacity: 0.35,
          strokeWeight: 1,
          fillColor: '#10b981',
          fillOpacity: 0.1,
          map,
          center: pos,
          radius: currentPosition.accuracy,
          clickable: false,
        });
      } else {
        userAccuracyCircleRef.current.setCenter(pos);
        userAccuracyCircleRef.current.setRadius(currentPosition.accuracy);
        userAccuracyCircleRef.current.setMap(map);
      }
    }
  }, [currentPosition]);

  // Update Destination Marker & Arrival Radius Circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.google?.maps) return;

    if (!destination) {
      if (destinationMarkerRef.current) destinationMarkerRef.current.setMap(null);
      if (radiusCircleRef.current) radiusCircleRef.current.setMap(null);
      return;
    }

    const destPos = { lat: destination.lat, lng: destination.lng };

    const destIcon = {
      url: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">
          <path d="M18 0C8.06 0 0 8.06 0 18C0 31.5 18 46 18 46C18 46 36 31.5 36 18C36 8.06 27.94 0 18 0Z" fill="#decbb4" stroke="#0b1d16" stroke-width="2"/>
          <circle cx="18" cy="18" r="7" fill="#0b1d16" />
        </svg>
      `),
      scaledSize: new google.maps.Size(36, 46),
      anchor: new google.maps.Point(18, 46),
    };

    if (!destinationMarkerRef.current) {
      destinationMarkerRef.current = new google.maps.Marker({
        position: destPos,
        map,
        icon: destIcon,
        title: destination.name,
        zIndex: 20,
      });
    } else {
      destinationMarkerRef.current.setPosition(destPos);
      destinationMarkerRef.current.setMap(map);
    }

    const circleColor = isArrived ? '#ef4444' : '#10b981';
    const circleFillOpacity = isArrived ? 0.35 : 0.15;

    if (!radiusCircleRef.current) {
      radiusCircleRef.current = new google.maps.Circle({
        strokeColor: circleColor,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: circleColor,
        fillOpacity: circleFillOpacity,
        map,
        center: destPos,
        radius: radiusMeters,
        clickable: false,
      });
    } else {
      radiusCircleRef.current.setCenter(destPos);
      radiusCircleRef.current.setRadius(radiusMeters);
      radiusCircleRef.current.setOptions({
        strokeColor: circleColor,
        fillColor: circleColor,
        fillOpacity: circleFillOpacity,
      });
      radiusCircleRef.current.setMap(map);
    }
  }, [destination, radiusMeters, isArrived]);

  // Update Route Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.google?.maps) return;

    if (!currentPosition || !destination) {
      if (routePolylineRef.current) routePolylineRef.current.setMap(null);
      return;
    }

    const path = [
      { lat: currentPosition.lat, lng: currentPosition.lng },
      { lat: destination.lat, lng: destination.lng },
    ];

    if (!routePolylineRef.current) {
      routePolylineRef.current = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#decbb4',
        strokeOpacity: 0.75,
        strokeWeight: 3,
        map,
      });
    } else {
      routePolylineRef.current.setPath(path);
      routePolylineRef.current.setMap(map);
    }
  }, [currentPosition, destination]);

  const centerOnUser = useCallback(() => {
    if (mapInstanceRef.current && currentPosition) {
      mapInstanceRef.current.panTo({
        lat: currentPosition.lat,
        lng: currentPosition.lng,
      });
      mapInstanceRef.current.setZoom(16);
    }
  }, [currentPosition]);

  const fitJourneyBounds = useCallback(() => {
    if (!mapInstanceRef.current || !window.google?.maps) return;
    const bounds = new google.maps.LatLngBounds();

    if (currentPosition) {
      bounds.extend({ lat: currentPosition.lat, lng: currentPosition.lng });
    }
    if (destination) {
      bounds.extend({ lat: destination.lat, lng: destination.lng });
    }

    if (!bounds.isEmpty()) {
      mapInstanceRef.current.fitBounds(bounds, {
        top: 80,
        bottom: 240,
        left: 40,
        right: 40,
      });
    }
  }, [currentPosition, destination]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full bg-forest-950" />

      {/* Floating Map Action Buttons */}
      <div className="absolute right-4 top-20 z-10 flex flex-col gap-2.5">
        {currentPosition && (
          <button
            onClick={centerOnUser}
            title="Recenter on My Location"
            className="w-11 h-11 rounded-full glass-panel flex items-center justify-center text-cream-100 shadow-lg hover:text-emerald-400 active:scale-95 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        )}

        {currentPosition && destination && (
          <button
            onClick={fitJourneyBounds}
            title="Fit Entire Journey in View"
            className="w-11 h-11 rounded-full glass-panel flex items-center justify-center text-cream-100 shadow-lg hover:text-emerald-400 active:scale-95 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        )}
      </div>

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none z-10">
        <span className="text-[11px] font-medium tracking-wide text-cream-300/80 bg-forest-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-forest-800 shadow">
          Tap anywhere on map to set destination
        </span>
      </div>
    </div>
  );
};
