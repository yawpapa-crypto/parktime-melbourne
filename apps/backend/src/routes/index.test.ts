import Fastify from "fastify";
import { afterAll, describe, expect, it } from "vitest";
import { registerRoutes } from "./index.js";

describe("GET /", () => {
  const app = Fastify();
  registerRoutes(app);

  afterAll(async () => {
    await app.close();
  });

  it("returns 200 JSON index by default", async () => {
    const res = await app.inject({ method: "GET", url: "/" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.name).toBe("ParkTime Melbourne API");
    expect(body.version).toBe("1.0.0");
    expect(body.health).toBe("/health");
    expect(body.endpoints.some((e: { path: string }) => e.path === "/api/search")).toBe(true);
  });

  it("returns HTML for browser Accept header", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/",
      headers: { accept: "text/html" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/html/);
    expect(res.body).toContain("ParkTime Melbourne API");
    expect(res.body).toContain("/api/parking/nearby");
  });
});
