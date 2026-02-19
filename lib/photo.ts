import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "presensi");
const UPLOAD_DIR_IZIN = path.join(process.cwd(), "public", "uploads", "izin");

/**
 * Simpan base64 image ke disk. Return path relatif untuk disimpan di DB.
 * Format: presensi/YYYY/MM/userId_timestamp_random.jpg
 */
export async function savePresensiPhoto(
  base64Data: string,
  userId: number,
  type: "masuk" | "keluar" | "sakit"
): Promise<string> {
  const match = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
  const ext = match ? (match[1] === "jpeg" ? "jpg" : match[1]) : "jpg";
  const data = match ? match[2] : base64Data;
  const buf = Buffer.from(data, "base64");

  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const dir = path.join(UPLOAD_DIR, String(y), m);
  await mkdir(dir, { recursive: true });

  const filename = `${userId}_${type}_${now.getTime()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const filePath = path.join(dir, filename);
  await writeFile(filePath, buf);

  return path.join("uploads", "presensi", String(y), m, filename).replace(/\\/g, "/");
}

/**
 * Simpan foto bukti izin (surat dokter dll) ke disk.
 * Return path relatif untuk disimpan di DB: uploads/izin/YYYY/MM/userId_timestamp_random.jpg
 */
export async function saveIzinPhoto(base64Data: string, userId: number): Promise<string> {
  const match = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
  const ext = match ? (match[1] === "jpeg" ? "jpg" : match[1]) : "jpg";
  const data = match ? match[2] : base64Data;
  const buf = Buffer.from(data, "base64");

  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const dir = path.join(UPLOAD_DIR_IZIN, String(y), m);
  await mkdir(dir, { recursive: true });

  const filename = `${userId}_${now.getTime()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const filePath = path.join(dir, filename);
  await writeFile(filePath, buf);

  return path.join("uploads", "izin", String(y), m, filename).replace(/\\/g, "/");
}
