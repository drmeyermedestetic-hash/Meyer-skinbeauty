// lib/shipping.ts
//
// Arquitectura de envíos para Argentina (Etapa 6): reglas manuales al
// inicio + un adapter preparado para conectar un proveedor logístico
// real más adelante (Correo Argentino, Andreani, etc.) sin tener que
// reescribir el checkout.
//
// IMPORTANTE: las tarifas de abajo son PLACEHOLDERS. No están basadas en
// ningún proveedor real — hay que reemplazarlas por los costos reales
// antes de publicar la tienda. Están marcadas con TODO.

import type { ShippingMethod } from "@/lib/types";

export interface ShippingQuote {
  method: ShippingMethod;
  label: string;
  cost: number; // 0 para retiro en local
  etaDays: string; // texto para mostrar, ej: "3 a 5 días hábiles"
}

export interface ShippingAddress {
  postalCode: string;
  province: string;
  city: string;
}

// ------------------------------------------------------------------
// REGLAS MANUALES (Fase 1)
// TODO: reemplazar por tarifas reales. Se puede armar tantas zonas
// como haga falta; la que no matchee ningún rango cae en DEFAULT_ZONE.
// ------------------------------------------------------------------
interface ManualZone {
  name: string;
  postalCodeRanges: [number, number][];
  cost: number;
  etaDays: string;
}

const MANUAL_ZONES: ManualZone[] = [
  {
    name: "San Miguel de Tucumán y alrededores",
    postalCodeRanges: [[4000, 4199]],
    cost: 0, // TODO: definir costo real (o dejar en 0 si es zona de reparto propio)
    etaDays: "24 a 48 horas hábiles",
  },
  {
    name: "Resto de Tucumán",
    postalCodeRanges: [[4200, 4499]],
    cost: 0, // TODO
    etaDays: "3 a 5 días hábiles",
  },
  {
    name: "Otras provincias",
    postalCodeRanges: [
      [1000, 3999],
      [4500, 9999],
    ],
    cost: 0, // TODO
    etaDays: "5 a 8 días hábiles",
  },
];

const DEFAULT_ZONE: ManualZone = {
  name: "Envío a todo el país",
  postalCodeRanges: [],
  cost: 0, // TODO
  etaDays: "5 a 10 días hábiles",
};

function findZone(postalCode: number): ManualZone {
  for (const zone of MANUAL_ZONES) {
    for (const [min, max] of zone.postalCodeRanges) {
      if (postalCode >= min && postalCode <= max) return zone;
    }
  }
  return DEFAULT_ZONE;
}

// ------------------------------------------------------------------
// RETIRO EN LOCAL — sin costo, siempre disponible
// ------------------------------------------------------------------
const STORE_PICKUP: ShippingQuote = {
  method: "retiro_local",
  label: "Retiro en local — Meyer SkinBeauty",
  cost: 0,
  etaDays: "Listo para retirar en 24 horas hábiles",
};

// ------------------------------------------------------------------
// ADAPTER — interfaz para conectar un proveedor logístico real después.
// Cuando se integre Correo Argentino / Andreani / OCA, se implementa
// esta interfaz y se cambia una sola línea en `getShippingQuotes`.
// ------------------------------------------------------------------
export interface ShippingProviderAdapter {
  quote(address: ShippingAddress): Promise<ShippingQuote | null>;
}

// Implementación placeholder — reglas manuales de arriba.
class ManualRulesAdapter implements ShippingProviderAdapter {
  async quote(address: ShippingAddress): Promise<ShippingQuote> {
    const postalCode = Number(address.postalCode);
    const zone = Number.isFinite(postalCode) ? findZone(postalCode) : DEFAULT_ZONE;
    return {
      method: "domicilio",
      label: `Envío a domicilio — ${zone.name}`,
      cost: zone.cost,
      etaDays: zone.etaDays,
    };
  }
}

// TODO (etapa futura): reemplazar por un adapter real, ej:
// class AndreaniAdapter implements ShippingProviderAdapter { ... }
const activeProvider: ShippingProviderAdapter = new ManualRulesAdapter();

/**
 * Devuelve las opciones de envío disponibles para una dirección dada:
 * siempre incluye "retiro en local" + el cálculo a domicilio.
 */
export async function getShippingQuotes(address: ShippingAddress): Promise<ShippingQuote[]> {
  const homeDelivery = await activeProvider.quote(address);
  return homeDelivery ? [STORE_PICKUP, homeDelivery] : [STORE_PICKUP];
}
