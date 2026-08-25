"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

export default function Header() {
  const { itemCount, openCart } = useCart();

  return (
    <header className="top">
      <Link href="/" className="logo">
        <span className="serif">MEYER</span>
      </Link>
      <div className="right">
        <button className="icon-btn cart-count" onClick={openCart} aria-label="Ver carrito">
          🛍
          <span className="badge">{itemCount}</span>
        </button>
      </div>
    </header>
  );
}
