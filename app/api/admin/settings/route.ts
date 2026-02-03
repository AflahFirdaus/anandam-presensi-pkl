import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import type { IdRow } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

export async function PUT(request: NextRequest) {
  const session = await getSessionFromRequest();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await request.json();
    const {
      area_name,
      area_lat,
      area_lng,
      area_radius_m,
      jam_masuk,
      jam_pulang,
      schedule_type,
      enabled_shifts,
    } = body;

    const lat = area_lat != null ? Number(area_lat) : null;
    const lng = area_lng != null ? Number(area_lng) : null;
    const radius = area_radius_m != null ? Number(area_radius_m) : null;
    const masuk = jam_masuk != null ? String(jam_masuk).trim() : null;
    const pulang = jam_pulang != null ? String(jam_pulang).trim() : null;
    const st = schedule_type != null && ["WEEKDAY", "SATURDAY", "SUNDAY"].includes(String(schedule_type))
      ? String(schedule_type)
      : null;
    const shifts = Array.isArray(enabled_shifts)
      ? enabled_shifts.filter(
          (s: unknown) =>
            s && typeof s === "object" && "jam_masuk" in s && "jam_pulang" in s
          )
      : [];
    const enabledShiftsJson = shifts.length > 0 ? JSON.stringify(shifts) : null;

    const [existing] = await pool.execute<IdRow[]>("SELECT id FROM settings ORDER BY id DESC LIMIT 1");
    if (existing.length) {
      await pool.execute(
        `UPDATE settings SET area_name=?, area_lat=?, area_lng=?, area_radius_m=?, jam_masuk=?, jam_pulang=?, schedule_type=?, enabled_shifts=?, updated_by=?, updated_at=NOW() WHERE id=?`,
        [area_name ?? null, lat, lng, radius, masuk, pulang, st, enabledShiftsJson, session.user.id, existing[0].id]
      );
    } else {
      await pool.execute(
        `INSERT INTO settings (area_name, area_lat, area_lng, area_radius_m, jam_masuk, jam_pulang, schedule_type, enabled_shifts, updated_by, updated_at) VALUES (?,?,?,?,?,?,?,?,?,NOW())`,
        [area_name ?? null, lat, lng, radius, masuk, pulang, st, enabledShiftsJson, session.user.id]
      );
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
