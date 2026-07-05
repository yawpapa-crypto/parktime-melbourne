import { DateTime, Duration } from "luxon";
import type {
  ConfidenceLevel,
  ParkingRestrictionRecord,
  RuleEvaluationInput,
  RuleEvaluationResult,
  VehicleType,
} from "./types.js";

const MELBOURNE_TZ = "Australia/Melbourne";

interface ActiveWindow {
  restriction: ParkingRestrictionRecord;
  windowStart: DateTime;
  windowEnd: DateTime;
}

function parseTimeOnDate(date: DateTime, hhmm: string): DateTime {
  const [h, m] = hhmm.split(":").map(Number);
  return date.set({ hour: h, minute: m, second: 0, millisecond: 0 });
}

function dayMatches(restriction: ParkingRestrictionRecord, dt: DateTime): boolean {
  const luxonDay = dt.weekday % 7;
  return restriction.daysOfWeek.includes(luxonDay);
}

function describeRestriction(r: ParkingRestrictionRecord): string {
  switch (r.kind) {
    case "time_limit":
      return r.maxStayMinutes ? `${Math.round(r.maxStayMinutes / 60)}P` : "Time limited";
    case "paid":
      return r.maxStayMinutes
        ? `${Math.round(r.maxStayMinutes / 60)}P Metered`
        : "Paid parking";
    case "clearway":
      return "Clearway";
    case "loading":
      return "Loading zone";
    case "permit":
      return r.permitRequired ? `Permit ${r.permitRequired}` : "Permit only";
    case "accessible":
      return "Accessible parking";
    case "no_stopping":
      return "No stopping";
    case "unrestricted":
      return "Unrestricted";
    default:
      return r.kind;
  }
}

function formatLeaveBy(dt: DateTime): string {
  return dt.setZone(MELBOURNE_TZ).toFormat("h:mm a").toLowerCase();
}

function getActiveWindows(
  restrictions: ParkingRestrictionRecord[],
  arrival: DateTime,
  horizonEnd: DateTime,
): ActiveWindow[] {
  const windows: ActiveWindow[] = [];
  let cursor = arrival.startOf("day");
  const endDay = horizonEnd.endOf("day");

  while (cursor <= endDay) {
    for (const restriction of restrictions) {
      if (!dayMatches(restriction, cursor)) continue;
      const start = parseTimeOnDate(cursor, restriction.startTime);
      let end = parseTimeOnDate(cursor, restriction.endTime);
      if (end <= start) end = end.plus({ days: 1 });

      if (end > arrival && start < horizonEnd) {
        windows.push({
          restriction,
          windowStart: DateTime.max(start, arrival),
          windowEnd: DateTime.min(end, horizonEnd),
        });
      }
    }
    cursor = cursor.plus({ days: 1 });
  }

  return windows.sort((a, b) => a.windowStart.toMillis() - b.windowStart.toMillis());
}

function vehicleAllowed(restriction: ParkingRestrictionRecord, vehicleType: VehicleType): boolean {
  if (!restriction.vehicleTypes?.length) return true;
  return restriction.vehicleTypes.includes(vehicleType);
}

function permitAllowed(
  restriction: ParkingRestrictionRecord,
  permitStatus: string,
): boolean {
  if (restriction.kind !== "permit") return true;
  if (!restriction.permitRequired) return permitStatus !== "none";
  if (restriction.permitExempt?.includes(permitStatus)) return true;
  return permitStatus === restriction.permitRequired || permitStatus === "other";
}

export function evaluateParkingRules(input: RuleEvaluationInput): RuleEvaluationResult {
  const {
    bay,
    restrictions,
    meter,
    arrivalTimeIso,
    intendedDurationMinutes,
    vehicleType,
    permitStatus,
    isPublicHoliday = null,
  } = input;

  const arrival = DateTime.fromISO(arrivalTimeIso, { zone: MELBOURNE_TZ });
  const intendedEnd = arrival.plus({ minutes: intendedDurationMinutes });
  const horizonEnd = intendedEnd.plus({ hours: 24 });

  let confidence: ConfidenceLevel = restrictions.length ? "high" : "low";
  if (isPublicHoliday === null) confidence = confidence === "high" ? "medium" : confidence;
  if (restrictions.some((r) => r.isTemporary)) confidence = "medium";

  const applicable = restrictions.filter((r) => vehicleAllowed(r, vehicleType));
  const windows = getActiveWindows(applicable, arrival, horizonEnd);
  const activeWindow = windows.find(
    (w) => arrival >= w.windowStart && arrival < w.windowEnd,
  );

  if (!activeWindow) {
    const nextWindow = windows.find((w) => w.windowStart > arrival);
    if (!restrictions.length) {
      return {
        canPark: true,
        currentRule: "No restriction data available",
        maximumMinutes: null,
        remainingMinutes: intendedDurationMinutes,
        leaveBy: formatLeaveBy(intendedEnd),
        paymentRequired: false,
        estimatedCost: null,
        nextRule: null,
        nextRuleStart: null,
        clearwayWarning: null,
        permitWarning: null,
        accessibleRestriction: null,
        loadingRestriction: null,
        confidence: "low",
        source: bay.source,
        sourceUpdatedAt: bay.sourceUpdatedAt ?? null,
      };
    }

    return {
      canPark: true,
      currentRule: "Unrestricted at this time",
      maximumMinutes: null,
      remainingMinutes: intendedDurationMinutes,
      leaveBy: formatLeaveBy(intendedEnd),
      paymentRequired: false,
      estimatedCost: null,
      nextRule: nextWindow ? describeRestriction(nextWindow.restriction) : restrictions[0] ? describeRestriction(restrictions[0]) : null,
      nextRuleStart: nextWindow?.windowStart.toISO() ?? null,
      clearwayWarning: null,
      permitWarning: null,
      accessibleRestriction: null,
      loadingRestriction: null,
      confidence,
      source: bay.source,
      sourceUpdatedAt: bay.sourceUpdatedAt ?? null,
    };
  }

  const first = activeWindow;
  const active = first.restriction;
  let canPark = true;
  let clearwayWarning: string | null = null;
  let permitWarning: string | null = null;
  let accessibleRestriction: string | null = null;
  let loadingRestriction: string | null = null;
  let paymentRequired = active.paymentRequired;
  let maximumMinutes: number | null = active.maxStayMinutes ?? null;
  let leaveByDt: DateTime = intendedEnd;

  if (active.kind === "clearway" || active.kind === "no_stopping") {
    canPark = false;
    clearwayWarning = `${describeRestriction(active)} active until ${formatLeaveBy(first.windowEnd)}`;
  }

  if (active.kind === "loading") {
    canPark = vehicleType === "standard" ? false : true;
    loadingRestriction = `Loading zone until ${formatLeaveBy(first.windowEnd)}`;
    if (!canPark) maximumMinutes = 0;
  }

  if (active.kind === "permit" && !permitAllowed(active, permitStatus)) {
    canPark = false;
    permitWarning = `${describeRestriction(active)} — your permit does not apply`;
  }

  if (active.kind === "accessible" && vehicleType !== "accessible") {
    canPark = false;
    accessibleRestriction = "Accessible parking only";
  }

  if (canPark && maximumMinutes != null) {
    const maxEnd = arrival.plus({ minutes: maximumMinutes });
    leaveByDt = DateTime.min(maxEnd, first.windowEnd);
  } else if (canPark) {
    leaveByDt = first.windowEnd;
  }

  for (const w of windows) {
    if (w.windowStart > arrival && w.windowStart < leaveByDt && (w.restriction.kind === "clearway" || w.restriction.kind === "no_stopping")) {
      leaveByDt = DateTime.min(leaveByDt, w.windowStart);
      clearwayWarning = `${describeRestriction(w.restriction)} starts at ${formatLeaveBy(w.windowStart)}`;
    }
  }

  const remainingMinutes = Math.max(
    0,
    Math.floor(leaveByDt.diff(arrival, "minutes").minutes),
  );

  const rate = active.ratePerHour ?? meter?.ratePerHour ?? null;
  let estimatedCost: number | null = null;
  if (paymentRequired && rate != null) {
    const billableMinutes = Math.min(remainingMinutes, intendedDurationMinutes);
    estimatedCost = Number(((billableMinutes / 60) * rate).toFixed(2));
  }

  const nextWindow = windows.find((w) => w.windowStart >= leaveByDt);
  const nextRule = nextWindow ? describeRestriction(nextWindow.restriction) : null;
  const nextRuleStart = nextWindow ? nextWindow.windowStart.toISO() : null;

  if (isPublicHoliday === null) {
    confidence = confidence === "high" ? "medium" : confidence;
  }

  let currentRule = describeRestriction(active);
  if (paymentRequired && rate != null) currentRule += ` · $${rate.toFixed(2)}/hr`;
  if (active.startTime && active.endTime) {
    currentRule += ` · ${active.startTime.slice(0, 5)}–${active.endTime.slice(0, 5)}`;
  }

  return {
    canPark,
    currentRule,
    maximumMinutes,
    remainingMinutes,
    leaveBy: canPark || remainingMinutes > 0 ? formatLeaveBy(leaveByDt) : null,
    paymentRequired,
    estimatedCost,
    nextRule,
    nextRuleStart,
    clearwayWarning,
    permitWarning,
    accessibleRestriction,
    loadingRestriction,
    confidence,
    source: bay.source,
    sourceUpdatedAt: bay.sourceUpdatedAt ?? null,
  };
}

export function defaultWeekday2PRestriction(bayId: string, councilId: string): ParkingRestrictionRecord {
  return {
    id: `${bayId}-2p-weekday`,
    bayId,
    councilId,
    kind: "paid",
    daysOfWeek: [1, 2, 3, 4, 5],
    startTime: "08:00",
    endTime: "18:30",
    maxStayMinutes: 120,
    paymentRequired: true,
    ratePerHour: 4.6,
    priority: 10,
    isTemporary: false,
    source: "seed",
    sourceUpdatedAt: null,
  };
}

export { MELBOURNE_TZ, Duration };
