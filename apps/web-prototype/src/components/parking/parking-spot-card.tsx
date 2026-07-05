import { MapPin } from "lucide-react";
import type { ParkSpot } from "@/types/parking";
import { TYPE_BG, TYPE_TEXT } from "@/data/parking";
import { isParkable } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { AvailBadge, ParkBadge } from "./park-badge";

interface ParkingSpotCardProps {
  spot: ParkSpot;
  onClick: () => void;
  compact?: boolean;
  selected?: boolean;
}

export function ParkingSpotCard({
  spot,
  onClick,
  compact = false,
  selected = false,
}: ParkingSpotCardProps) {
  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "shrink-0 bg-[#F7F9FC] rounded-2xl px-3.5 py-3 flex items-center gap-2.5 border border-black/5",
          "hover:bg-white hover:border-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "active:bg-gray-100 transition-all",
        )}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: TYPE_BG[spot.type] }}
        >
          <span className="text-[9px] font-bold" style={{ color: TYPE_TEXT[spot.type] }}>
            {spot.limit}
          </span>
        </div>
        <div className="text-left">
          <div className="text-[12px] font-semibold text-[#111827]">Until {spot.leaveBy}</div>
          <div className="text-[10px] text-gray-400">
            {spot.distance} · {spot.cost}
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "w-full bg-[#F7F9FC] rounded-2xl p-3.5 text-left border border-black/5",
        "hover:border-primary/20 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "active:bg-gray-100 transition-all",
        selected && "outline-2 outline-primary",
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-[13px] font-semibold text-[#111827]">{spot.street}</div>
          <div className="text-[11px] text-gray-400">
            {spot.suburb} · {spot.distance}
          </div>
        </div>
        <ParkBadge spot={spot} />
      </div>
      <div className="flex items-center justify-between">
        <div className="text-[12px] text-gray-600">
          {isParkable(spot.type) ? `Leave by ${spot.leaveBy}` : spot.nextRule}
        </div>
        <AvailBadge spot={spot} />
      </div>
    </button>
  );
}

interface ParkingSpotListRowProps {
  spot: ParkSpot;
  onClick: () => void;
}

export function ParkingSpotListRow({ spot, onClick }: ParkingSpotListRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full bg-white rounded-2xl p-4 text-left border border-black/5 shadow-sm",
        "hover:border-primary/20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "active:bg-gray-50 transition-all",
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-[14px] font-semibold text-[#111827]">{spot.street}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">{spot.suburb}</div>
        </div>
        <ParkBadge spot={spot} />
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-[#F7F9FC] rounded-xl px-3 py-2">
          <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Leave by</div>
          <div
            className="text-[13px] font-semibold text-[#111827] mt-0.5"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            {isParkable(spot.type) ? spot.leaveBy : "—"}
          </div>
        </div>
        <div className="bg-[#F7F9FC] rounded-xl px-3 py-2">
          <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Cost</div>
          <div className="text-[13px] font-semibold text-[#111827] mt-0.5">{spot.cost}</div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <MapPin size={12} className="text-gray-400" aria-hidden="true" />
          <span className="text-[12px] text-gray-500">{spot.distance}</span>
        </div>
        <AvailBadge spot={spot} />
      </div>
      <div className="mt-1.5 text-[11px] text-gray-400">{spot.nextRule}</div>
    </button>
  );
}
