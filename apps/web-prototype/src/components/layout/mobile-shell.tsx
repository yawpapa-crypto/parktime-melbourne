import type { Screen } from "@/types/parking";
import { Bookmark, List, Map, Timer, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  active: Screen;
  onNavigate: (screen: Screen) => void;
}

const tabs: { id: Screen; label: string; icon: (active: boolean) => React.ReactNode }[] = [
  { id: "map", label: "Map", icon: (a) => <Map size={26} strokeWidth={a ? 2.5 : 1.8} /> },
  { id: "nearby", label: "Nearby", icon: (a) => <List size={26} strokeWidth={a ? 2.5 : 1.8} /> },
  { id: "saved", label: "Saved", icon: (a) => <Bookmark size={26} strokeWidth={a ? 2.5 : 1.8} /> },
  { id: "timer", label: "Timer", icon: (a) => <Timer size={26} strokeWidth={a ? 2.5 : 1.8} /> },
  { id: "profile", label: "Profile", icon: (a) => <User size={26} strokeWidth={a ? 2.5 : 1.8} /> },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 flex flex-col bg-white overflow-hidden supports-[height:100dvh]:h-[100dvh] h-screen w-screen">
      {children}
    </div>
  );
}

/** @deprecated Demo-only frame; use AppShell for production/mobile. */
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

export function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <nav
      aria-label="Main navigation"
      className="bg-white border-t flex items-center pt-2 px-2 flex-shrink-0"
      style={{
        borderColor: "rgba(0,0,0,0.07)",
        paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
      }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onNavigate(tab.id)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all mobile-touch",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isActive ? "text-primary" : "text-[#9CA3AF] hover:text-gray-600",
            )}
          >
            {tab.icon(isActive)}
            <span className="text-xs font-semibold leading-none sm:text-[10px]">{tab.label}</span>
            {isActive && <span className="w-1 h-1 rounded-full bg-primary" aria-hidden="true" />}
          </button>
        );
      })}
    </nav>
  );
}

