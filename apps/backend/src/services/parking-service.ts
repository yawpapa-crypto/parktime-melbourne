import { evaluateParkingRules } from "@parktime/shared";
import type { NearbyParkingBay, RuleEvaluationResult } from "@parktime/shared";
import { query } from "../db/pool.js";

interface BayRow {
  id: string;
  council_id: string;
  external_bay_id: string;
  external_road_segment_id: string | null;
  street_description: string;
  suburb: string | null;
  latitude: number;
  longitude: number;
  bay_type: string;
  marker_id: string | null;
  zone_id: string | null;
  source: string;
  source_updated_at: string | null;
  distance_metres: number;
}

interface RestrictionRow {
  id: string;
  bay_id: string;
  council_id: string;
  external_restriction_id: string | null;
  kind: string;
  days_of_week: number[];
  start_time: string;
  end_time: string;
  max_stay_minutes: number | null;
  payment_required: boolean;
  rate_per_hour: string | null;
  permit_required: string | null;
  permit_exempt: string[] | null;
  priority: number;
  is_temporary: boolean;
  source: string;
  source_updated_at: string | null;
}

function mapRestriction(row: RestrictionRow) {
  return {
    id: row.id,
    bayId: row.bay_id,
    councilId: row.council_id,
    externalRestrictionId: row.external_restriction_id,
    kind: row.kind as RestrictionRow["kind"],
    daysOfWeek: row.days_of_week,
    startTime: row.start_time,
    endTime: row.end_time,
    maxStayMinutes: row.max_stay_minutes,
    paymentRequired: row.payment_required,
    ratePerHour: row.rate_per_hour ? Number(row.rate_per_hour) : null,
    permitRequired: row.permit_required,
    permitExempt: row.permit_exempt,
    priority: row.priority,
    isTemporary: row.is_temporary,
    source: row.source,
    sourceUpdatedAt: row.source_updated_at,
  };
}

export async function getRestrictionsForBay(bayId: string) {
  const res = await query<RestrictionRow>(
    `SELECT * FROM parking_restrictions WHERE bay_id = $1 ORDER BY priority ASC`,
    [bayId],
  );
  return res.rows.map(mapRestriction);
}

export async function evaluateBayRule(
  bayId: string,
  arrivalTime?: string,
  intendedDurationMinutes = 120,
): Promise<RuleEvaluationResult> {
  const bayRes = await query<BayRow>(
    `SELECT pb.*, ST_Y(pb.location::geometry) AS latitude, ST_X(pb.location::geometry) AS longitude, 0 AS distance_metres
     FROM parking_bays pb WHERE pb.id = $1`,
    [bayId],
  );
  const bay = bayRes.rows[0];
  if (!bay) throw new Error("Bay not found");

  const restrictions = await getRestrictionsForBay(bayId);
  return evaluateParkingRules({
    bay: {
      id: bay.id,
      councilId: bay.council_id,
      externalBayId: bay.external_bay_id,
      externalRoadSegmentId: bay.external_road_segment_id,
      streetDescription: bay.street_description,
      suburb: bay.suburb,
      latitude: bay.latitude,
      longitude: bay.longitude,
      bayType: bay.bay_type,
      markerId: bay.marker_id,
      zoneId: bay.zone_id,
      source: bay.source,
      sourceUpdatedAt: bay.source_updated_at,
    },
    restrictions: restrictions as never[],
    arrivalTimeIso: arrivalTime ?? new Date().toISOString(),
    intendedDurationMinutes,
    vehicleType: "standard",
    permitStatus: "none",
  });
}

export async function findNearbyParking(options: {
  latitude: number;
  longitude: number;
  radius?: number;
  arrivalTime?: string;
  minimumDuration?: number;
  freeOnly?: boolean;
  parkingTypes?: string[];
}): Promise<NearbyParkingBay[]> {
  const radius = options.radius ?? 500;
  const res = await query<BayRow>(
    `SELECT pb.id, pb.council_id, pb.external_bay_id, pb.external_road_segment_id,
            pb.street_description, pb.suburb, pb.bay_type, pb.marker_id, pb.zone_id,
            pb.source, pb.source_updated_at,
            ST_Y(pb.location::geometry) AS latitude,
            ST_X(pb.location::geometry) AS longitude,
            ST_DistanceSphere(pb.location, ST_SetSRID(ST_MakePoint($2,$1),4326)) AS distance_metres
     FROM parking_bays pb
     JOIN councils c ON c.id = pb.council_id AND c.is_active = TRUE
     WHERE ST_DWithin(
       pb.location::geography,
       ST_SetSRID(ST_MakePoint($2,$1),4326)::geography,
       $3
     )
     ORDER BY distance_metres ASC
     LIMIT 50`,
    [options.latitude, options.longitude, radius],
  );

  const results: NearbyParkingBay[] = [];
  for (const row of res.rows) {
    const restrictions = await getRestrictionsForBay(row.id);
    const rule = evaluateParkingRules({
      bay: {
        id: row.id,
        councilId: row.council_id,
        externalBayId: row.external_bay_id,
        externalRoadSegmentId: row.external_road_segment_id,
        streetDescription: row.street_description,
        suburb: row.suburb,
        latitude: row.latitude,
        longitude: row.longitude,
        bayType: row.bay_type,
        markerId: row.marker_id,
        zoneId: row.zone_id,
        source: row.source,
        sourceUpdatedAt: row.source_updated_at,
      },
      restrictions: restrictions as never[],
      arrivalTimeIso: options.arrivalTime ?? new Date().toISOString(),
      intendedDurationMinutes: options.minimumDuration ?? 60,
      vehicleType: "standard",
      permitStatus: "none",
    });

    if (options.freeOnly && rule.paymentRequired) continue;
    if (options.parkingTypes?.length && !options.parkingTypes.includes(row.bay_type)) continue;
    if (options.minimumDuration && rule.remainingMinutes != null && rule.remainingMinutes < options.minimumDuration) {
      continue;
    }

    results.push({
      id: row.id,
      councilId: row.council_id,
      externalBayId: row.external_bay_id,
      externalRoadSegmentId: row.external_road_segment_id,
      streetDescription: row.street_description,
      suburb: row.suburb,
      latitude: row.latitude,
      longitude: row.longitude,
      bayType: row.bay_type,
      markerId: row.marker_id,
      zoneId: row.zone_id,
      source: row.source,
      sourceUpdatedAt: row.source_updated_at,
      distanceMetres: Math.round(row.distance_metres),
      rule,
    });
  }

  return results;
}

export async function getBayOccupancy(bayId: string) {
  const res = await query(
    `SELECT * FROM parking_occupancy WHERE bay_id = $1 ORDER BY observed_at DESC LIMIT 1`,
    [bayId],
  );
  return res.rows[0] ?? null;
}

export async function getCouncilCoverage() {
  const staleHours = Number(process.env.IMPORT_STALE_HOURS ?? 48);
  const res = await query(
    `SELECT c.external_id AS council_id, c.name AS council_name, c.last_import_at,
            COUNT(DISTINCT pb.id)::int AS bays_count,
            COUNT(DISTINCT pr.id)::int AS restrictions_count,
            COUNT(DISTINCT po.id)::int AS sensors_count,
            COUNT(DISTINCT pm.id)::int AS meters_count,
            CASE
              WHEN c.last_import_at IS NULL THEN TRUE
              WHEN c.last_import_at < NOW() - ($1 || ' hours')::interval THEN TRUE
              ELSE FALSE
            END AS is_stale,
            c.is_active
     FROM councils c
     LEFT JOIN parking_bays pb ON pb.council_id = c.id
     LEFT JOIN parking_restrictions pr ON pr.council_id = c.id
     LEFT JOIN parking_occupancy po ON po.bay_id = pb.id
     LEFT JOIN parking_meters pm ON pm.council_id = c.id
     GROUP BY c.id
     ORDER BY c.name`,
    [String(staleHours)],
  );
  return res.rows;
}

export async function getAdminQualityMetrics() {
  const coverage = await getCouncilCoverage();
  const duplicates = await query(
    `SELECT council_id, external_bay_id, COUNT(*) AS count
     FROM parking_bays GROUP BY council_id, external_bay_id HAVING COUNT(*) > 1`,
  );
  const missingRestrictions = await query(
    `SELECT pb.id FROM parking_bays pb
     LEFT JOIN parking_restrictions pr ON pr.bay_id = pb.id
     WHERE pr.id IS NULL LIMIT 100`,
  );
  const invalidCoords = await query(
    `SELECT id FROM parking_bays
     WHERE ST_Y(location::geometry) = 0 OR ST_X(location::geometry) = 0`,
  );
  const recentFailures = await query(
    `SELECT ij.*, c.name AS council_name FROM import_jobs ij
     JOIN councils c ON c.id = ij.council_id
     WHERE ij.status = 'failed' ORDER BY ij.started_at DESC LIMIT 20`,
  );
  return { coverage, duplicates: duplicates.rows, missingRestrictions: missingRestrictions.rows, invalidCoords: invalidCoords.rows, recentFailures: recentFailures.rows };
}
