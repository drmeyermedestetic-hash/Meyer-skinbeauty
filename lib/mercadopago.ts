// lib/mercadopago.ts
// Cliente de Mercado Pago (server-only). Usa el SDK oficial `mercadopago`.
// Nunca importar este módulo desde un componente "use client": expondría
// el access token si se hiciera bundle para el browser.

import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

let cachedConfig: MercadoPagoConfig | null = null;

function getConfig(): MercadoPagoConfig {
  if (!ACCESS_TOKEN) {
    throw new Error(
      "Mercado Pago no está configurado: falta MERCADOPAGO_ACCESS_TOKEN en el entorno."
    );
  }
  if (!cachedConfig) {
    cachedConfig = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN });
  }
  return cachedConfig;
}

/** Preferencias de pago (crear el checkout de Mercado Pago). */
export const mpPreference = {
  create: (args: Parameters<Preference["create"]>[0]) =>
    new Preference(getConfig()).create(args),
};

/** Consulta de pagos (usado por el webhook para verificar el estado real). */
export const mpPayment = {
  get: (args: Parameters<Payment["get"]>[0]) =>
    new Payment(getConfig()).get(args),
};
