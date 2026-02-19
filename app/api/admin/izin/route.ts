import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import pool from "@/lib/db";
import type { IzinRow, IzinTanggalGantiRow } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [rows] = await pool.execute<IzinRow[]>(
      `SELECT i.id, i.user_id, i.jenis_izin, i.tanggal_izin, i.alasan, i.foto_bukti, i.status, i.created_at, i.updated_at,
              u.nama, u.username
       FROM izin i
       LEFT JOIN users u ON i.user_id = u.id
       ORDER BY i.created_at DESC`
    );

    const list: Array<{
      id: number;
      user_id: number;
      jenis_izin: string;
      tanggal_izin: string;
      alasan: string;
      foto_bukti: string | null;
      status: string;
      created_at: string;
      updated_at: string;
      nama: string;
      username: string;
      tanggal_ganti: Array<{ tanggal_ganti: string; jam_mulai: string | null; jam_selesai: string | null }>;
    }> = [];

    for (const izin of rows) {
      const [gantiRows] = await pool.execute<IzinTanggalGantiRow[]>(
        "SELECT tanggal_ganti, jam_mulai, jam_selesai FROM izin_tanggal_ganti WHERE izin_id = ? ORDER BY tanggal_ganti",
        [izin.id]
      );
      const row = izin as IzinRow & { nama?: string; username?: string };
      list.push({
        id: izin.id,
        user_id: izin.user_id,
        jenis_izin: izin.jenis_izin,
        tanggal_izin: izin.tanggal_izin,
        alasan: izin.alasan,
        foto_bukti: izin.foto_bukti,
        status: izin.status,
        created_at: String(izin.created_at),
        updated_at: String(izin.updated_at),
        nama: row.nama ?? "",
        username: row.username ?? "",
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

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, foto_bukti } = body;

    if (!id || !status || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "ID dan status wajib diisi" },
        { status: 400 }
      );
    }

    await pool.execute(
      `UPDATE izin SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [status, id]
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
