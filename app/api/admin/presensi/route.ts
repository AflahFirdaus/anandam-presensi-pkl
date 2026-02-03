import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import type { PresensiListApiRow } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const date = request.nextUrl.searchParams.get("date");
  const tanggal = date ?? new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
    return NextResponse.json({ error: "Parameter date harus YYYY-MM-DD" }, { status: 400 });
  }
  const [rows] = await pool.execute<PresensiListApiRow[]>(
    `SELECT p.id, p.user_id, u.nama, u.username, p.tanggal, p.jam_masuk, p.jam_keluar, p.masuk_status, p.keluar_status, p.foto_masuk_path, p.foto_keluar_path
     FROM presensi p
     JOIN users u ON u.id = p.user_id
     WHERE p.tanggal = ?
     ORDER BY p.jam_masuk ASC`,
    [tanggal]
  );
  return NextResponse.json({
    date: tanggal,
    list: rows.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      nama: r.nama,
      username: r.username,
      tanggal: r.tanggal,
      jam_masuk: r.jam_masuk,
      jam_keluar: r.jam_keluar,
      masuk_status: r.masuk_status,
      keluar_status: r.keluar_status,
      foto_masuk_path: r.foto_masuk_path,
      foto_keluar_path: r.foto_keluar_path,
    })),
  });
}
