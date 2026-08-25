// scripts/seed-products.ts
// Carga data/catalog.json (el catálogo real, exportado del xlsx que
// mandó la clienta) en las tablas `brands`, `categories` y `products`
// de Supabase, resolviendo/creando marcas y categorías (con
// subcategoría como categoría hija) antes de insertar cada producto.
//
// Uso:
//   1. Correr supabase/schema.sql en el proyecto de Supabase.
//   2. Completar SUPABASE_SERVICE_ROLE_KEY y NEXT_PUBLIC_SUPABASE_URL en .env.local.
//   3. npm run seed:products
//
// precio/precio_oferta/stock llegan en null/0 porque el catálogo
// original no los traía — hay que cargarlos a mano en Supabase (o en
// el panel /admin) antes de poder vender cada producto.

import { config } from "dotenv";
config({ path: ".env.local" });

import { getSupabaseAdminClient } from "../lib/supabase";
import catalog from "../data/catalog.json";
import categories from "../data/categories.json";

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // quita acentos (diacríticos combinantes)
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

async function main() {
  const supabase = getSupabaseAdminClient();

  // 1) Marcas — una fila por marca única del catálogo.
  const brandNames = [...new Set((catalog as any[]).map((p) => p.brand).filter(Boolean))];
  const brandIdByName = new Map<string, string>();
  for (const name of brandNames) {
    const { data, error } = await supabase
      .from("brands")
      .upsert({ name, slug: slugify(name) }, { onConflict: "slug" })
      .select("id")
      .single();
    if (error) throw error;
    brandIdByName.set(name, data.id);
  }
  console.log(`✅ ${brandNames.length} marcas sembradas.`);

  // 2) Categorías de primer nivel (data/categories.json).
  const topCategoryIdBySlug = new Map<string, string>();
  for (const cat of categories as { name: string; slug: string }[]) {
    const { data, error } = await supabase
      .from("categories")
      .upsert({ name: cat.name, slug: cat.slug, parent_id: null }, { onConflict: "slug" })
      .select("id")
      .single();
    if (error) throw error;
    topCategoryIdBySlug.set(cat.slug, data.id);
  }
  console.log(`✅ ${(categories as any[]).length} categorías sembradas.`);

  // 3) Subcategorías (categoría hija, parent_id = categoría de primer
  // nivel). El slug se namespacea con la categoría padre para evitar
  // colisiones entre subcategorías con el mismo nombre en categorías
  // distintas (ej: "Limpiadores" en Skincare Coreano y en Medical Skincare).
  const subcategoryIdByKey = new Map<string, string>(); // key: `${categorySlug}::${subcategoryName}`
  const subcategoryPairs = new Set<string>();
  for (const p of catalog as any[]) {
    if (p.subcategory) subcategoryPairs.add(`${p.categorySlug}::${p.subcategory}`);
  }
  for (const key of subcategoryPairs) {
    const [categorySlug, subcategoryName] = key.split("::");
    const parentId = topCategoryIdBySlug.get(categorySlug);
    if (!parentId) continue;
    const slug = `${categorySlug}-${slugify(subcategoryName)}`;
    const { data, error } = await supabase
      .from("categories")
      .upsert(
        { name: subcategoryName, slug, parent_id: parentId },
        { onConflict: "slug" }
      )
      .select("id")
      .single();
    if (error) throw error;
    subcategoryIdByKey.set(key, data.id);
  }
  console.log(`✅ ${subcategoryPairs.size} subcategorías sembradas.`);

  // 4) Productos.
  const rows = (catalog as any[]).map((p) => {
    const categoryId = p.subcategory
      ? subcategoryIdByKey.get(`${p.categorySlug}::${p.subcategory}`)
      : topCategoryIdBySlug.get(p.categorySlug);

    return {
      sku: p.sku,
      slug: p.slug,
      name: p.name,
      brand_id: p.brand ? brandIdByName.get(p.brand) ?? null : null,
      category_id: categoryId ?? topCategoryIdBySlug.get(p.categorySlug) ?? null,
      short_description: p.shortDescription,
      description: p.description,
      benefits: p.benefits,
      key_ingredients: p.keyIngredients,
      skin_types: p.skinType,
      how_to_use: p.usageInstructions,
      country_of_origin: p.origin,
      size: p.size,
      price: p.price,
      sale_price: p.salePrice,
      stock: p.stock ?? 0,
      information_image: p.infoSheetFile,
    };
  });

  const { error, count } = await supabase
    .from("products")
    .upsert(rows, { onConflict: "sku", count: "exact" });

  if (error) {
    console.error("Error sembrando productos:", error);
    process.exit(1);
  }

  console.log(`✅ ${count ?? rows.length} productos sembrados/actualizados en Supabase.`);
  console.log(
    "⚠️  Recordá cargar precio, precio de oferta y stock reales (a mano o desde /admin): el xlsx original no los traía."
  );
}

main();
