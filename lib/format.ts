// lib/format.ts
// Helpers de formato compartidos por server y client components.

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

/** Formatea un precio en pesos argentinos, ej: $ 45.900 */
export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined) return "Precio a confirmar";
  return arsFormatter.format(value);
}

/** Genera el número de pedido visible (#MSB0000) a partir del id interno. */
export function formatOrderNumber(orderId: string): string {
  const short = orderId.replace(/-/g, "").slice(0, 6).toUpperCase();
  return `#MSB-${short}`;
}
