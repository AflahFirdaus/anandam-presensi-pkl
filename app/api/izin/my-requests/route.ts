import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import pool from "@/lib/db";
import type { IzinGantiHariRow } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's izin requests with user info
    const [rows] = await pool.execute<IzinGantiHariRow[]>(
      `SELECT
        ig.id,
        ig.user_id,
        ig.tanggal_mulai,
        ig.jam_mulai,
        ig.tanggal_selesai,
        ig.jam_selesai,
        ig.alasan,
        ig.status,
        ig.foto_bukti,
        ig.created_at,
        ig.updated_at,
        u.nama,
        u.username
       FROM izin_ganti_hari ig
       LEFT JOIN users u ON ig.user_id = u.id
       WHERE ig.user_id = ?
       ORDER BY ig.created_at DESC`,
      [session.user.id]
    );

    return NextResponse.json({
      izin_requests: rows,
    });
  } catch (error) {
    console.error("Error fetching izin requests:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data izin" },
      { status: 500 }
    );
  }
}
