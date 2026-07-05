export type Screen = "onboarding" | "map" | "nearby" | "saved" | "timer" | "profile";
export type Sheet = null | "detail" | "filter" | "report" | "scanner";

export type ParkSpotType =
  | "available"
  | "paid"
  | "caution"
  | "clearway"
  | "permit"
  | "loading";

export interface ParkSpot {
  id: number;
  street: string;
  suburb: string;
  distance: string;
  limit: string;
  badge: string;
  leaveBy: string;
  maxStay: string;
  cost: string;
  costNote: string;
  type: ParkSpotType;
  nextRule: string;
  availability: string;
  occupancy: number;
  lastUpdated: string;
  council: string;
  clearwayHours?: string;
  permitException?: string;
  mx: number;
  my: number;
}

export interface SavedPlace {
  label: string;
  cat: string;
  street: string;
  suburb: string;
  rule: string;
  status: ParkSpotType;
  dist: string;
  icon: string;
}
