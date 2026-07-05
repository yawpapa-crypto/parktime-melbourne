import type { ParkSpot } from "@/types/parking";
import { TYPE_BG, TYPE_TEXT } from "@/data/parking";
import { isParkable } from "@/lib/utils";

interface ParkBadgeProps {
  spot: ParkSpot;
  size?: "sm" | "md";
}

export function ParkBadge({ spot, size = "sm" }: ParkBadgeProps) {
  const pad = size === "md" ? "px-3 py-1.5 text-[11px]" : "px-2 py-0.5 text-[10px]";
  return (
    <span
      className={`rounded-full font-semibold tracking-wide shrink-0 ${pad}`}
      style={{ background: TYPE_BG[spot.type], color: TYPE_TEXT[spot.type] }}
    >
      {spot.badge}
    </span>
  );
}

export function AvailBadge({ spot }: { spot: ParkSpot }) {
  const ok = isParkable(spot.type);
  return (
    <span
      className={`text-[11px] font-medium ${ok ? "text-green-600" : "text-gray-400"}`}
    >
      {spot.availability}
    </span>
  );
}
