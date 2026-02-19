import mysql, { type RowDataPacket } from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "presensi_pkl",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;

export type UserRole = "ADMIN" | "PKL";

/** Tipe user untuk API/session (bukan baris DB). */
export interface User {
  id: number;
  nama: string;
  username: string;
  role: UserRole;
  is_active: number;
  created_at: Date;
  updated_at: Date;
}

/** Baris SELECT dari tabel users. Untuk pool.execute<T> harus T extends RowDataPacket[]. */
export interface UserRow extends RowDataPacket {
  id: number;
  nama: string;
  username: string;
  role: string;
  is_active: number;
  created_at: Date;
  updated_at: Date;
}

export interface SessionRow extends RowDataPacket {
  id: string;
  user_id: number;
  expires_at: Date;
  created_at: Date;
}

export interface SettingsRow extends RowDataPacket {
  id: number;
  area_name: string | null;
  area_lat: string | null;
  area_lng: string | null;
  area_radius_m: number | null;
  jam_masuk: string | null;
  jam_pulang: string | null;
  schedule_type: string | null;
  enabled_shifts: { jam_masuk: string; jam_pulang: string }[] | string | null;
  updated_by: number | null;
  updated_at: Date | null;
}

export interface PresensiRow extends RowDataPacket {
  id: number;
  user_id: number;
  tanggal: string;
  jam_masuk: Date | null;
  jam_keluar: Date | null;
  shift_jam_masuk: string | null;
  shift_jam_pulang: string | null;
  foto_masuk_path: string | null;
  foto_keluar_path: string | null;
  masuk_lat: string | null;
  masuk_lng: string | null;
  masuk_accuracy: number | null;
  masuk_distance_m: number | null;
  masuk_status: "TEPAT_WAKTU" | "TELAT" | null;
  masuk_lokasi_valid: number | null;
  keluar_lat: string | null;
  keluar_lng: string | null;
  keluar_accuracy: number | null;
  keluar_distance_m: number | null;
  keluar_status: "SESUAI" | "PULANG_CEPAT" | null;
  keluar_lokasi_valid: number | null;
  total_jam_kerja: string | null;
  created_at: Date;
  updated_at: Date;
}

/** Hasil SELECT COUNT(*) as total */
export interface CountRow extends RowDataPacket {
  total: number;
}

/** Hasil query statistik presensi admin */
export interface AdminStatsRow extends RowDataPacket {
  total_masuk: number;
  telat: number;
  sudah_pulang: number;
  sakit: number;
  kantor: number;
  luar: number;
}

/** Baris presensi hari ini (dashboard PKL) */
export interface PresensiTodayRow extends RowDataPacket {
  jam_masuk: Date | null;
  jam_keluar: Date | null;
  masuk_status: string | null;
  keluar_status: string | null;
  status_kehadiran: string | null;
}

/** Baris list presensi (admin page + API), tanpa tanggal di SELECT admin page */
export interface PresensiListRow extends RowDataPacket {
  id: number;
  user_id: number;
  nama: string;
  username: string;
  jam_masuk: Date | null;
  jam_keluar: Date | null;
  masuk_status: string | null;
  keluar_status: string | null;
  foto_masuk_path: string | null;
  foto_keluar_path: string | null;
  status_kehadiran: string | null;
  masuk_lokasi_valid: number | null;
}

/** Baris list presensi API (dengan tanggal) */
export interface PresensiListApiRow extends RowDataPacket {
  id: number;
  user_id: number;
  nama: string;
  username: string;
  tanggal: string;
  jam_masuk: Date | null;
  jam_keluar: Date | null;
  masuk_status: string | null;
  keluar_status: string | null;
  foto_masuk_path: string | null;
  foto_keluar_path: string | null;
}

/** Baris settings untuk form (area + jam + shift) */
export interface SettingsFormRow extends RowDataPacket {
  area_name: string | null;
  area_lat: string | null;
  area_lng: string | null;
  area_radius_m: number | null;
  jam_masuk: string | null;
  jam_pulang: string | null;
  schedule_type: string | null;
  enabled_shifts: { jam_masuk: string; jam_pulang: string }[] | string | null;
  /** DATE dari MySQL bisa dikembalikan driver sebagai string atau Date */
  force_holiday_date?: Date | string | null;
}

/** Baris hanya id (SELECT id FROM ...) */
export interface IdRow extends RowDataPacket {
  id: number;
}

/** Baris login (users) */
export interface UserLoginRow extends RowDataPacket {
  id: number;
  password: string;
  is_active: number;
}

/** Baris session JOIN users (auth) */
export interface SessionWithUserRow extends RowDataPacket {
  id: string;
  user_id: number;
  expires_at: Date;
  nama: string;
  username: string;
  role: UserRole;
  is_active: number;
  created_at: Date;
  updated_at: Date;
}

/** Baris settings area + jam/shift (presensi in/out) */
export interface SettingsAreaRow extends RowDataPacket {
  area_lat: string;
  area_lng: string;
  area_radius_m: number;
  jam_masuk?: string;
  jam_pulang?: string;
  enabled_shifts?: { jam_masuk: string; jam_pulang: string }[] | string | null;
  /** DATE dari MySQL bisa dikembalikan driver sebagai string atau Date */
  force_holiday_date?: Date | string | null;
}

/** Baris presensi existing (id, jam_masuk, shift jam untuk validasi pulang) */
export interface PresensiExistingRow extends RowDataPacket {
  id: number;
  jam_masuk: Date;
  shift_jam_masuk: string | null;
  shift_jam_pulang: string | null;
  status_kehadiran: string | null;
  foto_sakit_path: string | null;
}

/** Baris jam_keluar */
export interface PresensiKeluarRow extends RowDataPacket {
  jam_keluar: Date | null;
}

/** Baris presensi today API */
export interface PresensiTodayApiRow extends RowDataPacket {
  id: number;
  tanggal: string;
  jam_masuk: Date | null;
  jam_keluar: Date | null;
  foto_masuk_path: string | null;
  foto_keluar_path: string | null;
  foto_sakit_path: string | null;
  masuk_status: string | null;
  keluar_status: string | null;
  status_kehadiran: string | null;
}

/** Baris tabel izin (SAKIT / TUKAR_SHIFT) */
export interface IzinRow extends RowDataPacket {
  id: number;
  user_id: number;
  jenis_izin: "SAKIT" | "TUKAR_SHIFT";
  tanggal_izin: string;
  alasan: string;
  foto_bukti: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: Date;
  updated_at: Date;
}

/** Baris tabel izin_tanggal_ganti */
export interface IzinTanggalGantiRow extends RowDataPacket {
  id: number;
  izin_id: number;
  tanggal_ganti: string;
  jam_mulai: string | null;
  jam_selesai: string | null;
  created_at: Date;
}
