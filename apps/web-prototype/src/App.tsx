import { useCallback, useState, lazy, Suspense } from "react";
import { useAppStore } from "@/context/app-store";
import type { Screen, Sheet } from "@/types/parking";
import { AppShell, BottomNav } from "@/components/layout/mobile-shell";
import { InstallBanner } from "@/components/ui/install-banner";
import { BayDetailSheet } from "@/components/sheets/bay-detail-sheet";
import { FilterSheet } from "@/components/sheets/filter-sheet";
import { ReportSheet } from "@/components/sheets/report-sheet";

const OnboardingScreen = lazy(() =>
  import("@/components/screens/onboarding-screen").then((m) => ({ default: m.OnboardingScreen })),
);
const MapScreen = lazy(() =>
  import("@/components/screens/map-screen").then((m) => ({ default: m.MapScreen })),
);
const NearbyScreen = lazy(() =>
  import("@/components/screens/nearby-screen").then((m) => ({ default: m.NearbyScreen })),
);
const SavedScreen = lazy(() =>
  import("@/components/screens/saved-screen").then((m) => ({ default: m.SavedScreen })),
);
const TimerScreen = lazy(() =>
  import("@/components/screens/timer-screen").then((m) => ({ default: m.TimerScreen })),
);
const ProfileScreen = lazy(() =>
  import("@/components/screens/profile-screen").then((m) => ({ default: m.ProfileScreen })),
);
const ScannerScreen = lazy(() =>
  import("@/components/screens/scanner-screen").then((m) => ({ default: m.ScannerScreen })),
);

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
        <Suspense fallback={<ScreenLoader />}>
          <OnboardingScreen
          step={onbStep}
          onNext={() => {
            if (onbStep < 2) setOnbStep(onbStep + 1);
            else completeOnboarding();
          }}
          onSkip={completeOnboarding}
          />
        </Suspense>
      ) : (
        <>
          <InstallBanner />
          <main
            className="flex-1 flex flex-col overflow-hidden relative"
            style={{ paddingTop: "env(safe-area-inset-top)" }}
          >
            {screen === "map" && (
              <Suspense fallback={<ScreenLoader />}>
                <MapScreen
                onOpenFilter={() => setSheet("filter")}
                sheetOpen={sheetOpen}
                setSheetOpen={setSheetOpen}
                onSelectBay={(bay) => {
                  setSelectedBay(bay);
                  setSheet("detail");
                }}
                />
              </Suspense>
            )}
            {screen === "nearby" && (
              <Suspense fallback={<ScreenLoader />}>
                <NearbyScreen
                onSelectBay={(bay) => {
                  setSelectedBay(bay);
                  setSheet("detail");
                }}
                />
              </Suspense>
            )}
            {screen === "saved" && (
              <Suspense fallback={<ScreenLoader />}>
                <SavedScreen onNavigateToMap={() => setScreen("map")} />
              </Suspense>
            )}
            {screen === "timer" && (
              <Suspense fallback={<ScreenLoader />}>
                <TimerScreen />
              </Suspense>
            )}
            {screen === "profile" && (
              <Suspense fallback={<ScreenLoader />}>
                <ProfileScreen onOpenScanner={() => setSheet("scanner")} />
              </Suspense>
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
            {sheet === "scanner" && (
              <Suspense fallback={null}>
                <ScannerScreen onClose={() => setSheet(null)} />
              </Suspense>
            )}
          </main>
          <BottomNav active={screen} onNavigate={handleNavigate} />
          {activeSession && screen !== "timer" && (
            <button
              type="button"
              onClick={() => setScreen("timer")}
              className="absolute bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-4 right-4 z-40 bg-primary text-white rounded-2xl py-3.5 px-4 text-base font-semibold shadow-lg mobile-touch"
            >
              Active session · tap to view timer
            </button>
          )}
        </>
      )}
    </AppShell>
  );
}

function ScreenLoader() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#F7F9FC] text-base text-gray-500">
      Loading…
    </div>
  );
}
