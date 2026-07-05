import { Bell, MapPin } from "lucide-react";
import { ToggleSwitch } from "@/components/ui/icon-button";
import { Button } from "@/components/ui/button";

const ONBOARDING_SLIDES = [
  {
    icon: (
      <svg width="88" height="88" viewBox="0 0 88 88" fill="none" aria-hidden="true">
        <rect width="88" height="88" rx="24" fill="#EEF1F7" />
        <rect x="16" y="24" width="56" height="42" rx="7" fill="#1A2744" />
        <rect x="22" y="30" width="44" height="30" rx="4" fill="#3B82F6" opacity="0.45" />
        <circle cx="44" cy="45" r="8" fill="#22C55E" />
        <circle cx="44" cy="45" r="4" fill="white" />
        <circle cx="61" cy="33" r="5.5" fill="#EF4444" />
        <circle cx="27" cy="37" r="4.5" fill="#F59E0B" />
        <circle cx="61" cy="56" r="4.5" fill="#8B5CF6" />
      </svg>
    ),
    title: "Know before you park",
    body: "See the parking rule that applies right now, in plain language.",
  },
  {
    icon: (
      <svg width="88" height="88" viewBox="0 0 88 88" fill="none" aria-hidden="true">
        <rect width="88" height="88" rx="24" fill="#EEF1F7" />
        <rect x="16" y="18" width="56" height="54" rx="7" fill="#1A2744" />
        <rect x="22" y="27" width="44" height="9" rx="3" fill="#22C55E" opacity="0.8" />
        <rect x="22" y="40" width="44" height="9" rx="3" fill="#3B82F6" opacity="0.7" />
        <rect x="22" y="53" width="30" height="9" rx="3" fill="#F59E0B" opacity="0.7" />
        <circle cx="67" cy="57" r="11" fill="#22C55E" />
        <path d="M62 57L65.5 60.5L73 53" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Find longer parking",
    body: "Filter nearby streets by 1P, 2P, 4P, all‑day, free or paid parking.",
  },
  {
    icon: (
      <svg width="88" height="88" viewBox="0 0 88 88" fill="none" aria-hidden="true">
        <rect width="88" height="88" rx="24" fill="#EEF1F7" />
        <circle cx="44" cy="42" r="26" fill="#1A2744" />
        <circle cx="44" cy="42" r="20" fill="#1A2744" stroke="#22C55E" strokeWidth="3" strokeDasharray="10 5" />
        <text x="44" y="47" textAnchor="middle" fill="white" fontSize="15" fontWeight="700" fontFamily="'DM Mono', monospace">1:42</text>
        <circle cx="44" cy="68" r="6" fill="#F59E0B" />
        <path d="M42 67.5L44 65L46 67.5M44 65V71" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Leave on time",
    body: "Start a parking timer and receive reminders before your period ends.",
  },
];

interface OnboardingScreenProps {
  step: number;
  onNext: () => void;
  onSkip: () => void;
}

export function OnboardingScreen({ step, onNext, onSkip }: OnboardingScreenProps) {
  const slide = ONBOARDING_SLIDES[step];
  const isLast = step === 2;

  return (
    <section className="flex flex-col h-full bg-white" aria-label="Onboarding">
      <div className="flex justify-end px-5 pt-2">
        <button
          type="button"
          onClick={onSkip}
          className="text-[14px] text-gray-400 font-medium py-2 px-1 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          Skip
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-7">
        <div className="flex gap-2 mb-1" role="tablist" aria-label="Onboarding progress">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              role="tab"
              aria-selected={i === step}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === step ? 26 : 8,
                height: 8,
                background: i === step ? "#1A2744" : "#E5E7EB",
              }}
            />
          ))}
        </div>
        {slide.icon}
        <div className="text-center space-y-3">
          <h1 className="text-[26px] font-semibold text-[#111827] leading-tight">{slide.title}</h1>
          <p className="text-[15px] text-gray-500 leading-relaxed">{slide.body}</p>
        </div>
        {isLast && (
          <div className="w-full space-y-2.5 mt-1">
            {[
              { icon: <MapPin size={17} className="text-primary" aria-hidden="true" />, title: "Allow location access", sub: "Required to find parking near you", defaultOn: true },
              { icon: <Bell size={17} className="text-primary" aria-hidden="true" />, title: "Enable notifications", sub: "Reminders before your time expires", defaultOn: true },
            ].map((row) => (
              <div key={row.title} className="flex items-center gap-3 bg-[#F7F9FC] rounded-2xl px-4 py-3.5">
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">{row.icon}</div>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-[#111827]">{row.title}</div>
                  <div className="text-[11px] text-gray-400">{row.sub}</div>
                </div>
                <ToggleSwitch checked={row.defaultOn} onChange={() => {}} label={row.title} />
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="px-6 pb-10">
        <Button size="lg" onClick={onNext}>
          {isLast ? "Get started" : "Continue"}
        </Button>
      </div>
    </section>
  );
}
