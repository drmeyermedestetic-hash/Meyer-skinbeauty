import Link from "next/link";
import {
  getCategories,
  getFeaturedProducts,
  getNewProducts,
} from "@/lib/products";
import CategoryGrid from "@/components/CategoryGrid";
import ProductRail from "@/components/ProductRail";

export default async function HomePage() {
  const [categories, featured, novedades] = await Promise.all([
    getCategories(),
    getFeaturedProducts(),
    getNewProducts(),
  ]);

  return (
    <>
      <section className="hero">
        <div className="content">
          <h1 className="serif">
            Skincare,
            <br />
            Beauty &amp; Science
          </h1>
          <p>
            Una selección de belleza y cuidado de la piel elegida para
            transformar tu rutina.
          </p>
          <div className="btns">
            <Link href="/categoria/skincare-coreano">
              <button className="btn-primary">Ver productos</button>
            </Link>
            <Link href="/categoria/skincare-coreano">
              <button className="btn-outline">K-Beauty</button>
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <h3>Categorías</h3>
        <CategoryGrid categories={categories} />
      </section>

      <section className="section">
        <h3>Destacados</h3>
        <ProductRail products={featured} />
      </section>

      <section className="banner-black">
        <div className="eyebrow">Selección profesional</div>
        <h2 className="serif">
          Science
          <br />
          Meets Skin
        </h2>
        <p>
          Dermocosmética avanzada para resultados visibles y respaldados por
          la ciencia.
        </p>
        <Link href="/categoria/medical-skincare">
          <button>Descubrir</button>
        </Link>
      </section>

      <section className="section">
        <h3>Novedades</h3>
        <ProductRail products={novedades} />
      </section>
    </>
  );
}
