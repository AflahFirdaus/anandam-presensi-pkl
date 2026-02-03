"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { ModalDeletePresensi, ModalInfo } from "../components/Modal";
import { DownloadIcon, TrashIcon } from "lucide-react";

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
  masuk_status: string | null;
  keluar_status: string | null;
  foto_masuk_path: string | null;
  foto_keluar_path: string | null;
};

export default function AdminPresensiList({
  initialDate,
  initialList,
}: {
  initialDate: string;
  initialList: Row[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [date, setDate] = useState(initialDate);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [exportMonth, setExportMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const filteredList = useMemo(
    () =>
      search.trim()
        ? initialList.filter(
            (r) =>
              r.nama.toLowerCase().includes(search.trim().toLowerCase()) ||
              r.username.toLowerCase().includes(search.trim().toLowerCase())
          )
        : initialList,
    [initialList, search]
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
  }, [search, initialDate]);

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setDate(v);
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", v);
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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Tanggal</label>
            <input
              type="date"
              value={date}
              onChange={handleDateChange}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium text-slate-700">Cari nama atau username</label>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ketik nama atau username..."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
        <div className="flex flex-shrink-0 flex-col gap-2">
          <label className="text-sm font-medium text-slate-700">
            Pilih bulan (download & hapus)
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="month"
              value={exportMonth}
              onChange={(e) => setExportMonth(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="button"
              onClick={handleDownloadCsv}
              disabled={downloadLoading}
              className="rounded-xl border border-emerald-600 flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-emerald-600 transition-colors duration-500
 hover:bg-emerald-600 hover:text-white disabled:opacity-50 disabled:pointer-events-none"
            >
              <DownloadIcon className="h-4 w-4 color-emerald-600" /> {downloadLoading ? "Mengunduh..." : "Download CSV"}
            </button>
            <button
              type="button"
              onClick={openDeleteModal}
              disabled={deleteLoading}
              className="rounded-xl border border-red-600 flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors duration-500
 hover:bg-red-600 hover:text-white disabled:opacity-50 disabled:pointer-events-none"
            >
              <TrashIcon className="h-4 w-4 color-red-600" /> Hapus Presensi
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
                  <th className="px-4 py-3 font-semibold text-slate-700">Username</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Jam Masuk</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Status Masuk</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Jam Keluar</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Status Keluar</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Foto</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                      Tidak ada hasil untuk &quot;{search.trim()}&quot;.
                    </td>
                  </tr>
                ) : (
                  paginatedList.map((r, i) => (
                <tr key={r.id} className="border-b border-slate-100 transition hover:bg-slate-50/50" style={{ animationDelay: `${i * 25}ms` }}>
                  <td className="px-4 py-3 font-medium text-slate-800">{r.nama}</td>
                  <td className="px-4 py-3 text-slate-600">{r.username}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {r.jam_masuk ? new Date(r.jam_masuk).toLocaleTimeString("id-ID") : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={r.masuk_status === "TELAT" ? "font-medium text-amber-600" : "font-medium text-green-700"}>
                      {r.masuk_status ?? "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {r.jam_keluar ? new Date(r.jam_keluar).toLocaleTimeString("id-ID") : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={r.keluar_status === "PULANG_CEPAT" ? "font-medium text-amber-600" : "font-medium text-green-700"}>
                      {labelKeluar(r.keluar_status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {r.foto_masuk_path && (
                        <a href={`/${r.foto_masuk_path}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Masuk
                        </a>
                      )}
                      {r.foto_keluar_path && (
                        <a href={`/${r.foto_keluar_path}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Keluar
                        </a>
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
