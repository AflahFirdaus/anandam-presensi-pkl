"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type L from "leaflet";

const DEFAULT_CENTER: [number, number] = [-7.759833144584404, 110.39532415647228]; // Anandam, Yogyakarta
const DEFAULT_ZOOM = 15;

type MapPickerProps = {
  lat: number | null;
  lng: number | null;
  radius: number;
  onLatLngChange: (lat: number, lng: number) => void;
};

export default function MapPicker({ lat, lng, radius, onLatLngChange }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<typeof L | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const [locStatus, setLocStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  const center: [number, number] =
    lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng)
      ? [lat, lng]
      : DEFAULT_CENTER;

  const onPick = useCallback(
    (newLat: number, newLng: number) => {
      onLatLngChange(newLat, newLng);
    },
    [onLatLngChange]
  );

  useEffect(() => {
    if (!containerRef.current || typeof window === "undefined") return;

    const init = async () => {
      const L = (await import("leaflet")).default;
      leafletRef.current = L;
      await import("leaflet/dist/leaflet.css");

      // Perbaiki icon marker default (path sering error di build)
      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (mapRef.current) return;
      const map = L.map(containerRef.current!).setView(center, DEFAULT_ZOOM);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      const marker = L.marker(center, { draggable: true }).addTo(map);
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onPick(pos.lat, pos.lng);
      });

      let circle: L.Circle | null = null;
      if (radius > 0) {
        circle = L.circle(center, { radius, color: "#3b82f6", fillOpacity: 0.15 }).addTo(map);
      }

      map.on("click", (e: L.LeafletMouseEvent) => {
        const { lat: newLat, lng: newLng } = e.latlng;
        marker.setLatLng([newLat, newLng]);
        if (circle) circle.setLatLng([newLat, newLng]);
        onPick(newLat, newLng);
      });

      mapRef.current = map;
      markerRef.current = marker;
      circleRef.current = circle;
    };

    init();
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    const circle = circleRef.current;
    const L = leafletRef.current;
    if (!map || !marker || !L) return;

    marker.setLatLng(center);
    if (circle) {
      circle.setLatLng(center);
      circle.setRadius(radius > 0 ? radius : 1);
    } else if (radius > 0) {
      const newCircle = L.circle(center, { radius, color: "#3b82f6", fillOpacity: 0.15 }).addTo(map);
      circleRef.current = newCircle;
    }
  }, [center[0], center[1], radius]);

  const useCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocStatus("error");
      return;
    }
    setLocStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        onLatLngChange(newLat, newLng);
        mapRef.current?.setView([newLat, newLng], DEFAULT_ZOOM);
        setLocStatus("ok");
      },
      () => setLocStatus("error"),
      { enableHighAccuracy: true }
    );
  }, [onLatLngChange]);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-xs text-slate-500">
          Klik atau geser marker di peta untuk mengatur titik pusat area.
        </p>
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locStatus === "loading"}
          className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {locStatus === "loading" ? "Mengambil lokasi..." : "Gunakan lokasi saat ini"}
        </button>
      </div>
      <div ref={containerRef} className="h-[320px] w-full bg-slate-100" />
      <p className="border-t border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
        Lingkaran biru menunjukkan radius area presensi.
        {locStatus === "ok" && <span className="ml-2 text-green-600">Lokasi berhasil diambil.</span>}
        {locStatus === "error" && <span className="ml-2 text-red-600">Lokasi tidak tersedia. Izinkan akses atau cek GPS.</span>}
      </p>
    </div>
  );
}
