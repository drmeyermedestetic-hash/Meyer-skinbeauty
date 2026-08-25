// lib/seo.ts
// Helpers de SEO: metadata dinámica por producto/categoría, OpenGraph,
// Twitter cards y los schema.org (Product, BreadcrumbList, Organization).
// No inventa datos: todo se arma a partir de lo que ya existe en
// `Product`/`Category` (lib/types.ts) — precio y disponibilidad
// siempre reflejan lo que hay cargado, nunca un valor fijo.

import type { Metadata } from "next";
import type { Category, Product } from "@/lib/types";

const SITE_NAME = "Meyer SkinBeauty";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://meyerskinbeauty.com";

/** Metadata de Next.js (title, description, OG, Twitter) para una ficha de producto. */
export function buildProductMetadata(p: Product): Metadata {
  const title = `${p.name} — ${p.brand ?? p.category} | ${SITE_NAME}`;
  const description =
    p.shortDescription ?? `${p.name} de ${p.brand ?? p.category}, disponible en ${SITE_NAME}.`;
  const url = `${SITE_URL}/producto/${p.slug}`;
  const images = p.imageUrl ? [{ url: p.imageUrl }] : [];

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: SITE_NAME, images, type: "website" },
    twitter: { card: "summary_large_image", title, description, images: images.map((i) => i.url) },
  };
}

/** Metadata de Next.js para un listado de categoría. */
export function buildCategoryMetadata(c: Category): Metadata {
  const title = `${c.name} | ${SITE_NAME}`;
  const description = `Descubrí la selección de ${c.name.toLowerCase()} de ${SITE_NAME}.`;
  const url = `${SITE_URL}/categoria/${c.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: SITE_NAME, type: "website" },
  };
}

/**
 * JSON-LD schema.org/Product — precio y disponibilidad SIEMPRE
 * reflejan lo que hay cargado, nunca un valor fijo. Si el producto
 * todavía no tiene precio (priceIsPending), no se emite `offers`:
 * es más correcto no publicar una oferta que publicar una inventada.
 */
export function buildProductJsonLd(p: Product) {
  const price = p.salePrice ?? p.price;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    sku: p.sku,
    brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined,
    description: p.shortDescription ?? undefined,
    image: p.imageUrl ?? undefined,
    offers:
      price !== null
        ? {
            "@type": "Offer",
            priceCurrency: "ARS",
            price,
            availability:
              p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: `${SITE_URL}/producto/${p.slug}`,
          }
        : undefined,
  };
}

/** JSON-LD schema.org/BreadcrumbList — para home > categoría > producto. */
export function buildBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}

/**
 * JSON-LD schema.org/Organization — se incluye una sola vez en el layout raíz.
 * TODO: confirmar el handle de Instagram de la tienda (puede ser
 * distinto al de la clínica) — hoy no se incluye `sameAs` por eso.
 */
export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo-meyer.png`,
  };
}
