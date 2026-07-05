import { useState } from "react";
import { X } from "lucide-react";
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
  const [duration, setDuration] = useState<string[]>([]);
  const [cost, setCost] = useState("any");
  const [parkType, setParkType] = useState<string[]>([]);
  const [avail, setAvail] = useState("Show all");

  const clearFilters = () => {
    setDuration([]);
    setCost("any");
    setParkType([]);
    setAvail("Show all");
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end" role="dialog" aria-modal="true" aria-labelledby="filter-title">
      <button type="button" className="absolute inset-0 bg-black/30" aria-label="Close filters" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90%]">
        <header className="pt-3 px-5 pb-4 border-b border-black/5 flex items-center justify-between flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200 absolute top-3 left-1/2 -translate-x-1/2" />
          <h2 id="filter-title" className="text-[17px] font-semibold text-[#111827] pt-4">
            Filter parking
          </h2>
          <IconButton label="Close filters" size="sm" onClick={onClose} className="w-8 h-8 mt-4">
            <X size={15} className="text-gray-500" />
          </IconButton>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6 no-scrollbar">
          <fieldset>
            <legend className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Duration</legend>
            <div className="flex flex-wrap gap-2">
              {["15 min", "30 min", "1P", "2P", "4P", "All day", "Unrestricted"].map((d) => (
                <FilterPill key={d} label={d} active={duration.includes(d)} onToggle={() => setDuration(toggle(duration, d))} />
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Cost</legend>
            <div className="flex gap-2">
              {["Free", "Paid", "Any"].map((c) => (
                <FilterPill key={c} label={c} active={cost === c.toLowerCase()} onToggle={() => setCost(c.toLowerCase())} />
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Parking type</legend>
            <div className="flex flex-wrap gap-2">
              {["General", "Accessible", "Loading", "Motorcycle", "Electric vehicle", "Permit zone"].map((t) => (
                <FilterPill key={t} label={t} active={parkType.includes(t)} onToggle={() => setParkType(toggle(parkType, t))} />
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Availability</legend>
            <div className="flex flex-wrap gap-2">
              {["Available now", "Sensor confirmed", "Show all"].map((a) => (
                <FilterPill key={a} label={a} active={avail === a} onToggle={() => setAvail(a)} />
              ))}
            </div>
          </fieldset>
        </div>

        <footer className="px-5 pb-8 pt-3 space-y-2.5 border-t border-black/5 flex-shrink-0">
          <Button size="lg" onClick={onClose}>
            Show parking
          </Button>
          <button
            type="button"
            onClick={clearFilters}
            className="w-full py-3 rounded-2xl text-[14px] font-medium text-gray-500 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Clear filters
          </button>
        </footer>
      </div>
    </div>
  );
}
