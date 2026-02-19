import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import pool from "@/lib/db";
import { saveIzinPhoto } from "@/lib/photo";
import type { IzinRow } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { jenis_izin, tanggal_izin, alasan, foto_bukti, tanggal_ganti } = body;

    if (!jenis_izin || !tanggal_izin) {
      return NextResponse.json(
        { error: "Jenis izin dan tanggal izin wajib diisi" },
        { status: 400 }
      );
    }

    if (jenis_izin !== "SAKIT" && jenis_izin !== "TUKAR_SHIFT") {
      return NextResponse.json(
        { error: "Jenis izin harus SAKIT atau TUKAR_SHIFT" },
        { status: 400 }
      );
    }

    // Izin Sakit: wajib foto surat dokter, tidak ada hutang/tanggal ganti
    if (jenis_izin === "SAKIT") {
      if (!foto_bukti || typeof foto_bukti !== "string" || !foto_bukti.trim()) {
        return NextResponse.json(
          { error: "Foto surat dokter wajib diupload untuk izin sakit" },
          { status: 400 }
        );
      }
    }

    // Tukar Shift: wajib alasan dan minimal satu tanggal ganti
    const arr = Array.isArray(tanggal_ganti) ? tanggal_ganti : [];
    if (jenis_izin === "TUKAR_SHIFT") {
      if (!alasan || typeof alasan !== "string" || !alasan.trim()) {
        return NextResponse.json(
          { error: "Alasan wajib diisi untuk tukar shift" },
          { status: 400 }
        );
      }
      if (arr.length === 0) {
        return NextResponse.json(
          { error: "Minimal satu tanggal ganti harus diisi (hari pengganti ketidakhadiran)" },
          { status: 400 }
        );
      }
      for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        if (!item || !item.tanggal_ganti) {
          return NextResponse.json(
            { error: `Tanggal ganti ke-${i + 1} wajib diisi` },
            { status: 400 }
          );
        }
      }
    }

    // Simpan foto ke disk dan dapatkan path (bukan simpan base64 di DB)
    let fotoPath: string | null = null;
    if (foto_bukti && typeof foto_bukti === "string" && foto_bukti.trim()) {
      try {
        fotoPath = await saveIzinPhoto(foto_bukti.trim(), session.user.id);
      } catch (err) {
        console.error("Error saving izin photo:", err);
        return NextResponse.json(
          { error: "Gagal menyimpan foto. Pastikan format image valid." },
          { status: 400 }
        );
      }
    }

    const conn = await pool.getConnection();
    try {
      const [result] = await conn.execute<IzinRow[]>(
        `INSERT INTO izin (user_id, jenis_izin, tanggal_izin, alasan, foto_bukti, status)
         VALUES (?, ?, ?, ?, ?, 'PENDING')`,
        [session.user.id, jenis_izin, tanggal_izin, (alasan && String(alasan).trim()) || "", fotoPath]
      );
      const insertId = (result as unknown as { insertId: number }).insertId;
      if (!insertId) {
        return NextResponse.json({ error: "Gagal menyimpan izin" }, { status: 500 });
      }

      // Hanya tukar shift yang punya tanggal ganti (izin sakit tidak dihitung hutang)
      for (const item of arr) {
        const jam_mulai = item.jam_mulai ?? null;
        const jam_selesai = item.jam_selesai ?? null;
        await conn.execute(
          `INSERT INTO izin_tanggal_ganti (izin_id, tanggal_ganti, jam_mulai, jam_selesai) VALUES (?, ?, ?, ?)`,
          [insertId, item.tanggal_ganti, jam_mulai, jam_selesai]
        );
      }

      return NextResponse.json({
        success: true,
        message: "Permintaan izin berhasil dikirim",
        izinId: insertId,
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error("Error creating izin request:", error);
    return NextResponse.json(
      { error: "Gagal membuat permintaan izin" },
      { status: 500 }
    );
  }
}
