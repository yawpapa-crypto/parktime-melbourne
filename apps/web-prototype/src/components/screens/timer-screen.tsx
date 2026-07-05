import { useEffect, useMemo, useState } from "react";
import { Bell, MapPin, Navigation2 } from "lucide-react";
import { useAppStore } from "@/context/app-store";
import { ToggleSwitch } from "@/components/ui/icon-button";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";

export function TimerScreen() {
  const { activeSession, endSession, extendSession, updateSessionReminders } = useAppStore();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const secs = useMemo(() => {
    if (!activeSession) return 0;
    return Math.max(0, Math.floor((new Date(activeSession.expectedEndAt).getTime() - now) / 1000));
  }, [activeSession, now]);

  if (!activeSession) {
    return (
      <section className="flex-1 flex flex-col bg-[#F7F9FC]">
        <EmptyState
          title="No active session"
          description="Start a parking timer from a bay on the map or nearby list."
          className="flex-1"
        />
      </section>
    );
  }

  const totalSecs = Math.max(
    1,
    Math.floor(
      (new Date(activeSession.expectedEndAt).getTime() - new Date(activeSession.startedAt).getTime()) / 1000,
    ),
  );
  const hrs = Math.floor(secs / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  const pct = secs / totalSecs;
  const R = 88;
  const C = 2 * Math.PI * R;
  const color = secs > 1800 ? "#22C55E" : secs > 900 ? "#F59E0B" : "#EF4444";
  const leaveBy = new Date(activeSession.expectedEndAt).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const started = new Date(activeSession.startedAt).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const elapsedHrs = (totalSecs - secs) / 3600;
  const cost = activeSession.paymentRequired
    ? ((activeSession.estimatedCost ?? 4.6) * (elapsedHrs / (totalSecs / 3600))).toFixed(2)
    : "0.00";

  const navigate = () => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${activeSession.latitude},${activeSession.longitude}`,
      "_blank",
    );
  };

  return (
    <section className="flex-1 flex flex-col bg-[#F7F9FC] overflow-hidden" aria-label="Active parking session">
      <header className="bg-white px-5 pt-3 pb-4 border-b border-black/5">
        <h1 className="text-[20px] font-semibold text-[#111827]">Active session</h1>
        <div className="flex items-center gap-2 mt-1">
          <MapPin size={13} className="text-gray-400" />
          <span className="text-[13px] text-gray-500">{activeSession.streetDescription}</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="flex flex-col items-center pt-7 pb-5">
          <div className="relative w-[210px] h-[210px]">
            <svg width="210" height="210" viewBox="0 0 210 210">
              <circle cx="105" cy="105" r={R} fill="none" stroke="#EEF1F7" strokeWidth="14" />
              <circle cx="105" cy="105" r={R} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)} transform="rotate(-90 105 105)" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-[38px] font-bold tabular-nums" style={{ color, fontFamily: "'DM Mono', monospace" }}>
                {String(hrs).padStart(2, "0")}:{String(mins).padStart(2, "0")}
              </div>
              <div className="text-[12px] text-gray-400 mt-2">Leave by {leaveBy}</div>
            </div>
          </div>
        </div>

        <div className="px-4 grid grid-cols-2 gap-2.5 mb-4">
          {[
            { label: "STARTED", value: started },
            { label: "VEHICLE", value: activeSession.vehicleRegistration },
            { label: "PAID SO FAR", value: `$${cost}` },
            { label: "RATE", value: activeSession.paymentRequired ? "Metered" : "Free" },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-2xl px-4 py-3.5 border border-black/5">
              <div className="text-[10px] font-semibold text-gray-400 uppercase">{item.label}</div>
              <div className="text-[16px] font-semibold mt-1" style={{ fontFamily: "'DM Mono', monospace" }}>{item.value}</div>
            </div>
          ))}
        </div>

        <div className="mx-4 mb-4 bg-white rounded-2xl p-4 border border-black/5">
          <div className="text-[11px] font-semibold text-gray-400 uppercase mb-2">Parking rule</div>
          <div className="text-[13px]">{activeSession.currentRule}</div>
        </div>

        <div className="mx-4 mb-4 bg-white rounded-2xl p-4 border border-black/5">
          <div className="text-[11px] font-semibold text-gray-400 uppercase mb-3">Reminders</div>
          <div className="space-y-3">
            {["15 minutes before", "10 minutes before", "5 minutes before"].map((r, i) => (
              <div key={r} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Bell size={14} className="text-gray-400" />
                  <span className="text-[13px]">{r}</span>
                </div>
                <ToggleSwitch
                  label={r}
                  checked={activeSession.reminders[i] ?? false}
                  onChange={(checked) => {
                    const next = [...activeSession.reminders];
                    next[i] = checked;
                    updateSessionReminders(next);
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 pb-6 space-y-2.5">
          <Button variant="outline" className="w-full" onClick={() => void extendSession(30)}>
            Extend 30 minutes
          </Button>
          <div className="grid grid-cols-2 gap-2.5">
            <Button variant="secondary" className="gap-2" onClick={navigate}>
              <Navigation2 size={15} /> Navigate back
            </Button>
            <Button variant="destructive" onClick={() => void endSession()}>
              End parking
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
