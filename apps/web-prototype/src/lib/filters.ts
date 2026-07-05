import type { NearbyBay } from "@/services/api";
import type { ParkingFilters } from "@/types/app";

const DURATION_MINUTES: Record<string, number> = {
  "15 min": 15,
  "30 min": 30,
  "1P": 60,
  "2P": 120,
  "4P": 240,
  "All day": 480,
  Unrestricted: 9999,
};

export function filtersToApiParams(filters: ParkingFilters) {
  const minimumDuration = filters.duration.length
    ? Math.max(...filters.duration.map((d) => DURATION_MINUTES[d] ?? 0))
    : undefined;

  return {
    minimumDuration,
    freeOnly: filters.cost === "free" ? true : undefined,
    parkingTypes: filters.parkTypes.length ? filters.parkTypes.join(",") : undefined,
  };
}

export function applyClientFilters(bays: NearbyBay[], filters: ParkingFilters): NearbyBay[] {
  let results = bays;

  if (filters.cost === "paid") {
    results = results.filter((b) => b.rule.paymentRequired);
  }

  if (filters.availability === "available") {
    results = results.filter((b) => b.rule.canPark);
  }

  if (filters.duration.length) {
    const min = Math.max(...filters.duration.map((d) => DURATION_MINUTES[d] ?? 0));
    results = results.filter((b) => (b.rule.maximumMinutes ?? 9999) >= min || min >= 480);
  }

  return results;
}

export type SortOption = "Closest" | "Longest parking" | "Cheapest" | "Most available";

export function sortBays(bays: NearbyBay[], sort: SortOption): NearbyBay[] {
  const copy = [...bays];
  switch (sort) {
    case "Longest parking":
      return copy.sort(
        (a, b) => (b.rule.maximumMinutes ?? 0) - (a.rule.maximumMinutes ?? 0),
      );
    case "Cheapest":
      return copy.sort(
        (a, b) => (a.rule.estimatedCost ?? 0) - (b.rule.estimatedCost ?? 0),
      );
    case "Most available":
      return copy.sort((a, b) => Number(b.rule.canPark) - Number(a.rule.canPark));
    default:
      return copy.sort((a, b) => a.distanceMetres - b.distanceMetres);
  }
}
