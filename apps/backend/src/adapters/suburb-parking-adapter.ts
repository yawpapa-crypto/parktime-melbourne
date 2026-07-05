import type { ParkingBayRecord, ParkingRestrictionRecord } from "@parktime/shared";
import { BaseCouncilAdapter } from "./base-adapter.js";
import type { SuburbImportConfig } from "../config/suburb-imports.js";
import { geocodeSuburbStreet } from "../services/mapbox-search.js";

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function generateBayPoints(
  config: SuburbImportConfig,
  street: string,
  latitude: number,
  longitude: number,
): ParkingBayRecord[] {
  const bays: ParkingBayRecord[] = [];
  const streetSlug = slugify(street);

  for (let i = 0; i < config.baysPerStreet; i++) {
    const offset = (i - config.baysPerStreet / 2) * 0.00007;
    bays.push({
      id: "",
      councilId: config.councilExternalId,
      externalBayId: `${config.slug}-${streetSlug}-${i + 1}`,
      externalRoadSegmentId: streetSlug,
      streetDescription: `${street}, ${config.suburb}`,
      suburb: config.suburb,
      latitude: latitude + offset * 0.25,
      longitude: longitude + offset,
      bayType: "general",
      source: `${config.councilName} (Mapbox geocoded — verify sign)`,
      sourceUpdatedAt: new Date().toISOString(),
      rawData: { street, suburb: config.suburb, generated: true, index: i },
    });
  }

  return bays;
}

export class SuburbParkingAdapter extends BaseCouncilAdapter {
  councilId: string;
  councilName: string;
  private readonly config: SuburbImportConfig;
  private councilDbId = "";

  constructor(config: SuburbImportConfig) {
    super();
    this.config = config;
    this.councilId = config.councilExternalId;
    this.councilName = config.councilName;
  }

  setCouncilDbId(id: string) {
    this.councilDbId = id;
  }

  async fetchBays(): Promise<unknown[]> {
    const sessionToken = `suburb-${this.config.slug}-${Date.now()}`;
    const bays: ParkingBayRecord[] = [];

    for (const street of this.config.streets) {
      try {
        const located = await geocodeSuburbStreet(
          street,
          this.config.suburb,
          this.config.center,
          sessionToken,
        );
        if (!located) continue;
        bays.push(...generateBayPoints(this.config, street, located.latitude, located.longitude));
        await new Promise((r) => setTimeout(r, 120));
      } catch {
        // skip streets Mapbox cannot resolve
      }
    }

    return bays;
  }

  async fetchRestrictions(): Promise<unknown[]> {
    return [];
  }

  normaliseBays(raw: unknown[]): ParkingBayRecord[] {
    return (raw as ParkingBayRecord[]).map((bay) => ({
      ...bay,
      councilId: this.councilDbId || this.config.councilExternalId,
    }));
  }

  normaliseRestrictions(
    _raw: unknown[],
    bayLookup: Map<string, string>,
  ): ParkingRestrictionRecord[] {
    const restrictions: ParkingRestrictionRecord[] = [];
    for (const [, bayId] of bayLookup) {
      restrictions.push({
        id: "",
        bayId,
        councilId: this.councilDbId || this.config.councilExternalId,
        externalRestrictionId: `${bayId}-suburb-2p`,
        kind: "time_limit",
        daysOfWeek: [1, 2, 3, 4, 5],
        startTime: "08:00",
        endTime: "18:00",
        maxStayMinutes: 120,
        paymentRequired: false,
        priority: 0,
        isTemporary: false,
        source: `${this.config.councilName} (estimated suburb default)`,
        sourceUpdatedAt: new Date().toISOString(),
        rawData: { confidence: "low", note: "Verify physical sign" },
      });
    }
    return restrictions;
  }
}
