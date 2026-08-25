// lib/products.ts
// Acceso al catálogo de productos.
//
// Si Supabase está configurado (variables de entorno cargadas y la
// tabla `products` sembrada con `npm run seed:products`), se lee de
// ahí. Si no, se usa `data/catalog.json` — el catálogo real que
// mandó la clienta, ya normalizado — para que el sitio se pueda
// navegar aun sin base de datos conectada. El checkout SIEMPRE
// requiere Supabase (ver lib/orders.ts): ahí sí hace falta stock y
// precio persistidos y confiables.

import { isSupabaseConfigured, getSupabasePublicClient } from "@/lib/supabase";
import type { Category, Product } from "@/lib/types";
import catalogJson from "@/data/catalog.json";
import categoriesJson from "@/data/categories.json";

const localCatalog = catalogJson as Product[];
const localCategories = categoriesJson as Category[];

function mapRowToProduct(row: any): Product {
  return {
    sku: row.sku,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    category: row.category,
    categorySlug: row.category_slug,
    subcategory: row.subcategory,
    shortDescription: row.short_description,
    description: row.description,
    benefits: row.benefits ?? [],
    keyIngredients: row.key_ingredients ?? [],
    skinType: row.skin_type ?? [],
    usageInstructions: row.usage_instructions,
    origin: row.origin,
    size: row.size,
    price: row.price !== null ? Number(row.price) : null,
    salePrice: row.sale_price !== null ? Number(row.sale_price) : null,
    priceIsPending: row.price === null,
    stock: row.stock ?? 0,
    imageUrl: row.image_url,
    infoSheetFile: row.info_sheet_file,
    updatedAt: row.updated_at,
  };
}

export async function getAllProducts(): Promise<Product[]> {
  if (isSupabaseConfigured) {
    const supabase = getSupabasePublicClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapRowToProduct);
  }
  return localCatalog;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (isSupabaseConfigured) {
    const supabase = getSupabasePublicClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return data ? mapRowToProduct(data) : null;
  }
  return localCatalog.find((p) => p.slug === slug) ?? null;
}

export async function getProductsByCategory(
  categorySlug: string
): Promise<Product[]> {
  const all = await getAllProducts();
  return all.filter((p) => p.categorySlug === categorySlug);
}

export async function getCategories(): Promise<Category[]> {
  // Las categorías son fijas (definidas junto al catálogo), no hace
  // falta traerlas de Supabase.
  return localCategories;
}

/**
 * Selección de "destacados" / "novedades" para la home.
 * TODO: reemplazar por un campo `featured` / `created_at` real en
 * `products` cuando haya criterio de merchandising — por ahora es
 * una selección determinística sobre el catálogo para poder mostrar
 * las filas de la home.
 */
export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const all = await getAllProducts();
  return all.slice(0, limit);
}

export async function getNewProducts(limit = 8): Promise<Product[]> {
  const all = await getAllProducts();
  return [...all].reverse().slice(0, limit);
}
