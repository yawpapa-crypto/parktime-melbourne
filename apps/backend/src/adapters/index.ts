import { BaseCouncilAdapter } from "./base-adapter.js";

function createStubAdapter(councilId: string, councilName: string) {
  return class StubCouncilAdapter extends BaseCouncilAdapter {
    councilId = councilId;
    councilName = councilName;
    async fetchBays() { return []; }
    async fetchRestrictions() { return []; }
    normaliseBays() { return []; }
    normaliseRestrictions() { return []; }
  };
}

export const yarraAdapter = new (createStubAdapter("city-of-yarra", "City of Yarra"))();
export const portPhillipAdapter = new (createStubAdapter("city-of-port-phillip", "City of Port Phillip"))();
export const stonningtonAdapter = new (createStubAdapter("city-of-stonnington", "City of Stonnington"))();
export const merriBekAdapter = new (createStubAdapter("city-of-merri-bek", "City of Merri-bek"))();
export const maribyrnongAdapter = new (createStubAdapter("city-of-maribyrnong", "City of Maribyrnong"))();
export const darebinAdapter = new (createStubAdapter("city-of-darebin", "City of Darebin"))();
export const boroondaraAdapter = new (createStubAdapter("city-of-boroondara", "City of Boroondara"))();
export const mooneeValleyAdapter = new (createStubAdapter("city-of-moonee-valley", "City of Moonee Valley"))();
export const glenEiraAdapter = new (createStubAdapter("city-of-glen-eira", "City of Glen Eira"))();

export const councilAdapters = {
  "city-of-melbourne": () => import("./melbourne-adapter.js").then((m) => m.melbourneAdapter),
  "city-of-yarra": async () => yarraAdapter,
  "city-of-port-phillip": async () => portPhillipAdapter,
  "city-of-stonnington": async () => stonningtonAdapter,
  "city-of-merri-bek": async () => merriBekAdapter,
  "city-of-maribyrnong": async () => maribyrnongAdapter,
  "city-of-darebin": async () => darebinAdapter,
  "city-of-boroondara": async () => boroondaraAdapter,
  "city-of-moonee-valley": async () => mooneeValleyAdapter,
  "city-of-glen-eira": async () => glenEiraAdapter,
};
