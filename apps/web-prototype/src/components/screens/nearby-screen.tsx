import { useCallback, useEffect, useState } from "react";
import { api, type NearbyBay } from "@/services/api";
import { useAppStore } from "@/context/app-store";
import { applyClientFilters, filtersToApiParams, sortBays, type SortOption } from "@/lib/filters";
import { SortChip } from "@/components/ui/filter-pill";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";

interface NearbyScreenProps {
  onSelectBay: (bay: NearbyBay) => void;
}

const SORT_OPTIONS: SortOption[] = ["Closest", "Longest parking", "Cheapest", "Most available"];

export function NearbyScreen({ onSelectBay }: NearbyScreenProps) {
  const { filters, mapCenter, setMapCenter } = useAppStore();
  const [sort, setSort] = useState<SortOption>("Closest");
  const [bays, setBays] = useState<NearbyBay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let lat = mapCenter.latitude;
      let lng = mapCenter.longitude;
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 }),
          );
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
          setMapCenter({ latitude: lat, longitude: lng });
        } catch {
          // use map center
        }
      }
      const res = await api.nearby({ latitude: lat, longitude: lng, radius: 800, ...filtersToApiParams(filters) });
      setBays(applyClientFilters(res.results, filters));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBays([]);
    } finally {
      setLoading(false);
    }
  }, [filters, mapCenter.latitude, mapCenter.longitude, setMapCenter]);

  useEffect(() => {
    void load();
  }, [load]);

  const sorted = sortBays(bays, sort);

  return (
    <section className="flex-1 flex flex-col bg-[#F7F9FC] overflow-hidden" aria-label="Nearby parking">
      <header className="bg-white px-5 pt-3 pb-4 border-b border-black/5 flex-shrink-0">
        <h1 className="text-[20px] font-semibold text-[#111827]">Nearby parking</h1>
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          {SORT_OPTIONS.map((s) => (
            <SortChip key={s} label={s} active={sort === s} onClick={() => setSort(s)} />
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5 no-scrollbar">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : sorted.length === 0 ? (
          <EmptyState title="No parking found" description="Try adjusting filters or search another area on the map." />
        ) : (
          sorted.map((bay) => (
            <button
              key={bay.id}
              type="button"
              onClick={() => onSelectBay(bay)}
              className="w-full bg-white rounded-2xl p-4 text-left border border-black/5 shadow-sm hover:border-primary/20"
            >
              <div className="text-[14px] font-semibold text-[#111827]">{bay.streetDescription}</div>
              <div className="text-[12px] text-gray-500 mt-1">
                {bay.suburb ?? "Melbourne"} · {bay.distanceMetres} m
              </div>
              <div className="text-[12px] text-primary mt-1 font-medium">
                {bay.rule.leaveBy ? `Leave by ${bay.rule.leaveBy}` : bay.rule.currentRule}
              </div>
            </button>
          ))
        )}
      </div>
    </section>
  );
}
