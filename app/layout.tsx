import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { buildOrganizationJsonLd } from "@/lib/seo";
import Header from "@/components/Header";
import CartDrawer from "@/components/CartDrawer";

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
        <CartProvider>
          <div className="app">
            <Header />
            {children}
            <footer className="site-footer">
              © {new Date().getFullYear()} Meyer SkinBeauty
            </footer>
          </div>
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
