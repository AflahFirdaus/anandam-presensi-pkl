"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Stethoscope, RefreshCw, CheckCircle, XCircle, ArrowLeft, Calendar, Clock, Loader2, ThumbsUp, ThumbsDown } from "lucide-react";

type IzinRequest = {
  id: number;
  user_id: number;
  nama: string;
  username: string;
  jenis_izin: string;
  tanggal_izin: string;
  alasan: string;
  status: string;
  foto_bukti: string | null;
  created_at: string;
  updated_at: string;
  tanggal_ganti: Array<{ tanggal_ganti: string; jam_mulai: string | null; jam_selesai: string | null }>;
};

const formatDate = (dateString: string | number | Date) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export default function AdminIzinPage() {
  const [izinRequests, setIzinRequests] = useState<IzinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [action, setAction] = useState<"APPROVE" | "REJECT" | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetchIzinRequests();
  }, []);

  const fetchIzinRequests = async () => {
    try {
      const res = await fetch("/api/admin/izin");
      const data = await res.json();
      setIzinRequests(data.izin_requests || []);
    } catch (error) {
      console.error("Error fetching izin requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedId) return;
    try {
      const res = await fetch("/api/admin/izin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedId, status: "APPROVED" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: data.error ?? "Gagal mengapprove izin" });
        return;
      }
      setMessage({ type: "ok", text: data.message ?? "Izin berhasil disetujui" });
      setSelectedId(null);
      setAction(null);
      fetchIzinRequests();
    } catch {
      setMessage({ type: "err", text: "Koneksi gagal" });
    }
  };

  const handleReject = async () => {
    if (!selectedId) return;
    try {
      const res = await fetch("/api/admin/izin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedId, status: "REJECTED" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: data.error ?? "Gagal menolak izin" });
        return;
      }
      setMessage({ type: "ok", text: data.message ?? "Izin berhasil ditolak" });
      setSelectedId(null);
      setAction(null);
      fetchIzinRequests();
    } catch {
      setMessage({ type: "err", text: "Koneksi gagal" });
    }
  };

  const openActionModal = (id: number, status: "APPROVE" | "REJECT") => {
    setSelectedId(id);
    setAction(status);
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="animate-slide-up w-full">
      <div className="mb-8 rounded-2xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Manajemen Izin</h1>
            <p className="mt-1 text-sm text-white/70">Setujui atau tolak permintaan izin sakit & tukar shift</p>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
            Ke Panel Admin
          </Link>
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
            message.type === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
          }`}
        >
          {message.type === "ok" ? <CheckCircle className="h-5 w-5 shrink-0" /> : <XCircle className="h-5 w-5 shrink-0" />}
          {message.text}
        </div>
      )}

      {izinRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/50 py-16 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-200">
            <RefreshCw className="h-7 w-7 text-slate-500" />
          </div>
          <p className="font-medium text-slate-600">Belum ada permintaan izin</p>
          <p className="mt-1 text-sm text-slate-500">Semua permintaan akan muncul di sini</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {izinRequests.map((request) => (
            <div
              key={request.id}
              className={`overflow-hidden rounded-2xl border-2 bg-white shadow-sm transition hover:shadow-md ${
                request.status === "PENDING"
                  ? "border-amber-200/80 bg-gradient-to-br from-amber-50/50 to-white"
                  : request.status === "APPROVED"
                    ? "border-emerald-200/80 bg-gradient-to-br from-emerald-50/30 to-white"
                    : "border-red-200/80 bg-gradient-to-br from-red-50/30 to-white"
              }`}
            >
              <div className="p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        request.jenis_izin === "SAKIT" ? "bg-red-100 text-red-600" : "bg-indigo-100 text-indigo-600"
                      }`}
                    >
                      {request.jenis_izin === "SAKIT" ? <Stethoscope className="h-5 w-5" /> : <RefreshCw className="h-5 w-5" />}
                    </div>
                    <div>
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                          request.jenis_izin === "SAKIT" ? "bg-red-100 text-red-700" : "bg-indigo-100 text-indigo-700"
                        }`}
                      >
                        {request.jenis_izin === "SAKIT" ? "Izin Sakit" : "Tukar Shift"}
                      </span>
                      <h3 className="mt-1.5 font-semibold text-slate-800">{request.nama}</h3>
                      <p className="text-xs text-slate-500">@{request.username}</p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                      request.status === "PENDING"
                        ? "bg-amber-100 text-amber-800"
                        : request.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {request.status === "PENDING" && <Clock className="h-3.5 w-3.5" />}
                    {request.status === "APPROVED" && <CheckCircle className="h-3.5 w-3.5" />}
                    {request.status === "REJECTED" && <XCircle className="h-3.5 w-3.5" />}
                    {request.status === "PENDING" ? "Menunggu" : request.status === "APPROVED" ? "Disetujui" : "Ditolak"}
                  </span>
                </div>

                <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="font-medium">Izin:</span> {formatDate(request.tanggal_izin)}
                  </span>
                </div>

                <div className="mb-3 text-sm text-slate-600">
                  <span className="font-medium text-slate-700 block mb-1">Rencana Ganti Jam:</span>
                  {request.jenis_izin === "SAKIT" ? (
                    <span className="text-slate-400 italic">Tidak diperlukan (Izin Sakit)</span>
                  ) : request.tanggal_ganti && request.tanggal_ganti.length > 0 ? (
                    <div className="flex flex-col gap-1 ml-1 border-l-2 border-indigo-100 pl-3">
                      {request.tanggal_ganti.map((g, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-indigo-600">•</span>
                          <span>{formatDate(g.tanggal_ganti)}</span>
                          <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                            {g.jam_mulai ?? "00:00"} – {g.jam_selesai ?? "00:00"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-amber-600 italic">Belum mengisi tanggal ganti</span>
                  )}
                </div>

                <p className="mb-4 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-dashed border-slate-200">
                  <span className="font-semibold text-slate-700">Alasan:</span> {request.alasan}
                </p>

                {request.foto_bukti && (
                  <div className="mb-4 group relative overflow-hidden rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="absolute top-2 left-2 z-10 bg-black/50 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm">
                      Bukti Foto
                    </div>
                    <img
                      src={request.foto_bukti.startsWith("data:") ? request.foto_bukti : `/${request.foto_bukti}`}
                      alt="Bukti Izin"
                      className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs text-slate-400">
                    {new Date(request.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  {request.status === "PENDING" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openActionModal(request.id, "APPROVE")}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                        Setujui
                      </button>
                      <button
                        onClick={() => openActionModal(request.id, "REJECT")}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700"
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                        Tolak
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedId && action && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className={`p-5 ${action === "APPROVE" ? "bg-emerald-50" : "bg-red-50"}`}>
              <h3 className="text-lg font-semibold text-slate-800">
                {action === "APPROVE" ? "Setujui Izin" : "Tolak Izin"}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {action === "APPROVE" ? "Permintaan akan disetujui." : "Permintaan akan ditolak."}
              </p>
            </div>
            <div className="p-5">
              {message && (
                <div
                  className={`mb-4 flex items-center gap-2 rounded-xl px-4 py-2 text-sm ${
                    message.type === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
                  }`}
                >
                  {message.text}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={action === "APPROVE" ? handleApprove : handleReject}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 font-medium text-white transition ${
                    action === "APPROVE" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {action === "APPROVE" ? <ThumbsUp className="h-4 w-4" /> : <ThumbsDown className="h-4 w-4" />}
                  {action === "APPROVE" ? "Setujui" : "Tolak"}
                </button>
                <button
                  onClick={() => {
                    setSelectedId(null);
                    setAction(null);
                    setMessage(null);
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
