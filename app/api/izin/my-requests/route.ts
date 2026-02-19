import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import pool from "@/lib/db";
import type { IzinRow, IzinTanggalGantiRow } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [rows] = await pool.execute<IzinRow[]>(
      `SELECT id, user_id, jenis_izin, tanggal_izin, alasan, foto_bukti, status, created_at, updated_at
       FROM izin
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [session.user.id]
    );

    const list: Array<{
      id: number;
      jenis_izin: string;
      tanggal_izin: string;
      alasan: string;
      status: string;
      foto_bukti: string | null;
      created_at: string;
      nama: string;
      username: string;
      tanggal_ganti: Array<{ tanggal_ganti: string; jam_mulai: string | null; jam_selesai: string | null }>;
    }> = [];

    for (const izin of rows) {
      const [gantiRows] = await pool.execute<IzinTanggalGantiRow[]>(
        "SELECT tanggal_ganti, jam_mulai, jam_selesai FROM izin_tanggal_ganti WHERE izin_id = ? ORDER BY tanggal_ganti",
        [izin.id]
      );
      list.push({
        id: izin.id,
        jenis_izin: izin.jenis_izin,
        tanggal_izin: izin.tanggal_izin,
        alasan: izin.alasan,
        status: izin.status,
        foto_bukti: izin.foto_bukti,
        created_at: String(izin.created_at),
        nama: session.user.nama,
        username: session.user.username,
        tanggal_ganti: gantiRows.map((r) => ({
          tanggal_ganti: r.tanggal_ganti,
          jam_mulai: r.jam_mulai,
          jam_selesai: r.jam_selesai,
        })),
      });
    }

    return NextResponse.json({
      izin_requests: list,
    });
  } catch (error) {
    console.error("Error fetching izin requests:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data izin" },
      { status: 500 }
    );
  }
}
