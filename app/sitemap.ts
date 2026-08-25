// app/sitemap.ts
//
// Sitemap dinámico — se regenera solo a partir de las categorías y
// productos reales (Supabase si está conectado, si no data/catalog.json
// vía lib/products.ts). Next.js lo sirve automáticamente en /sitemap.xml.
//
// Sólo lista rutas que existen de verdad hoy: /novedades, /ofertas y
// /the-meyer-edit todavía no tienen página propia (son secciones de la
// home), así que no se incluyen para no listar URLs que dan 404.

import type { MetadataRoute } from "next";
import { getAllProducts, getCategories } from "@/lib/products";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://meyerskinbeauty.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([getCategories(), getAllProducts()]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${SITE_URL}/categoria/${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE_URL}/producto/${p.slug}`,
    lastModified: p.updatedAt ?? undefined,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
