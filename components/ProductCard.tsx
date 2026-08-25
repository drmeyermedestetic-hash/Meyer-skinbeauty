import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";

export default function ProductCard({
  product,
  variant = "rail",
}: {
  product: Product;
  variant?: "rail" | "grid";
}) {
  const price = product.salePrice ?? product.price;
  const stockLabel =
    product.stock <= 0
      ? { text: "Sin stock", cls: "out" }
      : product.stock <= 5
      ? { text: `Últimas ${product.stock} unidades`, cls: "low" }
      : { text: "En stock", cls: "" };

  return (
    <Link
      href={`/producto/${product.slug}`}
      className={`pcard${variant === "grid" ? " grid-card" : ""}`}
    >
      <div className="img" aria-hidden="true">
        {product.category === "Body & Fragrances"
          ? "🌸"
          : product.category === "Mascarillas Coreanas"
          ? "🪷"
          : product.category === "Labios"
          ? "💋"
          : product.category === "Medical Skincare"
          ? "🧬"
          : "🌿"}
      </div>
      <div className="info">
        <div className="brand">{product.brand ?? product.category}</div>
        <div className="name">{product.name}</div>
        {price !== null ? (
          <div className="price">{formatPrice(price)}</div>
        ) : (
          <div className="price pending">Precio a confirmar</div>
        )}
        <div className={`stock ${stockLabel.cls}`}>{stockLabel.text}</div>
      </div>
    </Link>
  );
}
