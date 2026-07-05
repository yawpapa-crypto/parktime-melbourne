import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import type { ParkingBayRecord, ParkingRestrictionRecord } from "@parktime/shared";
import { BaseCouncilAdapter } from "./base-adapter.js";
import { MelbourneOdsClient, OdsApiError } from "../services/ods-client.js";

interface GeoJsonFeature {
  type: "Feature";
  geometry?: { type: string; coordinates: number[] };
  properties?: Record<string, unknown>;
}

interface GeoJsonCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}

function parseDays(raw: unknown): number[] {
  if (Array.isArray(raw)) return raw.map(Number);
  if (typeof raw === "string") {
    const map: Record<string, number> = {
      mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0,
    };
    return raw
      .split(/[,/|]/)
      .map((d) => map[d.trim().slice(0, 3).toLowerCase()] ?? Number(d))
      .filter((n) => !Number.isNaN(n));
  }
  return [1, 2, 3, 4, 5];
}

function unwrapOdsRecord(item: unknown): Record<string, unknown> {
  const row = item as Record<string, unknown>;
  if (row.properties && typeof row.properties === "object") {
    return row.properties as Record<string, unknown>;
  }
  return row;
}

export class MelbourneCouncilAdapter extends BaseCouncilAdapter {
  councilId = "city-of-melbourne";
  councilName = "City of Melbourne";
  private councilDbId = "";
  private readonly ods: MelbourneOdsClient;

  constructor(ods: MelbourneOdsClient = new MelbourneOdsClient()) {
    super();
    this.ods = ods;
  }

  setCouncilDbId(id: string) {
    this.councilDbId = id;
  }

  private datasetId(key: keyof typeof MelbourneCouncilAdapter.prototype.datasetKeys): string {
    return this.datasetKeys[key];
  }

  private readonly datasetKeys = {
    bays: process.env.MELBOURNE_DATASET_BAYS ?? "on-street-parking-bays",
    restrictions: process.env.MELBOURNE_DATASET_RESTRICTIONS ?? "on-street-car-park-bay-restrictions",
    sensors: process.env.MELBOURNE_DATASET_SENSORS ?? "on-street-parking-bay-sensors",
    meters: process.env.MELBOURNE_DATASET_METERS ?? "parking-meters",
    zones: process.env.MELBOURNE_DATASET_ZONES ?? "on-street-parking-zones",
  };

  private loadLocalBays(): unknown[] | null {
    const filePath = process.env.MELBOURNE_BAYS_GEOJSON_PATH;
    if (!filePath) return null;
    const resolved = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
    if (!existsSync(resolved)) return null;
    const geo = JSON.parse(readFileSync(resolved, "utf8")) as GeoJsonCollection;
    return geo.features ?? [];
  }

  async fetchBays(): Promise<unknown[]> {
    const local = this.loadLocalBays();
    if (local?.length) return local;

    try {
      const geo = await this.ods.fetchExportGeoJson(this.datasetId("bays"));
      return geo.features ?? [];
    } catch (err) {
      if (err instanceof OdsApiError && err.isUnauthorized) throw err;
      return this.ods.fetchAllRecords(this.datasetId("bays"));
    }
  }

  async fetchRestrictions(): Promise<unknown[]> {
    return this.fetchDataset(this.datasetId("restrictions"));
  }

  async fetchSensors(): Promise<unknown[]> {
    return this.fetchDataset(this.datasetId("sensors"));
  }

  async fetchMeters(): Promise<unknown[]> {
    return this.fetchDataset(this.datasetId("meters"));
  }

  async fetchZones(): Promise<unknown[]> {
    return this.fetchDataset(this.datasetId("zones"));
  }

  private async fetchDataset(datasetId: string): Promise<unknown[]> {
    try {
      return await this.ods.fetchDatasetFeatures(datasetId);
    } catch (err) {
      if (err instanceof OdsApiError) {
        if (err.isUnauthorized) throw err;
        if (err.isRateLimited) throw err;
      }
      throw err;
    }
  }

  normaliseBays(raw: unknown[]): ParkingBayRecord[] {
    return raw.map((item, index) => {
      const feature = item as GeoJsonFeature;
      const props = unwrapOdsRecord(item);
      const coords = feature.geometry?.coordinates;
      const lat = Number(props.latitude ?? coords?.[1] ?? 0);
      const lng = Number(props.longitude ?? coords?.[0] ?? 0);
      const roadSegmentId = String(props.roadsegmentid ?? props.road_segment_id ?? index);
      const kerbsideId = props.kerbsideid ?? props.kerbside_id ?? props.marker_id;
      const externalBayId = String(kerbsideId ?? `${roadSegmentId}-${index}`);

      return {
        id: "",
        councilId: this.councilDbId,
        externalBayId,
        externalRoadSegmentId: roadSegmentId,
        streetDescription: String(
          props.roadsegmentdescription ?? props.street ?? props.description ?? "Unknown street",
        ),
        suburb: props.suburb ? String(props.suburb) : "Melbourne",
        latitude: lat,
        longitude: lng,
        bayType: String(props.baytype ?? props.bay_type ?? "general"),
        markerId: kerbsideId ? String(kerbsideId) : null,
        zoneId: props.zone_id ? String(props.zone_id) : null,
        source: "City of Melbourne ODS",
        sourceUpdatedAt: props.lastupdated ? String(props.lastupdated) : null,
        rawData: { ...(props as Record<string, unknown>), _geometry: feature.geometry ?? null },
      };
    });
  }

  normaliseRestrictions(
    raw: unknown[],
    bayLookup: Map<string, string>,
  ): ParkingRestrictionRecord[] {
    const results: ParkingRestrictionRecord[] = [];

    for (const item of raw) {
      const row = unwrapOdsRecord(item);
      const bayKey = String(row.bay_id ?? row.kerbsideid ?? row.marker_id ?? row.bayid ?? "");
      const bayId = bayLookup.get(bayKey);
      if (!bayId) continue;

      const kindRaw = String(row.restriction_type ?? row.restriction ?? row.type ?? "time_limit").toLowerCase();
      let kind: ParkingRestrictionRecord["kind"] = "time_limit";
      if (kindRaw.includes("clearway")) kind = "clearway";
      else if (kindRaw.includes("loading")) kind = "loading";
      else if (kindRaw.includes("permit")) kind = "permit";
      else if (kindRaw.includes("accessible")) kind = "accessible";
      else if (kindRaw.includes("paid") || kindRaw.includes("meter")) kind = "paid";
      else if (kindRaw.includes("no stopping")) kind = "no_stopping";
      else if (kindRaw.includes("unrestricted")) kind = "unrestricted";

      results.push({
        id: "",
        bayId,
        councilId: this.councilDbId,
        externalRestrictionId: row.restriction_id ? String(row.restriction_id) : null,
        kind,
        daysOfWeek: parseDays(row.days_of_week ?? row.days ?? [1, 2, 3, 4, 5]),
        startTime: String(row.start_time ?? row.time_start ?? "08:00:00").slice(0, 8),
        endTime: String(row.end_time ?? row.time_end ?? "18:30:00").slice(0, 8),
        maxStayMinutes: row.max_stay_minutes
          ? Number(row.max_stay_minutes)
          : row.time_limit_hours
            ? Number(row.time_limit_hours) * 60
            : kind === "paid" || kind === "time_limit"
              ? 120
              : null,
        paymentRequired: kind === "paid" || Boolean(row.payment_required),
        ratePerHour: row.rate_per_hour ? Number(row.rate_per_hour) : kind === "paid" ? 4.6 : null,
        permitRequired: row.permit_zone ? String(row.permit_zone) : null,
        permitExempt: row.permit_exempt ? String(row.permit_exempt).split(",") : null,
        priority: Number(row.priority ?? 10),
        isTemporary: Boolean(row.is_temporary ?? false),
        source: "City of Melbourne ODS",
        sourceUpdatedAt: row.lastupdated ? String(row.lastupdated) : null,
        rawData: row,
      });
    }

    return results;
  }
}

export const melbourneAdapter = new MelbourneCouncilAdapter();
