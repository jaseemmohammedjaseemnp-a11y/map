import type { UserPreferences, Destination } from '../types';

const STORAGE_KEYS = {
  PREFERENCES: 'nearme_alarm_preferences_v3',
  LAST_DESTINATION: 'nearme_alarm_last_destination_v3',
};

const DEFAULT_GEOAPIFY_KEY =
  (import.meta.env.VITE_GEOAPIFY_API_KEY as string | undefined) ||
  '4535ab6baa8d436fb5c8a356457ada90';

const DEFAULT_PREFERENCES: UserPreferences = {
  radius: 200,
  soundType: 'chime',
  volume: 1.0,
  vibrate: true,
  wakeLock: true,
  geoapifyApiKey: DEFAULT_GEOAPIFY_KEY,
  mapStyle: 'osm-carto',
  googleMapsApiKey: '',
};

export function loadUserPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
      geoapifyApiKey: parsed.geoapifyApiKey || DEFAULT_GEOAPIFY_KEY,
      mapStyle: parsed.mapStyle || 'satellite',
    };
  } catch (e) {
    console.warn('Failed to parse preferences from localStorage:', e);
    return DEFAULT_PREFERENCES;
  }
}

export function saveUserPreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs));
  } catch (e) {
    console.warn('Failed to save preferences to localStorage:', e);
  }
}

export function loadLastDestination(): Destination | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LAST_DESTINATION);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Destination;
    if (
      typeof parsed?.lat !== 'number' ||
      typeof parsed?.lng !== 'number' ||
      isNaN(parsed.lat) ||
      isNaN(parsed.lng) ||
      parsed.lat < -85 ||
      parsed.lat > 85 ||
      parsed.lng < -180 ||
      parsed.lng > 180
    ) {
      localStorage.removeItem(STORAGE_KEYS.LAST_DESTINATION);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveLastDestination(dest: Destination | null): void {
  try {
    if (dest) {
      localStorage.setItem(STORAGE_KEYS.LAST_DESTINATION, JSON.stringify(dest));
    } else {
      localStorage.removeItem(STORAGE_KEYS.LAST_DESTINATION);
    }
  } catch (e) {
    console.warn('Failed to save destination:', e);
  }
}
