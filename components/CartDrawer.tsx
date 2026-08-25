"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";

export default function CartDrawer() {
  const { items, isOpen, closeCart, subtotal, setQuantity, removeItem } = useCart();

  return (
    <>
      <div className={`overlay${isOpen ? " show" : ""}`} onClick={closeCart} />
      <aside className={`drawer${isOpen ? " show" : ""}`} aria-hidden={!isOpen}>
        <div className="drawer-head">
          <h3>Tu carrito</h3>
          <button onClick={closeCart} aria-label="Cerrar carrito">
            ✕
          </button>
        </div>

        <div className="drawer-items">
          {items.length === 0 ? (
            <div className="empty-cart">Tu carrito está vacío.</div>
          ) : (
            items.map((item) => (
              <div className="cart-item" key={item.sku}>
                <div className="thumb" aria-hidden="true">
                  🌿
                </div>
                <div className="meta">
                  <div className="brand">{item.brand}</div>
                  <div className="name">{item.name}</div>
                  <div className="row">
                    <div className="qty">
                      <button onClick={() => setQuantity(item.sku, item.quantity - 1)}>
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button onClick={() => setQuantity(item.sku, item.quantity + 1)}>
                        +
                      </button>
                    </div>
                    <div className="price">{formatPrice(item.price * item.quantity)}</div>
                  </div>
                  <button className="del" onClick={() => removeItem(item.sku)}>
                    Quitar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="drawer-summary">
            <div className="sum-row total">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <Link href="/checkout" onClick={closeCart}>
              <button className="btn-add" style={{ width: "100%" }}>
                Ir a checkout
              </button>
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
