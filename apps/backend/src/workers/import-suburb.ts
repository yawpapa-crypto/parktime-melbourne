import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import type { ImportStats } from "@parktime/shared";
import { query } from "../db/pool.js";
import { SuburbParkingAdapter } from "../adapters/suburb-parking-adapter.js";
import { SUBURB_IMPORTS } from "../config/suburb-imports.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });
dotenv.config();

export async function runSuburbImport(suburbSlug: string): Promise<ImportStats> {
  const config = SUBURB_IMPORTS[suburbSlug];
  if (!config) {
    throw new Error(`Unknown suburb "${suburbSlug}". Available: ${Object.keys(SUBURB_IMPORTS).join(", ")}`);
  }

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
    [config.councilExternalId],
  );
  const councilId = councilRes.rows[0]?.id;
  if (!councilId) {
    throw new Error(`${config.councilName} not found — run migrations first`);
  }

  const adapter = new SuburbParkingAdapter(config);
  adapter.setCouncilDbId(councilId);

  const job = await query<{ id: string }>(
    `INSERT INTO import_jobs (council_id, dataset_type, status) VALUES ($1, $2, 'running') RETURNING id`,
    [councilId, `suburb:${suburbSlug}`],
  );
  const jobId = job.rows[0].id;

  try {
    const rawBays = await adapter.fetchBays();
    const bays = adapter.normaliseBays(rawBays);
    const bayLookup = new Map<string, string>();

    if (!bays.length) {
      throw new Error(`No bays generated for ${config.suburb} — check Mapbox token and street list`);
    }

    for (const bay of bays) {
      try {
        if (!bay.latitude || !bay.longitude || Number.isNaN(bay.latitude)) {
          stats.baysFailed++;
          continue;
        }
        const inserted = await query<{ id: string; external_bay_id: string }>(
          `INSERT INTO parking_bays (
            council_id, external_bay_id, external_road_segment_id, street_description, suburb,
            location, bay_type, marker_id, zone_id, source, source_updated_at, raw_data
          ) VALUES (
            $1,$2,$3,$4,$5, ST_SetSRID(ST_MakePoint($6,$7),4326), $8,$9,$10,$11,$12,$13
          )
          ON CONFLICT (council_id, external_bay_id) DO UPDATE SET
            street_description = EXCLUDED.street_description,
            suburb = EXCLUDED.suburb,
            location = EXCLUDED.location,
            source_updated_at = EXCLUDED.source_updated_at,
            raw_data = EXCLUDED.raw_data,
            updated_at = NOW()
          RETURNING id, external_bay_id`,
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

    const restrictions = adapter.normaliseRestrictions([], bayLookup);
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

    await query(
      `UPDATE councils SET is_active = TRUE, last_import_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [councilId],
    );
    await query(
      `UPDATE import_jobs SET status = 'completed', records_imported = $2, records_failed = $3, finished_at = NOW() WHERE id = $1`,
      [jobId, stats.baysImported, stats.baysFailed],
    );
  } catch (err) {
    await query(
      `UPDATE import_jobs SET status = 'failed', error_message = $2, finished_at = NOW() WHERE id = $1`,
      [jobId, String(err)],
    );
    throw err;
  }

  return stats;
}

const isCli = process.argv[1]?.includes("import-suburb");
if (isCli) {
  const suburbSlug = process.argv[2];
  if (!suburbSlug) {
    console.error("Usage: tsx src/workers/import-suburb.ts <ascot-vale|altona>");
    process.exit(1);
  }

  runSuburbImport(suburbSlug)
    .then((stats) => {
      console.log(`${suburbSlug} import complete:`, stats);
      process.exit(0);
    })
    .catch((err) => {
      console.error(`${suburbSlug} import failed:`, err);
      process.exit(1);
    });
}
