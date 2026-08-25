import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllProducts, getProductBySlug } from "@/lib/products";
import AddToCartControls from "@/components/AddToCartControls";
import ProductAccordion from "@/components/ProductAccordion";

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((p) => ({ sku: p.slug }));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ sku: string }>;
}) {
  const { sku } = await params;
  const product = await getProductBySlug(sku);
  if (!product) notFound();

  return (
    <>
      <div className="page-head">
        <Link href={`/categoria/${product.categorySlug}`} className="back" aria-label="Volver">
          ←
        </Link>
        <h2>{product.category}</h2>
      </div>

      <div className="pd-gallery" aria-hidden="true">
        {product.category === "Body & Fragrances"
          ? "🌸"
          : product.category === "Mascarillas Coreanas"
          ? "🪷"
          : product.category === "Labios"
          ? "💋"
          : product.category === "Medical Skincare"
          ? "🧬"
          : "🌿"}
      </div>

      <div className="pd-body">
        <div className="pd-brand">{product.brand ?? product.category}</div>
        <h1 className="pd-name serif">{product.name}</h1>
        {product.shortDescription && (
          <p className="pd-desc">{product.shortDescription}</p>
        )}

        <AddToCartControls product={product} />

        <ProductAccordion product={product} />
      </div>
    </>
  );
}
