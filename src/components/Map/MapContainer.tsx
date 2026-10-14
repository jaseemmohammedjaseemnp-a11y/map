import React, { useState, useEffect } from 'react';
import type { Coordinates, Destination, GPSReading, MapTileStyle, TravelMode } from '../../types';
import { loadGoogleMaps, getGoogleMapsApiKey } from '../../services/googleMapsLoader';
import { getGeoapifyApiKey } from '../../services/geoapifyService';
import { GoogleMapView } from './GoogleMapView';
import { FallbackMapView } from './FallbackMapView';

import type { RouteResult } from '../../services/routingService';

interface MapContainerProps {
  currentPosition: GPSReading | null;
  origin?: Destination | null;
  destination: Destination | null;
  stops?: Destination[];
  routeCoordinates?: [number, number][] | null;
  routeInfo?: RouteResult | null;
  radiusMeters: number;
  isArrived: boolean;
  onSelectCoordinates: (coords: Coordinates) => void;
  customApiKey?: string;
  geoapifyApiKey?: string;
  mapStyle?: MapTileStyle;
  onOpenSettings?: () => void;
  className?: string;
  isTraveling?: boolean;
  travelMode?: TravelMode;
  travelingCoords?: Coordinates | null;
  travelingHeading?: number;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  currentPosition,
  origin,
  destination,
  stops = [],
  routeCoordinates,
  routeInfo,
  radiusMeters,
  isArrived,
  onSelectCoordinates,
  customApiKey,
  geoapifyApiKey,
  mapStyle = 'satellite',
  onOpenSettings,
  className = '',
  isTraveling = false,
  travelMode = 'transit',
  travelingCoords = null,
  travelingHeading = 0,
}) => {
  const [mapsState, setMapsState] = useState<'checking' | 'loading' | 'google' | 'geoapify' | 'osm'>('checking');

  const resolvedGeoapifyKey = getGeoapifyApiKey(geoapifyApiKey);

  useEffect(() => {
    const googleKey = getGoogleMapsApiKey(customApiKey);

    if (googleKey) {
      setMapsState('loading');
      loadGoogleMaps(googleKey)
        .then(() => {
          setMapsState('google');
        })
        .catch((err) => {
          console.warn('Google Maps could not be loaded, using Geoapify map:', err);
          setMapsState(resolvedGeoapifyKey ? 'geoapify' : 'osm');
        });
      return;
    }

    if (resolvedGeoapifyKey) {
      setMapsState('geoapify');
    } else {
      setMapsState('osm');
    }
  }, [customApiKey, resolvedGeoapifyKey]);

  const getStyleLabel = (style: MapTileStyle) => {
    switch (style) {
      case 'satellite':
        return 'Satellite Hybrid';
      case 'dark-matter-yellow-roads':
        return 'Dark & Yellow';
      case 'osm-carto':
        return 'Crisp Streets';
      case 'positron':
        return 'Positron Light';
      case 'klokantech-basic':
        return 'Clean Vector';
      default:
        return 'Dark Purple';
    }
  };

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {mapsState === 'google' ? (
        <GoogleMapView
          currentPosition={currentPosition}
          destination={destination}
          radiusMeters={radiusMeters}
          isArrived={isArrived}
          onSelectCoordinates={onSelectCoordinates}
        />
      ) : (
        <FallbackMapView
          currentPosition={currentPosition}
          origin={origin}
          destination={destination}
          stops={stops}
          routeCoordinates={routeCoordinates}
          routeInfo={routeInfo}
          radiusMeters={radiusMeters}
          isArrived={isArrived}
          onSelectCoordinates={onSelectCoordinates}
          geoapifyApiKey={resolvedGeoapifyKey}
          mapStyle={mapStyle}
          isTraveling={isTraveling}
          travelMode={travelMode}
          travelingCoords={travelingCoords}
          travelingHeading={travelingHeading}
        />
      )}
    </div>
  );
};
