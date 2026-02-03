import { getSessionFromRequest } from "@/lib/auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import type { UserRow } from "@/lib/db";
import AdminUsersList from "./AdminUsersList";
import Version from "../../components/Version";

export default async function AdminUsersPage() {
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "ADMIN") redirect("/");
  const [rows] = await pool.execute<UserRow[]>("SELECT id, nama, username, role, is_active, created_at FROM users ORDER BY id");
  return (
    <div className="animate-slide-up w-full">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/50 sm:p-8">
        <h1 className="mb-6 text-xl font-bold text-slate-800">Kelola User</h1>
        <AdminUsersList initialUsers={rows} currentUserId={session.user.id} />
      </div>
      <Version />
    </div>
  );
}
