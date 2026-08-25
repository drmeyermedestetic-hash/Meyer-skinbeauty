import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategories, getProductsByCategory } from "@/lib/products";
import { buildBreadcrumbJsonLd, buildCategoryMetadata } from "@/lib/seo";
import ProductCard from "@/components/ProductCard";

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) return {};
  return buildCategoryMetadata(category);
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const products = await getProductsByCategory(slug);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Inicio", url: "/" },
    { name: category.name, url: `/categoria/${category.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="page-head">
        <Link href="/" className="back" aria-label="Volver">
          ←
        </Link>
        <h2>{category.name}</h2>
      </div>

      <div className="section" style={{ paddingTop: 20 }}>
        {products.length === 0 ? (
          <div className="page-empty">
            Todavía no hay productos cargados en esta categoría.
          </div>
        ) : (
          <div className="grid2">
            {products.map((p) => (
              <ProductCard key={p.sku} product={p} variant="grid" />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
