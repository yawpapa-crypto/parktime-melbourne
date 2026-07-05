import {
  AlertTriangle,
  Bookmark,
  ChevronRight,
  Clock,
  Database,
  Flag,
  MapPin,
  Navigation2,
  Share2,
  Shield,
  X,
} from "lucide-react";
import type { ParkSpot } from "@/types/parking";
import { TYPE_BG, TYPE_TEXT } from "@/data/parking";
import { AvailBadge, ParkBadge } from "@/components/parking/park-badge";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { isParkable } from "@/lib/utils";

interface DetailSheetProps {
  spot: ParkSpot;
  onClose: () => void;
  onStartTimer: () => void;
  onReport: () => void;
}

export function DetailSheet({ spot, onClose, onStartTimer, onReport }: DetailSheetProps) {
  const pct = spot.occupancy;
  const barColor = pct > 75 ? "#EF4444" : pct > 45 ? "#F59E0B" : "#22C55E";

  return (
    <div
      className="absolute inset-0 z-30 flex flex-col justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-sheet-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/30 backdrop-blur-[1px] cursor-default"
        aria-label="Close detail panel"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-t-3xl shadow-2xl flex flex-col overflow-hidden max-h-[84%]">
        <header className="pt-3 pb-4 px-5 border-b border-black/5 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-4" />
          <div className="flex items-start justify-between">
            <div>
              <ParkBadge spot={spot} size="md" />
              <h2 id="detail-sheet-title" className="text-[19px] font-semibold text-[#111827] leading-tight mt-2">
                {spot.street}
              </h2>
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin size={12} className="text-gray-400" aria-hidden="true" />
                <span className="text-[12px] text-gray-500">
                  {spot.suburb} · {spot.distance}
                </span>
              </div>
            </div>
            <IconButton label="Close detail" size="sm" onClick={onClose} className="w-8 h-8">
              <X size={15} className="text-gray-500" />
            </IconButton>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {isParkable(spot.type) ? (
            <div
              className="mx-4 mt-4 rounded-2xl p-4 border"
              style={{ background: TYPE_BG[spot.type] }}
            >
              <div
                className="text-[12px] font-semibold uppercase tracking-wide mb-1"
                style={{ color: TYPE_TEXT[spot.type] }}
              >
                You can park here until
              </div>
              <div
                className="text-[28px] font-bold"
                style={{ color: TYPE_TEXT[spot.type], fontFamily: "'DM Mono', monospace" }}
              >
                {spot.leaveBy}
              </div>
              <div className="text-[13px] mt-1" style={{ color: TYPE_TEXT[spot.type], opacity: 0.8 }}>
                Maximum stay from now: {spot.maxStay}
              </div>
            </div>
          ) : (
            <div className="mx-4 mt-4 rounded-2xl p-4 bg-red-50 border border-red-100 flex gap-3">
              <AlertTriangle size={17} className="text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <div className="text-[13px] font-semibold text-red-700">No parking permitted</div>
                <div className="text-[12px] text-red-600 mt-1">{spot.costNote}</div>
              </div>
            </div>
          )}

          <div className="px-4 mt-3 space-y-0">
            {spot.cost !== "—" && (
              <div className="flex items-center justify-between py-3.5 border-b border-black/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                    <span className="text-[11px] font-bold text-blue-600">$</span>
                  </div>
                  <span className="text-[13px] text-gray-600">{spot.costNote}</span>
                </div>
                <span className="text-[14px] font-semibold text-[#111827]">{spot.cost}</span>
              </div>
            )}
            <div className="flex items-center justify-between py-3.5 border-b border-black/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center">
                  <ChevronRight size={14} className="text-green-600" aria-hidden="true" />
                </div>
                <span className="text-[13px] text-gray-600">Next rule</span>
              </div>
              <span className="text-[12px] font-medium text-[#111827] text-right max-w-[55%]">
                {spot.nextRule}
              </span>
            </div>
            {spot.clearwayHours && (
              <div className="py-3 border-b border-black/5">
                <div className="rounded-xl bg-red-50 border border-red-100 p-3.5 flex gap-3">
                  <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <div className="text-[12px] font-semibold text-red-700">Clearway warning</div>
                    <div className="text-[12px] text-red-600 mt-0.5">{spot.clearwayHours}</div>
                  </div>
                </div>
              </div>
            )}
            {spot.permitException && (
              <div className="py-3 border-b border-black/5">
                <div className="rounded-xl bg-violet-50 border border-violet-100 p-3 flex gap-2.5">
                  <Shield size={14} className="text-violet-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="text-[12px] text-violet-700">{spot.permitException}</div>
                </div>
              </div>
            )}
            {spot.type !== "clearway" && spot.type !== "loading" && (
              <div className="py-3.5 border-b border-black/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] text-gray-500">Live occupancy</span>
                  <AvailBadge spot={spot} />
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
                </div>
              </div>
            )}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-1.5">
                <Database size={11} className="text-gray-400" aria-hidden="true" />
                <span className="text-[11px] text-gray-400">{spot.council}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={11} className="text-gray-400" aria-hidden="true" />
                <span className="text-[11px] text-gray-400">Updated {spot.lastUpdated}</span>
              </div>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-100 px-3.5 py-3 text-[11px] text-amber-800 leading-relaxed mb-1">
              Always check the physical parking sign before leaving your vehicle.
            </div>
          </div>

          <div className="px-4 py-4 space-y-2.5">
            {isParkable(spot.type) && (
              <Button size="lg" onClick={onStartTimer}>
                Start parking timer
              </Button>
            )}
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: <Bookmark size={18} aria-hidden="true" />, label: "Save" },
                { icon: <Navigation2 size={18} aria-hidden="true" />, label: "Navigate" },
                { icon: <Share2 size={18} aria-hidden="true" />, label: "Share" },
                { icon: <Flag size={18} aria-hidden="true" />, label: "Report", action: onReport },
              ].map((a) => (
                <button
                  key={a.label}
                  type="button"
                  onClick={"action" in a ? a.action : undefined}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-[#F7F9FC] border border-black/5 text-[11px] font-medium text-primary hover:bg-white hover:border-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-gray-100 transition-all"
                >
                  {a.icon}
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
