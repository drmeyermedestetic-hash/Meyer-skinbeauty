"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import type { Product } from "@/lib/types";

export default function AddToCartControls({ product }: { product: Product }) {
  const { addItem, openCart } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);

  const price = product.salePrice ?? product.price;
  const canBuy = price !== null && product.stock > 0;
  const maxQty = Math.max(product.stock, 0);

  function handleAdd() {
    if (!canBuy || price === null) return;
    addItem(
      {
        sku: product.sku,
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        price,
      },
      qty
    );
  }

  return (
    <>
      <div className="pd-price-row">
        {price !== null ? (
          <div className="pd-price">
            {new Intl.NumberFormat("es-AR", {
              style: "currency",
              currency: "ARS",
              maximumFractionDigits: 0,
            }).format(price)}
          </div>
        ) : (
          <div className="pd-price pending">Precio a confirmar</div>
        )}
        <div className="qty">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Restar cantidad"
          >
            −
          </button>
          <span>{qty}</span>
          <button
            onClick={() => setQty((q) => Math.min(maxQty || 1, q + 1))}
            aria-label="Sumar cantidad"
          >
            +
          </button>
        </div>
      </div>

      <div className="pd-actions">
        <button
          className="btn-add"
          disabled={!canBuy}
          onClick={() => {
            handleAdd();
            openCart();
          }}
        >
          {product.stock <= 0
            ? "Sin stock"
            : price === null
            ? "Precio a confirmar"
            : "Agregar al carrito"}
        </button>
        <button
          className="btn-buy"
          disabled={!canBuy}
          onClick={() => {
            handleAdd();
            router.push("/checkout");
          }}
        >
          Comprar ahora
        </button>
      </div>
      {!canBuy && (
        <p className="co-hint" style={{ marginBottom: 20 }}>
          {product.stock <= 0
            ? "Este producto no tiene stock disponible por el momento."
            : "Todavía no cargamos el precio de este producto — escribinos y te confirmamos."}
        </p>
      )}
    </>
  );
}
