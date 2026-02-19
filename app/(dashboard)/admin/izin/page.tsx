"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type IzinRequest = {
  id: number;
  user_id: number;
  nama: string;
  username: string;
  tanggal_mulai: string;
  jam_mulai: string;
  tanggal_selesai: string;
  jam_selesai: string;
  alasan: string;
  status: string;
  foto_bukti: string | null;
  created_at: string;
  updated_at: string;
};

export default function AdminIzinPage() {
  const [izinRequests, setIzinRequests] = useState<IzinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [action, setAction] = useState<"APPROVE" | "REJECT" | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [fotoBukti, setFotoBukti] = useState<string | null>(null);

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
        body: JSON.stringify({
          id: selectedId,
          status: "APPROVED",
          foto_bukti: fotoBukti || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "err", text: data.error ?? "Gagal mengapprove izin" });
        return;
      }

      setMessage({ type: "ok", text: data.message ?? "Izin berhasil disetujui" });
      setSelectedId(null);
      setAction(null);
      setFotoBukti(null);
      fetchIzinRequests();
    } catch (error) {
      setMessage({ type: "err", text: "Koneksi gagal" });
    }
  };

  const handleReject = async () => {
    if (!selectedId) return;

    try {
      const res = await fetch("/api/admin/izin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedId,
          status: "REJECTED",
          foto_bukti: fotoBukti || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "err", text: data.error ?? "Gagal menolak izin" });
        return;
      }

      setMessage({ type: "ok", text: data.message ?? "Izin berhasil ditolak" });
      setSelectedId(null);
      setAction(null);
      setFotoBukti(null);
      fetchIzinRequests();
    } catch (error) {
      setMessage({ type: "err", text: "Koneksi gagal" });
    }
  };

  const openActionModal = (id: number, status: string) => {
    setSelectedId(id);
    setAction(status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="animate-slide-up w-full">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Manajemen Izin Ganti Hari</h1>
        <Link
          href="/admin/izin"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
        >
          Ke Panel Izin
        </Link>
      </div>

      {izinRequests.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-500">Belum ada permintaan izin</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {izinRequests.map((request) => (
            <div
              key={request.id}
              className={`rounded-xl border-2 p-4 transition ${
                request.status === "PENDING"
                  ? "border-amber-200 bg-amber-50"
                  : request.status === "APPROVED"
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800">{request.nama}</h3>
                  <p className="text-xs text-slate-500">{request.username}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    request.status === "PENDING"
                      ? "bg-amber-200 text-amber-800"
                      : request.status === "APPROVED"
                      ? "bg-green-200 text-green-800"
                      : "bg-red-200 text-red-800"
                  }`}
                >
                  {request.status === "PENDING" ? "Menunggu" : request.status === "APPROVED" ? "Disetujui" : "Ditolak"}
                </span>
              </div>

              <div className="mb-3 space-y-1 text-sm">
                <p className="text-slate-600">
                  <span className="font-medium text-slate-700">Tanggal:</span>
                  {request.tanggal_mulai} - {request.tanggal_selesai}
                </p>
                <p className="text-slate-600">
                  <span className="font-medium text-slate-700">Jam:</span>
                  {request.jam_mulai} - {request.jam_selesai}
                </p>
              </div>

              <p className="mb-3 text-sm text-slate-600">{request.alasan}</p>

              {request.foto_bukti && (
                <div className="mb-3 max-w-xs overflow-hidden rounded-lg border">
                  <img
                    src={request.foto_bukti}
                    alt="Bukti"
                    className="h-32 w-full object-cover"
                  />
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{new Date(request.created_at).toLocaleDateString("id-ID")}</span>
                {request.status === "PENDING" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => openActionModal(request.id, "APPROVE")}
                      className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 transition"
                    >
                      Setujui
                    </button>
                    <button
                      onClick={() => openActionModal(request.id, "REJECT")}
                      className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 transition"
                    >
                      Tolak
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {selectedId && action && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">
              {action === "APPROVE" ? "Setujui Izin" : "Tolak Izin"}
            </h3>

            {action === "REJECT" && (
              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Alasan Penolakan</label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                />
              </div>
            )}

            {action === "APPROVE" && (
              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Foto Bukti (opsional)</label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full text-sm text-slate-500"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFotoBukti(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
            )}

            {message && (
              <div className={`mb-4 rounded-lg px-4 py-2 text-sm ${message.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                {message.text}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={action === "APPROVE" ? handleApprove : handleReject}
                className="flex-1 rounded-lg px-4 py-2 font-medium text-white transition"
              >
                {action === "APPROVE" ? "Setujui" : "Tolak"}
              </button>
              <button
                onClick={() => {
                  setSelectedId(null);
                  setAction(null);
                  setFotoBukti(null);
                  setMessage(null);
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
