// lib/products.ts
// Acceso público al catálogo de productos (usa la anon key — RLS
// filtra automáticamente a lo `active`).
//
// Si Supabase está configurado (variables de entorno cargadas y la
// tabla `products` sembrada con `npm run seed:products`), se lee de
// ahí con join a `brands`/`categories`. Si no, se usa
// `data/catalog.json` — el catálogo real que mandó la clienta, ya
// normalizado — para que el sitio se pueda navegar aun sin base de
// datos conectada. El checkout SIEMPRE requiere Supabase (ver
// lib/orders.ts): ahí sí hace falta stock y precio persistidos y
// confiables. El panel /admin usa sus propias queries con la service
// role key (ver app/api/admin/**) — no pasa por acá.

import { isSupabaseConfigured, getSupabasePublicClient } from "@/lib/supabase";
import type { Category, Product } from "@/lib/types";
import catalogJson from "@/data/catalog.json";
import categoriesJson from "@/data/categories.json";

const localCatalog = catalogJson as Product[];
const localCategories = categoriesJson as Category[];

const PRODUCT_SELECT = `
  *,
  brand:brands(name),
  category:categories(name, slug, parent:categories(name, slug))
`;

function mapRowToProduct(row: any): Product {
  // category_id apunta a la subcategoría cuando existe (con parent_id
  // seteado); si no tiene padre, la fila ES la categoría de primer nivel.
  const category = row.category;
  const hasParent = Boolean(category?.parent);
  const topCategory = hasParent ? category.parent : category;

  return {
    sku: row.sku,
    slug: row.slug,
    name: row.name,
    brand: row.brand?.name ?? null,
    category: topCategory?.name ?? "Sin categoría",
    categorySlug: topCategory?.slug ?? "sin-categoria",
    subcategory: hasParent ? category.name : null,
    shortDescription: row.short_description,
    description: row.description,
    benefits: row.benefits ?? [],
    keyIngredients: row.key_ingredients ?? [],
    skinType: row.skin_types ?? [],
    usageInstructions: row.how_to_use,
    origin: row.country_of_origin,
    size: row.size,
    price: row.price !== null ? Number(row.price) : null,
    salePrice: row.sale_price !== null ? Number(row.sale_price) : null,
    priceIsPending: row.price === null,
    stock: row.stock ?? 0,
    imageUrl: row.main_image,
    infoSheetFile: row.information_image,
    updatedAt: row.updated_at,
  };
}

export async function getAllProducts(): Promise<Product[]> {
  if (isSupabaseConfigured) {
    const supabase = getSupabasePublicClient();
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
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
      .select(PRODUCT_SELECT)
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return data ? mapRowToProduct(data) : null;
  }
  return localCatalog.find((p) => p.slug === slug) ?? null;
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  const all = await getAllProducts();
  return all.filter((p) => p.categorySlug === categorySlug);
}

export async function getCategories(): Promise<Category[]> {
  // Las categorías "de primer nivel" son fijas (definidas junto al
  // catálogo), no hace falta traerlas de Supabase para el menú principal.
  return localCategories;
}

/**
 * Selección de "destacados" / "novedades" para la home.
 * Usa los flags reales de la tabla (`featured`, `new_arrival`) cuando
 * hay Supabase conectado; si no, cae a una selección determinística
 * sobre el catálogo local.
 */
export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  if (isSupabaseConfigured) {
    const supabase = getSupabasePublicClient();
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("featured", true)
      .limit(limit);
    if (error) throw error;
    if (data && data.length > 0) return data.map(mapRowToProduct);
  }
  const all = await getAllProducts();
  return all.slice(0, limit);
}

export async function getNewProducts(limit = 8): Promise<Product[]> {
  if (isSupabaseConfigured) {
    const supabase = getSupabasePublicClient();
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("new_arrival", true)
      .limit(limit);
    if (error) throw error;
    if (data && data.length > 0) return data.map(mapRowToProduct);
  }
  const all = await getAllProducts();
  return [...all].reverse().slice(0, limit);
}
