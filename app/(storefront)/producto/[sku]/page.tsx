import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllProducts, getProductBySlug } from "@/lib/products";
import { buildBreadcrumbJsonLd, buildProductJsonLd, buildProductMetadata } from "@/lib/seo";
import AddToCartControls from "@/components/AddToCartControls";
import ProductAccordion from "@/components/ProductAccordion";

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((p) => ({ sku: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sku: string }>;
}): Promise<Metadata> {
  const { sku } = await params;
  const product = await getProductBySlug(sku);
  if (!product) return {};
  return buildProductMetadata(product);
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ sku: string }>;
}) {
  const { sku } = await params;
  const product = await getProductBySlug(sku);
  if (!product) notFound();

  const jsonLd = [
    buildProductJsonLd(product),
    buildBreadcrumbJsonLd([
      { name: "Inicio", url: "/" },
      { name: product.category, url: `/categoria/${product.categorySlug}` },
      { name: product.name, url: `/producto/${product.slug}` },
    ]),
  ];

  return (
    <>
      {jsonLd.map((ld, i) => (
        <script
          key={i}
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      ))}

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

        {product.infoSheetFile && (
          <div className="pd-infosheet">
            <h3>Ficha técnica</h3>
            <Image
              src={`/img/catalogo/${product.infoSheetFile}`}
              alt={`Ficha técnica de ${product.name}`}
              width={1536}
              height={1024}
              sizes="(max-width: 640px) 100vw, 640px"
              style={{ width: "100%", height: "auto" }}
            />
          </div>
        )}
      </div>
    </>
  );
}
