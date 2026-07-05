import type { Screen } from "@/types/parking";
import { Bookmark, List, Map, Timer, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  active: Screen;
  onNavigate: (screen: Screen) => void;
}

const tabs: { id: Screen; label: string; icon: (active: boolean) => React.ReactNode }[] = [
  { id: "map", label: "Map", icon: (a) => <Map size={22} strokeWidth={a ? 2.5 : 1.8} /> },
  { id: "nearby", label: "Nearby", icon: (a) => <List size={22} strokeWidth={a ? 2.5 : 1.8} /> },
  { id: "saved", label: "Saved", icon: (a) => <Bookmark size={22} strokeWidth={a ? 2.5 : 1.8} /> },
  { id: "timer", label: "Timer", icon: (a) => <Timer size={22} strokeWidth={a ? 2.5 : 1.8} /> },
  { id: "profile", label: "Profile", icon: (a) => <User size={22} strokeWidth={a ? 2.5 : 1.8} /> },
];

export function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <nav
      aria-label="Main navigation"
      className="bg-white border-t flex items-center pt-2 pb-6 px-2 flex-shrink-0 h-[76px]"
      style={{ borderColor: "rgba(0,0,0,0.07)" }}
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
              "flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isActive ? "text-primary" : "text-[#9CA3AF] hover:text-gray-600",
            )}
          >
            {tab.icon(isActive)}
            <span className="text-[10px] font-medium leading-none">{tab.label}</span>
            {isActive && <span className="w-1 h-1 rounded-full bg-primary" aria-hidden="true" />}
          </button>
        );
      })}
    </nav>
  );
}

export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative mx-auto overflow-hidden flex flex-col"
      style={{
        width: 390,
        height: 844,
        borderRadius: 50,
        background: "white",
        boxShadow:
          "0 0 0 10px #1C1C1E, 0 0 0 12px #3A3A3C, 0 40px 100px rgba(0,0,0,0.6), 0 10px 30px rgba(0,0,0,0.4)",
      }}
    >
      <div
        className="absolute inset-0 overflow-hidden flex flex-col"
        style={{ borderRadius: 42 }}
      >
        {children}
      </div>
    </div>
  );
}

export function StatusBar({ light = false }: { light?: boolean }) {
  const c = light ? "text-white" : "text-[#111827]";
  const fill = light ? "white" : "#111827";
  return (
    <div
      className="relative flex items-center justify-between px-5 pt-3 pb-2 h-12"
      aria-hidden="true"
    >
      <span className={`text-[13px] font-semibold ${c}`}>4:48</span>
      <div className="w-28 h-8 rounded-full bg-[#111827] absolute left-1/2 -translate-x-1/2 top-2 pointer-events-none" />
      <div className="flex items-center gap-1.5">
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none" aria-hidden="true">
          <rect x="0" y="4" width="3" height="8" rx="0.8" fill={fill} />
          <rect x="4.5" y="2.5" width="3" height="9.5" rx="0.8" fill={fill} />
          <rect x="9" y="0.5" width="3" height="11.5" rx="0.8" fill={fill} />
          <rect x="13.5" y="0.5" width="3" height="11.5" rx="0.8" fill={fill} opacity="0.3" />
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none" aria-hidden="true">
          <rect x="0.5" y="0.5" width="21" height="11" rx="3" stroke={fill} strokeOpacity="0.35" />
          <rect x="2" y="2" width="17" height="8" rx="2" fill={fill} />
          <path
            d="M23 4.5V7.5C23.8 7.2 24.3 6.7 24.3 6C24.3 5.3 23.8 4.8 23 4.5Z"
            fill={fill}
            fillOpacity="0.4"
          />
        </svg>
      </div>
    </div>
  );
}
