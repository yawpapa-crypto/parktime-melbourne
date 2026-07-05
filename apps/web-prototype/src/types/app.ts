import type { NearbyBay } from "@/services/api";

export interface UserProfile {
  name: string;
  location: string;
  vehicles: string[];
  defaultVehicle: string;
  preferredDuration: string;
  notificationsEnabled: boolean;
  accessibleParking: boolean;
  evCharging: boolean;
  colorBlindMode: boolean;
  mapAppearance: "default" | "satellite";
}

export interface SavedPlace {
  id: string;
  label: string;
  category: string;
  bayId?: string;
  street: string;
  suburb: string;
  latitude?: number;
  longitude?: number;
  rule?: string;
  status: "available" | "paid" | "caution";
  icon: string;
}

export interface ParkingFilters {
  duration: string[];
  cost: "free" | "paid" | "any";
  parkTypes: string[];
  availability: "available" | "sensor" | "all";
}

export interface ActiveSession {
  id: string;
  bayId: string;
  streetDescription: string;
  suburb: string | null;
  latitude: number;
  longitude: number;
  vehicleRegistration: string;
  startedAt: string;
  expectedEndAt: string;
  estimatedCost: number | null;
  currentRule: string;
  paymentRequired: boolean;
  reminders: boolean[];
}

export const DEFAULT_PROFILE: UserProfile = {
  name: "ParkTime User",
  location: "Melbourne, VIC",
  vehicles: ["1ABC123"],
  defaultVehicle: "1ABC123",
  preferredDuration: "2P",
  notificationsEnabled: true,
  accessibleParking: false,
  evCharging: false,
  colorBlindMode: false,
  mapAppearance: "default",
};

export const DEFAULT_FILTERS: ParkingFilters = {
  duration: [],
  cost: "any",
  parkTypes: [],
  availability: "all",
};

export type SelectedBay = NearbyBay;
