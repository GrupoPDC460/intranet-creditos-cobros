import { AdminShell } from "@/components/admin/admin-shell";

export const metadata = { title: "Panel administrativo" };

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
