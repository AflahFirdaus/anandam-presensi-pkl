"use client";

import { useState, useMemo } from "react";
import MapPicker from "./MapPicker";
import {
  type ScheduleType,
  SCHEDULE_LABELS,
  getShiftsByScheduleType,
  type ShiftOption,
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
};

function isShiftEnabled(
  shift: ShiftOption,
  enabled: { jam_masuk: string; jam_pulang: string }[]
): boolean {
  return enabled.some(
    (e) => e.jam_masuk === shift.jam_masuk && e.jam_pulang === shift.jam_pulang
  );
}

export default function AdminSettingsForm({ initial }: { initial: Settings }) {
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const shifts = useMemo(
    () => getShiftsByScheduleType(form.schedule_type),
    [form.schedule_type]
  );

  function toggleShift(shift: ShiftOption, enabled: boolean) {
    if (enabled) {
      setForm((f) => ({
        ...f,
        enabled_shifts: [...f.enabled_shifts, { jam_masuk: shift.jam_masuk, jam_pulang: shift.jam_pulang }],
      }));
    } else {
      setForm((f) => ({
        ...f,
        enabled_shifts: f.enabled_shifts.filter(
          (e) => !(e.jam_masuk === shift.jam_masuk && e.jam_pulang === shift.jam_pulang)
        ),
      }));
    }
  }

  function setScheduleType(st: ScheduleType) {
    setForm((f) => ({ ...f, schedule_type: st, enabled_shifts: [] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          area_name: form.area_name || null,
          area_lat: form.area_lat ? Number(form.area_lat) : null,
          area_lng: form.area_lng ? Number(form.area_lng) : null,
          area_radius_m: form.area_radius_m ? Number(form.area_radius_m) : null,
          jam_masuk: form.jam_masuk || null,
          jam_pulang: form.jam_pulang || null,
          schedule_type: form.schedule_type,
          enabled_shifts: form.enabled_shifts,
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
        <h2 className="mb-3 text-base font-semibold text-slate-800">Jadwal & Shift Hari Ini</h2>
        <p className="mb-4 text-sm text-slate-600">
          Pilih tipe jadwal, lalu aktifkan shift yang dipakai hari ini dengan switch.
        </p>
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">Jadwal hari ini</label>
          <div className="flex flex-wrap gap-3">
            {(["WEEKDAY", "SATURDAY", "SUNDAY"] as const).map((st) => (
              <label key={st} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="schedule_type"
                  checked={form.schedule_type === st}
                  onChange={() => setScheduleType(st)}
                  className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700">{SCHEDULE_LABELS[st]}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Shift aktif (centang untuk mengaktifkan)</label>
          <ul className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            {shifts.map((shift) => {
              const enabled = isShiftEnabled(shift, form.enabled_shifts);
              return (
                <li key={shift.label} className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-slate-800">{shift.label}</span>
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => toggleShift(shift, e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="relative h-6 w-11 shrink-0 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/30" />
                    <span className="text-sm text-slate-600">{enabled ? "Aktif" : "Nonaktif"}</span>
                  </label>
                </li>
              );
            })}
          </ul>
          {form.enabled_shifts.length === 0 && (
            <p className="mt-2 text-xs text-amber-600">Minimal aktifkan satu shift agar presensi bisa dilakukan.</p>
          )}
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
