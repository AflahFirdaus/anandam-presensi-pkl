import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get("q");

    if (!q || q.length < 2) {
      return NextResponse.json({ users: [] });
    }

    // Search for users with similar nama or username
    const [rows] = await pool.query(
      `SELECT id, nama, username FROM users WHERE
       (nama LIKE ? OR username LIKE ?) AND role = 'PKL' AND is_active = 1
       LIMIT 10`,
      [`%${q}%`, `%${q}%`]
    );

    return NextResponse.json({ users: rows });
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json({ users: [] }, { status: 500 });
  }
}
