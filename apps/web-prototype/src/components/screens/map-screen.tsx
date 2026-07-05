import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  LocateFixed,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { LiveMapboxMap, type MapCenter } from "@/components/parking/live-mapbox-map";
import { IconButton } from "@/components/ui/icon-button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { api, type NearbyBay, type SearchResult } from "@/services/api";
import { SUBURB_PRESETS } from "@/config/suburb-presets";

const MELBOURNE = { latitude: -37.8136, longitude: 144.9631 };

interface MapScreenProps {
  onOpenFilter: () => void;
  sheetOpen: boolean;
  setSheetOpen: (open: boolean) => void;
}

function bayBadgeLabel(bay: NearbyBay): string {
  const rule = bay.rule.currentRule.split(" · ")[0] ?? "Parking";
  return rule.length > 18 ? `${rule.slice(0, 16)}…` : rule;
}

export function MapScreen({ onOpenFilter, sheetOpen, setSheetOpen }: MapScreenProps) {
  const sessionToken = useRef(String(Date.now()));
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [destination, setDestination] = useState<MapCenter | null>(null);
  const [bays, setBays] = useState<NearbyBay[]>([]);
  const [selected, setSelected] = useState<NearbyBay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const center = useMemo(
    () => destination ?? MELBOURNE,
    [destination?.latitude, destination?.longitude],
  );

  const loadNearby = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.nearby({ latitude: lat, longitude: lng, radius: 800 });
      setBays(res.results);
      if (!res.results.length) setSelected(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(
        msg.includes("Failed to fetch") || msg.includes("ECONNREFUSED")
          ? "Cannot reach the API — run npm run dev:backend in another terminal."
          : msg,
      );
      setBays([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNearby(center.latitude, center.longitude);
  }, [center.latitude, center.longitude, loadNearby]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      try {
        const res = await api.search(query.trim(), sessionToken.current);
        setSuggestions(res.results);
        if (res.error) setError(res.error);
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const selectPlace = async (place: SearchResult) => {
    setQuery(place.placeFormatted || place.name);
    setSuggestions([]);
    let target = place;
    try {
      const res = await api.retrieve(place.id, sessionToken.current);
      if (res.results[0]) target = res.results[0];
      sessionToken.current = String(Date.now());
    } catch {
      // suggest-only coords are ok for some result types
    }
    setDestination({ latitude: target.latitude, longitude: target.longitude });
    setSheetOpen(true);
    await loadNearby(target.latitude, target.longitude);
  };

  const locateMe = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setDestination({ latitude: lat, longitude: lng });
        setSheetOpen(true);
        await loadNearby(lat, lng);
        setLocating(false);
      },
      () => {
        setError("Location permission denied.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const previewBays = bays.filter((b) => b.rule.canPark).slice(0, 3);

  return (
    <section className="relative flex-1 overflow-hidden" aria-label="Map">
      <div className="absolute inset-0 z-0">
        <LiveMapboxMap
          center={center}
          bays={bays}
          selectedId={selected?.id ?? null}
          onSelectBay={(bay) => {
            setSelected(bay);
            setSheetOpen(true);
          }}
          className="h-full w-full"
        />
      </div>

      <div className="absolute top-0 left-0 right-0 px-4 pt-2 pb-3 z-50 pointer-events-none">
        <div className="flex gap-2 items-center pointer-events-auto">
          <div
            role="search"
            className="flex-1 flex items-center gap-2.5 bg-white rounded-2xl px-4 py-3 shadow-sm border border-black/5"
          >
            <Search size={16} className="text-gray-400 shrink-0 pointer-events-none" aria-hidden="true" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search street, suburb or destination"
              className="flex-1 min-w-0 text-[14px] text-[#111827] placeholder:text-gray-400 bg-transparent outline-none border-none"
              aria-label="Search destination"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {query ? (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
                <X size={14} className="text-gray-400" />
              </button>
            ) : null}
          </div>
          <IconButton label="Open filters" onClick={onOpenFilter}>
            <SlidersHorizontal size={18} className="text-primary" />
          </IconButton>
        </div>

        {suggestions.length > 0 && (
          <div className="mt-2 bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden max-h-48 overflow-y-auto pointer-events-auto">
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-black/5 last:border-0"
                onClick={() => selectPlace(s)}
              >
                <div className="text-[14px] font-semibold text-[#111827]">{s.name}</div>
                <div className="text-[12px] text-gray-500">{s.placeFormatted}</div>
              </button>
            ))}
          </div>
        )}

        <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto">
          {SUBURB_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setQuery(preset.query);
                setDestination({ latitude: preset.latitude, longitude: preset.longitude });
                setSheetOpen(true);
                void loadNearby(preset.latitude, preset.longitude);
              }}
              className="shrink-0 rounded-full bg-white/95 border border-black/10 px-3 py-1.5 text-[12px] font-semibold text-primary shadow-sm"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="absolute right-4 top-[72px] z-10 flex flex-col gap-2">
        <IconButton label="Locate me" onClick={locateMe}>
          <LocateFixed size={18} className={`text-primary ${locating ? "animate-pulse" : ""}`} />
        </IconButton>
      </div>

      {selected && (
        <div className="absolute left-4 right-4 top-[120px] z-10 bg-white rounded-2xl shadow-lg border border-black/5 p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-[15px] font-semibold text-[#111827] leading-snug">
                {selected.streetDescription}
              </h2>
              <p className="text-[12px] text-gray-500 mt-0.5">
                {selected.suburb ?? "Melbourne"} · {selected.distanceMetres} m
              </p>
            </div>
            <button type="button" onClick={() => setSelected(null)} aria-label="Close detail">
              <X size={16} className="text-gray-400" />
            </button>
          </div>
          <span
            className="inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{
              background: selected.rule.canPark
                ? selected.rule.paymentRequired
                  ? "#DBEAFE"
                  : "#DCFCE7"
                : "#FEE2E2",
              color: selected.rule.canPark
                ? selected.rule.paymentRequired
                  ? "#1D4ED8"
                  : "#15803D"
                : "#B91C1C",
            }}
          >
            {bayBadgeLabel(selected)}
          </span>
          <p className="text-[12px] text-gray-600">{selected.rule.currentRule}</p>
          {selected.rule.leaveBy && (
            <p className="text-[13px] font-semibold text-primary">Leave by {selected.rule.leaveBy}</p>
          )}
          <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            Always check the physical parking sign before leaving your vehicle.
          </p>
        </div>
      )}

      <div
        className="absolute left-0 right-0 bottom-0 z-20 transition-all duration-300"
        style={{ height: sheetOpen ? "55%" : "100px" }}
      >
        <div className="h-full bg-white rounded-t-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden">
          <button
            type="button"
            className="pt-3 pb-2 flex flex-col items-center gap-2 flex-shrink-0 w-full hover:bg-gray-50"
            onClick={() => setSheetOpen(!sheetOpen)}
            aria-expanded={sheetOpen}
          >
            <div className="w-10 h-1 rounded-full bg-gray-200" />
            <div className="px-5 flex items-center justify-between w-full">
              <span className="text-[14px] font-semibold text-[#111827]">Parking near you</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] text-gray-400">
                  {loading ? "…" : `${bays.length} results`}
                </span>
                {sheetOpen ? (
                  <ChevronDown size={16} className="text-gray-400" />
                ) : (
                  <ChevronUp size={16} className="text-gray-400" />
                )}
              </div>
            </div>
          </button>

          {loading ? (
            <LoadingState message="Finding parking within 500 m…" className="px-4" />
          ) : error ? (
            <ErrorState message={error} onRetry={() => loadNearby(center.latitude, center.longitude)} />
          ) : bays.length === 0 ? (
            <EmptyState
              title="No parking found"
              description="Try searching another Melbourne street or destination."
              className="px-4"
            />
          ) : !sheetOpen ? (
            <div className="px-5 pb-3 flex gap-2.5 overflow-x-auto no-scrollbar">
              {previewBays.map((bay) => (
                <button
                  key={bay.id}
                  type="button"
                  onClick={() => {
                    setSelected(bay);
                    setSheetOpen(true);
                  }}
                  className="shrink-0 bg-[#F7F9FC] rounded-2xl px-3.5 py-3 border border-black/5 text-left min-w-[160px]"
                >
                  <div className="text-[12px] font-semibold truncate">{bay.streetDescription}</div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    {bay.distanceMetres} m · {bay.rule.leaveBy ?? bay.rule.currentRule}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 no-scrollbar">
              {bays.map((bay) => (
                <button
                  key={bay.id}
                  type="button"
                  onClick={() => setSelected(bay)}
                  className={`w-full text-left bg-[#F7F9FC] rounded-2xl p-3.5 border transition-all ${
                    selected?.id === bay.id ? "border-primary ring-2 ring-primary/20" : "border-black/5"
                  }`}
                >
                  <div className="text-[14px] font-semibold text-[#111827]">{bay.streetDescription}</div>
                  <div className="text-[12px] text-gray-500 mt-1">
                    {bay.suburb ?? "Melbourne"} · {bay.distanceMetres} m
                  </div>
                  <div className="text-[12px] text-primary mt-1 font-medium">
                    {bay.rule.leaveBy ? `Leave by ${bay.rule.leaveBy}` : bay.rule.currentRule}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
