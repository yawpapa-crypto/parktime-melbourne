import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { NearbyBay } from "@/services/api";

const TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

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

  useEffect(() => {
    if (!containerRef.current || !TOKEN || mapRef.current) return;

    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [center.longitude, center.latitude],
      zoom: 14,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");
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
    map.flyTo({
      center: [center.longitude, center.latitude],
      zoom: map.getZoom() < 13 ? 14 : map.getZoom(),
      duration: 800,
    });
  }, [center.latitude, center.longitude]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    for (const bay of bays) {
      const selected = bay.id === selectedId;
      const el = document.createElement("button");
      el.type = "button";
      el.className = "parktime-bay-marker";
      el.style.width = selected ? "22px" : "16px";
      el.style.height = selected ? "22px" : "16px";
      el.style.borderRadius = "9999px";
      el.style.border = "2px solid white";
      el.style.background = bay.rule.canPark
        ? bay.rule.paymentRequired
          ? "#3B82F6"
          : "#22C55E"
        : "#EF4444";
      el.style.boxShadow = selected ? "0 0 0 4px rgba(34,197,94,0.25)" : "0 1px 4px rgba(0,0,0,0.25)";
      el.style.cursor = "pointer";
      el.setAttribute("aria-label", bay.streetDescription);

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectBay(bay);
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([bay.longitude, bay.latitude])
        .addTo(map);

      markersRef.current.push(marker);
    }
  }, [bays, selectedId, onSelectBay]);

  if (!TOKEN || TOKEN.includes("your_")) {
    return (
      <div className={`flex items-center justify-center bg-[#E8ECF2] text-sm text-gray-600 p-6 ${className ?? ""}`}>
        Mapbox token missing — set VITE_MAPBOX_ACCESS_TOKEN in .env
      </div>
    );
  }

  return <div ref={containerRef} className={className ?? "h-full w-full"} aria-label="Melbourne parking map" />;
}
