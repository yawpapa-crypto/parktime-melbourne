import { describe, expect, it } from "vitest";
import { MelbourneOdsClient } from "./ods-client.js";

describe("Melbourne ODS live fetch", () => {
  it("fetches parking bays with invalid key fallback", async () => {
    const client = new MelbourneOdsClient({ apiKey: "Park" });
    const page = await client.fetchRecords("on-street-parking-bays", { limit: 2 });
    expect(page.total_count).toBeGreaterThan(0);
    expect(page.results.length).toBeGreaterThan(0);
  }, 15000);
});
