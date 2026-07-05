import type {
  CouncilCoverage,
  CouncilParkingAdapter,
  ImportStats,
  ImportValidationResult,
  ParkingBayRecord,
  ParkingRestrictionRecord,
} from "@parktime/shared";

export interface CouncilAdapterContext {
  councilDbId: string;
  lastImportAt?: string | null;
  stats: Partial<ImportStats>;
}

export abstract class BaseCouncilAdapter implements CouncilParkingAdapter {
  abstract councilId: string;
  abstract councilName: string;

  abstract fetchBays(): Promise<unknown[]>;
  abstract fetchRestrictions(): Promise<unknown[]>;
  fetchSensors?(): Promise<unknown[]>;
  fetchMeters?(): Promise<unknown[]>;
  fetchZones?(): Promise<unknown[]>;

  abstract normaliseBays(raw: unknown[]): ParkingBayRecord[];
  abstract normaliseRestrictions(
    raw: unknown[],
    bayLookup: Map<string, string>,
  ): ParkingRestrictionRecord[];

  validateImport(stats: ImportStats): ImportValidationResult {
    const issues: string[] = [];
    if (stats.baysImported === 0) issues.push("No bays imported");
    if (stats.baysFailed > stats.baysImported * 0.05) {
      issues.push("High bay failure rate (>5%)");
    }
    if (stats.errors.length) issues.push(...stats.errors.slice(0, 5));
    return { valid: issues.length === 0, issues };
  }

  returnCoverageMetadata(): CouncilCoverage {
    return {
      councilId: this.councilId,
      councilName: this.councilName,
      baysCount: 0,
      restrictionsCount: 0,
      sensorsCount: 0,
      metersCount: 0,
      lastImportAt: null,
      isStale: true,
    };
  }
}

export type { CouncilParkingAdapter };
