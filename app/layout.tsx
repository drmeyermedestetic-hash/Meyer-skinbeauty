import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { buildOrganizationJsonLd } from "@/lib/seo";

// Layout raíz — compartido por la tienda (app/(storefront)) y el
// panel /admin, que tienen cada uno su propio chrome (ver
// app/(storefront)/layout.tsx y app/admin/(panel)/layout.tsx).

// Tipografía del brief de la Etapa 1: serif editorial "de la misma
// familia visual del cartel MEYER" + sans funcional para precios,
// checkout y UI transaccional. next/font las autohospeda (sin
// requests externos en runtime) y expone --font-serif/--font-sans
// para que globals.css las use con el mismo fallback de siempre.
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-serif",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Meyer SkinBeauty", template: "%s" },
  description:
    "Skincare, beauty & science — dermocosmética avanzada y K-Beauty seleccionadas por Meyer SkinBeauty.",
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const organizationJsonLd = buildOrganizationJsonLd();

  return (
    <html lang="es" className={`${playfair.variable} ${inter.variable}`}>
      <body>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
