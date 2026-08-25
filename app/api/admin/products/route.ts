// app/api/admin/products/route.ts
// Listado y alta de productos — sólo para admins autenticados
// (ver lib/admin-auth.ts). Usa la service role key: acá SÍ se puede
// ver/crear productos inactivos o sin precio, a diferencia del
// catálogo público (lib/products.ts).

import { NextRequest, NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { resolveBrandId, resolveCategoryId, slugify } from "@/lib/admin-catalog";

const LIST_SELECT = `
  id, sku, slug, name, price, sale_price, stock, active, featured, best_seller, new_arrival,
  brand:brands(name),
  category:categories(name, slug, parent:categories(name, slug))
`;

function splitList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function toNumberOrNull(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminForApi();
  if (!auth.ok) return auth.response;

  const search = req.nextUrl.searchParams.get("q")?.trim();
  const supabase = getSupabaseAdminClient();
  let query = supabase.from("products").select(LIST_SELECT).order("name", { ascending: true });
  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminForApi();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body?.sku?.trim() || !body?.name?.trim() || !body?.category?.trim()) {
    return NextResponse.json(
      { error: "Faltan campos obligatorios: SKU, nombre y categoría" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdminClient();
  try {
    const brandId = await resolveBrandId(supabase, body.brand);
    const categoryId = await resolveCategoryId(supabase, body.category, body.subcategory);

    const { data, error } = await supabase
      .from("products")
      .insert({
        sku: body.sku.trim(),
        slug: body.slug?.trim() || slugify(body.sku.trim()),
        name: body.name.trim(),
        brand_id: brandId,
        category_id: categoryId,
        short_description: body.shortDescription || null,
        description: body.description || null,
        benefits: splitList(body.benefits),
        key_ingredients: splitList(body.keyIngredients),
        skin_types: splitList(body.skinTypes),
        how_to_use: body.howToUse || null,
        country_of_origin: body.countryOfOrigin || null,
        size: body.size || null,
        price: toNumberOrNull(body.price),
        sale_price: toNumberOrNull(body.salePrice),
        stock: toNumberOrNull(body.stock) ?? 0,
        main_image: body.mainImage || null,
        featured: Boolean(body.featured),
        best_seller: Boolean(body.bestSeller),
        new_arrival: Boolean(body.newArrival),
        active: body.active !== false,
      })
      .select("id")
      .single();

    if (error) throw error;
    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (err: any) {
    const message =
      err?.code === "23505" ? "Ya existe un producto con ese SKU o slug" : err?.message ?? "Error al crear el producto";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
