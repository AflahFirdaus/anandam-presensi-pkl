import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { PresensiTodayApiRow } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET() {
  const session = await getSessionFromRequest();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "PKL") {
    return NextResponse.json({ error: "Hanya role PKL yang bisa presensi" }, { status: 403 });
  }
  const today = new Date().toISOString().slice(0, 10);
  const [rows] = await pool.execute<PresensiTodayApiRow[]>(
    "SELECT id, tanggal, jam_masuk, jam_keluar, foto_masuk_path, foto_keluar_path, foto_sakit_path, masuk_status, keluar_status, status_kehadiran FROM presensi WHERE user_id = ? AND tanggal = ?",
    [session.user.id, today]
  );
  const row = rows[0] ?? null;
  return NextResponse.json({
    presensi: row
      ? {
        id: row.id,
        tanggal: row.tanggal,
        jam_masuk: row.jam_masuk,
        jam_keluar: row.jam_keluar,
        foto_masuk_path: row.foto_masuk_path,
        foto_keluar_path: row.foto_keluar_path,
        foto_sakit_path: row.foto_sakit_path,
        masuk_status: row.masuk_status,
        keluar_status: row.keluar_status,
        status_kehadiran: row.status_kehadiran,
      }
      : null,
  });
}
