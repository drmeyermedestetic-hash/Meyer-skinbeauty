// lib/admin-catalog.ts
// Helpers server-only compartidos por el panel /admin para resolver
// (o crear al vuelo) la marca y la categoría de un producto a partir
// de texto libre — así el formulario de producto no depende de que
// exista una pantalla aparte de gestión de marcas/categorías todavía.

import type { SupabaseClient } from "@supabase/supabase-js";

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // quita acentos (diacríticos combinantes)
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export async function resolveBrandId(
  supabase: SupabaseClient,
  name: string | null | undefined
): Promise<string | null> {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  const { data, error } = await supabase
    .from("brands")
    .upsert({ name: trimmed, slug: slugify(trimmed) }, { onConflict: "slug" })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

/**
 * Resuelve la categoría de primer nivel y, si se pasa, la subcategoría
 * (como categoría hija con parent_id). Devuelve el id que va en
 * `products.category_id` — el de la subcategoría cuando existe.
 */
export async function resolveCategoryId(
  supabase: SupabaseClient,
  categoryName: string,
  subcategoryName?: string | null
): Promise<string> {
  const catSlug = slugify(categoryName);
  const { data: topCategory, error: topError } = await supabase
    .from("categories")
    .upsert({ name: categoryName.trim(), slug: catSlug, parent_id: null }, { onConflict: "slug" })
    .select("id")
    .single();
  if (topError) throw topError;

  const trimmedSub = subcategoryName?.trim();
  if (!trimmedSub) return topCategory.id;

  const subSlug = `${catSlug}-${slugify(trimmedSub)}`;
  const { data: subCategory, error: subError } = await supabase
    .from("categories")
    .upsert(
      { name: trimmedSub, slug: subSlug, parent_id: topCategory.id },
      { onConflict: "slug" }
    )
    .select("id")
    .single();
  if (subError) throw subError;
  return subCategory.id;
}
