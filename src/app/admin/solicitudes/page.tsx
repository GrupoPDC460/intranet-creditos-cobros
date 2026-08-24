import { listUsers, usersConfigured } from "@/lib/users";
import { SolicitudesAdmin } from "@/components/admin/solicitudes-admin";

export const dynamic = "force-dynamic";

export default async function SolicitudesPage() {
  const configured = usersConfigured();
  const pending = configured ? await listUsers("pending") : [];
  const active = configured ? await listUsers("active") : [];
  return (
    <SolicitudesAdmin
      configured={configured}
      pending={pending.map((u) => ({
        id: u.id,
        email: u.email,
        username: u.username,
        fullName: u.full_name,
        createdAt: u.created_at,
      }))}
      active={active.map((u) => ({
        id: u.id,
        email: u.email,
        username: u.username,
        fullName: u.full_name,
        role: u.role,
      }))}
    />
  );
}
