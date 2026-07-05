import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAppStore } from "@/context/app-store";
import { TYPE_HEX } from "@/data/parking";
import { SortChip } from "@/components/ui/filter-pill";
import { EmptyState } from "@/components/ui/states";

const CATEGORIES = ["All", "Work", "Home", "Free parking", "Weekend"];

interface SavedScreenProps {
  onNavigateToMap?: (lat: number, lng: number) => void;
}

export function SavedScreen({ onNavigateToMap }: SavedScreenProps) {
  const { savedPlaces, removeSavedPlace, addSavedPlace, setMapCenter } = useAppStore();
  const [active, setActive] = useState("All");
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [street, setStreet] = useState("");
  const [suburb, setSuburb] = useState("Melbourne");
  const [category, setCategory] = useState("Work");

  const filtered =
    active === "All" ? savedPlaces : savedPlaces.filter((s) => s.category === active);

  const handleAdd = () => {
    if (!label.trim() || !street.trim()) return;
    addSavedPlace({
      label: label.trim(),
      category,
      street: street.trim(),
      suburb: suburb.trim(),
      rule: "Saved location",
      status: "available",
      icon: category === "Home" ? "🏠" : category === "Work" ? "💼" : "📍",
    });
    setAdding(false);
    setLabel("");
    setStreet("");
  };

  const openPlace = (lat?: number, lng?: number) => {
    if (lat != null && lng != null) {
      setMapCenter({ latitude: lat, longitude: lng });
      onNavigateToMap?.(lat, lng);
    }
  };

  return (
    <section className="flex-1 flex flex-col bg-[#F7F9FC] overflow-hidden" aria-label="Saved places">
      <header className="bg-white px-5 pt-3 pb-4 border-b border-black/5">
        <h1 className="text-[20px] font-semibold text-[#111827]">Saved places</h1>
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((c) => (
            <SortChip key={c} label={c} active={active === c} onClick={() => setActive(c)} />
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5 no-scrollbar">
        {filtered.length === 0 ? (
          <EmptyState title="No saved places" description={`Nothing saved under "${active}" yet.`} />
        ) : (
          filtered.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm flex gap-3">
              <button type="button" onClick={() => openPlace(s.latitude, s.longitude)} className="flex-1 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-secondary flex items-center justify-center text-[20px]">{s.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold">{s.label}</div>
                    <div className="text-[12px] text-gray-400 truncate">{s.street}, {s.suburb}</div>
                    <div className="text-[12px] text-gray-600 mt-1">{s.rule ?? "Saved"}</div>
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: TYPE_HEX[s.status] }} />
                </div>
              </button>
              <button type="button" onClick={() => removeSavedPlace(s.id)} aria-label="Remove" className="text-gray-400 hover:text-red-500 p-2">
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}

        <button
          type="button"
          onClick={() => setAdding(true)}
          className="w-full bg-white rounded-2xl p-4 border border-dashed border-black/15 flex items-center justify-center gap-2 text-[14px] font-medium text-gray-400"
        >
          <Plus size={16} /> Add saved place
        </button>
      </div>

      {adding && (
        <div className="absolute inset-0 z-50 flex items-end bg-black/30">
          <div className="w-full bg-white rounded-t-3xl p-5 space-y-3">
            <h3 className="text-[17px] font-semibold">Add saved place</h3>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (e.g. Office)" className="w-full rounded-xl border px-4 py-3 text-[15px]" />
            <input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Street address" className="w-full rounded-xl border px-4 py-3 text-[15px]" />
            <input value={suburb} onChange={(e) => setSuburb(e.target.value)} placeholder="Suburb" className="w-full rounded-xl border px-4 py-3 text-[15px]" />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border px-4 py-3 text-[15px]">
              {CATEGORIES.filter((c) => c !== "All").map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setAdding(false)} className="flex-1 py-3 rounded-xl border">Cancel</button>
              <button type="button" onClick={handleAdd} className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold">Save</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
