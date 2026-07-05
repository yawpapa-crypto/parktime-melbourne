import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  Camera,
  Flag,
  LocateFixed,
  MapPin,
  Navigation2,
  Search,
  Share2,
  SlidersHorizontal,
  User,
} from "lucide-react";
import { SPOTS, TYPE_BG, TYPE_HEX, TYPE_TEXT } from "@/data/parking";
import type { ParkSpotType } from "@/types/parking";
import { MelbourneCBDMap } from "@/components/parking/melbourne-map";
import { AvailBadge, ParkBadge } from "@/components/parking/park-badge";
import { ParkingSpotCard } from "@/components/parking/parking-spot-card";
import { Button } from "@/components/ui/button";
import { SortChip } from "@/components/ui/filter-pill";
import { IconButton } from "@/components/ui/icon-button";
import { isParkable } from "@/lib/utils";

interface DesktopLayoutProps {
  onOpenMobile: () => void;
}

export function DesktopLayout({ onOpenMobile }: DesktopLayoutProps) {
  const [selectedId, setSelectedId] = useState<number | null>(1);
  const [sort, setSort] = useState("Closest");
  const [showDetail, setShowDetail] = useState(true);
  const spot = SPOTS.find((s) => s.id === selectedId) ?? SPOTS[0];
  const mapWidth = typeof window !== "undefined" ? Math.max(600, window.innerWidth - 420) : 800;
  const mapHeight = typeof window !== "undefined" ? window.innerHeight - 56 : 700;

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <header
        className="h-14 bg-white border-b flex items-center px-6 gap-6 flex-shrink-0 z-20"
        style={{ borderColor: "rgba(0,0,0,0.08)" }}
      >
        <div className="flex items-center gap-2.5 mr-4">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <MapPin size={13} className="text-white" aria-hidden="true" />
          </div>
          <span className="text-[15px] font-bold text-[#111827] tracking-tight">ParkTime</span>
          <span className="text-[13px] text-gray-400 font-medium">Melbourne</span>
        </div>
        <div
          role="search"
          className="flex-1 flex items-center gap-2.5 bg-[#F7F9FC] rounded-xl px-3.5 py-2.5 border border-black/6 max-w-md"
        >
          <Search size={15} className="text-gray-400 shrink-0" aria-hidden="true" />
          <span className="text-[14px] text-gray-400">Search street, suburb or destination</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F7F9FC] border border-black/6 text-[13px] font-medium text-primary hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <SlidersHorizontal size={15} aria-hidden="true" /> Filters
          </button>
          <Button size="sm" onClick={onOpenMobile}>
            Mobile app
          </Button>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center ml-2" aria-hidden="true">
            <User size={15} className="text-white" />
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative bg-[#E8ECF2]">
          <MelbourneCBDMap
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id);
              setShowDetail(true);
            }}
            width={mapWidth}
            height={mapHeight}
          />
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <IconButton label="Locate me">
              <LocateFixed size={17} className="text-primary" />
            </IconButton>
            <IconButton label="Open sign scanner">
              <Camera size={17} className="text-primary" />
            </IconButton>
          </div>
          <div
            className="absolute bottom-6 left-4 bg-white rounded-2xl shadow border border-black/6 px-4 py-3 flex gap-5"
            aria-label="Map legend"
          >
            {(["available", "paid", "caution", "clearway", "permit"] as ParkSpotType[]).map((t) => (
              <div key={t} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: TYPE_HEX[t] }} />
                <span className="text-[11px] font-medium text-gray-600 capitalize">{t}</span>
              </div>
            ))}
          </div>
        </div>

        <aside
          className="w-[400px] flex flex-col border-l overflow-hidden flex-shrink-0"
          style={{ borderColor: "rgba(0,0,0,0.08)" }}
          aria-label="Parking results"
        >
          <div
            className="px-4 py-3 border-b flex items-center gap-2 flex-shrink-0"
            style={{ borderColor: "rgba(0,0,0,0.08)" }}
          >
            <span className="text-[13px] font-semibold text-[#111827]">Parking near you</span>
            <div className="flex-1" />
            <div className="flex gap-1.5" role="toolbar" aria-label="Sort options">
              {["Closest", "Free only"].map((s) => (
                <SortChip key={s} label={s} active={sort === s} onClick={() => setSort(s)} />
              ))}
            </div>
          </div>

          {showDetail && selectedId ? (
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <div className="px-4 pt-4 pb-2 flex items-center gap-2 flex-shrink-0">
                <IconButton
                  label="Back to list"
                  size="sm"
                  onClick={() => setShowDetail(false)}
                  className="w-8 h-8 bg-[#F7F9FC]"
                >
                  <ArrowLeft size={14} className="text-gray-600" />
                </IconButton>
                <span className="text-[13px] font-medium text-gray-500">Back to list</span>
              </div>
              <div className="px-4 pb-3 border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                <ParkBadge spot={spot} size="md" />
                <h2 className="text-[18px] font-semibold text-[#111827] mt-2 leading-tight">{spot.street}</h2>
                <div className="flex items-center gap-1.5 mt-1">
                  <MapPin size={12} className="text-gray-400" aria-hidden="true" />
                  <span className="text-[12px] text-gray-500">
                    {spot.suburb} · {spot.distance}
                  </span>
                </div>
              </div>
              {isParkable(spot.type) && (
                <div className="mx-4 mt-3 rounded-xl p-4 border" style={{ background: TYPE_BG[spot.type] }}>
                  <div className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: TYPE_TEXT[spot.type] }}>
                    Park until
                  </div>
                  <div className="text-[24px] font-bold" style={{ color: TYPE_TEXT[spot.type], fontFamily: "'DM Mono', monospace" }}>
                    {spot.leaveBy}
                  </div>
                  <div className="text-[12px] mt-1" style={{ color: TYPE_TEXT[spot.type], opacity: 0.8 }}>
                    Max stay: {spot.maxStay}
                  </div>
                </div>
              )}
              <div className="px-4 mt-3 space-y-0">
                {spot.cost !== "—" && (
                  <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                    <span className="text-[13px] text-gray-600">{spot.costNote}</span>
                    <span className="text-[14px] font-semibold text-[#111827]">{spot.cost}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                  <span className="text-[12px] text-gray-500">Next rule</span>
                  <span className="text-[12px] font-medium text-[#111827] text-right max-w-[60%]">{spot.nextRule}</span>
                </div>
                {spot.clearwayHours && (
                  <div className="py-3">
                    <div className="rounded-xl bg-red-50 border border-red-100 p-3 flex gap-2.5">
                      <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
                      <div className="text-[12px] text-red-700">Clearway: {spot.clearwayHours}</div>
                    </div>
                  </div>
                )}
                {spot.type !== "clearway" && spot.type !== "loading" && (
                  <div className="py-3 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] text-gray-500">Occupancy</span>
                      <AvailBadge spot={spot} />
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${spot.occupancy}%`,
                          background: spot.occupancy > 75 ? "#EF4444" : spot.occupancy > 45 ? "#F59E0B" : "#22C55E",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="px-4 py-4 space-y-2.5 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                {isParkable(spot.type) && (
                  <Button className="w-full">Start parking timer</Button>
                )}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { icon: <Bookmark size={16} aria-hidden="true" />, label: "Save" },
                    { icon: <Navigation2 size={16} aria-hidden="true" />, label: "Navigate" },
                    { icon: <Share2 size={16} aria-hidden="true" />, label: "Share" },
                    { icon: <Flag size={16} aria-hidden="true" />, label: "Report" },
                  ].map((a) => (
                    <button
                      key={a.label}
                      type="button"
                      className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl bg-[#F7F9FC] border border-black/5 text-[11px] font-medium text-primary hover:bg-white hover:border-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                    >
                      {a.icon}
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mx-4 mb-4 rounded-xl bg-amber-50 border border-amber-100 px-3.5 py-3 text-[11px] text-amber-800 leading-relaxed">
                Always check the physical parking sign before leaving your vehicle.
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
              {SPOTS.map((s) => (
                <ParkingSpotCard
                  key={s.id}
                  spot={s}
                  selected={s.id === selectedId}
                  onClick={() => {
                    setSelectedId(s.id);
                    setShowDetail(true);
                  }}
                />
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
