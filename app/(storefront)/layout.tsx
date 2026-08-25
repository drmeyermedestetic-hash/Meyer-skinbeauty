import { CartProvider } from "@/lib/cart-context";
import Header from "@/components/Header";
import CartDrawer from "@/components/CartDrawer";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="app">
        <Header />
        {children}
        <footer className="site-footer">© {new Date().getFullYear()} Meyer SkinBeauty</footer>
      </div>
      <CartDrawer />
    </CartProvider>
  );
}
