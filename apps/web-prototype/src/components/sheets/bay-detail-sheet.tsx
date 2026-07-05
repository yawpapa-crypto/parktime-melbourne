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
  X,
} from "lucide-react";
import type { NearbyBay } from "@/services/api";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";

interface BayDetailSheetProps {
  bay: NearbyBay;
  onClose: () => void;
  onStartTimer: () => void;
  onReport: () => void;
  onSave: () => void;
  isSaved: boolean;
}

export function BayDetailSheet({
  bay,
  onClose,
  onStartTimer,
  onReport,
  onSave,
  isSaved,
}: BayDetailSheetProps) {
  const navigate = () => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${bay.latitude},${bay.longitude}`,
      "_blank",
    );
  };

  const share = async () => {
    const text = `${bay.streetDescription} — ${bay.rule.currentRule}`;
    if (navigator.share) {
      await navigator.share({ title: bay.streetDescription, text });
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-black/30" aria-label="Close" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl shadow-2xl flex flex-col overflow-hidden max-h-[84%]">
        <header className="pt-3 pb-4 px-5 border-b border-black/5">
          <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-4" />
          <div className="flex items-start justify-between">
            <div>
              <span
                className="inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold mb-2"
                style={{
                  background: bay.rule.canPark
                    ? bay.rule.paymentRequired
                      ? "#DBEAFE"
                      : "#DCFCE7"
                    : "#FEE2E2",
                  color: bay.rule.canPark
                    ? bay.rule.paymentRequired
                      ? "#1D4ED8"
                      : "#15803D"
                    : "#B91C1C",
                }}
              >
                {bay.rule.currentRule.split(" · ")[0]}
              </span>
              <h2 className="text-[19px] font-semibold text-[#111827] leading-tight">{bay.streetDescription}</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin size={12} className="text-gray-400" />
                <span className="text-[12px] text-gray-500">
                  {bay.suburb ?? "Melbourne"} · {bay.distanceMetres} m
                </span>
              </div>
            </div>
            <IconButton label="Close" size="sm" onClick={onClose} className="w-8 h-8">
              <X size={15} className="text-gray-500" />
            </IconButton>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-3">
          {bay.rule.canPark ? (
            <div className="rounded-2xl p-4 bg-green-50 border border-green-100">
              <div className="text-[12px] font-semibold text-green-700 uppercase tracking-wide mb-1">
                You can park here until
              </div>
              <div className="text-[28px] font-bold text-green-800" style={{ fontFamily: "'DM Mono', monospace" }}>
                {bay.rule.leaveBy ?? "Check sign"}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-4 bg-red-50 border border-red-100 flex gap-3">
              <AlertTriangle size={17} className="text-red-500 shrink-0" />
              <div>
                <div className="text-[13px] font-semibold text-red-700">No parking permitted</div>
                <div className="text-[12px] text-red-600 mt-1">{bay.rule.currentRule}</div>
              </div>
            </div>
          )}

          {bay.rule.estimatedCost != null && (
            <div className="flex items-center justify-between py-3 border-b border-black/5">
              <span className="text-[13px] text-gray-600">Estimated cost</span>
              <span className="text-[14px] font-semibold">${bay.rule.estimatedCost.toFixed(2)}</span>
            </div>
          )}

          {bay.rule.nextRule && (
            <div className="flex items-center justify-between py-3 border-b border-black/5">
              <div className="flex items-center gap-3">
                <ChevronRight size={14} className="text-green-600" />
                <span className="text-[13px] text-gray-600">Next rule</span>
              </div>
              <span className="text-[12px] font-medium text-right max-w-[55%]">{bay.rule.nextRule}</span>
            </div>
          )}

          {bay.rule.clearwayWarning && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-3.5 flex gap-3">
              <AlertTriangle size={15} className="text-red-500 shrink-0" />
              <div className="text-[12px] text-red-600">{bay.rule.clearwayWarning}</div>
            </div>
          )}

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-1.5">
              <Database size={11} className="text-gray-400" />
              <span className="text-[11px] text-gray-400">{bay.source}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={11} className="text-gray-400" />
              <span className="text-[11px] text-gray-400">
                {bay.sourceUpdatedAt ? new Date(bay.sourceUpdatedAt).toLocaleDateString() : "—"}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-amber-50 border border-amber-100 px-3.5 py-3 text-[11px] text-amber-800">
            Always check the physical parking sign before leaving your vehicle.
          </div>

          <div className="space-y-2.5 pb-4">
            {bay.rule.canPark && (
              <Button size="lg" onClick={onStartTimer}>
                Start parking timer
              </Button>
            )}
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={onSave}
                className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-[#F7F9FC] border border-black/5 text-[11px] font-medium text-primary"
              >
                <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} />
                {isSaved ? "Saved" : "Save"}
              </button>
              <button type="button" onClick={navigate} className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-[#F7F9FC] border border-black/5 text-[11px] font-medium text-primary">
                <Navigation2 size={18} /> Navigate
              </button>
              <button type="button" onClick={share} className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-[#F7F9FC] border border-black/5 text-[11px] font-medium text-primary">
                <Share2 size={18} /> Share
              </button>
              <button type="button" onClick={onReport} className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-[#F7F9FC] border border-black/5 text-[11px] font-medium text-primary">
                <Flag size={18} /> Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
