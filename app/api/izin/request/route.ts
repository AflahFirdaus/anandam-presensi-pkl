import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import pool from "@/lib/db";
import type { IzinGantiHariRow } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tanggal_mulai, jam_mulai, tanggal_selesai, jam_selesai, alasan, foto_bukti } = body;

    // Validate required fields
    if (!tanggal_mulai || !jam_mulai || !tanggal_selesai || !jam_selesai || !alasan) {
      return NextResponse.json(
        { error: "Semua kolom wajib diisi" },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(`${tanggal_mulai}T${jam_mulai}`);
    const endDate = new Date(`${tanggal_selesai}T${jam_selesai}`);

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: "Tanggal selesai harus setelah tanggal mulai" },
        { status: 400 }
      );
    }

    // Insert izin request
    const [result] = await pool.execute<IzinGantiHariRow[]>(
      `INSERT INTO izin_ganti_hari
        (user_id, tanggal_mulai, jam_mulai, tanggal_selesai, jam_selesai, alasan, status, foto_bukti)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)`,
      [
        session.user.id,
        tanggal_mulai,
        jam_mulai,
        tanggal_selesai,
        jam_selesai,
        alasan,
        foto_bukti,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Permintaan izin ganti hari berhasil dikirim",
      izinId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating izin request:", error);
    return NextResponse.json(
      { error: "Gagal membuat permintaan izin" },
      { status: 500 }
    );
  }
}
