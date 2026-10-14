import type { Coordinates, Destination, MapTileStyle } from '../types';

export const DEFAULT_GEOAPIFY_KEY =
  (import.meta.env.VITE_GEOAPIFY_API_KEY as string | undefined)?.trim() ||
  '4535ab6baa8d436fb5c8a356457ada90';

export function getGeoapifyApiKey(customKey?: string): string {
  if (customKey && customKey.trim().length > 0) {
    return customKey.trim();
  }
  return DEFAULT_GEOAPIFY_KEY;
}

/**
 * Returns tile URL template for Geoapify raster maps
 */
export function getGeoapifyTileUrl(
  style: MapTileStyle = 'dark-matter-dark-purple',
  apiKey: string
): string {
  if (!apiKey) {
    return 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  }
  return `https://maps.geoapify.com/v1/tile/${style}/{z}/{x}/{y}@2x.png?apiKey=${apiKey}`;
}

export interface GeoapifyFeature {
  properties: {
    name?: string;
    address_line1?: string;
    address_line2?: string;
    formatted?: string;
    lat: number;
    lon: number;
    place_id?: string;
  };
}

/**
 * Performs global geocoding search using Geoapify Geocoding Search API
 */
export async function searchGeoapifyPlaces(
  query: string,
  apiKey: string,
  proximity?: Coordinates | null
): Promise<Destination[]> {
  const cleanKey = getGeoapifyApiKey(apiKey);
  if (!cleanKey || !query.trim()) {
    return [];
  }

  try {
    let url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
      query.trim()
    )}&apiKey=${cleanKey}&limit=6`;

    if (proximity) {
      url += `&bias=proximity:${proximity.lng},${proximity.lat}`;
    }

    const res = await fetch(url);
    if (!res.ok) {
      console.warn('Geoapify Geocoding HTTP error:', res.status);
      return [];
    }

    const data = await res.json();
    if (data.features && Array.isArray(data.features) && data.features.length > 0) {
      return data.features.map((feat: GeoapifyFeature) => {
        const p = feat.properties;
        return {
          name: p.name || p.address_line1 || p.formatted?.split(',')[0] || 'Location',
          address: p.formatted || `${p.address_line1 || ''} ${p.address_line2 || ''}`.trim(),
          lat: p.lat,
          lng: p.lon,
          placeId: p.place_id,
        };
      });
    }

    // Fallback to OSM Nominatim if Geoapify returned empty results
    return await searchNominatim(query);
  } catch (err) {
    console.warn('Geoapify Geocoding fetch failed, falling back to OSM:', err);
    return await searchNominatim(query);
  }
}

async function searchNominatim(query: string): Promise<Destination[]> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query.trim()
    )}&limit=6&addressdetails=1`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((item: any) => ({
      name: item.name || item.display_name?.split(',')[0] || 'Location',
      address: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));
  } catch (err) {
    console.warn('Nominatim fallback error:', err);
    return [];
  }
}

/**
 * Reverse geocode coordinates into a human-readable address using Geoapify Reverse API
 */
export async function reverseGeocodeGeoapify(
  coords: Coordinates,
  apiKey: string
): Promise<string | null> {
  const cleanKey = getGeoapifyApiKey(apiKey);
  if (!cleanKey) return null;

  try {
    const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${coords.lat}&lon=${coords.lng}&apiKey=${cleanKey}&limit=1`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (data.features && data.features.length > 0) {
      const p = data.features[0].properties;
      return p.formatted || p.address_line1 || null;
    }
  } catch (err) {
    console.warn('Geoapify reverse geocode failed:', err);
  }
  return null;
}
