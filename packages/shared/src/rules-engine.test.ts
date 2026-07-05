import { describe, expect, it } from "vitest";
import { DateTime } from "luxon";
import {
  defaultWeekday2PRestriction,
  evaluateParkingRules,
  MELBOURNE_TZ,
} from "./rules-engine.js";
import type { ParkingBayRecord, ParkingRestrictionRecord } from "./types.js";

const baseBay: ParkingBayRecord = {
  id: "bay-1",
  councilId: "melbourne",
  externalBayId: "123",
  streetDescription: "Little Lonsdale Street",
  suburb: "Melbourne",
  latitude: -37.8136,
  longitude: 144.9631,
  bayType: "general",
  source: "City of Melbourne",
  sourceUpdatedAt: "2025-09-03T00:00:00.000Z",
};

function evaluate(
  restrictions: ParkingRestrictionRecord[],
  arrivalIso: string,
  duration = 120,
  extras: Partial<Parameters<typeof evaluateParkingRules>[0]> = {},
) {
  return evaluateParkingRules({
    bay: baseBay,
    restrictions,
    arrivalTimeIso: arrivalIso,
    intendedDurationMinutes: duration,
    vehicleType: "standard",
    permitStatus: "none",
    ...extras,
  });
}

describe("weekday 2P restriction", () => {
  it("allows parking with correct leave-by on weekday afternoon", () => {
    const r = defaultWeekday2PRestriction("bay-1", "melbourne");
    const arrival = DateTime.fromObject(
      { year: 2026, month: 7, day: 6, hour: 16, minute: 48 },
      { zone: MELBOURNE_TZ },
    );
    const result = evaluate([r], arrival.toISO()!);
    expect(result.canPark).toBe(true);
    expect(result.paymentRequired).toBe(true);
    expect(result.maximumMinutes).toBe(120);
    expect(result.leaveBy).toBe("6:30 pm");
  });
});

describe("arrival near restriction end", () => {
  it("caps remaining time before restriction ends", () => {
    const r = defaultWeekday2PRestriction("bay-1", "melbourne");
    const arrival = DateTime.fromObject(
      { year: 2026, month: 7, day: 6, hour: 18, minute: 0 },
      { zone: MELBOURNE_TZ },
    );
    const result = evaluate([r], arrival.toISO()!, 120);
    expect(result.remainingMinutes).toBeLessThanOrEqual(30);
    expect(result.leaveBy).toBe("6:30 pm");
  });
});

describe("overnight unrestricted parking", () => {
  it("allows parking outside paid hours", () => {
    const r = defaultWeekday2PRestriction("bay-1", "melbourne");
    const arrival = DateTime.fromObject(
      { year: 2026, month: 7, day: 6, hour: 19, minute: 0 },
      { zone: MELBOURNE_TZ },
    );
    const result = evaluate([r], arrival.toISO()!, 180);
    expect(result.currentRule).toMatch(/Unrestricted/i);
    expect(result.paymentRequired).toBe(false);
  });
});

describe("clearway during intended stay", () => {
  it("warns when clearway starts before intended end", () => {
    const paid = defaultWeekday2PRestriction("bay-1", "melbourne");
    const clearway: ParkingRestrictionRecord = {
      id: "cw",
      bayId: "bay-1",
      councilId: "melbourne",
      kind: "clearway",
      daysOfWeek: [1, 2, 3, 4, 5],
      startTime: "07:00",
      endTime: "09:00",
      paymentRequired: false,
      priority: 20,
      isTemporary: false,
      source: "test",
    };
    const arrival = DateTime.fromObject(
      { year: 2026, month: 7, day: 7, hour: 8, minute: 30 },
      { zone: MELBOURNE_TZ },
    );
    const result = evaluate([clearway, paid], arrival.toISO()!, 60);
    expect(result.canPark).toBe(false);
    expect(result.clearwayWarning).toBeTruthy();
  });
});

describe("permit-only parking", () => {
  it("blocks parking without permit", () => {
    const permit: ParkingRestrictionRecord = {
      id: "p",
      bayId: "bay-1",
      councilId: "melbourne",
      kind: "permit",
      daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
      startTime: "00:00",
      endTime: "23:59",
      permitRequired: "P10",
      paymentRequired: false,
      priority: 15,
      isTemporary: false,
      source: "test",
    };
    const result = evaluate([permit], DateTime.now().setZone(MELBOURNE_TZ).toISO()!);
    expect(result.canPark).toBe(false);
    expect(result.permitWarning).toBeTruthy();
  });
});

describe("loading zones", () => {
  it("blocks standard vehicles in loading zone", () => {
    const loading: ParkingRestrictionRecord = {
      id: "l",
      bayId: "bay-1",
      councilId: "melbourne",
      kind: "loading",
      daysOfWeek: [1, 2, 3, 4, 5],
      startTime: "07:00",
      endTime: "18:00",
      paymentRequired: false,
      priority: 25,
      isTemporary: false,
      source: "test",
    };
    const arrival = DateTime.fromObject(
      { year: 2026, month: 7, day: 6, hour: 10, minute: 0 },
      { zone: MELBOURNE_TZ },
    );
    const result = evaluate([loading], arrival.toISO()!);
    expect(result.canPark).toBe(false);
    expect(result.loadingRestriction).toBeTruthy();
  });
});

describe("public holiday uncertainty", () => {
  it("lowers confidence when holiday status unknown", () => {
    const r = defaultWeekday2PRestriction("bay-1", "melbourne");
    const result = evaluate([r], DateTime.now().setZone(MELBOURNE_TZ).toISO()!, 60, {
      isPublicHoliday: null,
    });
    expect(result.confidence).toBe("medium");
  });
});

describe("multiple overlapping restrictions", () => {
  it("applies highest priority active restriction first", () => {
    const paid = defaultWeekday2PRestriction("bay-1", "melbourne");
    const shorter: ParkingRestrictionRecord = {
      ...paid,
      id: "1p",
      maxStayMinutes: 60,
      priority: 5,
    };
    const arrival = DateTime.fromObject(
      { year: 2026, month: 7, day: 6, hour: 10, minute: 0 },
      { zone: MELBOURNE_TZ },
    );
    const result = evaluate([paid, shorter], arrival.toISO()!, 120);
    expect(result.canPark).toBe(true);
    expect(result.remainingMinutes).toBeLessThanOrEqual(120);
  });
});

describe("daylight-saving transitions", () => {
  it("handles AEDT to AEST transition correctly", () => {
    const r = defaultWeekday2PRestriction("bay-1", "melbourne");
    const arrival = DateTime.fromObject(
      { year: 2026, month: 4, day: 5, hour: 16, minute: 0 },
      { zone: MELBOURNE_TZ },
    );
    const result = evaluate([r], arrival.toISO()!, 90);
    expect(result.leaveBy).toBeTruthy();
  });
});

describe("missing occupancy data", () => {
  it("still evaluates rules without occupancy", () => {
    const r = defaultWeekday2PRestriction("bay-1", "melbourne");
    const arrival = DateTime.fromObject(
      { year: 2026, month: 7, day: 6, hour: 10, minute: 0 },
      { zone: MELBOURNE_TZ },
    );
    const result = evaluateParkingRules({
      bay: baseBay,
      restrictions: [r],
      occupancy: null,
      arrivalTimeIso: arrival.toISO()!,
      intendedDurationMinutes: 60,
      vehicleType: "standard",
      permitStatus: "none",
    });
    expect(result.currentRule).toMatch(/2P|Metered/i);
  });
});
