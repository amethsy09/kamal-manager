import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin-nav";
import { AdminShell } from "@/components/admin-shell";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin();
  return <AdminShell sidebar={<AdminNav />}>{children}</AdminShell>;
}
