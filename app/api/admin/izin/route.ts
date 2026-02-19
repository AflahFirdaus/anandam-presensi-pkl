import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import pool from "@/lib/db";
import type { IzinGantiHariRow } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all izin requests with user info
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
       ORDER BY ig.created_at DESC`
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

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, foto_bukti } = body;

    // Validate required fields
    if (!id || !status || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "ID dan status wajib diisi" },
        { status: 400 }
      );
    }

    // Update izin status
    await pool.execute(
      `UPDATE izin_ganti_hari
       SET status = ?, foto_bukti = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, foto_bukti, id]
    );

    return NextResponse.json({
      success: true,
      message: `Izin ${status === "APPROVED" ? "Disetujui" : "Ditolak"} berhasil`,
    });
  } catch (error) {
    console.error("Error updating izin status:", error);
    return NextResponse.json(
      { error: "Gagal mengupdate status izin" },
      { status: 500 }
    );
  }
}
