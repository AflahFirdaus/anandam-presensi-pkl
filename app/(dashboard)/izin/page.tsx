"use client";

import { useState, useEffect, useRef } from "react";
import { FileText, Calendar, Stethoscope, RefreshCw, Clock, CheckCircle, XCircle, Loader2, History, Send, Plus, Trash2, ImageIcon } from "lucide-react";

type TanggalGantiItem = {
  tanggal_ganti: string;
  jam_mulai: string;
  jam_selesai: string;
};

type IzinRequest = {
  id: number;
  jenis_izin: string;
  tanggal_izin: string;
  alasan: string;
  status: string;
  foto_bukti: string | null;
  created_at: string;
  nama: string;
  username: string;
  tanggal_ganti: Array<{ tanggal_ganti: string; jam_mulai: string | null; jam_selesai: string | null }>;
};

type JenisIzin = "SAKIT" | "TUKAR_SHIFT";

const formatDate = (dateString: string | number | Date) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function IzinPage() {
  const [activeTab, setActiveTab] = useState<"submit" | "history">("submit");
  const [jenisIzin, setJenisIzin] = useState<JenisIzin>("TUKAR_SHIFT");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [tanggalIzin, setTanggalIzin] = useState("");
  const [alasan, setAlasan] = useState("");
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreviewUrl, setFotoPreviewUrl] = useState<string | null>(null);
  const fotoPreviewRef = useRef<string | null>(null);
  const [tanggalGantiList, setTanggalGantiList] = useState<TanggalGantiItem[]>([
    { tanggal_ganti: "", jam_mulai: "", jam_selesai: "" },
  ]);
  

  const [myRequests, setMyRequests] = useState<IzinRequest[]>([]);

  useEffect(() => {
    fetchMyRequests();
  }, []);

  // Revoke object URL saat ganti file atau unmount (hindari memory leak + ERR_INVALID_URL dari data URL)
  useEffect(() => {
    return () => {
      if (fotoPreviewRef.current) {
        URL.revokeObjectURL(fotoPreviewRef.current);
        fotoPreviewRef.current = null;
      }
    };
  }, []);

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fotoPreviewRef.current) {
      URL.revokeObjectURL(fotoPreviewRef.current);
      fotoPreviewRef.current = null;
    }
    setFotoPreviewUrl(null);
    setFotoFile(null);
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      fotoPreviewRef.current = url;
      setFotoPreviewUrl(url);
      setFotoFile(file);
    }
    e.target.value = "";
  };

  const fetchMyRequests = async () => {
    try {
      const res = await fetch("/api/izin/my-requests");
      const data = await res.json();
      setMyRequests(data.izin_requests || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  const addTanggalGanti = () => {
    setTanggalGantiList((prev) => [...prev, { tanggal_ganti: "", jam_mulai: "", jam_selesai: "" }]);
  };

  const removeTanggalGanti = (index: number) => {
    if (tanggalGantiList.length <= 1) return;
    setTanggalGantiList((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTanggalGanti = (index: number, field: keyof TanggalGantiItem, value: string) => {
    setTanggalGantiList((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    if (jenisIzin === "SAKIT") {
      if (!fotoFile) {
        setMessage({ type: "err", text: "Foto surat dokter wajib diupload untuk izin sakit." });
        setIsLoading(false);
        return;
      }
    } else {
      const validGanti = tanggalGantiList.filter((item) => item.tanggal_ganti.trim() !== "");
      if (validGanti.length === 0) {
        setMessage({ type: "err", text: "Minimal satu tanggal ganti harus diisi untuk tukar shift." });
        setIsLoading(false);
        return;
      }
    }

    const payload: Record<string, unknown> = {
      jenis_izin: jenisIzin,
      tanggal_izin: tanggalIzin,
      alasan: alasan.trim() || "",
      foto_bukti: null as string | null,
    };
    if (jenisIzin === "TUKAR_SHIFT") {
      const validGanti = tanggalGantiList.filter((item) => item.tanggal_ganti.trim() !== "");
      payload.tanggal_ganti = validGanti.map((item) => ({
        tanggal_ganti: item.tanggal_ganti,
        jam_mulai: item.jam_mulai || null,
        jam_selesai: item.jam_selesai || null,
      }));
    } else {
      payload.tanggal_ganti = [];
    }

    // Baca file sebagai base64 hanya saat kirim (hindari data URL panjang di DOM)
    if (fotoFile) {
      try {
        payload.foto_bukti = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string) || "");
          reader.onerror = () => reject(new Error("Gagal membaca file"));
          reader.readAsDataURL(fotoFile);
        });
      } catch {
        setMessage({ type: "err", text: "Gagal membaca file foto." });
        setIsLoading(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/izin/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "err", text: data.error ?? "Gagal mengirim permintaan izin" });
        return;
      }

      setMessage({ type: "ok", text: data.message ?? "Permintaan izin berhasil dikirim" });
      fetchMyRequests();

      setTanggalIzin("");
      setAlasan("");
      if (fotoPreviewRef.current) {
        URL.revokeObjectURL(fotoPreviewRef.current);
        fotoPreviewRef.current = null;
      }
      setFotoPreviewUrl(null);
      setFotoFile(null);
      setTanggalGantiList([{ tanggal_ganti: "", jam_mulai: "", jam_selesai: "" }]);
    } catch (error) {
      setMessage({ type: "err", text: "Koneksi gagal" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-slide-up w-full">
      {/* Header dengan tab */}
      <div className="mb-8 rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 p-6 text-white shadow-xl shadow-indigo-900/20">
        <h1 className="mb-1 text-2xl font-bold tracking-tight">Izin & Cuti</h1>
        <p className="mb-6 text-sm text-white/80">Ajukan izin sakit atau tukar shift</p>
        <div className="flex gap-1 rounded-xl bg-white/10 p-1 backdrop-blur-sm">
          <button
            onClick={() => setActiveTab("submit")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition ${
              activeTab === "submit" ? "bg-white text-indigo-700 shadow" : "text-white/90 hover:bg-white/10"
            }`}
          >
            <FileText className="h-4 w-4" />
            Buat Izin Baru
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition ${
              activeTab === "history" ? "bg-white text-indigo-700 shadow" : "text-white/90 hover:bg-white/10"
            }`}
          >
            <History className="h-4 w-4" />
            Riwayat
          </button>
        </div>
      </div>

      {activeTab === "submit" ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/30 sm:p-8">
          <div className="mb-8">
            <p className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-600">
              <FileText className="h-4 w-4 text-indigo-500" />
              Pilih jenis izin
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setJenisIzin("SAKIT")}
                className={`group rounded-2xl border-2 p-5 text-left transition-all ${
                  jenisIzin === "SAKIT"
                    ? "border-red-400 bg-gradient-to-br from-red-50 to-rose-50 shadow-lg shadow-red-100"
                    : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-100/50"
                }`}
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600 group-hover:bg-red-200">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <span className="block font-semibold text-slate-800">Izin Sakit</span>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Tidak masuk hari itu, wajib upload foto surat dokter. Tidak ada hutang.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setJenisIzin("TUKAR_SHIFT")}
                className={`group rounded-2xl border-2 p-5 text-left transition-all ${
                  jenisIzin === "TUKAR_SHIFT"
                    ? "border-indigo-400 bg-gradient-to-br from-indigo-50 to-blue-50 shadow-lg shadow-indigo-100"
                    : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-100/50"
                }`}
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200">
                  <RefreshCw className="h-6 w-6" />
                </div>
                <span className="block font-semibold text-slate-800">Tukar Shift</span>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Tidak masuk, diganti di hari lain (bisa dicicil).
                </p>
              </button>
            </div>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="rounded-xl bg-slate-50/80 p-4">
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                <Calendar className="h-4 w-4 text-indigo-500" />
                Tanggal Izin (hari tidak masuk) *
              </label>
              <input
                type="date"
                value={tanggalIzin}
                onChange={(e) => setTanggalIzin(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {jenisIzin === "TUKAR_SHIFT" && (
              <div className="rounded-xl bg-slate-50/80 p-4">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Clock className="h-4 w-4 text-indigo-500" />
                  Tanggal Ganti *
                </label>
                <p className="mb-3 text-xs text-slate-500">
                  Hari pengganti ketidakhadiran. Bisa lebih dari satu (misal 8 jam dicicil 2×4 jam).
                </p>
                {tanggalGantiList.map((item, index) => (
                  <div key={index} className="mb-3 flex flex-wrap items-end gap-2 rounded-xl border border-slate-200/80 bg-white p-3">
                    <div className="min-w-[120px] flex-1">
                      <input
                        type="date"
                        value={item.tanggal_ganti}
                        onChange={(e) => updateTanggalGanti(index, "tanggal_ganti", e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="time"
                        value={item.jam_mulai}
                        onChange={(e) => updateTanggalGanti(index, "jam_mulai", e.target.value)}
                        className="w-28 rounded-lg border border-slate-200 px-2 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                      />
                      <input
                        type="time"
                        value={item.jam_selesai}
                        onChange={(e) => updateTanggalGanti(index, "jam_selesai", e.target.value)}
                        className="w-28 rounded-lg border border-slate-200 px-2 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTanggalGanti(index)}
                      disabled={tanggalGantiList.length <= 1}
                      className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTanggalGanti}
                  className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 transition hover:border-indigo-400 hover:bg-indigo-50/50 hover:text-indigo-700"
                >
                  <Plus className="h-4 w-4" />
                  Tambah tanggal ganti
                </button>
              </div>
            )}

            <div className="rounded-xl bg-slate-50/80 p-4">
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                <FileText className="h-4 w-4 text-indigo-500" />
                Alasan {jenisIzin === "TUKAR_SHIFT" ? "*" : "(opsional)"}
              </label>
              <textarea
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                required={jenisIzin === "TUKAR_SHIFT"}
                rows={3}
                placeholder={jenisIzin === "SAKIT" ? "Opsional" : "Jelaskan alasan izin..."}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="rounded-xl bg-slate-50/80 p-4">
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                <ImageIcon className="h-4 w-4 text-indigo-500" />
                {jenisIzin === "SAKIT" ? "Foto surat dokter (wajib)" : "Foto Bukti (opsional)"}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFotoChange}
                className="w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 file:transition hover:file:bg-indigo-100"
              />
              {fotoPreviewUrl && (
                <div className="mt-3 max-w-xs overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                  <img src={fotoPreviewUrl} alt="Preview bukti" className="h-36 w-full object-cover" />
                </div>
              )}
            </div>

            {message && (
              <div
                className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
                  message.type === "ok"
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {message.type === "ok" ? <CheckCircle className="h-5 w-5 shrink-0" /> : <XCircle className="h-5 w-5 shrink-0" />}
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3.5 font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-700 hover:to-violet-700 hover:shadow-indigo-500/40 disabled:opacity-50 disabled:shadow-none"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              {isLoading ? "Memproses..." : "Kirim Permintaan Izin"}
            </button>
          </form>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/30 sm:p-8">
          <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-slate-800">
            <History className="h-5 w-5 text-indigo-500" />
            Riwayat Permintaan Izin
          </h2>
          {myRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50/80 py-16 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-200/80">
                <FileText className="h-7 w-7 text-slate-500" />
              </div>
              <p className="text-slate-600">Belum ada permintaan izin</p>
              <p className="mt-1 text-sm text-slate-500">Klik &quot;Buat Izin Baru&quot; untuk mengajukan</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/50 p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          request.jenis_izin === "SAKIT" ? "bg-red-100 text-red-600" : "bg-indigo-100 text-indigo-600"
                        }`}
                      >
                        {request.jenis_izin === "SAKIT" ? <Stethoscope className="h-5 w-5" /> : <RefreshCw className="h-5 w-5" />}
                      </div>
                      <div>
                        <span
                          className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                            request.jenis_izin === "SAKIT" 
                              ? "bg-red-100 text-red-700" 
                              : "bg-indigo-100 text-indigo-700"
                          }`}
                        >
                          {request.jenis_izin === "SAKIT" ? "Izin Sakit" : "Tukar Shift"}
                        </span>

                        <h3 className="mt-1.5 font-semibold text-slate-800">
                          {/* Perbaikan: Gunakan formatDate di sini */}
                          Tanggal izin: {formatDate(request.tanggal_izin)}
                        </h3>

                        {request.jenis_izin === "TUKAR_SHIFT" && request.tanggal_ganti.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs font-medium text-slate-700">Jadwal Ganti:</p>
                            <div className="text-xs text-slate-500">
                              {request.tanggal_ganti.map((g, idx) => (
                                <div key={idx} className="flex items-center gap-1">
                                  <span>• {formatDate(g.tanggal_ganti)}</span>
                                  <span className="text-slate-400">
                                    ({g.jam_mulai ?? "??:??"} – {g.jam_selesai ?? "??:??"})
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {request.jenis_izin === "SAKIT" && (
                          <p className="mt-1 text-xs text-slate-500 italic">
                            ✨ Tidak ada tanggungan jam (Izin Sakit)
                          </p>
                        )}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium ${
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
                  {request.alasan && <p className="mb-3 text-sm text-slate-600">{request.alasan}</p>}
                  {request.foto_bukti && (
                    <div className="mb-3 max-w-xs overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                      <img
                        src={request.foto_bukti.startsWith("data:") ? request.foto_bukti : `/${request.foto_bukti}`}
                        alt="Bukti"
                        className="h-32 w-full object-cover"
                      />
                    </div>
                  )}
                  <p className="text-xs text-slate-400">Dibuat {new Date(request.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
