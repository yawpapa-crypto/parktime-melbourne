import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  LocateFixed,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { api, type NearbyBay, type SearchResult } from "@/services/api";
import { SUBURB_PRESETS } from "@/config/suburb-presets";
import { useAppStore } from "@/context/app-store";
import { applyClientFilters, filtersToApiParams } from "@/lib/filters";
import { getCachedSearch, setCachedSearch } from "@/lib/search-cache";
import type { MapCenter } from "@/components/parking/live-mapbox-map";

const LiveMapboxMap = lazy(() =>
  import("@/components/parking/live-mapbox-map").then((m) => ({ default: m.LiveMapboxMap })),
);

const MELBOURNE = { latitude: -37.8136, longitude: 144.9631 };

interface MapScreenProps {
  onOpenFilter: () => void;
  sheetOpen: boolean;
  setSheetOpen: (open: boolean) => void;
  onSelectBay: (bay: NearbyBay) => void;
}

function bayBadgeLabel(bay: NearbyBay): string {
  const rule = bay.rule.currentRule.split(" · ")[0] ?? "Parking";
  return rule.length > 18 ? `${rule.slice(0, 16)}…` : rule;
}

export function MapScreen({ onOpenFilter, sheetOpen, setSheetOpen, onSelectBay }: MapScreenProps) {
  const { filters, setMapCenter } = useAppStore();
  const sessionToken = useRef(crypto.randomUUID?.() ?? String(Date.now()));
  const skipSuggestRef = useRef(false);
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [resolvingPlace, setResolvingPlace] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [destination, setDestination] = useState<MapCenter | null>(null);
  const [bays, setBays] = useState<NearbyBay[]>([]);
  const [selected, setSelected] = useState<NearbyBay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const searchAbortRef = useRef<AbortController | null>(null);
  const nearbyAbortRef = useRef<AbortController | null>(null);
  const [locationReady, setLocationReady] = useState(false);

  const center = useMemo(
    () => destination ?? MELBOURNE,
    [destination?.latitude, destination?.longitude],
  );

  const loadNearby = useCallback(async (lat: number, lng: number) => {
    nearbyAbortRef.current?.abort();
    const ac = new AbortController();
    nearbyAbortRef.current = ac;
    setLoading(true);
    setError(null);
    try {
      const res = await api.nearby(
        {
          latitude: lat,
          longitude: lng,
          radius: 600,
          ...filtersToApiParams(filters),
        },
        ac.signal,
      );
      if (ac.signal.aborted) return;
      setBays(applyClientFilters(res.results, filters));
      if (!res.results.length) setSelected(null);
    } catch (e) {
      if (ac.signal.aborted) return;
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
  }, [filters]);

  // Prefer cached GPS location on mobile — avoids loading Melbourne first
  useEffect(() => {
    let done = false;
    const finish = (lat: number, lng: number) => {
      if (done) return;
      done = true;
      setDestination({ latitude: lat, longitude: lng });
      setLocationReady(true);
    };

    const fallback = setTimeout(() => finish(MELBOURNE.latitude, MELBOURNE.longitude), 2800);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(fallback);
          finish(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          clearTimeout(fallback);
          finish(MELBOURNE.latitude, MELBOURNE.longitude);
        },
        { enableHighAccuracy: false, timeout: 2500, maximumAge: 300_000 },
      );
    } else {
      clearTimeout(fallback);
      finish(MELBOURNE.latitude, MELBOURNE.longitude);
    }

    return () => clearTimeout(fallback);
  }, []);

  useEffect(() => {
    if (!locationReady) return;
    loadNearby(center.latitude, center.longitude);
  }, [locationReady, center.latitude, center.longitude, loadNearby]);

  useEffect(() => {
    if (skipSuggestRef.current) {
      skipSuggestRef.current = false;
      return;
    }
    if (query.trim().length < 2) {
      setSuggestions([]);
      setSearchLoading(false);
      return;
    }

    const trimmed = query.trim();
    const cached = getCachedSearch(trimmed);
    if (cached) {
      setSuggestions(cached);
      setSearchLoading(false);
    } else {
      setSearchLoading(true);
    }

    searchAbortRef.current?.abort();
    const ac = new AbortController();
    searchAbortRef.current = ac;

    const timer = window.setTimeout(async () => {
      try {
        const res = await api.search(trimmed, sessionToken.current, ac.signal);
        if (ac.signal.aborted) return;
        setSuggestions(res.results);
        setCachedSearch(trimmed, res.results);
        if (res.error) setError(res.error);
      } catch (e) {
        if (ac.signal.aborted) return;
        setSuggestions([]);
      } finally {
        if (!ac.signal.aborted) setSearchLoading(false);
      }
    }, 350);
    return () => {
      window.clearTimeout(timer);
      ac.abort();
    };
  }, [query]);

  const goToCoordinates = useCallback(
    async (latitude: number, longitude: number) => {
      setDestination({ latitude, longitude });
      setSelected(null);
      setSheetOpen(true);
      await loadNearby(latitude, longitude);
    },
    [loadNearby, setSheetOpen],
  );

  const selectPlace = async (place: SearchResult) => {
    skipSuggestRef.current = true;
    setSearchFocused(false);
    setSuggestions([]);
    setQuery(place.name);
    setResolvingPlace(true);
    setError(null);

    try {
      const res = await api.retrieve(place.id, sessionToken.current);
      const target = res.results[0];
      if (
        target?.latitude == null ||
        target?.longitude == null ||
        Number.isNaN(target.latitude) ||
        Number.isNaN(target.longitude)
      ) {
        throw new Error("No coordinates returned for this place");
      }

      sessionToken.current = crypto.randomUUID?.() ?? String(Date.now());
      setMapCenter({ latitude: target.latitude, longitude: target.longitude });
      await goToCoordinates(target.latitude, target.longitude);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Could not locate "${place.name}". Tap a result from the list and try again. ${msg}`);
    } finally {
      setResolvingPlace(false);
    }
  };

  const selectFirstSuggestion = () => {
    if (suggestions[0]) void selectPlace(suggestions[0]);
  };

  const locateMe = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await goToCoordinates(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => {
        setError("Location permission denied.");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  };

  const previewBays = bays.filter((b) => b.rule.canPark).slice(0, 3);

  return (
    <section className="relative flex-1 overflow-hidden" aria-label="Map">
      <div className="absolute inset-0 z-0">
        <Suspense
          fallback={
            <div className="h-full w-full flex items-center justify-center bg-[#E8ECF2] text-base text-gray-600">
              Loading map…
            </div>
          }
        >
          <LiveMapboxMap
            center={center}
            bays={bays}
            selectedId={selected?.id ?? null}
            onSelectBay={(bay) => {
              setSelected(bay);
              onSelectBay(bay);
            }}
            className="h-full w-full"
          />
        </Suspense>
      </div>

      <div className="absolute top-0 left-0 right-0 px-4 pt-3 pb-3 z-50 pointer-events-none">
        <div className="flex gap-2.5 items-center pointer-events-auto">
          <div
            role="search"
            className="flex-1 flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-black/5 min-h-[52px]"
          >
            <Search size={20} className="text-gray-400 shrink-0" aria-hidden="true" />
            <input
              type="search"
              enterKeyHint="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => window.setTimeout(() => setSearchFocused(false), 150)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  selectFirstSuggestion();
                }
              }}
              placeholder="Search suburb or street"
              className="flex-1 min-w-0 text-base text-[#111827] placeholder:text-gray-400 bg-transparent outline-none border-none"
              aria-label="Search destination"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {searchLoading || resolvingPlace ? (
              <Loader2 size={18} className="text-primary animate-spin shrink-0" aria-label="Searching" />
            ) : null}
            {query && !searchLoading ? (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="mobile-touch p-1">
                <X size={18} className="text-gray-400" />
              </button>
            ) : null}
          </div>
          <IconButton label="Open filters" onClick={onOpenFilter} className="mobile-touch w-12 h-12">
            <SlidersHorizontal size={22} className="text-primary" />
          </IconButton>
        </div>

        {searchFocused && (suggestions.length > 0 || searchLoading) && (
          <div className="mt-2 bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden max-h-56 overflow-y-auto pointer-events-auto">
            {searchLoading && suggestions.length === 0 ? (
              <div className="px-4 py-4 text-base text-gray-500">Searching…</div>
            ) : (
              suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="w-full text-left px-4 py-3.5 hover:bg-gray-50 border-b border-black/5 last:border-0 mobile-touch"
                  onClick={() => selectPlace(s)}
                >
                  <div className="mobile-title text-[#111827]">{s.name}</div>
                  <div className="mobile-caption text-gray-500 mt-0.5">{s.placeFormatted}</div>
                </button>
              ))
            )}
          </div>
        )}

        <div className="mt-2.5 flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto">
          {SUBURB_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                skipSuggestRef.current = true;
                setQuery(preset.query);
                setSearchFocused(false);
                setSuggestions([]);
                void goToCoordinates(preset.latitude, preset.longitude);
              }}
              className="shrink-0 rounded-full bg-white/95 border border-black/10 px-4 py-2 text-sm font-semibold text-primary shadow-sm mobile-touch"
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
              <h2 className="text-lg font-semibold text-[#111827] leading-snug">
                {selected.streetDescription}
              </h2>
              <p className="mobile-caption text-gray-500 mt-0.5">
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
                <span className="mobile-caption text-gray-400">
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

          {loading && bays.length === 0 ? (
            <LoadingState message="Finding parking nearby…" className="px-4" />
          ) : error ? (
            <ErrorState message={error} onRetry={() => loadNearby(center.latitude, center.longitude)} />
          ) : bays.length === 0 ? (
            <EmptyState
              title="No parking found"
              description="Try another street or suburb — Ascot Vale and Altona are supported."
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
                  <div className="text-sm font-semibold truncate">{bay.streetDescription}</div>
                  <div className="mobile-caption text-gray-400 mt-1">
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
                  <div className="text-base font-semibold text-[#111827]">{bay.streetDescription}</div>
                  <div className="mobile-caption text-gray-500 mt-1">
                    {bay.suburb ?? "Melbourne"} · {bay.distanceMetres} m
                  </div>
                  <div className="text-sm text-primary mt-1 font-medium">
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
