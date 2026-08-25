// lib/supabase.ts
// Clientes de Supabase. El cliente "admin" usa la service role key y
// sólo debe importarse desde código server-only (route handlers,
// server components, scripts) — nunca desde un componente cliente.

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** true si las credenciales de Supabase están cargadas en el entorno. */
export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY
);

let cachedPublicClient: SupabaseClient | null = null;
let cachedAdminClient: SupabaseClient | null = null;

/**
 * Cliente público (anon key). Sólo puede leer lo que las policies de
 * RLS permiten (catálogo de productos activos). Seguro para usar en
 * Server Components para renderizar el catálogo.
 */
export function getSupabasePublicClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase no está configurado: faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY en el entorno."
    );
  }
  if (!cachedPublicClient) {
    cachedPublicClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
  }
  return cachedPublicClient;
}

/**
 * Cliente admin (service role key). Ignora RLS — sólo se usa server-side
 * para crear pedidos, procesar webhooks y actualizar stock.
 * NUNCA importar este módulo desde un componente con "use client".
 */
export function getSupabaseAdminClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Supabase no está configurado: faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en el entorno. " +
        "Cargá supabase/schema.sql en un proyecto de Supabase y completá .env.local."
    );
  }
  if (!cachedAdminClient) {
    cachedAdminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cachedAdminClient;
}
