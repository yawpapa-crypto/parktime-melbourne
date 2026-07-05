import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import type { ImportStats } from "@parktime/shared";
import { defaultWeekday2PRestriction } from "@parktime/shared";
import { query } from "../db/pool.js";
import { melbourneAdapter } from "../adapters/melbourne-adapter.js";
import { OdsApiError } from "../services/ods-client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });
dotenv.config();

export async function runMelbourneImport(): Promise<ImportStats> {
  const stats: ImportStats = {
    baysImported: 0,
    baysFailed: 0,
    restrictionsImported: 0,
    restrictionsFailed: 0,
    sensorsImported: 0,
    metersImported: 0,
    lastImportAt: new Date().toISOString(),
    errors: [],
  };

  const councilRes = await query<{ id: string }>(
    "SELECT id FROM councils WHERE external_id = $1",
    ["city-of-melbourne"],
  );
  const councilId = councilRes.rows[0]?.id;
  if (!councilId) throw new Error("Melbourne council not found — run migrations first");

  melbourneAdapter.setCouncilDbId(councilId);

  const job = await query<{ id: string }>(
    `INSERT INTO import_jobs (council_id, dataset_type, status) VALUES ($1, 'full', 'running') RETURNING id`,
    [councilId],
  );
  const jobId = job.rows[0].id;

  try {
    const rawBays = await melbourneAdapter.fetchBays();
    const subsetLimit = process.env.MELBOURNE_IMPORT_SUBSET
      ? Number(process.env.MELBOURNE_IMPORT_SUBSET)
      : undefined;
    const bays = melbourneAdapter
      .normaliseBays(rawBays)
      .slice(0, subsetLimit ?? undefined);
    const bayLookup = new Map<string, string>();

    for (const bay of bays) {
      try {
        if (!bay.latitude || !bay.longitude || Number.isNaN(bay.latitude)) {
          stats.baysFailed++;
          continue;
        }
        const inserted = await query<{ id: string; external_bay_id: string; marker_id: string | null }>(
          `INSERT INTO parking_bays (
            council_id, external_bay_id, external_road_segment_id, street_description, suburb,
            location, bay_type, marker_id, zone_id, source, source_updated_at, raw_data
          ) VALUES (
            $1,$2,$3,$4,$5, ST_SetSRID(ST_MakePoint($6,$7),4326), $8,$9,$10,$11,$12,$13
          )
          ON CONFLICT (council_id, external_bay_id) DO UPDATE SET
            street_description = EXCLUDED.street_description,
            location = EXCLUDED.location,
            source_updated_at = EXCLUDED.source_updated_at,
            raw_data = EXCLUDED.raw_data,
            updated_at = NOW()
          RETURNING id, external_bay_id, marker_id`,
          [
            councilId,
            bay.externalBayId,
            bay.externalRoadSegmentId ?? null,
            bay.streetDescription,
            bay.suburb ?? null,
            bay.longitude,
            bay.latitude,
            bay.bayType,
            bay.markerId ?? null,
            bay.zoneId ?? null,
            bay.source,
            bay.sourceUpdatedAt ?? null,
            JSON.stringify(bay.rawData ?? {}),
          ],
        );
        const row = inserted.rows[0];
        bayLookup.set(bay.externalBayId, row.id);
        if (row.marker_id) bayLookup.set(row.marker_id, row.id);
        stats.baysImported++;
      } catch (err) {
        stats.baysFailed++;
        stats.errors.push(String(err));
        await query(
          `INSERT INTO import_failures (import_job_id, external_id, reason, raw_data) VALUES ($1,$2,$3,$4)`,
          [jobId, bay.externalBayId, String(err), JSON.stringify(bay.rawData ?? {})],
        );
      }
    }

    let rawRestrictions: unknown[] = [];
    try {
      rawRestrictions = await melbourneAdapter.fetchRestrictions();
    } catch (err) {
      stats.errors.push(`Restrictions fetch failed: ${err}`);
    }

    const restrictions = melbourneAdapter.normaliseRestrictions(rawRestrictions, bayLookup);

    if (!restrictions.length) {
      for (const [externalId, bayId] of bayLookup.entries()) {
        if (externalId.includes("-")) continue;
        const seed = defaultWeekday2PRestriction(bayId, councilId);
        restrictions.push({ ...seed, externalRestrictionId: `${externalId}-default` });
      }
    }

    for (const restriction of restrictions) {
      try {
        await query(
          `INSERT INTO parking_restrictions (
            bay_id, council_id, external_restriction_id, kind, days_of_week, start_time, end_time,
            max_stay_minutes, payment_required, rate_per_hour, permit_required, permit_exempt,
            priority, is_temporary, source, source_updated_at, raw_data
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
          ON CONFLICT DO NOTHING`,
          [
            restriction.bayId,
            councilId,
            restriction.externalRestrictionId ?? null,
            restriction.kind,
            restriction.daysOfWeek,
            restriction.startTime,
            restriction.endTime,
            restriction.maxStayMinutes ?? null,
            restriction.paymentRequired,
            restriction.ratePerHour ?? null,
            restriction.permitRequired ?? null,
            restriction.permitExempt ?? null,
            restriction.priority,
            restriction.isTemporary,
            restriction.source,
            restriction.sourceUpdatedAt ?? null,
            JSON.stringify(restriction.rawData ?? {}),
          ],
        );
        stats.restrictionsImported++;
      } catch (err) {
        stats.restrictionsFailed++;
        stats.errors.push(String(err));
      }
    }

    try {
      const sensors = await melbourneAdapter.fetchSensors?.();
      if (sensors?.length) {
        for (const sensor of sensors) {
          const row = sensor as Record<string, unknown>;
          const markerId = String(row.marker_id ?? row.kerbsideid ?? "");
          const bayId = bayLookup.get(markerId);
          if (!bayId) continue;
          await query(
            `INSERT INTO parking_occupancy (bay_id, is_occupied, sensor_id, confidence, observed_at, source, raw_data)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [
              bayId,
              String(row.status ?? row.occupancy ?? "").toLowerCase().includes("present"),
              markerId,
              "medium",
              row.lastupdated ? new Date(String(row.lastupdated)) : new Date(),
              "City of Melbourne sensors",
              JSON.stringify(row),
            ],
          );
          stats.sensorsImported++;
        }
      }
    } catch (err) {
      stats.errors.push(`Sensor import: ${err}`);
    }

    await query(`UPDATE councils SET last_import_at = NOW(), updated_at = NOW() WHERE id = $1`, [councilId]);
    await query(
      `UPDATE import_jobs SET status = 'completed', records_imported = $2, records_failed = $3, finished_at = NOW() WHERE id = $1`,
      [jobId, stats.baysImported, stats.baysFailed],
    );
  } catch (err) {
    const message =
      err instanceof OdsApiError
        ? `[ODS ${err.status}] ${err.message}`
        : String(err);
    await query(
      `UPDATE import_jobs SET status = 'failed', error_message = $2, finished_at = NOW() WHERE id = $1`,
      [jobId, message],
    );
    throw err;
  }

  return stats;
}

const isCli = process.argv[1]?.includes("import-melbourne");
if (isCli) {
  const subset = process.env.MELBOURNE_IMPORT_SUBSET
    ? Number(process.env.MELBOURNE_IMPORT_SUBSET)
    : undefined;

  runMelbourneImport()
    .then((stats) => {
      console.log("Melbourne import complete:", stats);
      if (subset) console.log(`(subset limit env: ${subset})`);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Melbourne import failed:", err);
      process.exit(1);
    });
}
