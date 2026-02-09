"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type PresensiToday = {
  id: number;
  tanggal: string;
  jam_masuk: string | null;
  jam_keluar: string | null;
  foto_masuk_path: string | null;
  foto_keluar_path: string | null;
  foto_sakit_path: string | null;
  masuk_status: string | null;
  keluar_status: string | null;
  status_kehadiran: string | null;
} | null;

export default function PresensiPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [today, setToday] = useState<PresensiToday>(null);
  const [loading, setLoading] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
  } | null>(null);
  const [locError, setLocError] = useState<string | null>(null);
  const [submitType, setSubmitType] = useState<"in" | "out" | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [currentFacingMode, setCurrentFacingMode] = useState<"user" | "environment">("user");

  const loadToday = useCallback(async () => {
    const res = await fetch("/api/presensi/today", {
      cache: "no-store",
      credentials: "include",
    });
    const data = await res.json();
    setToday(data.presensi ?? null);
  }, []);

  const [isSakit, setIsSakit] = useState(false);

  useEffect(() => {
    loadToday().finally(() => setLoading(false));
  }, [loadToday]);

  // Fungsi untuk stop semua stream
  // 1. Perbaiki stopAllStreams: Hapus 'stream' dari dependency array
  const stopAllStreams = useCallback(() => {
    setStream((currentStream) => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
      return null; // Mengosongkan stream
    });
  }, []); // Sekarang dependency-nya KOSONG

  // 2. Perbaiki startCamera: Pastikan dependensinya stabil
  const startCamera = useCallback(async (facingMode: "user" | "environment") => {
    // Stop stream yang ada sebelum mulai yang baru
    // Kita panggil langsung dari state setter agar sinkron
    setStream((currentStream) => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
      return null;
    });

    try {
      console.log(`Attempting to start camera with facing mode: ${facingMode}`);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Browser tidak mendukung akses kamera");
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 720 },
          height: { ideal: 1280 },
        },
      });

      console.log("Camera stream started successfully");
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      // ... sisa kode catch Anda tetap sama
    }
  }, []); // Dependency KOSONG karena kita tidak butuh stopAllStreams di sini lagi

  // Update facing mode saat isSakit berubah
  useEffect(() => {
    if (isSakit) {
      setCurrentFacingMode("environment"); // Gunakan kamera belakang untuk sakit
    } else {
      setCurrentFacingMode("user"); // Gunakan kamera depan untuk presensi biasa
    }
  }, [isSakit]);

  // Start/stop camera saat currentFacingMode berubah
  useEffect(() => {
    startCamera(currentFacingMode);

    return () => {
      stopAllStreams();
    };
  }, [currentFacingMode, startCamera, stopAllStreams]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocError("Geolocation tidak didukung");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        });
        setLocError(null);
      },
      () => setLocError("Lokasi tidak tersedia"),
      { enableHighAccuracy: true }
    );
  }, []);

  function capturePhoto(): string | null {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !stream) return null;

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return null;

    const targetAspectRatio = 9 / 16;
    let finalW = w;
    let finalH = h;
    let sx = 0;
    let sy = 0;

    // If current aspect ratio is wider than target (e.g. landscape vs portrait)
    // We crop the width (sides)
    if (w / h > targetAspectRatio) {
      finalW = h * targetAspectRatio;
      finalH = h;
      sx = (w - finalW) / 2;
      sy = 0;
    } else {
      // If thinner/taller (unlikely for mobile camera issues described, but good to handle)
      // Crop height (top/bottom)
      finalW = w;
      finalH = w / targetAspectRatio;
      sx = 0;
      sy = (h - finalH) / 2;
    }

    canvas.width = finalW;
    canvas.height = finalH;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Draw cropped image
    ctx.drawImage(video, sx, sy, finalW, finalH, 0, 0, finalW, finalH);

    // Return high quality jpeg
    return canvas.toDataURL("image/jpeg", 0.9);
  }

  async function handlePresensi(type: "in" | "out") {
    if (!location) {
      setMessage({ type: "err", text: "Lokasi belum didapat. Izinkan akses lokasi." });
      return;
    }

    // Foto wajib jika sakit atau presensi masuk/pulang biasa
    const foto = capturePhoto();
    if (!foto) {
      setMessage({ type: "err", text: "Gagal mengambil foto dari kamera. Silakan coba lagi." });
      return;
    }

    setSubmitType(type);
    setMessage(null);
    try {
      const url = type === "in" ? "/api/presensi/in" : "/api/presensi/out";
      const bodyPayload: any = {
        foto_base64: foto,
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy,
      };

      if (type === "in" && isSakit) {
        bodyPayload.status_kehadiran = "SAKIT";
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: data.error ?? "Gagal presensi" });
        return;
      }

      let successMsg = "";
      if (type === "in") {
        if (data.status_kehadiran === "SAKIT") {
          successMsg = "Data Sakit berhasil dikirim dengan bukti foto.";
        } else {
          successMsg = `Presensi masuk berhasil (${data.via === "KANTOR" ? "Di Kantor" : "Di Luar Kantor"}).`;
        }
      } else {
        successMsg = `Presensi pulang berhasil (${data.via === "KANTOR" ? "Di Kantor" : "Di Luar Kantor"}).`;
      }

      setMessage({ type: "ok", text: successMsg });
      await loadToday();
    } catch {
      setMessage({ type: "err", text: "Koneksi gagal" });
    } finally {
      setSubmitType(null);
    }
  }

  if (loading) {
    return (
      <div className="animate-fade-in w-full rounded-2xl border border-slate-200/80 bg-white p-8 shadow-lg">
        <div className="flex items-center gap-3 text-slate-600">
          <svg className="h-5 w-5 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24" aria-hidden>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Memuat...
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slide-up w-full">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/50 sm:p-8">
        <h1 className="mb-6 text-xl font-bold text-slate-800">Presensi Hari Ini</h1>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-xl border-2 border-slate-200 bg-slate-900 shadow-inner ring-2 ring-slate-200/50 sm:mx-0">
            <div className="aspect-[4/3] w-full">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="flex flex-1 flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            {location ? (
              <p className="text-sm text-slate-600">
                <span className="font-medium text-slate-700">Lokasi:</span> {location.lat.toFixed(5)}, {location.lng.toFixed(5)} (accuracy ±{location.accuracy}m)
              </p>
            ) : (
              <p className="text-sm text-amber-600">{locError ?? "Mengambil lokasi..."}</p>
            )}
            {today?.jam_masuk && (
              <p className="text-sm text-slate-700">
                <span className="font-medium">Masuk:</span> {new Date(today.jam_masuk).toLocaleTimeString("id-ID")}{" "}
                {today.masuk_status === "TELAT" && <span className="text-amber-600">(Telat)</span>}
              </p>
            )}
            {today?.jam_keluar && (
              <p className="text-sm text-slate-700">
                <span className="font-medium">Keluar:</span> {new Date(today.jam_keluar).toLocaleTimeString("id-ID")}{" "}
                {today.keluar_status === "PULANG_CEPAT" && <span className="text-amber-600">(Pulang cepat)</span>}
              </p>
            )}
          </div>
        </div>

        {message && (
          <div className={`mb-6 animate-fade-in rounded-xl px-4 py-3 text-sm ${message.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
            {message.text}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {!today?.jam_masuk && (
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-slate-50 p-3">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={isSakit}
                  onChange={(e) => setIsSakit(e.target.checked)}
                />

                <div
                  className="relative h-6 w-11 rounded-full bg-slate-300
                    after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full
                    after:bg-white after:transition-all after:content-['']
                    peer-checked:bg-red-600 peer-checked:after:translate-x-full
                    peer-focus:ring-2 peer-focus:ring-red-300"
                />

                <span className="select-none text-sm font-medium text-slate-700">
                  Saya Sakit (wajib upload foto surat dokter)
                </span>
              </label>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {!today?.jam_masuk && (
              <button
                type="button"
                onClick={() => handlePresensi("in")}
                disabled={!!submitType || !location}
                className={`rounded-xl px-5 py-2.5 font-medium text-white shadow-md transition disabled:opacity-50 disabled:shadow-none ${isSakit
                  ? "bg-red-600 shadow-red-600/25 hover:bg-red-700 hover:shadow-red-600/30"
                  : "bg-green-600 shadow-green-600/25 hover:bg-green-700 hover:shadow-green-600/30"
                  }`}
              >
                {submitType === "in" ? "Memproses..." : (isSakit ? "Kirim Sakit & Foto" : "Presensi Masuk")}
              </button>
            )}
            {today?.jam_masuk && !today?.jam_keluar && (
              <button
                type="button"
                onClick={() => handlePresensi("out")}
                disabled={!!submitType || !location || today.status_kehadiran === "SAKIT"}
                className={`rounded-xl px-5 py-2.5 font-medium text-white shadow-md transition disabled:opacity-50 disabled:shadow-none ${today.status_kehadiran === "SAKIT"
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-orange-600 shadow-orange-600/25 hover:bg-orange-700 hover:shadow-orange-600/30"
                  }`}
              >
                {today.status_kehadiran === "SAKIT"
                  ? "Sudah Izin Sakit"
                  : (submitType === "out" ? "Memproses..." : "Presensi Pulang")}
              </button>
            )}
            {today?.jam_masuk && today?.jam_keluar && (
              <p className="rounded-xl bg-slate-100 px-4 py-2.5 text-slate-600">Presensi hari ini sudah lengkap.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
