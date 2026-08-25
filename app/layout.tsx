import type { Metadata } from "next";
import "./globals.css";
import { buildOrganizationJsonLd } from "@/lib/seo";

// Layout raíz — compartido por la tienda (app/(storefront)) y el
// panel /admin, que tienen cada uno su propio chrome (ver
// app/(storefront)/layout.tsx y app/admin/(panel)/layout.tsx).

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
    <html lang="es">
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
