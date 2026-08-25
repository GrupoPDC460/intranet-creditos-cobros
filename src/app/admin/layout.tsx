import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { countPending, usersConfigured } from "@/lib/users";
import { isAdmin } from "@/lib/require-admin";

export const metadata = { title: "Panel administrativo" };
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verificación de admin en vivo (rol fresco desde la base).
  if (!(await isAdmin())) redirect("/");
  const pending = usersConfigured() ? await countPending() : 0;
  return <AdminShell pendingCount={pending}>{children}</AdminShell>;
}
