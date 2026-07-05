import { useState } from "react";
import { Camera, X } from "lucide-react";
import { TYPE_BG, TYPE_HEX, TYPE_TEXT } from "@/data/parking";
import type { ParkSpotType } from "@/types/parking";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { LoadingState } from "@/components/ui/states";

interface ScannerScreenProps {
  onClose: () => void;
}

export function ScannerScreen({ onClose }: ScannerScreenProps) {
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);

  const handleScan = () => {
    setScanning(true);
    window.setTimeout(() => {
      setScanning(false);
      setScanned(true);
    }, 1800);
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col" role="dialog" aria-modal="true" aria-label="Sign scanner">
      <div className="flex-1 bg-[#0D1117] relative overflow-hidden">
        <div className="absolute inset-0 bg-[#0D1117]">
          <div
            className="absolute inset-0"
            style={{ backgroundImage: "radial-gradient(ellipse at 50% 40%, #1a1f2e 0%, #0D1117 70%)" }}
          />
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-px bg-white/[0.03]"
              style={{ left: `${10 + i * 14}%` }}
            />
          ))}
        </div>

        <header className="absolute top-0 left-0 right-0 px-5 pt-3 flex items-center justify-between z-10">
          <IconButton label="Close scanner" onClick={onClose} className="w-9 h-9 bg-black/40 border-none shadow-none hover:bg-black/60">
            <X size={18} className="text-white" />
          </IconButton>
          <div className="flex items-center gap-2 bg-black/40 rounded-full px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" aria-hidden="true" />
            <span className="text-[12px] font-medium text-white">Sign Scanner</span>
          </div>
          <div className="w-9" aria-hidden="true" />
        </header>

        {!scanned ? (
          <>
            <div className="absolute inset-0 flex items-center justify-center">
              {scanning ? (
                <LoadingState message="Scanning sign…" className="text-white/70" />
              ) : (
                <div className="relative w-64 h-40">
                  {[
                    ["top-0 left-0", "border-t-2 border-l-2"],
                    ["top-0 right-0", "border-t-2 border-r-2"],
                    ["bottom-0 left-0", "border-b-2 border-l-2"],
                    ["bottom-0 right-0", "border-b-2 border-r-2"],
                  ].map(([pos, border]) => (
                    <div key={pos} className={`absolute ${pos} w-6 h-6 ${border} border-white rounded-sm`} />
                  ))}
                  <div className="absolute inset-0 border border-white/20 rounded flex items-center justify-center">
                    <span className="text-white/50 text-[12px]">Point at parking sign</span>
                  </div>
                </div>
              )}
              {scanning && (
                <div className="absolute left-1/2 -translate-x-1/2 w-64 h-0.5 bg-accent opacity-80 animate-scanline top-1/3" />
              )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 pb-10 flex flex-col items-center gap-4">
              <p className="text-white/60 text-[13px]">Align the parking sign within the frame</p>
              <button
                type="button"
                onClick={handleScan}
                disabled={scanning}
                aria-label="Capture sign photo"
                className="w-16 h-16 rounded-full border-4 border-white/60 flex items-center justify-center active:scale-95 transition-transform hover:border-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60"
                style={{ background: scanning ? "#22C55E" : "rgba(255,255,255,0.15)" }}
              >
                <Camera size={24} className="text-white" />
              </button>
            </div>
          </>
        ) : (
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl overflow-hidden max-h-[70%]">
            <div className="overflow-y-auto no-scrollbar">
              <div className="pt-3 pb-2 flex justify-center">
                <div className="w-10 h-1 rounded-full bg-gray-200" />
              </div>
              <div className="mx-4 mt-2 rounded-2xl overflow-hidden bg-primary aspect-[3/1] relative flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="text-[11px] font-semibold text-white/60 uppercase tracking-wide mb-2">Scanned sign</div>
                  <div className="flex items-center gap-3 justify-center">
                    <div className="bg-white/10 rounded-lg px-4 py-2.5">
                      <div className="text-[20px] font-black text-white font-mono">2P</div>
                      <div className="text-[10px] text-white/70">8AM – 6:30PM</div>
                    </div>
                    <div className="bg-white/10 rounded-lg px-4 py-2.5">
                      <div className="text-[14px] font-bold text-[#3B82F6]">METER</div>
                      <div className="text-[10px] text-white/70">$4.60/hr</div>
                    </div>
                    <div className="bg-red-900/40 rounded-lg px-3 py-2.5">
                      <div className="text-[11px] font-bold text-red-300">CLEARWAY</div>
                      <div className="text-[10px] text-white/70">7–9AM wdays</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Confidence</span>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1" aria-hidden="true">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="w-5 h-2 rounded-full" style={{ background: i <= 4 ? "#22C55E" : "#E5E7EB" }} />
                      ))}
                    </div>
                    <span className="text-[12px] font-semibold text-green-600">High</span>
                  </div>
                </div>
                <div className="rounded-2xl bg-[#F7F9FC] border border-black/5 p-4 mb-3">
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Plain language</div>
                  <p className="text-[15px] font-medium text-[#111827] leading-relaxed">
                    You may park here for <span className="text-blue-700 font-semibold">2 hours</span> between{" "}
                    <span className="font-semibold">8:00 am and 6:30 pm</span>, Monday to Friday.{" "}
                    <span className="text-blue-600">Paid parking applies</span> at $4.60/hr.
                  </p>
                </div>
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Detected restrictions</div>
                <div className="space-y-2 mb-4">
                  {(
                    [
                      { type: "paid" as ParkSpotType, text: "2P Metered · $4.60/hr · 8:00 am–6:30 pm Mon–Fri" },
                      { type: "clearway" as ParkSpotType, text: "Clearway · 7:00 am–9:00 am weekdays" },
                    ] as const
                  ).map((r) => (
                    <div key={r.text} className="flex items-center gap-3 rounded-xl px-3.5 py-3" style={{ background: TYPE_BG[r.type] }}>
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: TYPE_HEX[r.type] }} />
                      <span className="text-[12px] font-medium" style={{ color: TYPE_TEXT[r.type] }}>
                        {r.text}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl bg-amber-50 border border-amber-100 px-3.5 py-3 text-[11px] text-amber-800 mb-5 leading-relaxed">
                  Always verify by reading the physical sign. This interpretation may not capture all conditions.
                </div>
                <div className="grid grid-cols-2 gap-2.5 pb-6">
                  <Button variant="secondary" onClick={onClose}>
                    Dismiss
                  </Button>
                  <Button onClick={onClose}>Use this</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
