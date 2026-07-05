import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import {
  getDeviceId,
  isOnboardingDone,
  loadActiveSession,
  loadFilters,
  loadProfile,
  loadSavedPlaces,
  saveActiveSession,
  saveFilters,
  saveProfile,
  saveSavedPlaces,
  setOnboardingDone,
} from "@/lib/storage";
import type {
  ActiveSession,
  ParkingFilters,
  SavedPlace,
  SelectedBay,
  UserProfile,
} from "@/types/app";
import { DEFAULT_FILTERS, DEFAULT_PROFILE } from "@/types/app";

interface AppStoreValue {
  deviceId: string;
  profile: UserProfile;
  updateProfile: (patch: Partial<UserProfile>) => void;
  savedPlaces: SavedPlace[];
  addSavedPlace: (place: Omit<SavedPlace, "id">) => void;
  removeSavedPlace: (id: string) => void;
  updateSavedPlace: (id: string, patch: Partial<SavedPlace>) => void;
  activeSession: ActiveSession | null;
  startSession: (bay: SelectedBay, expectedEndAt: string) => Promise<void>;
  endSession: () => Promise<void>;
  extendSession: (minutes: number) => Promise<void>;
  updateSessionReminders: (reminders: boolean[]) => void;
  filters: ParkingFilters;
  setFilters: (filters: ParkingFilters) => void;
  selectedBay: SelectedBay | null;
  setSelectedBay: (bay: SelectedBay | null) => void;
  mapCenter: { latitude: number; longitude: number };
  setMapCenter: (center: { latitude: number; longitude: number }) => void;
  councilCount: number | null;
  completeOnboarding: () => void;
  showOnboarding: boolean;
}

const AppStoreContext = createContext<AppStoreValue | null>(null);

const MELBOURNE = { latitude: -37.8136, longitude: 144.9631 };

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [deviceId] = useState(getDeviceId);
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile(DEFAULT_PROFILE));
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>(() => loadSavedPlaces([]));
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(() => loadActiveSession());
  const [filters, setFiltersState] = useState<ParkingFilters>(() => loadFilters(DEFAULT_FILTERS));
  const [selectedBay, setSelectedBay] = useState<SelectedBay | null>(null);
  const [mapCenter, setMapCenter] = useState(MELBOURNE);
  const [councilCount, setCouncilCount] = useState<number | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(() => !isOnboardingDone());

  useEffect(() => {
    api.councilCoverage().then((res) => setCouncilCount(res.councils.length)).catch(() => {});
  }, []);

  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      saveProfile(next);
      return next;
    });
  }, []);

  const addSavedPlace = useCallback((place: Omit<SavedPlace, "id">) => {
    setSavedPlaces((prev) => {
      const next = [{ ...place, id: crypto.randomUUID?.() ?? String(Date.now()) }, ...prev];
      saveSavedPlaces(next);
      void api.savePlace({ deviceId, ...place }).catch(() => {});
      return next;
    });
  }, [deviceId]);

  const removeSavedPlace = useCallback((id: string) => {
    setSavedPlaces((prev) => {
      const next = prev.filter((p) => p.id !== id);
      saveSavedPlaces(next);
      void api.deleteSavedPlace(id, deviceId).catch(() => {});
      return next;
    });
  }, [deviceId]);

  const updateSavedPlace = useCallback((id: string, patch: Partial<SavedPlace>) => {
    setSavedPlaces((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...patch } : p));
      saveSavedPlaces(next);
      return next;
    });
  }, []);

  const startSession = useCallback(
    async (bay: SelectedBay, expectedEndAt: string) => {
      const startedAt = new Date().toISOString();
      const body = {
        deviceId,
        bayId: bay.id,
        vehicleRegistration: profile.defaultVehicle,
        startedAt,
        expectedEndAt,
        estimatedCost: bay.rule.estimatedCost ?? undefined,
        reminders: [true, true, false],
      };
      const created = (await api.createSession(body)) as ActiveSession & { id: string };
      const session: ActiveSession = {
        id: created.id,
        bayId: bay.id,
        streetDescription: bay.streetDescription,
        suburb: bay.suburb,
        latitude: bay.latitude,
        longitude: bay.longitude,
        vehicleRegistration: profile.defaultVehicle,
        startedAt,
        expectedEndAt,
        estimatedCost: bay.rule.estimatedCost,
        currentRule: bay.rule.currentRule,
        paymentRequired: bay.rule.paymentRequired,
        reminders: [true, true, false],
      };
      setActiveSession(session);
      saveActiveSession(session);
    },
    [deviceId, profile.defaultVehicle],
  );

  const endSession = useCallback(async () => {
    if (activeSession) {
      await api.updateSession(activeSession.id, {
        endedAt: new Date().toISOString(),
        status: "ended",
      }).catch(() => {});
    }
    setActiveSession(null);
    saveActiveSession(null);
  }, [activeSession]);

  const extendSession = useCallback(
    async (minutes: number) => {
      if (!activeSession) return;
      const expectedEndAt = new Date(
        new Date(activeSession.expectedEndAt).getTime() + minutes * 60_000,
      ).toISOString();
      await api.updateSession(activeSession.id, { expectedEndAt }).catch(() => {});
      setActiveSession((prev) => {
        if (!prev) return prev;
        const next = { ...prev, expectedEndAt };
        saveActiveSession(next);
        return next;
      });
    },
    [activeSession],
  );

  const updateSessionReminders = useCallback((reminders: boolean[]) => {
    setActiveSession((prev) => {
      if (!prev) return prev;
      const next = { ...prev, reminders };
      saveActiveSession(next);
      if (prev.id) void api.updateSession(prev.id, { reminders }).catch(() => {});
      return next;
    });
  }, []);

  const setFilters = useCallback((next: ParkingFilters) => {
    setFiltersState(next);
    saveFilters(next);
  }, []);

  const completeOnboarding = useCallback(() => {
    setOnboardingDone();
    setShowOnboarding(false);
  }, []);

  const value = useMemo<AppStoreValue>(
    () => ({
      deviceId,
      profile,
      updateProfile,
      savedPlaces,
      addSavedPlace,
      removeSavedPlace,
      updateSavedPlace,
      activeSession,
      startSession,
      endSession,
      extendSession,
      updateSessionReminders,
      filters,
      setFilters,
      selectedBay,
      setSelectedBay,
      mapCenter,
      setMapCenter,
      councilCount,
      completeOnboarding,
      showOnboarding,
    }),
    [
      deviceId,
      profile,
      updateProfile,
      savedPlaces,
      addSavedPlace,
      removeSavedPlace,
      updateSavedPlace,
      activeSession,
      startSession,
      endSession,
      extendSession,
      updateSessionReminders,
      filters,
      setFilters,
      selectedBay,
      mapCenter,
      councilCount,
      completeOnboarding,
      showOnboarding,
    ],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider");
  return ctx;
}
