import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

/** DELETE presensi per bulan. Body: { month: "YYYY-MM" } */
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { month?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body harus JSON dengan field month (YYYY-MM)" },
      { status: 400 }
    );
  }

  const month = body.month;
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json(
      { error: "Field month wajib, format YYYY-MM (contoh: 2026-01)" },
      { status: 400 }
    );
  }

  const [y, m] = month.split("-").map(Number);
  const startDate = `${month}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const endDate = `${month}-${String(lastDay).padStart(2, "0")}`;

  const [result] = await pool.execute(
    "DELETE FROM presensi WHERE tanggal >= ? AND tanggal <= ?",
    [startDate, endDate]
  );
  const affected = Array.isArray(result) ? 0 : (result as { affectedRows: number }).affectedRows ?? 0;

  return NextResponse.json({
    success: true,
    deleted: affected,
    message: `${affected} presensi bulan ${month} telah dihapus.`,
  });
}
