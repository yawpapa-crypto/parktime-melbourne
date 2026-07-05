export type VehicleType = "standard" | "motorcycle" | "electric" | "accessible";
export type PermitStatus = "none" | "resident" | "p10" | "other";
export type RestrictionKind =
  | "time_limit"
  | "paid"
  | "clearway"
  | "loading"
  | "permit"
  | "accessible"
  | "no_stopping"
  | "unrestricted";

export type ConfidenceLevel = "high" | "medium" | "low";

export interface CouncilRecord {
  id: string;
  externalId: string;
  name: string;
  state: string;
  timezone: string;
  coveragePolygon?: unknown;
  lastImportAt?: string | null;
  isActive: boolean;
}

export interface ParkingBayRecord {
  id: string;
  councilId: string;
  externalBayId: string;
  externalRoadSegmentId?: string | null;
  streetDescription: string;
  suburb?: string | null;
  latitude: number;
  longitude: number;
  bayType: string;
  markerId?: string | null;
  zoneId?: string | null;
  source: string;
  sourceUpdatedAt?: string | null;
  rawData?: Record<string, unknown>;
}

export interface ParkingRestrictionRecord {
  id: string;
  bayId: string;
  councilId: string;
  externalRestrictionId?: string | null;
  kind: RestrictionKind;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  maxStayMinutes?: number | null;
  paymentRequired: boolean;
  ratePerHour?: number | null;
  permitRequired?: string | null;
  permitExempt?: string[] | null;
  vehicleTypes?: VehicleType[] | null;
  priority: number;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  isTemporary: boolean;
  source: string;
  sourceUpdatedAt?: string | null;
  rawData?: Record<string, unknown>;
}

export interface ParkingOccupancyRecord {
  bayId: string;
  isOccupied: boolean;
  sensorId?: string | null;
  confidence: ConfidenceLevel;
  observedAt: string;
  source: string;
}

export interface ParkingMeterRecord {
  id: string;
  bayId?: string | null;
  councilId: string;
  externalMeterId: string;
  latitude: number;
  longitude: number;
  ratePerHour?: number | null;
  source: string;
  sourceUpdatedAt?: string | null;
}

export interface RuleEvaluationInput {
  bay: ParkingBayRecord;
  restrictions: ParkingRestrictionRecord[];
  occupancy?: ParkingOccupancyRecord | null;
  meter?: ParkingMeterRecord | null;
  arrivalTimeIso: string;
  intendedDurationMinutes: number;
  vehicleType: VehicleType;
  permitStatus: PermitStatus;
  isPublicHoliday?: boolean | null;
}

export interface RuleEvaluationResult {
  canPark: boolean;
  currentRule: string;
  maximumMinutes: number | null;
  remainingMinutes: number | null;
  leaveBy: string | null;
  paymentRequired: boolean;
  estimatedCost: number | null;
  nextRule: string | null;
  nextRuleStart: string | null;
  clearwayWarning: string | null;
  permitWarning: string | null;
  accessibleRestriction: string | null;
  loadingRestriction: string | null;
  confidence: ConfidenceLevel;
  source: string;
  sourceUpdatedAt: string | null;
}

export interface NearbyParkingQuery {
  latitude: number;
  longitude: number;
  radius?: number;
  arrivalTime?: string;
  minimumDuration?: number;
  freeOnly?: boolean;
  parkingTypes?: string[];
}

export interface NearbyParkingBay extends ParkingBayRecord {
  distanceMetres: number;
  rule: RuleEvaluationResult;
  occupancy?: ParkingOccupancyRecord | null;
}

export interface SearchResult {
  id: string;
  name: string;
  placeFormatted: string;
  featureType: string;
  latitude: number;
  longitude: number;
}

export interface CouncilCoverage {
  councilId: string;
  councilName: string;
  baysCount: number;
  restrictionsCount: number;
  sensorsCount: number;
  metersCount: number;
  lastImportAt: string | null;
  isStale: boolean;
  boundingBox?: [number, number, number, number];
}

export interface CouncilParkingAdapter {
  councilId: string;
  councilName: string;
  fetchBays(): Promise<unknown[]>;
  fetchRestrictions(): Promise<unknown[]>;
  fetchSensors?(): Promise<unknown[]>;
  fetchMeters?(): Promise<unknown[]>;
  fetchZones?(): Promise<unknown[]>;
  normaliseBays(raw: unknown[]): ParkingBayRecord[];
  normaliseRestrictions(raw: unknown[], bayLookup: Map<string, string>): ParkingRestrictionRecord[];
  validateImport(stats: ImportStats): ImportValidationResult;
  returnCoverageMetadata(): CouncilCoverage;
}

export interface ImportStats {
  baysImported: number;
  baysFailed: number;
  restrictionsImported: number;
  restrictionsFailed: number;
  sensorsImported: number;
  metersImported: number;
  lastImportAt: string;
  errors: string[];
}

export interface ImportValidationResult {
  valid: boolean;
  issues: string[];
}

export * from "./rules-engine.js";
