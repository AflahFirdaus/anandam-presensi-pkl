"use client";

import { useState } from "react";
import MapPicker from "./MapPicker";
import {
  type ScheduleType,
  SCHEDULE_LABELS,
  getShiftsByScheduleType,
} from "@/lib/shifts";


type Settings = {
  area_name: string;
  area_lat: string;
  area_lng: string;
  area_radius_m: number;
  jam_masuk: string;
  jam_pulang: string;
  schedule_type: ScheduleType;
  enabled_shifts: { jam_masuk: string; jam_pulang: string }[];
  force_holiday_current?: boolean; // New
};


export default function AdminSettingsForm({ initial, scheduleTypeToday }: { initial: Settings; scheduleTypeToday: ScheduleType }) {
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          area_name: form.area_name || null,
          area_lat: form.area_lat ? Number(form.area_lat) : null,
          area_lng: form.area_lng ? Number(form.area_lng) : null,
          area_radius_m: form.area_radius_m ? Number(form.area_radius_m) : null,
          jam_masuk: form.jam_masuk || null,
          jam_pulang: form.jam_pulang || null,
          schedule_type: form.schedule_type,
          enabled_shifts: form.enabled_shifts,
          force_holiday_current: form.force_holiday_current,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: data.error ?? "Gagal menyimpan" });
        return;
      }
      setMessage({ type: "ok", text: "Settings berhasil disimpan." });
    } catch {
      setMessage({ type: "err", text: "Koneksi gagal" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Nama Area</label>
        <input
          type="text"
          value={form.area_name}
          onChange={(e) => setForm((f) => ({ ...f, area_name: e.target.value }))}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          placeholder="Contoh: Kantor Utama"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Pilih Titik Area di Peta</label>
        <MapPicker
          lat={form.area_lat ? Number(form.area_lat) : null}
          lng={form.area_lng ? Number(form.area_lng) : null}
          radius={form.area_radius_m || 0}
          onLatLngChange={(lat, lng) => setForm((f) => ({ ...f, area_lat: String(lat), area_lng: String(lng) }))}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Latitude</label>
          <input
            type="text"
            value={form.area_lat}
            onChange={(e) => setForm((f) => ({ ...f, area_lat: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="-6.xxxxxx"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Longitude</label>
          <input
            type="text"
            value={form.area_lng}
            onChange={(e) => setForm((f) => ({ ...f, area_lng: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="106.xxxxxx"
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Radius (meter)</label>
        <input
          type="number"
          min={1}
          value={form.area_radius_m}
          onChange={(e) => setForm((f) => ({ ...f, area_radius_m: Number(e.target.value) || 0 }))}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <div className="border-t border-slate-200 pt-5">
        <h2 className="text-base font-semibold text-slate-800">Hari Libur?</h2>
        <p className="mb-3 text-slate-600">Aktifkan switch untuk set hari libur</p>

        <div className="mb-6 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 p-4">
          <div>
            <h3 className="font-medium text-blue-900">Mode Hari Libur</h3>
            <p className="text-sm text-blue-700">Jika aktif, shift otomatis menjadi 10:00 - 19:00. Reset otomatis besok.</p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={!!form.force_holiday_current}
              onChange={(e) => setForm(f => ({ ...f, force_holiday_current: e.target.checked }))}
            />
            <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"></div>
          </label>
        </div>

        <div className={`flex flex-col gap-4 transition-opacity ${form.force_holiday_current ? "pointer-events-none opacity-50" : ""}`}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Shift hari ini ({form.force_holiday_current ? "Hari Libur (aktif)" : SCHEDULE_LABELS[scheduleTypeToday]})
            </label>
            <ul className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              {getShiftsByScheduleType(form.force_holiday_current ? "HOLIDAY" : scheduleTypeToday).map((shift) => {

                return (
                  <li key={shift.label} className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-slate-800">{shift.jam_masuk}</span>
                    <span className="w-full inline-block border-t border-dashed border-slate-500 [border-dasharray:80px_20px]"></span>
                    <span className="text-sm font-medium text-slate-800">{shift.jam_pulang}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {message && (
        <p className={`rounded-xl px-4 py-2.5 text-sm ${message.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>{message.text}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700 hover:shadow-blue-600/30 disabled:opacity-50 disabled:shadow-none"
      >
        {loading ? "Menyimpan..." : "Simpan"}
      </button>
    </form>
  );
}
