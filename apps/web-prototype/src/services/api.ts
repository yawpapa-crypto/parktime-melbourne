const API = import.meta.env.VITE_API_BASE_URL ?? "";

export interface SearchResult {
  id: string;
  name: string;
  placeFormatted: string;
  featureType: string;
  latitude?: number;
  longitude?: number;
}

export interface RuleResult {
  canPark: boolean;
  currentRule: string;
  leaveBy: string | null;
  paymentRequired: boolean;
  estimatedCost: number | null;
  maximumMinutes: number | null;
  remainingMinutes: number | null;
  nextRule: string | null;
  confidence: string;
  source: string;
  sourceUpdatedAt: string | null;
  clearwayWarning?: string | null;
}

export interface NearbyBay {
  id: string;
  streetDescription: string;
  suburb: string | null;
  latitude: number;
  longitude: number;
  distanceMetres: number;
  source: string;
  sourceUpdatedAt: string | null;
  rule: RuleResult;
}

export interface SavedPlaceRecord {
  id: string;
  label: string;
  category: string | null;
  bayId: string | null;
  streetDescription: string | null;
  suburb: string | null;
  latitude: number | null;
  longitude: number | null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, init);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  search(q: string, sessionToken?: string, signal?: AbortSignal) {
    const params = new URLSearchParams({ q });
    if (sessionToken) params.set("sessionToken", sessionToken);
    return request<{ results: SearchResult[]; error?: string }>(`/api/search?${params}`, { signal });
  },
  retrieve(mapboxId: string, sessionToken?: string, signal?: AbortSignal) {
    const params = new URLSearchParams({ mapboxId });
    if (sessionToken) params.set("sessionToken", sessionToken);
    return request<{ results: SearchResult[]; error?: string }>(`/api/search?${params}`, { signal });
  },
  nearby(opts: {
    latitude: number;
    longitude: number;
    radius?: number;
    minimumDuration?: number;
    freeOnly?: boolean;
    parkingTypes?: string;
  }, signal?: AbortSignal) {
    const params = new URLSearchParams({
      latitude: String(opts.latitude),
      longitude: String(opts.longitude),
      radius: String(opts.radius ?? 500),
    });
    if (opts.minimumDuration) params.set("minimumDuration", String(opts.minimumDuration));
    if (opts.freeOnly) params.set("freeOnly", "true");
    if (opts.parkingTypes) params.set("parkingTypes", opts.parkingTypes);
    return request<{ results: NearbyBay[]; count: number; error?: string }>(
      `/api/parking/nearby?${params}`,
      { signal },
    );
  },
  report(body: {
    bayId?: string;
    issueType: string;
    note?: string;
    deviceId?: string;
    photoUrl?: string;
  }) {
    return request<unknown>(`/api/parking/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  },
  createSession(body: Record<string, unknown>) {
    return request<{ id: string }>(`/api/parking/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  },
  updateSession(id: string, body: Record<string, unknown>) {
    return request<unknown>(`/api/parking/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  },
  councilCoverage() {
    return request<{ councils: { councilName: string; baysCount: number }[] }>(
      `/api/councils/coverage`,
    );
  },
  listSavedPlaces(deviceId: string) {
    return request<{ places: SavedPlaceRecord[] }>(
      `/api/saved?deviceId=${encodeURIComponent(deviceId)}`,
    );
  },
  savePlace(body: Record<string, unknown>) {
    return request<SavedPlaceRecord>(`/api/saved`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  },
  deleteSavedPlace(id: string, deviceId: string) {
    return request<{ ok: boolean }>(
      `/api/saved/${id}?deviceId=${encodeURIComponent(deviceId)}`,
      { method: "DELETE" },
    );
  },
};
