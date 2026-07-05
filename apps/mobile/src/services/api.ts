const API = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export interface SearchResult {
  id: string;
  name: string;
  placeFormatted: string;
  featureType: string;
  latitude: number;
  longitude: number;
}

export interface RuleResult {
  canPark: boolean;
  currentRule: string;
  leaveBy: string | null;
  paymentRequired: boolean;
  estimatedCost: number | null;
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, init);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  search(q: string, sessionToken?: string) {
    const params = new URLSearchParams({ q });
    if (sessionToken) params.set("sessionToken", sessionToken);
    return request<{ results: SearchResult[]; error?: string }>(`/api/search?${params}`);
  },
  retrieve(mapboxId: string, sessionToken?: string) {
    const params = new URLSearchParams({ q: "x", mapboxId });
    if (sessionToken) params.set("sessionToken", sessionToken);
    return request<{ results: SearchResult[] }>(`/api/search?${params}`);
  },
  nearby(opts: {
    latitude: number;
    longitude: number;
    radius?: number;
    minimumDuration?: number;
    freeOnly?: boolean;
  }) {
    const params = new URLSearchParams({
      latitude: String(opts.latitude),
      longitude: String(opts.longitude),
      radius: String(opts.radius ?? 500),
    });
    if (opts.minimumDuration) params.set("minimumDuration", String(opts.minimumDuration));
    if (opts.freeOnly) params.set("freeOnly", "true");
    return request<{ results: NearbyBay[]; count: number; error?: string }>(`/api/parking/nearby?${params}`);
  },
  bayRule(id: string) {
    return request<RuleResult>(`/api/parking/bays/${id}/rule`);
  },
  report(body: Record<string, unknown>) {
    return request<unknown>(`/api/parking/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  },
  createSession(body: Record<string, unknown>) {
    return request<unknown>(`/api/parking/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  },
};
