import { NextResponse } from "next/server";
import { getSessionFromRequest, deleteSession } from "@/lib/auth";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "presensi_session";

export async function POST() {
  const session = await getSessionFromRequest();
  if (session) {
    await deleteSession(session.sessionId);
  }
  const res = NextResponse.json({ success: true });
  res.headers.set("Set-Cookie", `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  return res;
}
