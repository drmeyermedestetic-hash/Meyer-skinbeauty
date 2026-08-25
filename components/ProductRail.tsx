import type { Product } from "@/lib/types";
import ProductCard from "@/components/ProductCard";

export default function ProductRail({ products }: { products: Product[] }) {
  if (!products.length) return null;
  return (
    <div className="h-scroll">
      {products.map((p) => (
        <ProductCard key={p.sku} product={p} variant="rail" />
      ))}
    </div>
  );
}
