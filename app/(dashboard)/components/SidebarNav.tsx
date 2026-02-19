"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { LogoutButton } from "./LogoutButton";

const iconClass = "h-5 w-5 shrink-0";

function IconHome() {
  return (
    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function IconCamera() {
  return (
    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 17v-2a2 2 0 00-2-2H7a2 2 0 00-2 2v2" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

type NavItem = { href: string; label: string; icon: React.ReactNode };

export function SidebarNav({
  user,
  children,
}: {
  user: { nama: string; role: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    setOpen(!mq.matches);
    const fn = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      setOpen(!e.matches);
    };
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [mounted]);

  useEffect(() => {
    if (open && isMobile) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, isMobile]);

  const adminItems: NavItem[] = [
    { href: "/", label: "Beranda", icon: <IconHome /> },
    { href: "/admin", label: "Presensi", icon: <IconCalendar /> },
    { href: "/admin/settings", label: "Pengaturan", icon: <IconSettings /> },
    { href: "/admin/users", label: "User", icon: <IconUsers /> },

  ];

  const pklItems: NavItem[] = [
    { href: "/", label: "Beranda", icon: <IconHome /> },
    { href: "/presensi", label: "Presensi", icon: <IconCamera /> },
    { href: "/izin", label: "Izin", icon: <IconCalendar /> },
  ];

  const items = user.role === "ADMIN" ? adminItems : pklItems;

  const closeSidebar = () => setOpen(false);
  /** Hanya tutup sidebar saat navigasi jika di mobile; di desktop biarkan tetap terbuka */
  const onNavClick = () => {
    if (isMobile) setOpen(false);
  };

  return (
    <>
      {/* Overlay: hanya di mobile saat sidebar terbuka */}
      {open && (
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={closeSidebar}
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
        />
      )}

      {/* Sidebar: geser kiri saat tutup, sama untuk mobile & desktop */}
      <aside
        className={`fixed left-0 top-0 z-30 flex h-screen w-56 flex-col bg-slate-900 text-slate-200 shadow-xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex h-auto flex-col items-start gap-1 border-b border-slate-700/60 px-4 py-3">
          <div className="flex flex-col items-start">
            <Link
              href="/"
              className="font-semibold text-xl text-white transition hover:text-blue-300"
              onClick={onNavClick}
            >
              ANANDAM.ID
            </Link>
            <h4 className="text-sm font-medium text-slate-400">
              Presensi PKL
            </h4>
          </div>
          <button
            type="button"
            onClick={closeSidebar}
            aria-label="Tutup menu"
            className="mt-2 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
          >
            <IconClose />
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavClick}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${isActive ? "bg-blue-600 text-white shadow-md" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-700/60 p-3 mb-16">
          <div className="mb-2 rounded-lg bg-slate-800/50 px-3 py-2 text-xs text-slate-400">
            <p className="truncate font-medium text-slate-200">{user.nama}</p>
            <p>{user.role}</p>
          </div>
          <div className="mb-16"><LogoutButton /></div>
        </div>
      </aside>
      {/* Area utama: di mobile saat open tidak geser (sidebar overlay); di desktop geser pl-56 */}
      <main
        className={`min-w-0 flex-1 transition-all duration-300 ${open && !isMobile ? "pl-56" : "pl-0"
          }`}
      >
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 shadow-sm">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Tutup menu" : "Buka menu"}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
          >
            {open ? <IconClose /> : <IconMenu />}
          </button>
          <span className="text-sm font-medium text-slate-700">Menu</span>
        </header>
        <div className="min-h-screen w-full max-w-full p-4 sm:p-6">{children}</div>
      </main>
    </>
  );
}
