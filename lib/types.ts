// lib/types.ts
// Tipos compartidos por todo el proyecto.

export interface Product {
  sku: string;
  slug: string;
  name: string;
  brand: string | null;
  category: string;
  categorySlug: string;
  subcategory: string | null;
  shortDescription: string | null;
  description: string | null;
  benefits: string[];
  keyIngredients: string[];
  skinType: string[];
  usageInstructions: string | null;
  origin: string | null;
  size: string | null;
  price: number | null;
  salePrice: number | null;
  priceIsPending: boolean;
  stock: number;
  imageUrl?: string | null;
  infoSheetFile: string | null;
  /** Sólo se completa cuando el producto viene de Supabase (products.updated_at). */
  updatedAt?: string | null;
}

export interface Category {
  name: string;
  slug: string;
  icon: string;
}

export interface CartItem {
  sku: string;
  slug: string;
  name: string;
  brand: string | null;
  price: number; // precio de referencia mostrado en el carrito; el servidor lo recalcula igual
  quantity: number;
}

export type ShippingMethod = "domicilio" | "retiro_local";
