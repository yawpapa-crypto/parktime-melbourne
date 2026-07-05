import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { MelbourneOdsClient, OdsApiError } from "./ods-client.js";

describe("MelbourneOdsClient", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("adds apikey, timezone and lang to record requests", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ total_count: 0, results: [] }), { status: 200 }),
    );

    const client = new MelbourneOdsClient({ apiKey: "test-key" });
    await client.fetchRecords("on-street-parking-bays", { limit: 50, offset: 0 });

    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("apikey=test-key");
    expect(url).toContain("timezone=Australia%2FMelbourne");
    expect(url).toContain("lang=en");
    expect(url).toContain("limit=50");
  });

  it("caps record limit at 100", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ total_count: 0, results: [] }), { status: 200 }),
    );

    const client = new MelbourneOdsClient({ apiKey: "test-key" });
    await client.fetchRecords("on-street-parking-bays", { limit: 500 });

    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("limit=100");
  });

  it("throws on 401 unauthorized", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response("Unauthorized", { status: 401 }));
    const client = new MelbourneOdsClient({ apiKey: "bad-key" });
    await expect(client.fetchRecords("on-street-parking-bays")).rejects.toBeInstanceOf(OdsApiError);
  });

  it("uses export geojson with limit=-1", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ type: "FeatureCollection", features: [] }), { status: 200 }),
    );

    const client = new MelbourneOdsClient({ apiKey: "test-key" });
    await client.fetchExportGeoJson("on-street-parking-bays");

    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("/exports/geojson");
    expect(url).toContain("limit=-1");
  });
});
