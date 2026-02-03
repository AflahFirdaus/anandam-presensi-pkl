import { cookies } from "next/headers";
import crypto from "crypto";
import pool from "./db";
import type { User, UserRole, SessionWithUserRow } from "./db";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "presensi_session";
const SESSION_MINUTES = parseInt(process.env.SESSION_MINUTES ?? "15");
if (isNaN(SESSION_MINUTES)) {
  throw new Error("SESSION_MINUTES must be a number");
}

export function generateSessionId(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createSession(userId: number): Promise<string> {
  const id = generateSessionId();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + SESSION_MINUTES);
  await pool.execute(
    "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)",
    [id, userId, expiresAt]
  );
  return id;
}

export async function getSession(
  sessionId: string | undefined
): Promise<{ user: User } | null> {
  if (!sessionId) return null;
  const [rows] = await pool.execute<SessionWithUserRow[]>(
    `SELECT s.id, s.user_id, s.expires_at, u.nama, u.username, u.role, u.is_active, u.created_at, u.updated_at
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = ? AND s.expires_at > NOW() AND u.is_active = 1`,
    [sessionId]
  );
  if (!rows.length) return null;
  const r = rows[0];
  return {
    user: {
      id: r.user_id,
      nama: r.nama,
      username: r.username,
      role: r.role,
      is_active: r.is_active,
      created_at: r.created_at,
      updated_at: r.updated_at,
    },
  };
}

export async function deleteSession(sessionId: string): Promise<void> {
  await pool.execute("DELETE FROM sessions WHERE id = ?", [sessionId]);
}

export async function getSessionFromRequest(): Promise<{
  user: User;
  sessionId: string;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const data = await getSession(token);
  if (!data || !token) return null;
  return { ...data, sessionId: token };
}

export function sessionCookieHeader(
  sessionId: string,
  maxAgeSeconds: number =  15 * 60// 15 minutes
): string {
  return `${COOKIE_NAME}=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}
