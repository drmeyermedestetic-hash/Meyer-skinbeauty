"use client";
// lib/supabase-browser.ts
// Cliente de Supabase para el navegador (login del panel /admin).
// Usa la anon key — nunca la service role key.

import { createBrowserClient } from "@supabase/ssr";

export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Supabase no está configurado en este entorno.");
  }
  return createBrowserClient(url, anonKey);
}
