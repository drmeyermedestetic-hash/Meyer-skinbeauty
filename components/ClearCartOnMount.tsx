"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart-context";

/** Vacía el carrito una vez que el pedido ya fue creado (success/pending). */
export default function ClearCartOnMount() {
  const { clear } = useCart();
  useEffect(() => {
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
