"use client";

import { useEffect } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export default function Modal({ open, onClose, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Tutup"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />
      <div
        className="relative w-full max-w-md animate-scale-in rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

type ModalDeletePresensiProps = {
  open: boolean;
  onClose: () => void;
  month: string;
  onConfirm: () => void;
  loading: boolean;
};

export function ModalDeletePresensi({ open, onClose, month, onConfirm, loading }: ModalDeletePresensiProps) {
  const monthLabel = month
    ? new Date(month + "-01").toLocaleDateString("id-ID", { month: "long", year: "numeric" })
    : "";

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
            <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Hapus data presensi</h3>
            <p className="mt-1 text-sm text-slate-600">
              Semua data presensi bulan <strong>{monthLabel}</strong> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

const AUTO_CLOSE_MS = 2500;

type ModalInfoProps = {
  open: boolean;
  onClose: () => void;
  message: string;
  type?: "info" | "success" | "error";
};

export function ModalInfo({ open, onClose, message, type = "info" }: ModalInfoProps) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, AUTO_CLOSE_MS);
    return () => clearTimeout(t);
  }, [open, onClose]);

  if (!open) return null;

  const icon =
    type === "success" ? (
      <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ) : type === "error" ? (
      <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ) : (
      <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );

  const bgClass =
    type === "success" ? "bg-emerald-50 border-emerald-200" : type === "error" ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" aria-label="Tutup" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div
        className={`relative flex w-full max-w-sm items-center gap-3 rounded-2xl border p-4 shadow-xl animate-scale-in ${bgClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0">{icon}</div>
        <p className="text-sm font-medium text-slate-800">{message}</p>
      </div>
    </div>
  );
}
