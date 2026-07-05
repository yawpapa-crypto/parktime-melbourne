import { useState } from "react";
import { X } from "lucide-react";
import { useAppStore } from "@/context/app-store";
import type { ParkingFilters } from "@/types/app";
import { DEFAULT_FILTERS } from "@/types/app";
import { FilterPill } from "@/components/ui/filter-pill";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";

interface FilterSheetProps {
  onClose: () => void;
}

function toggle(arr: string[], value: string) {
  return arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
}

export function FilterSheet({ onClose }: FilterSheetProps) {
  const { filters, setFilters } = useAppStore();
  const [draft, setDraft] = useState<ParkingFilters>(filters);

  const apply = () => {
    setFilters(draft);
    onClose();
  };

  const clearFilters = () => setDraft(DEFAULT_FILTERS);

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-black/30" aria-label="Close filters" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90%]">
        <header className="pt-3 px-5 pb-4 border-b border-black/5 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold text-[#111827] pt-4">Filter parking</h2>
          <IconButton label="Close filters" size="sm" onClick={onClose} className="w-8 h-8 mt-4">
            <X size={15} className="text-gray-500" />
          </IconButton>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6 no-scrollbar">
          <fieldset>
            <legend className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Duration</legend>
            <div className="flex flex-wrap gap-2">
              {["15 min", "30 min", "1P", "2P", "4P", "All day", "Unrestricted"].map((d) => (
                <FilterPill key={d} label={d} active={draft.duration.includes(d)} onToggle={() => setDraft((p) => ({ ...p, duration: toggle(p.duration, d) }))} />
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Cost</legend>
            <div className="flex gap-2">
              {(["free", "paid", "any"] as const).map((c) => (
                <FilterPill key={c} label={c === "any" ? "Any" : c.charAt(0).toUpperCase() + c.slice(1)} active={draft.cost === c} onToggle={() => setDraft((p) => ({ ...p, cost: c }))} />
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Parking type</legend>
            <div className="flex flex-wrap gap-2">
              {["General", "Accessible", "Loading", "Motorcycle", "Electric vehicle", "Permit zone"].map((t) => (
                <FilterPill key={t} label={t} active={draft.parkTypes.includes(t)} onToggle={() => setDraft((p) => ({ ...p, parkTypes: toggle(p.parkTypes, t) }))} />
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Availability</legend>
            <div className="flex flex-wrap gap-2">
              {(["available", "sensor", "all"] as const).map((a) => (
                <FilterPill
                  key={a}
                  label={a === "available" ? "Available now" : a === "sensor" ? "Sensor confirmed" : "Show all"}
                  active={draft.availability === a}
                  onToggle={() => setDraft((p) => ({ ...p, availability: a }))}
                />
              ))}
            </div>
          </fieldset>
        </div>

        <footer className="px-5 pb-8 pt-3 space-y-2.5 border-t border-black/5">
          <Button size="lg" onClick={apply}>Show parking</Button>
          <button type="button" onClick={clearFilters} className="w-full py-3 text-[14px] font-medium text-gray-500">Clear filters</button>
        </footer>
      </div>
    </div>
  );
}
