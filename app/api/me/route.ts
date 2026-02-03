import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET() {
  const session = await getSessionFromRequest();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    user: {
      id: session.user.id,
      nama: session.user.nama,
      username: session.user.username,
      role: session.user.role,
    },
  });
}
