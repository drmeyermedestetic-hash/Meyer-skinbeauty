// app/api/admin/products/[id]/route.ts
// Detalle, edición y baja de un producto — sólo admins autenticados.

import { NextRequest, NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { resolveBrandId, resolveCategoryId } from "@/lib/admin-catalog";

const DETAIL_SELECT = `
  *,
  brand:brands(name),
  category:categories(name, slug, parent:categories(id, name, slug))
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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminForApi();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("products").select(DETAIL_SELECT).eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });

  const category = data.category as any;
  const hasParent = Boolean(category?.parent);

  return NextResponse.json({
    product: {
      ...data,
      brandName: (data.brand as any)?.name ?? "",
      categoryName: hasParent ? category.parent.name : category?.name ?? "",
      subcategoryName: hasParent ? category.name : "",
    },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminForApi();
  if (!auth.ok) return auth.response;
  const { id } = await params;

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

    const { error } = await supabase
      .from("products")
      .update({
        sku: body.sku.trim(),
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
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const message =
      err?.code === "23505" ? "Ya existe un producto con ese SKU" : err?.message ?? "Error al guardar el producto";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminForApi();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const supabase = getSupabaseAdminClient();
  // No se borra físicamente: se desactiva. Un producto puede estar
  // referenciado desde order_items de pedidos ya hechos.
  const { error } = await supabase.from("products").update({ active: false }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
