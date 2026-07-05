import type { SearchResult } from "@parktime/shared";

type MapboxContext = {
  locality?: { name?: string };
  place?: { name?: string };
  region?: { name?: string };
};

type MapboxSuggestion = {
  mapbox_id?: string;
  name?: string;
  place_formatted?: string;
  full_address?: string;
  feature_type?: string;
  context?: MapboxContext;
  properties?: {
    mapbox_id?: string;
    name?: string;
    place_formatted?: string;
    full_address?: string;
    feature_type?: string;
    coordinates?: { longitude: number; latitude: number };
  };
  geometry?: { coordinates: [number, number] };
};

type MapboxFeature = MapboxSuggestion & {
  properties?: MapboxSuggestion["properties"] & {
    name?: string;
    place_formatted?: string;
    full_address?: string;
    feature_type?: string;
  };
};

function formatPlaceLabel(s: MapboxSuggestion): string {
  if (s.full_address) return s.full_address;
  if (s.properties?.full_address) return s.properties.full_address;

  const ctx = s.context;
  const parts = [
    s.name ?? s.properties?.name,
    ctx?.locality?.name,
    ctx?.place?.name,
    ctx?.region?.name,
  ].filter(Boolean) as string[];

  const unique = [...new Set(parts)];
  if (unique.length > 1) return unique.join(", ");
  return s.place_formatted ?? s.properties?.place_formatted ?? s.name ?? "Unknown";
}

function readSuggestCoordinates(s: MapboxSuggestion): { latitude?: number; longitude?: number } {
  const lat = s.properties?.coordinates?.latitude ?? s.geometry?.coordinates?.[1];
  const lng = s.properties?.coordinates?.longitude ?? s.geometry?.coordinates?.[0];
  if (typeof lat === "number" && typeof lng === "number") {
    return { latitude: lat, longitude: lng };
  }
  return {};
}

function mapSuggestion(s: MapboxSuggestion, index: number): SearchResult {
  const id = s.mapbox_id ?? s.properties?.mapbox_id ?? `suggestion-${index}`;
  const name = s.name ?? s.properties?.name ?? "Unknown";
  const placeFormatted = formatPlaceLabel(s);
  const featureType = s.feature_type ?? s.properties?.feature_type ?? "unknown";

  return { id, name, placeFormatted, featureType, ...readSuggestCoordinates(s) };
}

function mapFeature(feature: MapboxFeature, mapboxId: string): SearchResult {
  const name = feature.properties?.name ?? feature.name ?? "Unknown";
  const placeFormatted =
    feature.properties?.full_address ??
    feature.properties?.place_formatted ??
    feature.place_formatted ??
    feature.properties?.name ??
    name;

  const latitude = feature.geometry?.coordinates?.[1];
  const longitude = feature.geometry?.coordinates?.[0];
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    throw new Error("Mapbox retrieve returned no coordinates");
  }

  return {
    id: mapboxId,
    name,
    placeFormatted,
    featureType: feature.properties?.feature_type ?? feature.feature_type ?? "unknown",
    latitude,
    longitude,
  };
}

export async function searchPlaces(q: string, sessionToken?: string): Promise<SearchResult[]> {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) throw new Error("MAPBOX_ACCESS_TOKEN is not configured");

  const bbox = process.env.MAPBOX_SEARCH_BBOX ?? "140.961681,-39.159111,149.976679,-33.980648";
  const proximity = process.env.MAPBOX_SEARCH_PROXIMITY ?? "144.9631,-37.8136";

  const params = new URLSearchParams({
    q,
    access_token: token,
    country: "AU",
    bbox,
    proximity,
    language: "en",
    limit: "6",
    types: "address,street,place,poi,locality,neighborhood",
  });
  if (sessionToken) params.set("session_token", sessionToken);

  const url = `https://api.mapbox.com/search/searchbox/v1/suggest?${params}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Mapbox search failed (${res.status}): ${body}`);
  }

  const json = (await res.json()) as { suggestions?: MapboxSuggestion[] };
  return (json.suggestions ?? []).map(mapSuggestion);
}

export async function retrievePlace(mapboxId: string, sessionToken?: string): Promise<SearchResult> {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) throw new Error("MAPBOX_ACCESS_TOKEN is not configured");
  if (!sessionToken) throw new Error("Session token is required for place retrieve");

  const params = new URLSearchParams({
    access_token: token,
    session_token: sessionToken,
  });

  const url = `https://api.mapbox.com/search/searchbox/v1/retrieve/${encodeURIComponent(mapboxId)}?${params}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Mapbox retrieve failed (${res.status}): ${body}`);
  }

  const json = (await res.json()) as { features?: MapboxFeature[] };
  const feature = json.features?.[0];
  if (!feature) throw new Error("Place not found");

  return mapFeature(feature, mapboxId);
}

export async function geocodeSuburbStreet(
  street: string,
  suburb: string,
  proximity: { latitude: number; longitude: number },
  sessionToken?: string,
): Promise<{ latitude: number; longitude: number; label: string } | null> {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) throw new Error("MAPBOX_ACCESS_TOKEN is not configured");

  const query = `${street}, ${suburb}, Victoria, Australia`;
  const proximityStr = `${proximity.longitude},${proximity.latitude}`;
  const params = new URLSearchParams({
    q: query,
    access_token: token,
    country: "AU",
    proximity: proximityStr,
    language: "en",
    limit: "1",
    types: "address,street,place",
  });
  if (sessionToken) params.set("session_token", sessionToken);

  const suggestUrl = `https://api.mapbox.com/search/searchbox/v1/suggest?${params}`;
  const suggestRes = await fetch(suggestUrl);
  if (!suggestRes.ok) return null;

  const suggestJson = (await suggestRes.json()) as { suggestions?: MapboxSuggestion[] };
  const suggestion = suggestJson.suggestions?.[0];
  if (!suggestion) return null;

  const mapboxId = suggestion.mapbox_id ?? suggestion.properties?.mapbox_id;
  if (!mapboxId || !sessionToken) return null;

  const place = await retrievePlace(mapboxId, sessionToken);
  return {
    latitude: place.latitude!,
    longitude: place.longitude!,
    label: `${street}, ${suburb}`,
  };
}
