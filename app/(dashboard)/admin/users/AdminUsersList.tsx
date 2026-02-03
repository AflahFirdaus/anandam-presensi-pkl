"use client";

import { useState, useMemo, useEffect } from "react";
import { PlusIcon } from "lucide-react";
const PER_PAGE = 30;

type UserRow = {
  id: number;
  nama: string;
  username: string;
  role: string;
  is_active: number;
  created_at: Date;
};

export default function AdminUsersList({ initialUsers, currentUserId }: { initialUsers: UserRow[]; currentUserId: number }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [form, setForm] = useState({ nama: "", username: "", password: "", role: "PKL", is_active: true });
  const [page, setPage] = useState(1);

  const filteredUsers = useMemo(
    () =>
      search.trim()
        ? users.filter(
            (u) =>
              u.nama.toLowerCase().includes(search.trim().toLowerCase()) ||
              u.username.toLowerCase().includes(search.trim().toLowerCase()) ||
              u.role.toLowerCase().includes(search.trim().toLowerCase())
          )
        : users,
    [users, search]
  );

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginatedUsers = filteredUsers.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);
  const startItem = filteredUsers.length === 0 ? 0 : (safePage - 1) * PER_PAGE + 1;
  const endItem = Math.min(safePage * PER_PAGE, filteredUsers.length);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  async function loadUsers() {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    if (res.ok) setUsers(data.users);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: data.error ?? "Gagal" });
        return;
      }
      setMessage({ type: "ok", text: "User berhasil ditambah." });
      setForm({ nama: "", username: "", password: "", role: "PKL", is_active: true });
      setShowForm(false);
      await loadUsers();
    } catch {
      setMessage({ type: "err", text: "Koneksi gagal" });
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(e: React.FormEvent, id: number) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const payload: { nama?: string; username?: string; password?: string; role?: string; is_active?: number } = {
        nama: form.nama,
        username: form.username,
        role: form.role,
        is_active: form.is_active ? 1 : 0,
      };
      if (form.password) payload.password = form.password;
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: data.error ?? "Gagal" });
        return;
      }
      setMessage({ type: "ok", text: "User berhasil diupdate." });
      setEditId(null);
      setForm({ nama: "", username: "", password: "", role: "PKL", is_active: true });
      await loadUsers();
    } catch {
      setMessage({ type: "err", text: "Koneksi gagal" });
    } finally {
      setLoading(false);
    }
  }

  function openEdit(u: UserRow) {
    setEditId(u.id);
    setForm({ nama: u.nama, username: u.username, password: "", role: u.role, is_active: u.is_active === 1 });
  }

  async function handleDelete(u: UserRow) {
    if (!confirm(`Yakin hapus user "${u.nama}" (${u.username})? Data presensi user ini juga akan terhapus.`)) return;
    setDeletingId(u.id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: data.error ?? "Gagal menghapus" });
        return;
      }
      setMessage({ type: "ok", text: "User berhasil dihapus." });
      await loadUsers();
    } catch {
      setMessage({ type: "err", text: "Koneksi gagal" });
    } finally {
      setDeletingId(null);
    }
  }

  const inputClass = "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

  return (
    <>
      {message && (
        <p className={"mb-4 animate-fade-in rounded-xl px-4 py-2.5 text-sm " + (message.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600")}>
          {message.text}
        </p>
      )}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama, username, atau role..."
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:w-auto sm:min-w-[220px]"
        />
        {!showForm && !editId && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="shrink-0 rounded-xl flex items-center gap-2 bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700 hover:shadow-blue-600/30"
          > 
            <PlusIcon className="h-4 w-4 color-white" />
            <span className="text-sm font-medium text-white">Tambah User</span>
          </button>
        )}
      </div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Tutup"
            onClick={() => { setShowForm(false); setForm({ nama: "", username: "", password: "", role: "PKL", is_active: true }); }}
            className="absolute inset-0 bg-black/50"
          />
          <div className="relative w-full max-w-md animate-scale-in rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Tambah User</h2>
              <button
                type="button"
                aria-label="Tutup"
                onClick={() => { setShowForm(false); setForm({ nama: "", username: "", password: "", role: "PKL", is_active: true }); }}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium text-slate-700">Nama</label>
                <input type="text" placeholder="Nama" value={form.nama} onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))} className={inputClass} required />
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium text-slate-700">Username</label>
                <input type="text" placeholder="Username" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} className={inputClass} required />
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
                <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className={inputClass} required />
              </div>
              <div className="mb-5">
                <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
                <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className={inputClass}>
                  <option value="PKL">PKL</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={loading} className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-50">Simpan</button>
                <button type="button" onClick={() => { setShowForm(false); setForm({ nama: "", username: "", password: "", role: "PKL", is_active: true }); }} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {editId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Tutup"
            onClick={() => { setEditId(null); setForm({ nama: "", username: "", password: "", role: "PKL", is_active: true }); }}
            className="absolute inset-0 bg-black/50"
          />
          <div className="relative w-full max-w-md animate-scale-in rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Edit User</h2>
              <button
                type="button"
                aria-label="Tutup"
                onClick={() => { setEditId(null); setForm({ nama: "", username: "", password: "", role: "PKL", is_active: true }); }}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={(e) => handleUpdate(e, editId)}>
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium text-slate-700">Nama</label>
                <input type="text" placeholder="Nama" value={form.nama} onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))} className={inputClass} required />
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium text-slate-700">Username</label>
                <input type="text" placeholder="Username" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} className={inputClass} required />
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
                <input type="password" placeholder="Kosongkan jika tidak ganti" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className={inputClass} />
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
                <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className={inputClass}>
                  <option value="PKL">PKL</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div className="mb-5 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="edit-is_active" className="text-sm font-medium text-slate-700">
                  Aktif (user bisa login)
                </label>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={loading} className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-50">
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => { setEditId(null); setForm({ nama: "", username: "", password: "", role: "PKL", is_active: true }); }}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <p className="mb-3 text-sm text-slate-600">
        {search.trim()
          ? `Menampilkan ${filteredUsers.length} dari ${users.length} user.`
          : `Total ${users.length} user.`}
        {filteredUsers.length > PER_PAGE &&
          ` Halaman ${safePage}/${totalPages} (${startItem}-${endItem}).`}
      </p>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className="px-4 py-3 font-semibold text-slate-700">Nama</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Username</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Role</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Aktif</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  {search.trim() ? `Tidak ada hasil untuk "${search.trim()}".` : "Belum ada user."}
                </td>
              </tr>
            ) : (
              paginatedUsers.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 transition hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium text-slate-800">{u.nama}</td>
                <td className="px-4 py-3 text-slate-600">{u.username}</td>
                <td className="px-4 py-3 text-slate-700">{u.role}</td>
                <td className="px-4 py-3 text-slate-700">{u.is_active ? "Ya" : "Tidak"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => openEdit(u)} className="font-medium text-blue-600 hover:underline">Edit</button>
                    {u.id !== currentUserId && (
                      <button
                        type="button"
                        onClick={() => handleDelete(u)}
                        disabled={deletingId === u.id}
                        className="font-medium text-red-600 hover:underline disabled:opacity-50"
                      >
                        {deletingId === u.id ? "Menghapus..." : "Hapus"}
                      </button>
                    )}
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
  );
}
