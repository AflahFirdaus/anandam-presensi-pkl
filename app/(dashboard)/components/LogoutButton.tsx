"use client";

import { useRouter } from "next/navigation";

export function LogoutButton({ variant = "sidebar" }: { variant?: "sidebar" | "plain" }) {
  const router = useRouter();
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }
  if (variant === "sidebar") {
    return (
      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-all duration-200 hover:bg-red-600/20 hover:text-red-400"
      >
        <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Keluar
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={handleLogout}
      className="text-sm text-slate-500 hover:text-slate-700"
    >
      Logout
    </button>
  );
}
