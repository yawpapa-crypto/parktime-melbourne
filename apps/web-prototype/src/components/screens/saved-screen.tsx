import { useState } from "react";
import { Plus } from "lucide-react";
import { SAVED_PLACES } from "@/data/parking";
import { TYPE_HEX } from "@/data/parking";
import { SortChip } from "@/components/ui/filter-pill";
import { EmptyState } from "@/components/ui/states";

const CATEGORIES = ["All", "Work", "Home", "Free parking", "Weekend"];

export function SavedScreen() {
  const [active, setActive] = useState("All");
  const filtered =
    active === "All" ? SAVED_PLACES : SAVED_PLACES.filter((s) => s.cat === active);

  return (
    <section className="flex-1 flex flex-col bg-[#F7F9FC] overflow-hidden" aria-label="Saved places">
      <header className="bg-white px-5 pt-3 pb-4 border-b border-black/5 flex-shrink-0">
        <h1 className="text-[20px] font-semibold text-[#111827]">Saved places</h1>
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar" role="toolbar" aria-label="Filter categories">
          {CATEGORIES.map((c) => (
            <SortChip key={c} label={c} active={active === c} onClick={() => setActive(c)} />
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5 no-scrollbar">
        {filtered.length === 0 ? (
          <EmptyState
            title="No saved places"
            description={`Nothing saved under "${active}" yet.`}
            action={
              <button
                type="button"
                className="mt-2 text-[14px] font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-2"
              >
                Add a saved place
              </button>
            }
          />
        ) : (
          filtered.map((s) => (
            <button
              key={s.label}
              type="button"
              className="w-full bg-white rounded-2xl p-4 text-left border border-black/5 shadow-sm hover:border-primary/20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-gray-50 transition-all"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-secondary flex items-center justify-center text-[20px] flex-shrink-0" aria-hidden="true">
                  {s.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="text-[14px] font-semibold text-[#111827]">{s.label}</div>
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 ml-2"
                      style={{ background: TYPE_HEX[s.status] }}
                      aria-label={`Status: ${s.status}`}
                    />
                  </div>
                  <div className="text-[12px] text-gray-400 mt-0.5 truncate">
                    {s.street}, {s.suburb}
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[12px] text-gray-600">{s.rule}</span>
                    <span className="text-[11px] text-gray-400">{s.dist}</span>
                  </div>
                </div>
              </div>
            </button>
          ))
        )}

        <button
          type="button"
          className="w-full bg-white rounded-2xl p-4 border border-dashed border-black/15 flex items-center justify-center gap-2 text-[14px] font-medium text-gray-400 hover:text-primary hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-gray-50 transition-all"
        >
          <Plus size={16} aria-hidden="true" /> Add saved place
        </button>
      </div>
    </section>
  );
}
