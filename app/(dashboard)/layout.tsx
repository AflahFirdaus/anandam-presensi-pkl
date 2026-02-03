import { redirect } from "next/navigation";
import { getSessionFromRequest } from "@/lib/auth";
import { SidebarNav } from "./components/SidebarNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionFromRequest();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen w-full bg-slate-100">
      <SidebarNav user={{ nama: session.user.nama, role: session.user.role }}>
        {children}
      </SidebarNav>
    </div>
  );
}
