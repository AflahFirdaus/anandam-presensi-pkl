import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import type { UserLoginRow } from "@/lib/db";
import { createSession, sessionCookieHeader } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username dan password wajib" },
        { status: 400 }
      );
    }
    const [rows] = await pool.execute<UserLoginRow[]>(
      "SELECT id, password, is_active FROM users WHERE username = ?",
      [String(username).trim()]
    );
    if (!rows.length) {
      return NextResponse.json({ error: "Username atau password salah" }, { status: 401 });
    }
    const user = rows[0];
    if (user.is_active !== 1) {
      return NextResponse.json({ error: "Akun nonaktif" }, { status: 403 });
    }
    const ok = await bcrypt.compare(String(password), user.password);
    if (!ok) {
      return NextResponse.json({ error: "Username atau password salah" }, { status: 401 });
    }
    const sessionId = await createSession(user.id);
    const res = NextResponse.json({ message: "Login berhasil. Selamat datang di Anandam.ID" });
    res.headers.set("Set-Cookie", sessionCookieHeader(sessionId));
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
