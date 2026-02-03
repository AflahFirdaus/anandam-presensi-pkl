import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import type { SettingsAreaRow, PresensiExistingRow, PresensiKeluarRow } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { distanceMeters, isLocationValid } from "@/lib/geo";
import { savePresensiPhoto } from "@/lib/photo";

/** Batas accuracy GPS (meter) agar lokasi valid. Spesifikasi: ≤ 50m. Belum di settings. */
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
      "SELECT area_lat, area_lng, area_radius_m, jam_pulang FROM settings ORDER BY id DESC LIMIT 1"
    );
    const settings = setRows[0];
    if (!settings || settings.area_lat == null || settings.area_lng == null || settings.area_radius_m == null) {
      return NextResponse.json({ error: "Konfigurasi area belum di-set admin" }, { status: 400 });
    }

    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    const [existing] = await pool.execute<PresensiExistingRow[]>(
      "SELECT id, jam_masuk, shift_jam_masuk, shift_jam_pulang FROM presensi WHERE user_id = ? AND tanggal = ?",
      [session.user.id, today]
    );
    if (!existing.length) {
      return NextResponse.json(
        { error: "Belum presensi masuk hari ini" },
        { status: 400 }
      );
    }
    if (existing[0].jam_masuk == null) {
      return NextResponse.json(
        { error: "Data presensi masuk tidak valid" },
        { status: 400 }
      );
    }

    const presensiRow = existing[0];
    const jamPulangStr =
      presensiRow.shift_jam_pulang && String(presensiRow.shift_jam_pulang).length >= 5
        ? String(presensiRow.shift_jam_pulang)
        : String(settings.jam_pulang ?? "16:00");
    const [ph, pm] = jamPulangStr.split(":").map(Number);
    const jamPulangDate = new Date(now);
    jamPulangDate.setHours(ph || 16, pm || 0, 0, 0);
    if (now < jamPulangDate) {
      return NextResponse.json(
        { error: "Belum waktunya presensi pulang" },
        { status: 400 }
      );
    }
    const keluarStatus = now >= jamPulangDate ? "SESUAI" : "PULANG_CEPAT";

    const [row] = await pool.execute<PresensiKeluarRow[]>(
      "SELECT jam_keluar FROM presensi WHERE user_id = ? AND tanggal = ?",
      [session.user.id, today]
    );
    if (row[0].jam_keluar) {
      return NextResponse.json(
        { error: "Sudah presensi pulang hari ini" },
        { status: 400 }
      );
    }

    const areaLat = Number(settings.area_lat);
    const areaLng = Number(settings.area_lng);
    const radiusM = Number(settings.area_radius_m);
    const userLat = Number(lat);
    const userLng = Number(lng);
    const acc = Number(accuracy);
    const distanceM = distanceMeters(areaLat, areaLng, userLat, userLng);
    const lokasiValid = isLocationValid(distanceM, acc, radiusM, MAX_ACCURACY_M);
    if (!lokasiValid) {
      return NextResponse.json(
        { error: "Lokasi tidak valid (jarak atau accuracy melebihi batas)" },
        { status: 400 }
      );
    }

    const fotoPath = await savePresensiPhoto(foto_base64, session.user.id, "keluar");

    await pool.execute(
      `UPDATE presensi SET jam_keluar=?, foto_keluar_path=?, keluar_lat=?, keluar_lng=?, keluar_accuracy=?, keluar_distance_m=?, keluar_status=?, keluar_lokasi_valid=? WHERE user_id=? AND tanggal=?`,
      [now, fotoPath, userLat, userLng, acc, distanceM, keluarStatus, lokasiValid ? 1 : 0, session.user.id, today]
    );
    return NextResponse.json({ success: true, status: keluarStatus });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
