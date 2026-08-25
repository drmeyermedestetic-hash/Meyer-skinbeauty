// lib/admin-auth.ts
// Verificación de "es un admin de verdad" para el panel /admin.
// El middleware (raíz del proyecto) ya exige una sesión de Supabase
// Auth válida para entrar a /admin/**; acá se confirma además que esa
// persona esté en `admin_users` — no cualquier cuenta logueada es admin.

import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdminClient } from "@/lib/supabase";

export interface AdminUser {
  id: string;
  authUserId: string;
  fullName: string | null;
  role: "admin" | "editor";
  email: string | null;
}

async function loadAdminUser(): Promise<AdminUser | null> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Se consulta con la service role: es la forma confiable de
  // verificar el rol server-side (admin_users sólo expone por RLS la
  // fila propia, que ya es lo que necesitamos, pero usamos la service
  // role acá para no depender de que esa policy exista tal cual).
  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("admin_users")
    .select("id, auth_user_id, full_name, role")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!data) return null;
  return {
    id: data.id,
    authUserId: data.auth_user_id,
    fullName: data.full_name,
    role: data.role,
    email: user.email ?? null,
  };
}

/** Para Server Components / layouts del panel: redirige a /admin/login si no es admin. */
export async function requireAdminOrRedirect(): Promise<AdminUser> {
  const admin = await loadAdminUser();
  if (!admin) redirect("/admin/login");
  return admin;
}

/** Para Route Handlers de /api/admin/**: devuelve 401/403 en vez de redirigir. */
export async function requireAdminForApi(): Promise<
  { ok: true; admin: AdminUser } | { ok: false; response: NextResponse }
> {
  const admin = await loadAdminUser();
  if (!admin) {
    return {
      ok: false,
      response: NextResponse.json({ error: "No autorizado" }, { status: 403 }),
    };
  }
  return { ok: true, admin };
}
