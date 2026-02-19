import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import type { SettingsAreaRow, IdRow } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { distanceMeters, isLocationValid } from "@/lib/geo";
import { savePresensiPhoto } from "@/lib/photo";
// import { isHoliday } from "@/lib/holidays";
import { getShiftsByScheduleType } from "@/lib/shifts";

const TOLERANSI_TELAT_MENIT = 15;
const WINDOW_SEBELUM_MENIT = 15;
const WINDOW_SESUDAH_MENIT = 60;
const MAX_ACCURACY_M = 200;

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "PKL") {
    return NextResponse.json({ error: "Hanya role PKL yang bisa presensi" }, { status: 403 });
  }
  try {
    const body = await request.json();
    const { foto_base64, lat, lng, accuracy } = body;

    if (!foto_base64 || lat == null || lng == null || accuracy == null) {
      return NextResponse.json(
        { error: "foto_base64, lat, lng, accuracy wajib" },
        { status: 400 }
      );
    }

    const [setRows] = await pool.execute<SettingsAreaRow[]>(
      "SELECT area_lat, area_lng, area_radius_m, jam_masuk, jam_pulang, enabled_shifts, force_holiday_date FROM settings ORDER BY id DESC LIMIT 1"
    );
    const settings = setRows[0];
    if (
      !settings ||
      settings.area_lat == null ||
      settings.area_lng == null ||
      settings.area_radius_m == null
    ) {
      return NextResponse.json(
        { error: "Konfigurasi area/jam belum di-set admin" },
        { status: 400 }
      );
    }

    const rawShifts = settings.enabled_shifts;
    const enabledShifts: { jam_masuk: string; jam_pulang: string }[] = Array.isArray(rawShifts)
      ? rawShifts
      : typeof rawShifts === "string"
        ? (() => {
          try {
            const p = JSON.parse(rawShifts) as { jam_masuk: string; jam_pulang: string }[];
            return Array.isArray(p) ? p : [];
          } catch {
            return [];
          }
        })()
        : [];

    const areaLat = Number(settings.area_lat);
    const areaLng = Number(settings.area_lng);
    const radiusM = Number(settings.area_radius_m);
    const userLat = Number(lat);
    const userLng = Number(lng);
    const acc = Number(accuracy);

    const distanceM = distanceMeters(areaLat, areaLng, userLat, userLng);
    const lokasiValid = isLocationValid(distanceM, acc, radiusM, MAX_ACCURACY_M);


    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const todayJakarta = now.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

    // Cek hari libur dari toggle (tanggal disimpan timezone Jakarta)
    const forceHolidayStr = settings.force_holiday_date
      ? (typeof settings.force_holiday_date === "string"
        ? settings.force_holiday_date.slice(0, 10)
        : new Date(settings.force_holiday_date).toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }))
      : null;
    const isHolidayToday = forceHolidayStr === todayJakarta;

    // Hari di timezone Jakarta (0 = Minggu, 6 = Sabtu) agar konsisten dengan pengaturan & user di Indonesia
    const [yJ, mo, dJ] = todayJakarta.split("-").map(Number);
    const dayJakarta = new Date(yJ, mo - 1, dJ).getDay();

    let activeShifts: { jam_masuk: string; jam_pulang: string }[] = [];

    if (isHolidayToday) {
      activeShifts = getShiftsByScheduleType("HOLIDAY");
    } else if (dayJakarta === 0) {
      activeShifts = getShiftsByScheduleType("SUNDAY");
    } else if (dayJakarta === 6) {
      activeShifts = getShiftsByScheduleType("SATURDAY");
    } else {
      activeShifts = getShiftsByScheduleType("WEEKDAY");
    }

    let shiftJamMasuk: string;
    let shiftJamPulang: string;
    let masukStatus: "TEPAT_WAKTU" | "TELAT";

    let matched: { jam_masuk: string; jam_pulang: string } | null = null;

    if (activeShifts.length > 0) {
      for (const shift of activeShifts) {
        const [h, m] = String(shift.jam_masuk).split(":").map(Number);
        const jamMasukDate = new Date(now);
        jamMasukDate.setHours(h || 0, m || 0, 0, 0);

        const windowStart = new Date(jamMasukDate.getTime() - WINDOW_SEBELUM_MENIT * 60 * 1000);
        const windowEnd = new Date(jamMasukDate.getTime() + WINDOW_SESUDAH_MENIT * 60 * 1000);

        // Check fit in window
        if (now >= windowStart && now <= windowEnd) {
          matched = shift;
          break;
        }
      }
    }

    if (!matched) {
      return NextResponse.json(
        { error: `Tidak ada jadwal presensi yang cocok saat ini. (Jendela waktu: -${WINDOW_SEBELUM_MENIT} / +${WINDOW_SESUDAH_MENIT} menit dari jam shift).` },
        { status: 400 }
      );
    }

    shiftJamMasuk = matched.jam_masuk;
    shiftJamPulang = matched.jam_pulang;

    const [h, m] = shiftJamMasuk.split(":").map(Number);
    const jamMasukDate = new Date(now);
    jamMasukDate.setHours(h || 0, m || 0, 0, 0);
    const batasTelat = new Date(jamMasukDate.getTime() + TOLERANSI_TELAT_MENIT * 60 * 1000);
    masukStatus = now > batasTelat ? "TELAT" : "TEPAT_WAKTU";

    const [existing] = await pool.execute<IdRow[]>(
      "SELECT id FROM presensi WHERE user_id = ? AND tanggal = ?",
      [session.user.id, today]
    );
    if (existing.length) {
      return NextResponse.json(
        { error: "Sudah presensi masuk hari ini" },
        { status: 400 }
      );
    }

    const fotoPath = await savePresensiPhoto(foto_base64, session.user.id, "masuk");

    await pool.execute(
      `INSERT INTO presensi (
        user_id, tanggal, jam_masuk, shift_jam_masuk, shift_jam_pulang,
        foto_masuk_path, foto_sakit_path, masuk_lat, masuk_lng, masuk_accuracy,
        masuk_distance_m, masuk_status, masuk_lokasi_valid, status_kehadiran
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        session.user.id,
        today,
        now,
        shiftJamMasuk,
        shiftJamPulang,
        fotoPath,
        null,
        userLat,
        userLng,
        acc,
        distanceM,
        masukStatus,
        lokasiValid ? 1 : 0,
        "HADIR"
      ]
    );

    return NextResponse.json({
      success: true,
      status: masukStatus,
      via: lokasiValid ? "KANTOR" : "LUAR_KANTOR",
    });
  } catch (e: unknown) {
    console.error(e);
    const err = e as { code?: string; sqlMessage?: string };
    if (err?.code === "ER_BAD_FIELD_ERROR" || err?.sqlMessage?.includes("Unknown column")) {
      return NextResponse.json(
        { error: "Struktur tabel belum lengkap. Jalankan semua migration (004, 005, 006) di folder migrations." },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: err?.sqlMessage ? `Database: ${err.sqlMessage}` : "Server error" },
      { status: 500 }
    );
  }
}
