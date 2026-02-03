import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = Number((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  try {
    const body = await request.json();
    const { nama, username, password, role, is_active } = body;
    const updates: string[] = [];
    const values: (string | number)[] = [];
    if (nama != null) {
      updates.push("nama = ?");
      values.push(String(nama).trim());
    }
    if (username != null) {
      updates.push("username = ?");
      values.push(String(username).trim());
    }
    if (password != null && String(password).length > 0) {
      updates.push("password = ?");
      values.push(await bcrypt.hash(String(password), 10));
    }
    if (role != null) {
      updates.push("role = ?");
      values.push(role === "ADMIN" ? "ADMIN" : "PKL");
    }
    if (is_active != null) {
      updates.push("is_active = ?");
      values.push(is_active ? 1 : 0);
    }
    if (updates.length === 0) {
      return NextResponse.json({ error: "Tidak ada field untuk diupdate" }, { status: 400 });
    }
    values.push(id);
    await pool.execute(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, values);
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = Number((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  if (id === session.user.id) {
    return NextResponse.json({ error: "Tidak bisa menghapus akun sendiri" }, { status: 400 });
  }
  try {
    const [result] = await pool.execute("DELETE FROM users WHERE id = ?", [id]) as [{ affectedRows: number }, unknown];
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
