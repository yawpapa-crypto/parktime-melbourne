import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

export function InstallBanner() {
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem("parktime_install_dismissed") === "1") return;

    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/.test(ua);
    setIsIos(ios);
    setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div className="absolute top-0 left-0 right-0 z-[60] px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-lg bg-primary text-white rounded-2xl px-4 py-3 shadow-lg flex items-start gap-3">
        <Download size={20} className="shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold leading-snug">Install for app-like speed</p>
          <p className="text-[13px] text-white/80 mt-0.5 leading-snug">
            {isIos
              ? "Tap Share → Add to Home Screen for full screen and faster loads."
              : "Add to Home Screen from your browser menu for the best experience."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem("parktime_install_dismissed", "1");
            setVisible(false);
          }}
          className="mobile-touch shrink-0 p-1 rounded-lg hover:bg-white/10"
          aria-label="Dismiss install tip"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
