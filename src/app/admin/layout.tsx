import { AdminShell } from "@/components/admin/admin-shell";
import { countPending, usersConfigured } from "@/lib/users";

export const metadata = { title: "Panel administrativo" };
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pending = usersConfigured() ? await countPending() : 0;
  return <AdminShell pendingCount={pending}>{children}</AdminShell>;
}
