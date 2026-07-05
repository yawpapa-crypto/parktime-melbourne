import { useCallback, useState } from "react";
import { SPOTS } from "@/data/parking";
import type { Screen, Sheet } from "@/types/parking";
import { AppShell, BottomNav } from "@/components/layout/mobile-shell";
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

export default function App() {
  const [onbStep, setOnbStep] = useState(0);
  const [screen, setScreen] = useState<Screen>("map");
  const [sheet, setSheet] = useState<Sheet>(null);
  const [selectedId, setSelectedId] = useState<number | null>(1);
  const [sheetOpen, setSheetOpen] = useState(false);

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

  return (
    <AppShell>
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
          <main
            className="flex-1 flex flex-col overflow-hidden relative"
            style={{ paddingTop: "env(safe-area-inset-top)" }}
          >
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
    </AppShell>
  );
}
