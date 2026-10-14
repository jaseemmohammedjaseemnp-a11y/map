import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

let loadPromise: Promise<unknown> | null = null;
let currentLoadedKey = '';

export function getGoogleMapsApiKey(storedKey?: string): string {
  if (storedKey && storedKey.trim().length > 0) {
    return storedKey.trim();
  }
  const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (
    envKey &&
    typeof envKey === 'string' &&
    envKey.trim().length > 0 &&
    envKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE'
  ) {
    return envKey.trim();
  }
  return '';
}

export function loadGoogleMaps(apiKey: string): Promise<unknown> {
  if (!apiKey) {
    return Promise.reject(new Error('No Google Maps API key provided'));
  }

  if (loadPromise && currentLoadedKey === apiKey && window.google?.maps) {
    return loadPromise;
  }

  currentLoadedKey = apiKey;

  setOptions({
    key: apiKey,
    v: 'weekly',
  });

  loadPromise = Promise.all([
    importLibrary('maps'),
    importLibrary('places'),
    importLibrary('geometry'),
  ]);

  return loadPromise;
}

/**
 * Dark Forest map styling for Google Maps
 */
export const DARK_FOREST_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#0c1f17' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#07150e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#decbb4' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#fbf7ee' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#75bfa0' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#132c20' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#a3d9c3' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#1a3a2b' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#10271d' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#cbb396' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#275740' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#173629' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f5ecdc' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#1f4837' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#10b981' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#07150e' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#539e7d' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#07150e' }],
  },
];
