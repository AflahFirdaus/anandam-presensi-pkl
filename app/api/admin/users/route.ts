import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import type { UserRow } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getSessionFromRequest();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const [rows] = await pool.execute<UserRow[]>("SELECT id, nama, username, role, is_active, created_at FROM users ORDER BY id");
  return NextResponse.json({
    users: rows.map((r) => ({
      id: r.id,
      nama: r.nama,
      username: r.username,
      role: r.role,
      is_active: r.is_active,
      created_at: r.created_at,
    })),
  });
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await request.json();
    const { nama, username, password, role } = body;
    if (!nama || !username || !password) {
      return NextResponse.json({ error: "nama, username, password wajib" }, { status: 400 });
    }
    const r = role === "ADMIN" ? "ADMIN" : "PKL";
    const hash = await bcrypt.hash(String(password), 10);
    await pool.execute(
      "INSERT INTO users (nama, username, password, role) VALUES (?, ?, ?, ?)",
      [String(nama).trim(), String(username).trim(), hash, r]
    );
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ error: "Username sudah dipakai" }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
