import { notFound } from "next/navigation";
import Link from "next/link";
import { getSupabaseAdminClient } from "@/lib/supabase";
import ProductForm, { type ProductFormValues } from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("products")
    .select(
      `*, brand:brands(name), category:categories(name, slug, parent:categories(name, slug))`
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  const category = data.category as any;
  const hasParent = Boolean(category?.parent);

  const initialValues: Partial<ProductFormValues> = {
    sku: data.sku,
    name: data.name,
    brand: (data.brand as any)?.name ?? "",
    category: hasParent ? category.parent.name : category?.name ?? "",
    subcategory: hasParent ? category.name : "",
    shortDescription: data.short_description ?? "",
    description: data.description ?? "",
    benefits: (data.benefits ?? []).join(", "),
    keyIngredients: (data.key_ingredients ?? []).join(", "),
    skinTypes: (data.skin_types ?? []).join(", "),
    howToUse: data.how_to_use ?? "",
    countryOfOrigin: data.country_of_origin ?? "",
    size: data.size ?? "",
    price: data.price !== null ? String(data.price) : "",
    salePrice: data.sale_price !== null ? String(data.sale_price) : "",
    stock: String(data.stock ?? 0),
    mainImage: data.main_image ?? "",
    featured: data.featured,
    bestSeller: data.best_seller,
    newArrival: data.new_arrival,
    active: data.active,
  };

  return (
    <>
      <div className="topbar">
        <h1>Editar producto</h1>
        <div className="actions">
          <Link href="/admin/productos" className="btn btn-outline">
            ← Volver
          </Link>
        </div>
      </div>
      <div className="page">
        <ProductForm mode="edit" productId={id} initialValues={initialValues} />
      </div>
    </>
  );
}
