import { requireAdminOrRedirect } from "@/lib/admin-auth";
import AdminNav from "@/components/admin/AdminNav";
import LogoutButton from "@/components/admin/LogoutButton";

// Todo lo que cuelga de acá depende de la sesión (cookies) del
// usuario logueado — nunca se puede prerenderizar estático, y esto
// también evita que el build falle cuando Supabase todavía no está
// configurado en el entorno (ver lib/supabase-server.ts).
export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminOrRedirect();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="serif">MEYER · ADMIN</span>
        </div>
        <AdminNav />
        <div className="foot">
          {admin.fullName ?? admin.email}
          <br />
          <LogoutButton />
        </div>
      </aside>
      <main>{children}</main>
    </div>
  );
}
