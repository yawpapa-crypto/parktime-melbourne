import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { retrievePlace, searchPlaces } from "../services/mapbox-search.js";
import {
  evaluateBayRule,
  findNearbyParking,
  getAdminQualityMetrics,
  getBayOccupancy,
  getCouncilCoverage,
  getRestrictionsForBay,
} from "../services/parking-service.js";
import { query } from "../db/pool.js";

const APP_NAME = "ParkTime Melbourne API";
const APP_VERSION = "1.0.0";

const API_ENDPOINTS = [
  { method: "GET", path: "/health", description: "Health check" },
  { method: "GET", path: "/", description: "API index (this document)" },
  { method: "GET", path: "/api/search", description: "Mapbox search proxy (q, sessionToken, mapboxId)" },
  { method: "GET", path: "/api/parking/nearby", description: "Parking within radius (latitude, longitude, radius, …)" },
  { method: "GET", path: "/api/parking/bays/:id", description: "Parking bay details" },
  { method: "GET", path: "/api/parking/bays/:id/rule", description: "Evaluated parking rule for a bay" },
  { method: "GET", path: "/api/parking/bays/:id/occupancy", description: "Latest occupancy for a bay" },
  { method: "GET", path: "/api/parking/bays/:id/restrictions", description: "Restrictions for a bay" },
  { method: "POST", path: "/api/parking/reports", description: "Report incorrect parking data" },
  { method: "POST", path: "/api/parking/sessions", description: "Start a parking session" },
  { method: "PATCH", path: "/api/parking/sessions/:id", description: "Update/end a parking session" },
  { method: "GET", path: "/api/councils/coverage", description: "Council data coverage metadata" },
  { method: "GET", path: "/api/admin/quality", description: "Admin data quality metrics" },
] as const;

function buildIndexPayload() {
  return {
    name: APP_NAME,
    version: APP_VERSION,
    status: "ok",
    health: "/health",
    documentation: "https://github.com/parktime-melbourne",
    endpoints: API_ENDPOINTS,
  };
}

function wantsHtml(request: FastifyRequest): boolean {
  const accept = request.headers.accept ?? "";
  return accept.includes("text/html") && !accept.includes("application/json");
}

function renderLandingHtml(payload: ReturnType<typeof buildIndexPayload>): string {
  const rows = payload.endpoints
    .map(
      (e) =>
        `<tr><td><code>${e.method}</code></td><td><code>${e.path}</code></td><td>${e.description}</td></tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${payload.name}</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #F7F9FC; color: #111827; margin: 0; padding: 32px; }
    main { max-width: 880px; margin: 0 auto; background: white; border-radius: 16px; padding: 24px; border: 1px solid rgba(0,0,0,0.08); }
    h1 { margin-top: 0; color: #1A2744; }
    a { color: #1A2744; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; }
    th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #E5E7EB; vertical-align: top; }
    code { background: #EEF1F7; padding: 2px 6px; border-radius: 6px; }
  </style>
</head>
<body>
  <main>
    <h1>${payload.name}</h1>
    <p>Version <strong>${payload.version}</strong> · Status <strong>${payload.status}</strong></p>
    <p><a href="/health">Health check</a> · <a href="/?format=json">JSON index</a></p>
    <table>
      <thead><tr><th>Method</th><th>Path</th><th>Description</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </main>
</body>
</html>`;
}

export async function registerRoutes(app: FastifyInstance) {
  app.get("/", async (request, reply) => {
    const payload = buildIndexPayload();
    const format = (request.query as { format?: string }).format;

    if (format === "json" || !wantsHtml(request)) {
      return payload;
    }

    reply.type("text/html");
    return renderLandingHtml(payload);
  });

  app.get("/health", async () => ({ ok: true }));

  app.get("/api/search", async (request, reply) => {
    const schema = z
      .object({
        q: z.string().optional(),
        sessionToken: z.string().optional(),
        mapboxId: z.string().optional(),
      })
      .refine((v) => v.mapboxId || (v.q && v.q.length >= 2), {
        message: "Provide q (min 2 chars) or mapboxId",
      });
    const params = schema.parse(request.query);

    try {
      if (params.mapboxId) {
        const place = await retrievePlace(params.mapboxId, params.sessionToken);
        return { results: [place] };
      }
      const results = await searchPlaces(params.q!, params.sessionToken);
      return { results };
    } catch (err) {
      reply.code(502);
      return { error: String(err), results: [] };
    }
  });

  app.get("/api/parking/nearby", async (request, reply) => {
    const schema = z.object({
      latitude: z.coerce.number(),
      longitude: z.coerce.number(),
      radius: z.coerce.number().optional(),
      arrivalTime: z.string().optional(),
      minimumDuration: z.coerce.number().optional(),
      freeOnly: z.coerce.boolean().optional(),
      parkingTypes: z.string().optional(),
    });
    const q = schema.parse(request.query);
    try {
      const results = await findNearbyParking({
        latitude: q.latitude,
        longitude: q.longitude,
        radius: q.radius ?? 500,
        arrivalTime: q.arrivalTime,
        minimumDuration: q.minimumDuration,
        freeOnly: q.freeOnly,
        parkingTypes: q.parkingTypes?.split(",").filter(Boolean),
      });
      return { results, count: results.length };
    } catch (err) {
      reply.code(500);
      return { error: String(err), results: [] };
    }
  });

  app.get("/api/parking/bays/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const res = await query(
      `SELECT pb.*, ST_Y(pb.location::geometry) AS latitude, ST_X(pb.location::geometry) AS longitude
       FROM parking_bays pb WHERE pb.id = $1`,
      [id],
    );
    if (!res.rows[0]) {
      reply.code(404);
      return { error: "Bay not found" };
    }
    return res.rows[0];
  });

  app.get("/api/parking/bays/:id/rule", async (request, reply) => {
    const { id } = request.params as { id: string };
    const schema = z.object({
      arrivalTime: z.string().optional(),
      minimumDuration: z.coerce.number().optional(),
    });
    const q = schema.parse(request.query);
    try {
      return await evaluateBayRule(id, q.arrivalTime, q.minimumDuration ?? 120);
    } catch {
      reply.code(404);
      return { error: "Bay not found" };
    }
  });

  app.get("/api/parking/bays/:id/occupancy", async (request, reply) => {
    const { id } = request.params as { id: string };
    const occupancy = await getBayOccupancy(id);
    if (!occupancy) return { occupancy: null, status: "unknown" };
    return { occupancy };
  });

  app.post("/api/parking/reports", async (request) => {
    const body = z.object({
      bayId: z.string().uuid().optional(),
      councilId: z.string().uuid().optional(),
      issueType: z.string(),
      note: z.string().optional(),
      photoUrl: z.string().optional(),
      deviceId: z.string().optional(),
    }).parse(request.body);

    const res = await query(
      `INSERT INTO parking_reports (bay_id, council_id, issue_type, note, photo_url, reporter_device_id)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [body.bayId ?? null, body.councilId ?? null, body.issueType, body.note ?? null, body.photoUrl ?? null, body.deviceId ?? null],
    );
    return res.rows[0];
  });

  app.post("/api/parking/sessions", async (request) => {
    const body = z.object({
      deviceId: z.string(),
      bayId: z.string().uuid(),
      vehicleRegistration: z.string().optional(),
      startedAt: z.string(),
      expectedEndAt: z.string(),
      estimatedCost: z.number().optional(),
      reminders: z.array(z.boolean()).optional(),
    }).parse(request.body);

    const res = await query(
      `INSERT INTO parking_sessions (device_id, bay_id, vehicle_registration, started_at, expected_end_at, estimated_cost, reminders)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        body.deviceId,
        body.bayId,
        body.vehicleRegistration ?? null,
        body.startedAt,
        body.expectedEndAt,
        body.estimatedCost ?? null,
        JSON.stringify(body.reminders ?? []),
      ],
    );
    return res.rows[0];
  });

  app.patch("/api/parking/bays/:id/sessions/:sessionId", async (request, reply) => {
    reply.code(400);
    return { error: "Use PATCH /api/parking/sessions/:id" };
  });

  app.patch("/api/parking/sessions/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = z.object({
      endedAt: z.string().optional(),
      status: z.enum(["active", "ended", "cancelled"]).optional(),
      expectedEndAt: z.string().optional(),
    }).parse(request.body);

    const res = await query(
      `UPDATE parking_sessions SET
         ended_at = COALESCE($2, ended_at),
         status = COALESCE($3, status),
         expected_end_at = COALESCE($4, expected_end_at),
         updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, body.endedAt ?? null, body.status ?? null, body.expectedEndAt ?? null],
    );
    if (!res.rows[0]) {
      reply.code(404);
      return { error: "Session not found" };
    }
    return res.rows[0];
  });

  app.get("/api/councils/coverage", async () => {
    const coverage = await getCouncilCoverage();
    return { councils: coverage };
  });

  app.get("/api/admin/quality", async () => getAdminQualityMetrics());

  app.get("/api/parking/bays/:id/restrictions", async (request) => {
    const { id } = request.params as { id: string };
    return { restrictions: await getRestrictionsForBay(id) };
  });
}
