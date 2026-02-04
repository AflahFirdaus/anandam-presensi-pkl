import { redirect } from "next/navigation";
import { getSessionFromRequest } from "@/lib/auth";
import pool from "@/lib/db";
import type { CountRow, AdminStatsRow, PresensiTodayRow } from "@/lib/db";
import Link from "next/link";
import Version from "./components/Version";

export default async function HomePage() {
  const session = await getSessionFromRequest();
  if (!session) redirect("/login");

  const today = new Date().toISOString().slice(0, 10);

  if (session.user.role === "ADMIN") {
    const [[rowCount]] = await pool.execute<CountRow[]>(
      "SELECT COUNT(*) as total FROM users WHERE role = 'PKL' AND is_active = 1"
    );
    const [[stats]] = await pool.execute<AdminStatsRow[]>(
      `SELECT 
        COUNT(*) as total_masuk,
        COALESCE(SUM(CASE WHEN masuk_status = "TELAT" AND (status_kehadiran IS NULL OR status_kehadiran != "SAKIT") THEN 1 ELSE 0 END), 0) as telat,
        COALESCE(SUM(CASE WHEN jam_keluar IS NOT NULL THEN 1 ELSE 0 END), 0) as sudah_pulang,
        COALESCE(SUM(CASE WHEN status_kehadiran = "SAKIT" THEN 1 ELSE 0 END), 0) as sakit,
        COALESCE(SUM(CASE WHEN status_kehadiran != "SAKIT" AND (masuk_lokasi_valid = 1) THEN 1 ELSE 0 END), 0) as kantor,
        COALESCE(SUM(CASE WHEN status_kehadiran != "SAKIT" AND (masuk_lokasi_valid != 1 OR masuk_lokasi_valid IS NULL) THEN 1 ELSE 0 END), 0) as luar
       FROM presensi WHERE tanggal = ?`,
      [today]
    );
    const totalPkl = Number(rowCount?.total ?? 0);
    const totalMasuk = Number(stats?.total_masuk ?? 0);
    const totalTelat = Number(stats?.telat ?? 0);
    const totalPulang = Number(stats?.sudah_pulang ?? 0);
    const countSakit = Number(stats?.sakit ?? 0);
    const countKantor = Number(stats?.kantor ?? 0);
    const countLuar = Number(stats?.luar ?? 0);

    const tepatWaktu = totalMasuk - totalTelat - countSakit;
    const belumPresensi = totalPkl - totalMasuk;

    return (
      <div className="animate-slide-up w-full">
        <h1 className="mb-6 text-2xl font-bold text-slate-800">
          Selamat datang, {session.user.nama}
        </h1>

        {/* Summary Presensi Cards*/}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/50 transition hover:shadow-xl">
            <p className="text-sm font-medium text-slate-500">Total Anak PKL</p>
            <p className="mt-1 text-3xl font-bold text-slate-800">{totalPkl}</p>
            <p className="mt-1 text-xs text-slate-400">User aktif</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/50 transition hover:shadow-xl">
            <p className="text-sm font-medium text-slate-500">Presensi Masuk Hari Ini</p>
            <p className="mt-1 text-3xl font-bold text-blue-600">{totalMasuk}</p>
            <p className="mt-1 text-xs text-slate-400">dari {totalPkl} PKL</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/50 transition hover:shadow-xl">
            <p className="text-sm font-medium text-slate-500">Belum Presensi</p>
            <p className="mt-1 text-3xl font-bold text-amber-600">{belumPresensi}</p>
            <p className="mt-1 text-xs text-slate-400">dari {totalPkl} PKL</p>
          </div>
          <Link href="/admin?status=SAKIT" className="block">
            <div className="cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/50 transition hover:border-red-200 hover:bg-red-50 hover:shadow-xl group">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500 group-hover:text-red-700">Sakit</p>
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
              </div>
              <p className="mt-2 text-3xl font-bold text-slate-800 group-hover:text-red-900">{countSakit}</p>
              <p className="mt-1 text-xs text-slate-400 group-hover:text-red-600">Izin Sakit</p>
            </div>
          </Link>

          <Link href="/admin?status=KANTOR" className="block">
            <div className="cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/50 transition hover:border-blue-200 hover:bg-blue-50 hover:shadow-xl group">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500 group-hover:text-blue-700">Di Kantor</p>
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              </div>
              <p className="mt-2 text-3xl font-bold text-slate-800 group-hover:text-blue-900">{countKantor}</p>
              <p className="mt-1 text-xs text-slate-400 group-hover:text-blue-600">Di Anandam</p>
            </div>
          </Link>

          <Link href="/admin?status=LUAR_KANTOR" className="block">
            <div className="cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/50 transition hover:border-yellow-200 hover:bg-yellow-50 hover:shadow-xl group">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500 group-hover:text-yellow-700">Di Luar Kantor</p>
                <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
              </div>
              <p className="mt-2 text-3xl font-bold text-slate-800 group-hover:text-yellow-900">{countLuar}</p>
              <p className="mt-1 text-xs text-slate-400 group-hover:text-yellow-600">Luar Anandam</p>
            </div>
          </Link>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/50 transition hover:shadow-xl">
            <p className="text-sm font-medium text-slate-500">Tepat Waktu</p>
            <p className="mt-1 text-3xl font-bold text-green-600">{tepatWaktu}</p>
            <p className="mt-1 text-xs text-slate-400">Masuk Sesuai Jam</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/50 transition hover:shadow-xl">
            <p className="text-sm font-medium text-slate-500">Terlambat</p>
            <p className="mt-1 text-3xl font-bold text-amber-600">{totalTelat}</p>
            <p className="mt-1 text-xs text-slate-400">Melebihi Toleransi</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/50">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Ringkasan Hari Ini</h2>
            <Link href="/admin" className="text-sm font-medium text-blue-600 hover:underline">
              Lihat detail presensi →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50/80 p-4">
              <p className="text-sm text-slate-600">Sudah Presensi Pulang</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">{totalPulang}</p>
              <p className="text-xs text-slate-400">Orang</p>
            </div>
            <div className="rounded-xl bg-slate-50/80 p-4">
              <p className="text-sm text-slate-600">Belum Presensi Pulang</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">{Math.max(0, totalMasuk - totalPulang)}</p>
              <p className="text-xs text-slate-400">Masih di Lokasi</p>
            </div>
          </div>
        </div>
        <Version />
      </div>
    );
  }

  const [rows] = await pool.execute<PresensiTodayRow[]>(
    "SELECT jam_masuk, jam_keluar, masuk_status, keluar_status, status_kehadiran FROM presensi WHERE user_id = ? AND tanggal = ?",
    [session.user.id, today]
  );
  const presensi = rows[0] ?? null;

  return (
    <div className="animate-slide-up w-full">
      <h1 className="mb-6 text-2xl font-bold text-slate-800">
        Selamat datang, {session.user.nama}
      </h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/50 transition hover:shadow-xl">
          <p className="text-sm font-medium text-slate-500">Status Presensi Hari Ini</p>
          {presensi?.status_kehadiran === "SAKIT" ? (
            <>
              <p className="mt-2 text-lg font-semibold text-red-600">Izin Sakit</p>
              <p className="mt-1 text-sm text-slate-500">Anda tercatat sakit hari ini.</p>
            </>
          ) : !presensi?.jam_masuk ? (
            <>
              <p className="mt-2 text-lg font-semibold text-amber-600">Belum Absen Masuk</p>
              <p className="mt-1 text-sm text-slate-500">Buka menu Presensi untuk absen masuk (foto + lokasi).</p>
            </>
          ) : (
            <>
              <p className="mt-2 text-lg font-semibold text-green-600">Sudah Absen Masuk</p>
              <p className="mt-1 text-sm text-slate-600">
                Jam masuk: {new Date(presensi.jam_masuk!).toLocaleTimeString("id-ID")}
                {presensi.masuk_status === "TELAT" && (
                  <span className="ml-2 font-medium text-amber-600">(Terlambat)</span>
                )}
              </p>
            </>
          )}
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/50 transition hover:shadow-xl">
          <p className="text-sm font-medium text-slate-500">Presensi Pulang</p>
          {!presensi?.jam_masuk ? (
            <p className="mt-2 text-sm text-slate-500">Presensi pulang setelah Anda absen masuk.</p>
          ) : !presensi.jam_keluar ? (
            <>
              <p className="mt-2 text-lg font-semibold text-amber-600">Belum presensi pulang</p>
              <p className="mt-1 text-sm text-slate-500">Buka menu Presensi untuk absen pulang.</p>
            </>
          ) : (
            <>
              <p className="mt-2 text-lg font-semibold text-green-600">Sudah presensi pulang</p>
              <p className="mt-1 text-sm text-slate-600">
                Jam keluar: {new Date(presensi.jam_keluar).toLocaleTimeString("id-ID")}
                {presensi.keluar_status === "PULANG_CEPAT" && (
                  <span className="ml-2 font-medium text-amber-600">(Pulang cepat)</span>
                )}
              </p>
            </>
          )}
        </div>
      </div>
      <Version />
    </div>
  );
}
