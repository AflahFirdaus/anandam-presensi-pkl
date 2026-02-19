"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type IzinRequest = {
  id: number;
  tanggal_mulai: string;
  jam_mulai: string;
  tanggal_selesai: string;
  jam_selesai: string;
  alasan: string;
  status: string;
  foto_bukti: string | null;
  created_at: string;
  nama: string;
  username: string;
};

type SubmitFormType = "swap_with_colleague" | "day_off" | "shift_swap";

export default function IzinPage() {
  const [activeTab, setActiveTab] = useState<"submit" | "history">("submit");
  const [submitFormType, setSubmitFormType] = useState<SubmitFormType>("swap_with_colleague");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Form state
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [jamMulai, setJamMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [jamSelesai, setJamSelesai] = useState("");
  const [alasan, setAlasan] = useState("");
  const [fotoBukti, setFotoBukti] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [suggestedUsers, setSuggestedUsers] = useState<{ id: number; nama: string; username: string }[]>([]);

  // Get my requests
  const [myRequests, setMyRequests] = useState<IzinRequest[]>([]);

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    try {
      const res = await fetch("/api/izin/my-requests");
      const data = await res.json();
      setMyRequests(data.izin_requests || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  const handleUserSearch = async (query: string) => {
    if (query.length < 2) {
      setSuggestedUsers([]);
      return;
    }

    try {
      const res = await fetch(`/api/users/search?q=${query}`);
      const data = await res.json();
      setSuggestedUsers(data.users || []);
    } catch (error) {
      console.error("Error searching users:", error);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/izin/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tanggal_mulai: tanggalMulai,
          jam_mulai: jamMulai,
          tanggal_selesai: tanggalSelesai,
          jam_selesai: jamSelesai,
          alasan: alasan,
          foto_bukti: fotoBukti || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "err", text: data.error ?? "Gagal mengirim permintaan izin" });
        return;
      }

      setMessage({ type: "ok", text: data.message ?? "Permintaan izin berhasil dikirim" });
      fetchMyRequests();

      // Reset form
      setTanggalMulai("");
      setJamMulai("");
      setTanggalSelesai("");
      setJamSelesai("");
      setAlasan("");
      setFotoBukti(null);
      setSelectedUser(null);
      setSuggestedUsers([]);
    } catch (error) {
      setMessage({ type: "err", text: "Koneksi gagal" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-slide-up w-full">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start">
        <h1 className="mb-4 text-2xl font-bold text-slate-800">Izin Ganti Hari</h1>

        {/* Tabs */}
        <div className="ml-auto flex rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setActiveTab("submit")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === "submit"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Buat Izin Baru
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === "history"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Riwayat
          </button>
        </div>
      </div>

      {activeTab === "submit" ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/50">
          {/* Form Type Selection */}
          <div className="mb-6">
            <label className="mb-3 block text-sm font-medium text-slate-700">Jenis Izin</label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setSubmitFormType("swap_with_colleague")}
                className={`rounded-xl border-2 p-4 text-left transition ${
                  submitFormType === "swap_with_colleague"
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300 bg-slate-50"
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span className="font-semibold text-slate-800">Tukar Shift</span>
                </div>
                <p className="text-xs text-slate-500">
                  Tukar shift dengan teman kerja
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSubmitFormType("day_off")}
                className={`rounded-xl border-2 p-4 text-left transition ${
                  submitFormType === "day_off"
                    ? "border-green-500 bg-green-50"
                    : "border-slate-200 hover:border-slate-300 bg-slate-50"
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold text-slate-800">Libur Hari Ini</span>
                </div>
                <p className="text-xs text-slate-500">
                  Izin untuk hari ini saja
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSubmitFormType("shift_swap")}
                className={`rounded-xl border-2 p-4 text-left transition ${
                  submitFormType === "shift_swap"
                    ? "border-purple-500 bg-purple-50"
                    : "border-slate-200 hover:border-slate-300 bg-slate-50"
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                  <span className="font-semibold text-slate-800">Ganti Hari Libur</span>
                </div>
                <p className="text-xs text-slate-500">
                  Tukar hari libur dengan teman
                </p>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Date Selection */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Tanggal Mulai *
                </label>
                <input
                  type="date"
                  value={tanggalMulai}
                  onChange={(e) => setTanggalMulai(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Jam Mulai *
                </label>
                <input
                  type="time"
                  value={jamMulai}
                  onChange={(e) => setJamMulai(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Tanggal Selesai *
                </label>
                <input
                  type="date"
                  value={tanggalSelesai}
                  onChange={(e) => setTanggalSelesai(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Jam Selesai *
                </label>
                <input
                  type="time"
                  value={jamSelesai}
                  onChange={(e) => setJamSelesai(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            {/* User Selection (for tukar shift) */}
            {submitFormType === "swap_with_colleague" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Teman Kerja *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari nama teman kerja..."
                    onChange={(e) => handleUserSearch(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  {suggestedUsers.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-10 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                      {suggestedUsers.map((user) => (
                        <button
                          type="button"
                          key={user.id}
                          onClick={() => {
                            setSelectedUser(user.id);
                            setSuggestedUsers([]);
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                        >
                          {user.nama} ({user.username})
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedUser && (
                  <p className="mt-1 text-xs text-slate-500">
                    Teman dipilih: {suggestedUsers.find((u) => u.id === selectedUser)?.nama}
                  </p>
                )}
              </div>
            )}

            {/* Alasan */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Alasan *
              </label>
              <textarea
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                required
                rows={3}
                placeholder="Jelaskan alasan izin ganti hari..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {/* Photo Upload */}
            {submitFormType !== "day_off" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Foto Bukti (opsional)
                </label>
                <input
                  type="file"
                  accept="image/*"
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
                  className="w-full text-sm text-slate-500"
                />
                {fotoBukti && (
                  <div className="mt-2 max-w-xs overflow-hidden rounded-lg border">
                    <img src={fotoBukti} alt="Bukti" className="h-32 w-full object-cover" />
                  </div>
                )}
              </div>
            )}

            {/* Message */}
            {message && (
              <div className={`rounded-xl px-4 py-3 text-sm ${message.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                {message.text}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg disabled:opacity-50 disabled:hover:bg-blue-600"
            >
              {isLoading ? "Memproses..." : "Kirim Permintaan Izin"}
            </button>
          </form>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/50">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Riwayat Permintaan Izin</h2>

          {myRequests.length === 0 ? (
            <div className="rounded-xl bg-slate-50 px-4 py-8 text-center">
              <p className="text-sm text-slate-500">Belum ada permintaan izin</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-xl border border-slate-200 p-4 hover:border-slate-300"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        {request.tanggal_mulai} - {request.tanggal_selesai}
                      </h3>
                      <p className="text-xs text-slate-500">{request.jam_mulai} - {request.jam_selesai}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        request.status === "PENDING"
                          ? "bg-amber-100 text-amber-700"
                          : request.status === "APPROVED"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {request.status === "PENDING" ? "Menunggu" : request.status === "APPROVED" ? "Disetujui" : "Ditolak"}
                    </span>
                  </div>

                  <p className="mb-3 text-sm text-slate-600">{request.alasan}</p>

                  {request.foto_bukti && (
                    <div className="mb-3 max-w-xs overflow-hidden rounded-lg border">
                      <img src={request.foto_bukti} alt="Bukti" className="h-32 w-full object-cover" />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Dibuat: {new Date(request.created_at).toLocaleDateString("id-ID")}</span>
                    <span>{request.nama}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
