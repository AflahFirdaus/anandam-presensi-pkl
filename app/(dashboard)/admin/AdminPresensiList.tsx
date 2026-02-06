"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { ModalDeletePresensi, ModalInfo } from "../components/Modal";
import { DownloadIcon, TrashIcon, SearchIcon, CalendarIcon, FilterIcon } from "lucide-react";

const PER_PAGE = 30;

const LABEL_MASUK_STATUS: Record<string, string> = {
  TEPAT_WAKTU: "Tepat Waktu",
  TELAT: "Telat",
};
const LABEL_KELUAR_STATUS: Record<string, string> = {
  SESUAI: "Sesuai",
  PULANG_CEPAT: "Pulang Cepat",
};


function labelMasuk(s: string | null): string {
  if (!s) return "-";
  return LABEL_MASUK_STATUS[s] ?? s;
}
function labelKeluar(s: string | null): string {
  if (!s) return "-";
  return LABEL_KELUAR_STATUS[s] ?? s;
}

type Row = {
  id: number;
  user_id: number;
  nama: string;
  username: string;
  jam_masuk: Date | null;
  jam_keluar: Date | null;
  masuk_lat: number | null;
  masuk_lng: number | null;
  keluar_lat: number | null;
  keluar_lng: number | null;
  masuk_status: string | null;
  keluar_status: string | null;
  foto_masuk_path: string | null;
  foto_keluar_path: string | null;
  status_kehadiran: string | null;
  masuk_lokasi_valid: number | null;
};

function formatTotalJamKerja(jam_masuk: string | Date | null, jam_keluar: string | Date | null): string {
  if (!jam_masuk || !jam_keluar) return "-";
  const start = new Date(jam_masuk).getTime();
  const end = new Date(jam_keluar).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return "-";
  const totalMinutes = Math.floor((end - start) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}j ${String(minutes).padStart(2, "0")}m`;
}

export default function AdminPresensiList({
  initialDate,
  initialList,
  initialStatusFilter = 'ALL',
}: {
  initialDate: string;
  initialList: Row[];
  initialStatusFilter?: 'ALL' | 'SAKIT' | 'KANTOR' | 'LUAR_KANTOR';
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [date, setDate] = useState(initialDate);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SAKIT' | 'KANTOR' | 'LUAR_KANTOR'>(initialStatusFilter);

  const [exportMonth, setExportMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [openPhoto, setOpenPhoto] = useState<string | null>(null);

  // Sync state if prop changes (e.g. navigation)
  useEffect(() => {
    setStatusFilter(initialStatusFilter);
  }, [initialStatusFilter]);

  const filteredList = useMemo(
    () => {
      let filtered = initialList;

      // Filter by Search
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        filtered = filtered.filter(
          (r) =>
            r.nama.toLowerCase().includes(q) ||
            r.username.toLowerCase().includes(q)
        );
      }

      // Filter by Status Summary
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'SAKIT') {
          filtered = filtered.filter(r => r.status_kehadiran === 'SAKIT');
        } else if (statusFilter === 'KANTOR') {
          filtered = filtered.filter(r => r.status_kehadiran !== 'SAKIT' && r.masuk_lokasi_valid === 1);
        } else if (statusFilter === 'LUAR_KANTOR') {
          filtered = filtered.filter(r => r.status_kehadiran !== 'SAKIT' && r.masuk_lokasi_valid !== 1);
        }
      }

      return filtered;
    },
    [initialList, search, statusFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filteredList.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginatedList = filteredList.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);
  const startItem = filteredList.length === 0 ? 0 : (safePage - 1) * PER_PAGE + 1;
  const endItem = Math.min(safePage * PER_PAGE, filteredList.length);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [search, initialDate, statusFilter]);

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setDate(v);
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", v);
    // Keep status if exists, or remove? Better remove when date changes if we want clean state, 
    // but user might want to check SAKIT on other dates. Let's keep status if plausible.
    // Actually current URL logic in Page component reloads pure date. Params are minimal there.
    // If we want to keep status filter, we should append it.
    if (statusFilter !== 'ALL') {
      params.set("status", statusFilter);
    } else {
      params.delete("status");
    }
    router.push(`/admin?${params.toString()}`);
  }

  async function downloadCsvForMonth(month: string) {
    setDownloadLoading(true);
    try {
      const res = await fetch(`/api/admin/presensi/export?month=${month}`, { credentials: "include" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Gagal mengunduh CSV");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `presensi_${month}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Gagal mengunduh CSV");
    } finally {
      setDownloadLoading(false);
    }
  }

  function handleDownloadCsv() {
    downloadCsvForMonth(exportMonth);
  }

  function openDeleteModal() {
    setDeleteModalOpen(true);
  }

  async function handleConfirmDeletePresensi() {
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/admin/presensi/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ month: exportMonth }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? "Gagal menghapus presensi");
        return;
      }
      setDeleteModalOpen(false);
      setInfoMessage(data.message ?? "Presensi bulan tersebut telah dihapus.");
      router.refresh();
    } catch {
      alert("Gagal menghapus presensi");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <ModalDeletePresensi
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        month={exportMonth}
        onConfirm={handleConfirmDeletePresensi}
        loading={deleteLoading}
      />
      <ModalInfo
        open={!!infoMessage}
        onClose={() => setInfoMessage(null)}
        message={infoMessage ?? ""}
        type="success"
      />

      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="date"
              value={date}
              onChange={handleDateChange}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:w-auto"
            />
          </div>

          <div className="relative">
            <FilterIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => {
                const val = e.target.value as 'ALL' | 'SAKIT' | 'KANTOR' | 'LUAR_KANTOR';
                setStatusFilter(val);
                const params = new URLSearchParams(searchParams.toString());
                if (val !== 'ALL') {
                  params.set("status", val);
                } else {
                  params.delete("status");
                }
                router.replace(`/admin?${params.toString()}`);
              }}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-8 text-sm text-slate-800 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:w-auto"
            >
              <option value="ALL">Semua Status</option>
              <option value="KANTOR">Hadir di Kantor</option>
              <option value="LUAR_KANTOR">Luar Kantor</option>
              <option value="SAKIT">Sakit</option>
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau username..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <input
              type="month"
              value={exportMonth}
              onChange={(e) => setExportMonth(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:w-auto"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadCsv}
              disabled={downloadLoading}
              className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
              title="Download CSV"
            >
              <DownloadIcon className="h-4 w-4" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              type="button"
              onClick={openDeleteModal}
              disabled={deleteLoading}
              className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
              title="Hapus Data"
            >
              <TrashIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Hapus</span>
            </button>
          </div>
        </div>
      </div>
      {initialList.length === 0 ? (
        <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-slate-600">Tidak ada presensi pada tanggal ini.</p>
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-600">
            {search.trim()
              ? `Menampilkan ${filteredList.length} dari ${initialList.length} presensi.`
              : `Total ${initialList.length} presensi.`}
            {filteredList.length > PER_PAGE &&
              ` Halaman ${safePage}/${totalPages} (${startItem}-${endItem}).`}
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-4 py-3 font-semibold text-slate-700">Nama</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Status Kehadiran</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Jam Masuk</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Status Masuk</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Titik Masuk</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Jam Keluar</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Status Keluar</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Titik Keluar</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Total Jam</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Foto</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-6 text-center text-slate-500">
                      Tidak ada hasil untuk &quot;{search.trim()}&quot;.
                    </td>
                  </tr>
                ) : (
                  paginatedList.map((r, i) => (
                    <tr key={r.id} className="border-b border-slate-100 transition hover:bg-slate-50/50" style={{ animationDelay: `${i * 25}ms` }}>
                      <td className="px-4 py-3 font-medium text-slate-800">{r.nama}</td>
                      <td className="px-4 py-3 font-medium">
                        {r.status_kehadiran === 'SAKIT' ? (
                          <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">Sakit</span>
                        ) : (
                          r.masuk_lokasi_valid === 1 ? (
                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">Di Anandam</span>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">Luar Anandam</span>
                          )
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {r.jam_masuk ? new Date(r.jam_masuk).toLocaleTimeString("id-ID") : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={r.masuk_status === "TELAT" ? "font-medium text-amber-600" : "font-medium text-green-700"}>
                          {labelMasuk(r.masuk_status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{r.masuk_lat ?? "-"}, {r.masuk_lng ?? "-"}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {r.jam_keluar ? new Date(r.jam_keluar).toLocaleTimeString("id-ID") : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={r.keluar_status === "PULANG_CEPAT" ? "font-medium text-amber-600" : "font-medium text-green-700"}>
                          {labelKeluar(r.keluar_status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{r.keluar_lat ?? "-"}, {r.keluar_lng ?? "-"}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatTotalJamKerja(r.jam_masuk, r.jam_keluar)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {r.foto_masuk_path && (
                            <img
                              src={`/${r.foto_masuk_path}`}
                              alt="Foto Masuk"
                              onClick={() => setOpenPhoto(`/${r.foto_masuk_path}`)} // Set gambar ke state openPhoto
                              className="h-10 w-10 cursor-pointer rounded-md object-cover ring-1 ring-slate-200 hover:ring-blue-500"
                            />
                          )}

                          {r.foto_keluar_path && (
                            <img
                              src={`/${r.foto_keluar_path}`}
                              alt="Foto Keluar"
                              onClick={() => setOpenPhoto(`/${r.foto_keluar_path}`)} // Set gambar ke state openPhoto
                              className="h-10 w-10 cursor-pointer rounded-md object-cover ring-1 ring-slate-200 hover:ring-blue-500"
                            />
                          )}
                          {!r.foto_masuk_path && !r.foto_keluar_path && "-"}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {openPhoto && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
              <div className="relative max-w-3xl rounded-xl bg-white p-1 shadow-xl">
                <button
                  onClick={() => setOpenPhoto(null)}
                  className="absolute right-3 top-1 rounded-md p-1 text-4xl font-bold text-slate-600 hover:text-slate-900"
                  aria-label="Tutup"
                >
                  ×
                </button>
                <img
                  src={openPhoto}
                  alt="Bukti Presensi"
                  className="max-h-[80vh] w-full rounded-lg object-contain"
                />
              </div>
            </div>
          )}
          {totalPages > 1 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3">
              <span className="text-sm text-slate-600">
                Halaman {safePage} dari {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-50"
                >
                  Sebelumnya
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-50"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
