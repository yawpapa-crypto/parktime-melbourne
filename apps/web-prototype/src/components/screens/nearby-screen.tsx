import { useEffect, useState } from "react";
import { SPOTS } from "@/data/parking";
import { ParkingSpotListRow } from "@/components/parking/parking-spot-card";
import { SortChip } from "@/components/ui/filter-pill";
import { EmptyState, LoadingState } from "@/components/ui/states";

interface NearbyScreenProps {
  onSelectSpot: (id: number) => void;
}

const SORT_OPTIONS = ["Closest", "Longest parking", "Cheapest", "Most available"];

export function NearbyScreen({ onSelectSpot }: NearbyScreenProps) {
  const [sort, setSort] = useState("Closest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 500);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <section className="flex-1 flex flex-col bg-[#F7F9FC] overflow-hidden" aria-label="Nearby parking">
      <header className="bg-white px-5 pt-3 pb-4 border-b border-black/5 flex-shrink-0">
        <h1 className="text-[20px] font-semibold text-[#111827]">Nearby parking</h1>
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar" role="toolbar" aria-label="Sort options">
          {SORT_OPTIONS.map((s) => (
            <SortChip key={s} label={s} active={sort === s} onClick={() => setSort(s)} />
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5 no-scrollbar">
        {loading ? (
          <LoadingState />
        ) : SPOTS.length === 0 ? (
          <EmptyState
            title="No parking found"
            description="Try adjusting your filters or search in a different area."
          />
        ) : (
          SPOTS.map((s) => (
            <ParkingSpotListRow key={s.id} spot={s} onClick={() => onSelectSpot(s.id)} />
          ))
        )}
      </div>
    </section>
  );
}
