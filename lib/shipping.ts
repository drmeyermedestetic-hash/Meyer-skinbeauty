// lib/shipping.ts
// Cálculo de envío. Es un placeholder por zona de código postal —
// la integración real con un correo (Correo Argentino / Andreani /
// Envíopack) queda para la Etapa 6, según el README original.
// Se aísla acá para que reemplazar esta función alcance para
// conectar un proveedor real, sin tocar el checkout.

export interface ShippingOption {
  id: string;
  label: string;
  cost: number;
  etaDays: string;
}

/**
 * Devuelve las opciones de envío a domicilio disponibles para un
 * código postal argentino. Placeholder por zona (AMBA / interior).
 */
export function getShippingOptions(postalCode: string): ShippingOption[] {
  const cp = Number(postalCode);
  const isAmba = !Number.isNaN(cp) && cp >= 1000 && cp <= 1900;

  if (!postalCode || postalCode.trim().length < 4) return [];

  return [
    {
      id: "standard",
      label: isAmba ? "Envío estándar (CABA / GBA)" : "Envío estándar (interior)",
      cost: isAmba ? 3500 : 6500,
      etaDays: isAmba ? "2-3 días hábiles" : "4-7 días hábiles",
    },
    {
      id: "express",
      label: isAmba ? "Envío express (CABA / GBA)" : "Envío express (interior)",
      cost: isAmba ? 5900 : 9900,
      etaDays: isAmba ? "24-48 hs hábiles" : "2-4 días hábiles",
    },
  ];
}

export const PICKUP_OPTION: ShippingOption = {
  id: "retiro_local",
  label: "Retiro en local",
  cost: 0,
  etaDays: "Coordinamos por WhatsApp",
};
