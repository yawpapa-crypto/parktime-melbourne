import { useCallback, useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { SPOTS } from "@/data/parking";
import type { Screen, Sheet } from "@/types/parking";
import { BottomNav, PhoneFrame, StatusBar } from "@/components/layout/mobile-shell";
import { OnboardingScreen } from "@/components/screens/onboarding-screen";
import { MapScreen } from "@/components/screens/map-screen";
import { NearbyScreen } from "@/components/screens/nearby-screen";
import { SavedScreen } from "@/components/screens/saved-screen";
import { TimerScreen } from "@/components/screens/timer-screen";
import { ProfileScreen } from "@/components/screens/profile-screen";
import { ScannerScreen } from "@/components/screens/scanner-screen";
import { DetailSheet } from "@/components/sheets/detail-sheet";
import { FilterSheet } from "@/components/sheets/filter-sheet";
import { ReportSheet } from "@/components/sheets/report-sheet";
import { cn } from "@/lib/utils";

export default function App() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [onbStep, setOnbStep] = useState(0);
  const [screen, setScreen] = useState<Screen>("map");
  const [sheet, setSheet] = useState<Sheet>(null);
  const [selectedId, setSelectedId] = useState<number | null>(1);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const spot = SPOTS.find((s) => s.id === selectedId) ?? SPOTS[0];

  const handleSelectSpot = useCallback((id: number) => {
    setSelectedId(id);
    setSheet("detail");
  }, []);

  const handleNavigate = (s: Screen) => {
    setScreen(s);
    setSheet(null);
    setSheetOpen(false);
  };

  const quickJumpScreens: Screen[] = ["map", "nearby", "saved", "timer", "profile"];

  return (
    <div
      className="min-h-screen flex items-center justify-center py-10 relative"
      style={{
        background: "linear-gradient(135deg, #0F1B35 0%, #1A2744 45%, #0D3B5A 100%)",
      }}
    >
      <div className="absolute inset-0 opacity-5 pointer-events-none" aria-hidden="true">
        <svg width="100%" height="100%">
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0L0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
          <MapPin size={13} className="text-white" aria-hidden="true" />
        </div>
        <span className="text-white text-[15px] font-semibold tracking-tight">ParkTime Melbourne</span>
        {isDesktop && (
          <span className="ml-4 px-3 py-1 rounded-full bg-white/10 text-[11px] text-white/70 font-medium border border-white/20">
            Live map · search enabled
          </span>
        )}
      </div>

      <PhoneFrame>
        {screen === "onboarding" ? (
          <OnboardingScreen
            step={onbStep}
            onNext={() => {
              if (onbStep < 2) setOnbStep(onbStep + 1);
              else setScreen("map");
            }}
            onSkip={() => setScreen("map")}
          />
        ) : (
          <>
            <StatusBar />
            <main className="flex-1 flex flex-col overflow-hidden relative">
              {screen === "map" && (
                <MapScreen
                  onOpenFilter={() => setSheet("filter")}
                  sheetOpen={sheetOpen}
                  setSheetOpen={setSheetOpen}
                />
              )}
              {screen === "nearby" && <NearbyScreen onSelectSpot={handleSelectSpot} />}
              {screen === "saved" && <SavedScreen />}
              {screen === "timer" && <TimerScreen />}
              {screen === "profile" && (
                <ProfileScreen onOpenScanner={() => setSheet("scanner")} />
              )}

              {sheet === "detail" && (
                <DetailSheet
                  spot={spot}
                  onClose={() => setSheet(null)}
                  onStartTimer={() => {
                    setSheet(null);
                    setScreen("timer");
                  }}
                  onReport={() => setSheet("report")}
                />
              )}
              {sheet === "filter" && <FilterSheet onClose={() => setSheet(null)} />}
              {sheet === "report" && <ReportSheet spot={spot} onClose={() => setSheet(null)} />}
              {sheet === "scanner" && <ScannerScreen onClose={() => setSheet(null)} />}
            </main>
            <BottomNav active={screen} onNavigate={handleNavigate} />
          </>
        )}
      </PhoneFrame>

      <nav
        aria-label="Demo quick navigation"
        className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 flex-wrap justify-center z-10 px-6"
      >
        {quickJumpScreens.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleNavigate(s)}
            className={cn(
              "px-3 py-1.5 rounded-full text-[11px] font-medium transition-all border",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
              screen === s
                ? "bg-white/20 text-white border-white/30"
                : "bg-white/[0.07] text-white/45 border-transparent hover:bg-white/15 hover:text-white/70",
            )}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            handleNavigate("map");
            setSheet("filter");
          }}
          className="px-3 py-1.5 rounded-full text-[11px] font-medium transition-all bg-white/[0.07] text-white/45 border border-transparent hover:bg-white/15 hover:text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        >
          Filters
        </button>
        <button
          type="button"
          onClick={() => {
            handleNavigate("profile");
            window.setTimeout(() => setSheet("scanner"), 50);
          }}
          className="px-3 py-1.5 rounded-full text-[11px] font-medium transition-all bg-white/[0.07] text-white/45 border border-transparent hover:bg-white/15 hover:text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        >
          Scanner
        </button>
      </nav>
    </div>
  );
}
