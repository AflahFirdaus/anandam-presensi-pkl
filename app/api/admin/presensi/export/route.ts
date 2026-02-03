import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

interface ExportRow extends RowDataPacket {
  tanggal: string;
  nama: string;
  username: string;
  jam_masuk: Date | null;
  jam_keluar: Date | null;
  masuk_status: string | null;
  keluar_status: string | null;
}

const LABEL_MASUK: Record<string, string> = {
  TEPAT_WAKTU: "Tepat Waktu",
  TELAT: "Telat",
};
const LABEL_KELUAR: Record<string, string> = {
  SESUAI: "Sesuai",
  PULANG_CEPAT: "Pulang Cepat",
};

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatTime(d: Date | null): string {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const month = request.nextUrl.searchParams.get("month");
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json(
      { error: "Parameter month wajib, format YYYY-MM (contoh: 2026-01)" },
      { status: 400 }
    );
  }

  const [y, m] = month.split("-").map(Number);
  const startDate = `${month}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const endDate = `${month}-${String(lastDay).padStart(2, "0")}`;

  const [rows] = await pool.execute<ExportRow[]>(
    `SELECT p.tanggal, u.nama, u.username, p.jam_masuk, p.jam_keluar, p.masuk_status, p.keluar_status
     FROM presensi p
     JOIN users u ON u.id = p.user_id
     WHERE p.tanggal >= ? AND p.tanggal <= ?
     ORDER BY p.tanggal ASC, p.jam_masuk ASC`,
    [startDate, endDate]
  );

  const header = ["Tanggal", "Nama", "Username", "Jam Masuk", "Jam Keluar", "Status Masuk", "Status Keluar"];
  const lines: string[] = [header.map(escapeCsvCell).join(",")];

  for (const r of rows) {
    const tanggal = typeof r.tanggal === "string" ? r.tanggal : r.tanggal ? String(r.tanggal).slice(0, 10) : "";
    const nama = String(r.nama ?? "");
    const username = String(r.username ?? "");
    const jamMasuk = formatTime(r.jam_masuk);
    const jamKeluar = formatTime(r.jam_keluar);
    const statusMasuk = r.masuk_status ? (LABEL_MASUK[r.masuk_status] ?? r.masuk_status) : "";
    const statusKeluar = r.keluar_status ? (LABEL_KELUAR[r.keluar_status] ?? r.keluar_status) : "";
    lines.push(
      [tanggal, nama, username, jamMasuk, jamKeluar, statusMasuk, statusKeluar].map(escapeCsvCell).join(",")
    );
  }

  const csv = "\uFEFF" + lines.join("\r\n");
  const filename = `presensi_${month}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
