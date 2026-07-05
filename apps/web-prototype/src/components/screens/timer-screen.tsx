import { useEffect, useState } from "react";
import { Bell, MapPin, Navigation2 } from "lucide-react";
import { ToggleSwitch } from "@/components/ui/icon-button";
import { Button } from "@/components/ui/button";

const TOTAL_SECONDS = 6120;

export function TimerScreen() {
  const [secs, setSecs] = useState(TOTAL_SECONDS);
  const [reminders, setReminders] = useState([true, true, false]);

  useEffect(() => {
    const id = window.setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, []);

  const hrs = Math.floor(secs / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  const sec = secs % 60;
  const pct = secs / TOTAL_SECONDS;
  const R = 88;
  const C = 2 * Math.PI * R;
  const color = secs > 1800 ? "#22C55E" : secs > 900 ? "#F59E0B" : "#EF4444";
  const cost = (((TOTAL_SECONDS - secs) / 3600) * 4.6).toFixed(2);

  return (
    <section className="flex-1 flex flex-col bg-[#F7F9FC] overflow-hidden" aria-label="Active parking session">
      <header className="bg-white px-5 pt-3 pb-4 border-b border-black/5 flex-shrink-0">
        <h1 className="text-[20px] font-semibold text-[#111827]">Active session</h1>
        <div className="flex items-center gap-2 mt-1">
          <MapPin size={13} className="text-gray-400" aria-hidden="true" />
          <span className="text-[13px] text-gray-500">Little Lonsdale Street, CBD</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="flex flex-col items-center pt-7 pb-5">
          <div className="relative w-[210px] h-[210px]" role="timer" aria-live="polite" aria-label="Time remaining">
            <svg width="210" height="210" viewBox="0 0 210 210" aria-hidden="true">
              <circle cx="105" cy="105" r={R} fill="none" stroke="#EEF1F7" strokeWidth="14" />
              <circle
                cx="105"
                cy="105"
                r={R}
                fill="none"
                stroke={color}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - pct)}
                transform="rotate(-90 105 105)"
                style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                Time remaining
              </div>
              <div
                className="text-[38px] font-bold tabular-nums leading-none"
                style={{ color, fontFamily: "'DM Mono', monospace" }}
              >
                {String(hrs).padStart(2, "0")}:{String(mins).padStart(2, "0")}
              </div>
              <div
                className="text-[15px] tabular-nums mt-1"
                style={{ color, fontFamily: "'DM Mono', monospace", opacity: 0.7 }}
              >
                :{String(sec).padStart(2, "0")}
              </div>
              <div className="text-[12px] text-gray-400 mt-2">Leave by 6:30 pm</div>
            </div>
          </div>
        </div>

        <div className="px-4 grid grid-cols-2 gap-2.5 mb-4">
          {[
            { label: "STARTED", value: "4:48 pm" },
            { label: "VEHICLE", value: "1ABC 123" },
            { label: "PAID SO FAR", value: `$${cost}` },
            { label: "RATE", value: "$4.60/hr" },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-2xl px-4 py-3.5 border border-black/5">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{item.label}</div>
              <div
                className="text-[16px] font-semibold text-[#111827] mt-1"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>

        <div className="mx-4 mb-4 bg-white rounded-2xl p-4 border border-black/5">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Parking rule</div>
          <div className="text-[13px] text-[#111827]">2P Metered · $4.60/hr until 6:30 pm</div>
          <div className="mt-2 text-[12px] text-green-600 font-medium">Unrestricted after 6:30 pm</div>
        </div>

        <div className="mx-4 mb-4 bg-white rounded-2xl p-4 border border-black/5">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Reminders</div>
          <div className="space-y-3">
            {["15 minutes before", "10 minutes before", "5 minutes before"].map((r, i) => (
              <div key={r} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Bell size={14} className="text-gray-400" aria-hidden="true" />
                  <span className="text-[13px] text-[#111827]">{r}</span>
                </div>
                <ToggleSwitch
                  label={r}
                  checked={reminders[i]}
                  onChange={(checked) =>
                    setReminders((prev) => {
                      const next = [...prev];
                      next[i] = checked;
                      return next;
                    })
                  }
                />
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 pb-6 space-y-2.5">
          <Button variant="outline" className="w-full">
            Extend session
          </Button>
          <div className="grid grid-cols-2 gap-2.5">
            <Button variant="secondary" className="gap-2">
              <Navigation2 size={15} aria-hidden="true" /> Navigate back
            </Button>
            <Button variant="destructive">End parking</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
