// app/api/webhooks/mercadopago/route.ts
// Recibe la notificación de Mercado Pago, la verifica (firma +
// consulta directa a la API de pagos) y recién ahí actualiza el
// pedido y descuenta stock. Nunca confía en el body de la
// notificación por sí solo: es sólo un "avisá que pasó algo", el
// estado real siempre se confirma contra la API de Mercado Pago.
//
// Es idempotente: la misma notificación (o reintentos de la misma)
// nunca se procesa dos veces — ver lib/orders.ts#recordWebhookEvent.

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { mpPayment } from "@/lib/mercadopago";
import { applyPaymentResult, recordWebhookEvent } from "@/lib/orders";

const WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET;

/**
 * Verifica la firma `x-signature` que manda Mercado Pago siguiendo el
 * esquema documentado: HMAC-SHA256 sobre "id:{dataId};request-id:{xRequestId};ts:{ts};"
 * usando el secreto configurado en el panel de Mercado Pago (Webhooks).
 */
function isValidSignature(params: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string;
}): boolean {
  if (!WEBHOOK_SECRET) {
    // Sin secreto configurado no podemos verificar — se rechaza para
    // no procesar notificaciones no confiables en producción.
    console.error("MERCADOPAGO_WEBHOOK_SECRET no está configurado.");
    return false;
  }
  if (!params.xSignature) return false;

  const parts = Object.fromEntries(
    params.xSignature.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k?.trim(), v?.trim()];
    })
  );
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  const manifest = `id:${params.dataId};request-id:${params.xRequestId ?? ""};ts:${ts};`;
  const expected = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(manifest)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const url = new URL(req.url);

    // Mercado Pago manda el id del pago en el body (webhooks v2) o,
    // para integraciones viejas, como query params (?topic=payment&id=...).
    const dataId: string | undefined =
      body?.data?.id ?? url.searchParams.get("id") ?? undefined;
    const topic: string | undefined =
      body?.type ?? url.searchParams.get("topic") ?? undefined;

    if (topic !== "payment" || !dataId) {
      // Otros topics (merchant_order, etc.) no nos interesan acá.
      return NextResponse.json({ received: true });
    }

    const validSignature = isValidSignature({
      xSignature: req.headers.get("x-signature"),
      xRequestId: req.headers.get("x-request-id"),
      dataId: String(dataId),
    });
    if (!validSignature) {
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
    }

    // Nunca confiamos en el status que venga en el body: lo pedimos
    // directo a la API de Mercado Pago con el access token del server.
    const payment = await mpPayment.get({ id: dataId });
    const orderId = payment.external_reference;
    const paymentStatus = payment.status; // "approved" | "rejected" | "in_process" | ...

    if (!orderId) {
      console.error("Pago sin external_reference:", dataId);
      return NextResponse.json({ received: true });
    }

    const { alreadyProcessed, eventRowId } = await recordWebhookEvent({
      mpEventId: `payment:${dataId}:${paymentStatus}`,
      paymentId: String(dataId),
      status: paymentStatus ?? null,
      rawPayload: body,
    });

    if (!alreadyProcessed) {
      await applyPaymentResult({
        orderId,
        eventRowId,
        paymentId: String(dataId),
        mpStatus: paymentStatus ?? "pending",
      });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Error procesando webhook de Mercado Pago:", err);
    // 500 para que Mercado Pago reintente la notificación más tarde.
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
