import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import type { SettingsAreaRow, IdRow } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { distanceMeters, isLocationValid } from "@/lib/geo";
import { savePresensiPhoto } from "@/lib/photo";

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
    const { foto_base64, lat, lng, accuracy, status_kehadiran } = body; // Add status_kehadiran

    // Validasi basic
    if ((status_kehadiran !== "SAKIT" && !foto_base64) || lat == null || lng == null || accuracy == null) {
      return NextResponse.json(
        { error: "foto_base64 (wajib jika tidak sakit), lat, lng, accuracy wajib" },
        { status: 400 }
      );
    }

    const [setRows] = await pool.execute<SettingsAreaRow[]>(
      "SELECT area_lat, area_lng, area_radius_m, jam_masuk, jam_pulang, enabled_shifts FROM settings ORDER BY id DESC LIMIT 1"
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

    // REMOVED: Strict location blocking
    // if (!lokasiValid) { ... }

    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    let shiftJamMasuk: string;
    let shiftJamPulang: string;
    let masukStatus: "TEPAT_WAKTU" | "TELAT";

    /** Jendela presensi masuk: 15 menit sebelum s/d 45 menit setelah jam shift (lewat dari itu tetap bisa absen dengan status telat). */
    if (enabledShifts.length > 0) {
      let matched: { jam_masuk: string; jam_pulang: string } | null = null;
      for (const shift of enabledShifts) {
        const [h, m] = String(shift.jam_masuk).split(":").map(Number);
        const jamMasukDate = new Date(now);
        jamMasukDate.setHours(h || 0, m || 0, 0, 0);
        const windowStart = new Date(jamMasukDate.getTime() - WINDOW_SEBELUM_MENIT * 60 * 1000);
        const windowEnd = new Date(jamMasukDate.getTime() + WINDOW_SESUDAH_MENIT * 60 * 1000);
        if (now >= windowStart && now <= windowEnd) {
          matched = shift;
          break;
        }
      }

      // If none matched, check if we just default to the first one or error?
      // Existing logic was strict about window. 
      // User request: "Presensi tidak ditolak berdasarkan lokasi". 
      // It implies allowing attendance. 
      // If we are outside window, originally it errored.
      // But if user is late, they should be able to clock in as "TELAT"?
      // The current logic: if matched, it sets matched. If !matched, it returns error.
      // We should probably relax this if we want to allow "Late" attendance even outside window?
      // Or keep time strictness? "Presensi dapat dilakukan dari mana saja" -> Location.
      // Time restrictions might still apply. I will keep time logic as is for now unless "Sakit".

      if (!matched) {
        // If SAKIT, maybe ignore time window?
        if (status_kehadiran !== 'SAKIT') {
          return NextResponse.json(
            { error: `Presensi masuk valid ${WINDOW_SEBELUM_MENIT} menit sebelum sampai ${WINDOW_SESUDAH_MENIT} menit setelah jam shift. Periksa jam shift yang diaktifkan admin.` },
            { status: 400 }
          );
        }
        // If SAKIT, default to first shift or 08:00 just for recording?
        // Let's safe fallback
        matched = enabledShifts[0];
      }

      shiftJamMasuk = matched.jam_masuk;
      shiftJamPulang = matched.jam_pulang;
      const [h, m] = shiftJamMasuk.split(":").map(Number);
      const jamMasukDate = new Date(now);
      jamMasukDate.setHours(h || 0, m || 0, 0, 0);
      const batasTelat = new Date(jamMasukDate.getTime() + TOLERANSI_TELAT_MENIT * 60 * 1000);
      masukStatus = now > batasTelat ? "TELAT" : "TEPAT_WAKTU";
    } else {
      const jamMasukStr = String(settings.jam_masuk ?? "08:00");
      const [h, m] = jamMasukStr.split(":").map(Number);
      const jamMasukDate = new Date(now);
      jamMasukDate.setHours(h || 8, m || 0, 0, 0);
      const windowStart = new Date(jamMasukDate.getTime() - WINDOW_SEBELUM_MENIT * 60 * 1000);
      const windowEnd = new Date(jamMasukDate.getTime() + WINDOW_SESUDAH_MENIT * 60 * 1000);

      if (status_kehadiran !== 'SAKIT') {
        if (now < windowStart || now > windowEnd) {
          return NextResponse.json(
            { error: `Presensi masuk valid ${WINDOW_SEBELUM_MENIT} menit sebelum sampai ${WINDOW_SESUDAH_MENIT} menit setelah jam yang ditentukan.` },
            { status: 400 }
          );
        }
      }

      shiftJamMasuk = jamMasukStr.length === 5 ? jamMasukStr : "08:00";
      shiftJamPulang = String(settings.jam_pulang ?? "16:00").length === 5 ? String(settings.jam_pulang) : "16:00";
      const batasTelat = new Date(jamMasukDate.getTime() + TOLERANSI_TELAT_MENIT * 60 * 1000);
      masukStatus = now > batasTelat ? "TELAT" : "TEPAT_WAKTU";
    }

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

    let fotoPath: string | null = null;
    if (status_kehadiran !== "SAKIT") {
      fotoPath = await savePresensiPhoto(foto_base64, session.user.id, "masuk");
    }

    // Default status attendance
    const finalStatusKehadiran = (status_kehadiran === 'SAKIT') ? 'SAKIT' : 'HADIR';

    await pool.execute(
      `INSERT INTO presensi (
        user_id, tanggal, jam_masuk, shift_jam_masuk, shift_jam_pulang, 
        foto_masuk_path, masuk_lat, masuk_lng, masuk_accuracy, 
        masuk_distance_m, masuk_status, masuk_lokasi_valid, status_kehadiran
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        session.user.id,
        today,
        now,
        shiftJamMasuk,
        shiftJamPulang,
        fotoPath,
        userLat,
        userLng,
        acc,
        distanceM,
        masukStatus,
        lokasiValid ? 1 : 0,
        finalStatusKehadiran
      ]
    );

    return NextResponse.json({
      success: true,
      status: masukStatus,
      via: lokasiValid ? "KANTOR" : "LUAR_KANTOR",
      status_kehadiran: finalStatusKehadiran
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
