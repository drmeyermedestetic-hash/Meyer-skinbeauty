// scripts/seed-products.ts
// Carga data/catalog.json (el catálogo real, exportado del xlsx que
// mandó la clienta) en la tabla `products` de Supabase.
//
// Uso:
//   1. Correr supabase/schema.sql en el proyecto de Supabase.
//   2. Completar SUPABASE_SERVICE_ROLE_KEY y NEXT_PUBLIC_SUPABASE_URL en .env.local.
//   3. npm run seed:products
//
// precio/precio_oferta/stock llegan en null/0 porque el catálogo
// original no los traía — hay que cargarlos a mano en Supabase (o
// completar data/catalog.json) antes de poder vender cada producto.

import { config } from "dotenv";
config({ path: ".env.local" });

import { getSupabaseAdminClient } from "../lib/supabase";
import catalog from "../data/catalog.json";

async function main() {
  const supabase = getSupabaseAdminClient();

  const rows = (catalog as any[]).map((p) => ({
    sku: p.sku,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    category: p.category,
    category_slug: p.categorySlug,
    subcategory: p.subcategory,
    short_description: p.shortDescription,
    description: p.description,
    benefits: p.benefits,
    key_ingredients: p.keyIngredients,
    skin_type: p.skinType,
    usage_instructions: p.usageInstructions,
    origin: p.origin,
    size: p.size,
    price: p.price,
    sale_price: p.salePrice,
    stock: p.stock ?? 0,
    info_sheet_file: p.infoSheetFile,
  }));

  const { error, count } = await supabase
    .from("products")
    .upsert(rows, { onConflict: "sku", count: "exact" });

  if (error) {
    console.error("Error sembrando productos:", error);
    process.exit(1);
  }

  console.log(`✅ ${count ?? rows.length} productos sembrados/actualizados en Supabase.`);
  console.log(
    "⚠️  Recordá cargar precio, precio de oferta y stock reales: el xlsx original no los traía."
  );
}

main();
