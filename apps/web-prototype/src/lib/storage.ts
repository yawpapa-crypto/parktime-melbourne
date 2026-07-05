const DEVICE_KEY = "parktime_device_id";
const PROFILE_KEY = "parktime_profile";
const SAVED_KEY = "parktime_saved_places";
const SESSION_KEY = "parktime_active_session";
const FILTERS_KEY = "parktime_filters";
const ONBOARDING_KEY = "parktime_onboarding_done";

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID?.() ?? `device-${Date.now()}`;
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export function loadProfile<T>(fallback: T): T {
  return readJson<T>(PROFILE_KEY) ?? fallback;
}

export function saveProfile(profile: unknown) {
  writeJson(PROFILE_KEY, profile);
}

export function loadSavedPlaces<T>(fallback: T): T {
  return readJson<T>(SAVED_KEY) ?? fallback;
}

export function saveSavedPlaces(places: unknown) {
  writeJson(SAVED_KEY, places);
}

export function loadActiveSession<T>(): T | null {
  return readJson<T>(SESSION_KEY);
}

export function saveActiveSession(session: unknown | null) {
  if (session == null) localStorage.removeItem(SESSION_KEY);
  else writeJson(SESSION_KEY, session);
}

export function loadFilters<T>(fallback: T): T {
  return readJson<T>(FILTERS_KEY) ?? fallback;
}

export function saveFilters(filters: unknown) {
  writeJson(FILTERS_KEY, filters);
}

export function isOnboardingDone(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === "1";
}

export function setOnboardingDone() {
  localStorage.setItem(ONBOARDING_KEY, "1");
}
