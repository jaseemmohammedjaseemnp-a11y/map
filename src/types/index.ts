export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Destination {
  name: string;
  address?: string;
  lat: number;
  lng: number;
  placeId?: string;
}

export interface GPSReading {
  lat: number;
  lng: number;
  accuracy: number; // in meters
  speed: number | null; // in meters/second
  heading: number | null; // degrees from north
  timestamp: number; // unix timestamp in ms
  altitude?: number | null;
}

export type JourneyStatus = 'idle' | 'tracking' | 'arrived' | 'paused';

export type AlarmSoundType = 'chime' | 'radar' | 'siren' | 'subtle';

export type TravelMode = 'transit' | 'driving' | 'walking' | 'bike';

export type MapTileStyle =
  | 'satellite'
  | 'dark-matter-dark-purple'
  | 'dark-matter-yellow-roads'
  | 'osm-carto'
  | 'klokantech-basic'
  | 'positron';

export interface ArrivalConfig {
  radius: number; // meters: 100, 250, 500, 1000, 2000
  requiredConsecutiveFixes: number; // count of consecutive readings required inside radius (default: 3)
  maxAcceptedAccuracy: number; // discard/warn if accuracy > this (meters, default: 150)
}

export interface UserPreferences {
  radius: number;
  soundType: AlarmSoundType;
  volume: number; // 0.0 to 1.0
  vibrate: boolean;
  wakeLock: boolean;
  geoapifyApiKey?: string;
  mapStyle?: MapTileStyle;
  googleMapsApiKey?: string;
}

export interface SimulationState {
  isActive: boolean;
  progress: number; // 0 to 1
  speedKmh: number; // e.g. 5 (walk), 35 (bus), 80 (train)
  startCoords: Coordinates | null;
}

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  icon?: string;
}

export type GeolocationPermissionStatus = 'prompt' | 'granted' | 'denied' | 'unsupported';
