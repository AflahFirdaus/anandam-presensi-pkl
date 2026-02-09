import { getSessionFromRequest } from "@/lib/auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import type { SettingsFormRow } from "@/lib/db";
import type { ScheduleType } from "@/lib/shifts";
import AdminSettingsForm from "./AdminSettingsForm";
import Version from "../../components/Version";

/** Hari di timezone Jakarta: 0 = Minggu, 6 = Sabtu */
function getDayOfWeekJakarta(): number {
  const now = new Date();
  const jakartaDateStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const [y, m, d] = jakartaDateStr.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

function getScheduleTypeToday(dayOfWeek: number, forceHoliday: boolean): ScheduleType {
  if (forceHoliday) return "HOLIDAY";
  if (dayOfWeek === 0) return "SUNDAY";
  if (dayOfWeek === 6) return "SATURDAY";
  return "WEEKDAY";
}

export default async function AdminSettingsPage() {
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "ADMIN") redirect("/");
  const [rows] = await pool.execute<SettingsFormRow[]>(
    "SELECT area_name, area_lat, area_lng, area_radius_m, jam_masuk, jam_pulang, schedule_type, enabled_shifts, force_holiday_date FROM settings ORDER BY id DESC LIMIT 1"
  );
  const row = rows[0] ?? null;
  const rawEnabled = row?.enabled_shifts;
  const enabledShifts = Array.isArray(rawEnabled)
    ? rawEnabled
    : typeof rawEnabled === "string"
      ? (() => {
        try {
          const p = JSON.parse(rawEnabled) as { jam_masuk: string; jam_pulang: string }[];
          return Array.isArray(p) ? p : [];
        } catch {
          return [];
        }
      })()
      : [];
  const forceHolidayCurrent = row?.force_holiday_date
    ? (() => {
      const fd = row.force_holiday_date;
      const stored = typeof fd === "string" ? fd.slice(0, 10) : new Date(fd).toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
      return stored === new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
    })()
    : false;
  const dayJakarta = getDayOfWeekJakarta();
  const scheduleTypeToday = getScheduleTypeToday(dayJakarta, forceHolidayCurrent);

  const settings = row
    ? {
      area_name: row.area_name ?? "",
      area_lat: row.area_lat ?? "",
      area_lng: row.area_lng ?? "",
      area_radius_m: row.area_radius_m ?? 100,
      jam_masuk: row.jam_masuk ?? "08:00",
      jam_pulang: row.jam_pulang ?? "16:00",
      schedule_type: (row.schedule_type as "WEEKDAY" | "SATURDAY" | "SUNDAY") ?? "WEEKDAY",
      enabled_shifts: enabledShifts as { jam_masuk: string; jam_pulang: string }[],
      force_holiday_current: forceHolidayCurrent,
    }
    : {
      area_name: "",
      area_lat: "",
      area_lng: "",
      area_radius_m: 100,
      jam_masuk: "08:00",
      jam_pulang: "16:00",
      schedule_type: "WEEKDAY" as const,
      enabled_shifts: [] as { jam_masuk: string; jam_pulang: string }[],
      force_holiday_current: false,
    };

  return (
    <div className="animate-slide-up w-full">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/50 sm:p-8">
        <h1 className="mb-6 text-xl font-bold text-slate-800">Pengaturan Area & Jam Kerja</h1>
        <AdminSettingsForm initial={settings} scheduleTypeToday={scheduleTypeToday} />
      </div>
      <Version />
    </div>
  );
}
