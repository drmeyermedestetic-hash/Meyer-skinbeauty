import Link from "next/link";
import { getSupabaseAdminClient } from "@/lib/supabase";
import ProductsTable from "@/components/admin/ProductsTable";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `id, sku, slug, name, price, sale_price, stock, low_stock_threshold, active,
       brand:brands(name),
       category:categories(name, slug, parent:categories(name, slug))`
    )
    .order("name", { ascending: true });

  // El cliente de Supabase sin tipos generados infiere las relaciones
  // embebidas (brand/category) como array — en runtime son objetos
  // (belongs-to), así que se normalizan acá antes de tipar el prop.
  const unwrap = (v: any) => (Array.isArray(v) ? v[0] ?? null : v ?? null);
  const products = ((data ?? []) as any[]).map((row) => {
    const category = unwrap(row.category);
    return {
      ...row,
      brand: unwrap(row.brand),
      category: category ? { ...category, parent: unwrap(category.parent) } : null,
    };
  });

  return (
    <>
      <div className="topbar">
        <h1>Productos</h1>
        <div className="actions">
          <Link href="/admin/productos/nuevo" className="btn btn-dark">
            + Nuevo producto
          </Link>
        </div>
      </div>
      <div className="page">
        {error ? (
          <div className="page-empty">No se pudo cargar el catálogo: {error.message}</div>
        ) : (
          <ProductsTable products={products} />
        )}
      </div>
    </>
  );
}
