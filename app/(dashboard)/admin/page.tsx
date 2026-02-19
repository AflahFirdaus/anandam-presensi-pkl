import { getSessionFromRequest } from "@/lib/auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import type { PresensiListRow } from "@/lib/db";
import AdminPresensiList from "./AdminPresensiList";
import Version from "../components/Version";

type IzinForDateRow = {
  id: number;
  user_id: number;
  nama: string;
  username: string;
  jenis_izin: string;
  tanggal_izin: string;
  alasan: string;
  foto_bukti: string | null;
};

export default async function AdminPresensiPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; status?: string }>;
}) {
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "ADMIN") redirect("/");
  const { date, status } = await searchParams;
  const tanggal = date ?? new Date().toISOString().slice(0, 10);
  const [rows] = await pool.execute<PresensiListRow[]>(
    `SELECT p.id, p.user_id, u.nama, u.username, p.jam_masuk, p.jam_keluar, p.masuk_status, p.keluar_status, 
     p.masuk_lat, p.masuk_lng, p.keluar_lat, p.keluar_lng, p.foto_masuk_path, p.foto_keluar_path,
     p.status_kehadiran, p.masuk_lokasi_valid
     FROM presensi p JOIN users u ON u.id = p.user_id WHERE p.tanggal = ? ORDER BY p.jam_masuk ASC`,
    [tanggal]
  );

  const [izinRows] = await pool.execute<IzinForDateRow[]>(
    `SELECT i.id, i.user_id, i.jenis_izin, i.tanggal_izin, i.alasan, i.foto_bukti, u.nama, u.username
     FROM izin i
     JOIN users u ON u.id = i.user_id
     WHERE i.tanggal_izin = ? AND i.status = 'APPROVED'
     ORDER BY u.nama`,
    [tanggal]
  );

  const list = rows.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    nama: r.nama,
    username: r.username,
    jam_masuk: r.jam_masuk,
    jam_keluar: r.jam_keluar,
    masuk_status: r.masuk_status ?? null,
    keluar_status: r.keluar_status ?? null,
    masuk_lat: r.masuk_lat ?? null,
    masuk_lng: r.masuk_lng ?? null,
    keluar_lat: r.keluar_lat ?? null,
    keluar_lng: r.keluar_lng ?? null,
    foto_masuk_path: r.foto_masuk_path,
    foto_keluar_path: r.foto_keluar_path,
    status_kehadiran: r.status_kehadiran ?? null,
    masuk_lokasi_valid: r.masuk_lokasi_valid ?? null,
  }));

  const initialStatus = (status === 'SAKIT' || status === 'KANTOR' || status === 'LUAR_KANTOR') ? status : 'ALL';
  const izinList = izinRows.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    nama: r.nama,
    username: r.username,
    jenis_izin: r.jenis_izin,
    tanggal_izin: r.tanggal_izin,
    alasan: r.alasan,
    foto_bukti: r.foto_bukti,
  }));

  return (
    <div className="animate-slide-up w-full">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/50 sm:p-8">
        <h1 className="mb-6 text-xl font-bold text-slate-800">Presensi per Tanggal</h1>
        <AdminPresensiList
          initialDate={tanggal}
          initialList={list}
          initialIzinList={izinList}
          initialStatusFilter={initialStatus}
        />
      </div>
      <Version />
    </div>
  );
}
