import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import Header from "@/components/Header";
import CartDrawer from "@/components/CartDrawer";

export const metadata: Metadata = {
  title: "Meyer SkinBeauty",
  description:
    "Skincare, beauty & science — dermocosmética avanzada y K-Beauty seleccionadas por Meyer SkinBeauty.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
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
