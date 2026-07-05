import { useEffect, useMemo, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { NearbyBay } from "@/services/api";

import "mapbox-gl/dist/mapbox-gl.css";

const TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const MAX_MARKERS = 35;

export interface MapCenter {
  latitude: number;
  longitude: number;
}

interface LiveMapboxMapProps {
  center: MapCenter;
  bays: NearbyBay[];
  selectedId: string | null;
  onSelectBay: (bay: NearbyBay) => void;
  className?: string;
}

export function LiveMapboxMap({
  center,
  bays,
  selectedId,
  onSelectBay,
  className,
}: LiveMapboxMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const onSelectRef = useRef(onSelectBay);
  onSelectRef.current = onSelectBay;

  const markerBays = useMemo(() => bays.slice(0, MAX_MARKERS), [bays]);

  useEffect(() => {
    if (!containerRef.current || !TOKEN || mapRef.current) return;

    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [center.longitude, center.latitude],
      zoom: 14,
      attributionControl: false,
      fadeDuration: 0,
      refreshExpiredTiles: false,
    });

    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({
      center: [center.longitude, center.latitude],
      zoom: map.getZoom() < 13 ? 14 : map.getZoom(),
      duration: 450,
    });
  }, [center.latitude, center.longitude]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const render = () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      for (const bay of markerBays) {
        const selected = bay.id === selectedId;
        const el = document.createElement("button");
        el.type = "button";
        el.style.width = selected ? "24px" : "18px";
        el.style.height = selected ? "24px" : "18px";
        el.style.borderRadius = "9999px";
        el.style.border = "2px solid white";
        el.style.background = bay.rule.canPark
          ? bay.rule.paymentRequired
            ? "#3B82F6"
            : "#22C55E"
          : "#EF4444";
        el.style.boxShadow = selected
          ? "0 0 0 4px rgba(34,197,94,0.25)"
          : "0 1px 4px rgba(0,0,0,0.25)";
        el.setAttribute("aria-label", bay.streetDescription);

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onSelectRef.current(bay);
        });

        markersRef.current.push(
          new mapboxgl.Marker({ element: el, anchor: "center" })
            .setLngLat([bay.longitude, bay.latitude])
            .addTo(map),
        );
      }
    };

    if (map.isStyleLoaded()) render();
    else map.once("load", render);
  }, [markerBays, selectedId]);

  if (!TOKEN || TOKEN.includes("your_")) {
    return (
      <div className={`flex items-center justify-center bg-[#E8ECF2] text-base text-gray-600 p-6 ${className ?? ""}`}>
        Mapbox token missing
      </div>
    );
  }

  return <div ref={containerRef} className={className ?? "h-full w-full"} aria-label="Melbourne parking map" />;
}
