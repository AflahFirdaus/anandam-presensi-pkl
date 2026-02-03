import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { SettingsRow } from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await pool.execute<SettingsRow[]>(
      "SELECT id, area_name, area_lat, area_lng, area_radius_m, jam_masuk, jam_pulang, updated_by, updated_at FROM settings ORDER BY id DESC LIMIT 1"
    );
    const row = rows[0] ?? null;
    if (!row) {
      return NextResponse.json({
        settings: null,
      });
    }
    return NextResponse.json({
      settings: {
        id: row.id,
        area_name: row.area_name,
        area_lat: row.area_lat,
        area_lng: row.area_lng,
        area_radius_m: row.area_radius_m,
        jam_masuk: row.jam_masuk,
        jam_pulang: row.jam_pulang,
        updated_at: row.updated_at,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
