import { useCallback, useState } from "react";
import { useAppStore } from "@/context/app-store";
import type { Screen, Sheet } from "@/types/parking";
import { AppShell, BottomNav } from "@/components/layout/mobile-shell";
import { OnboardingScreen } from "@/components/screens/onboarding-screen";
import { MapScreen } from "@/components/screens/map-screen";
import { NearbyScreen } from "@/components/screens/nearby-screen";
import { SavedScreen } from "@/components/screens/saved-screen";
import { TimerScreen } from "@/components/screens/timer-screen";
import { ProfileScreen } from "@/components/screens/profile-screen";
import { ScannerScreen } from "@/components/screens/scanner-screen";
import { BayDetailSheet } from "@/components/sheets/bay-detail-sheet";
import { FilterSheet } from "@/components/sheets/filter-sheet";
import { ReportSheet } from "@/components/sheets/report-sheet";

export default function App() {
  const {
    showOnboarding,
    completeOnboarding,
    selectedBay,
    setSelectedBay,
    savedPlaces,
    addSavedPlace,
    startSession,
    activeSession,
  } = useAppStore();

  const [onbStep, setOnbStep] = useState(0);
  const [screen, setScreen] = useState<Screen>("map");
  const [sheet, setSheet] = useState<Sheet>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleNavigate = (s: Screen) => {
    setScreen(s);
    setSheet(null);
    setSheetOpen(false);
  };

  const handleSaveBay = useCallback(() => {
    if (!selectedBay) return;
    const exists = savedPlaces.some((p) => p.bayId === selectedBay.id);
    if (exists) return;
    addSavedPlace({
      label: selectedBay.streetDescription.split(",")[0] ?? "Saved bay",
      category: "Work",
      bayId: selectedBay.id,
      street: selectedBay.streetDescription,
      suburb: selectedBay.suburb ?? "Melbourne",
      latitude: selectedBay.latitude,
      longitude: selectedBay.longitude,
      rule: selectedBay.rule.currentRule,
      status: selectedBay.rule.canPark
        ? selectedBay.rule.paymentRequired
          ? "paid"
          : "available"
        : "caution",
      icon: "📍",
    });
  }, [selectedBay, savedPlaces, addSavedPlace]);

  const handleStartTimer = useCallback(async () => {
    if (!selectedBay) return;
    const end = selectedBay.rule.leaveBy
      ? new Date(`${new Date().toDateString()} ${selectedBay.rule.leaveBy}`).toISOString()
      : new Date(Date.now() + 2 * 60 * 60_000).toISOString();
    await startSession(selectedBay, end);
    setSheet(null);
    setSelectedBay(null);
    setScreen("timer");
  }, [selectedBay, startSession, setSelectedBay]);

  const isBaySaved = selectedBay
    ? savedPlaces.some((p) => p.bayId === selectedBay.id)
    : false;

  return (
    <AppShell>
      {showOnboarding ? (
        <OnboardingScreen
          step={onbStep}
          onNext={() => {
            if (onbStep < 2) setOnbStep(onbStep + 1);
            else completeOnboarding();
          }}
          onSkip={completeOnboarding}
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
                onSelectBay={(bay) => {
                  setSelectedBay(bay);
                  setSheet("detail");
                }}
              />
            )}
            {screen === "nearby" && (
              <NearbyScreen
                onSelectBay={(bay) => {
                  setSelectedBay(bay);
                  setSheet("detail");
                }}
              />
            )}
            {screen === "saved" && <SavedScreen onNavigateToMap={() => setScreen("map")} />}
            {screen === "timer" && <TimerScreen />}
            {screen === "profile" && (
              <ProfileScreen onOpenScanner={() => setSheet("scanner")} />
            )}

            {sheet === "detail" && selectedBay && (
              <BayDetailSheet
                bay={selectedBay}
                isSaved={isBaySaved}
                onClose={() => {
                  setSheet(null);
                  setSelectedBay(null);
                }}
                onStartTimer={handleStartTimer}
                onReport={() => setSheet("report")}
                onSave={handleSaveBay}
              />
            )}
            {sheet === "filter" && <FilterSheet onClose={() => setSheet(null)} />}
            {sheet === "report" && selectedBay && (
              <ReportSheet bay={selectedBay} onClose={() => setSheet(null)} />
            )}
            {sheet === "scanner" && <ScannerScreen onClose={() => setSheet(null)} />}
          </main>
          <BottomNav active={screen} onNavigate={handleNavigate} />
          {activeSession && screen !== "timer" && (
            <button
              type="button"
              onClick={() => setScreen("timer")}
              className="absolute bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-4 right-4 z-40 bg-primary text-white rounded-2xl py-3 px-4 text-[13px] font-semibold shadow-lg"
            >
              Active session · tap to view timer
            </button>
          )}
        </>
      )}
    </AppShell>
  );
}
