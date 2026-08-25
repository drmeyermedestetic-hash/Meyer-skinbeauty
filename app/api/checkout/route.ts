// app/api/checkout/route.ts
// Crea el pedido (pending) y la preferencia de pago de Mercado Pago.
// El front SOLO manda product_id + quantity — nunca precios.

import { NextRequest, NextResponse } from "next/server";
import { mpPreference } from "@/lib/mercadopago";
import { attachPreferenceToOrder, createPendingOrder, OrderError } from "@/lib/orders";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

export async function POST(req: NextRequest) {
  try {
    if (!SITE_URL) {
      throw new Error("Falta NEXT_PUBLIC_SITE_URL en el entorno.");
    }

    const body = await req.json();

    // 1) Validar payload básico
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "Carrito vacío" }, { status: 400 });
    }
    if (!body.customer?.email) {
      return NextResponse.json(
        { error: "Falta el email de contacto" },
        { status: 400 }
      );
    }

    // 2) Crear el pedido en estado "pending", con precios recalculados en servidor
    const order = await createPendingOrder({
      customer: body.customer,
      items: body.items, // [{ product_id, quantity }]
      shippingMethod: body.shippingMethod, // "domicilio" | "retiro_local"
      shippingAddress: body.shippingAddress ?? null,
      shippingCost: body.shippingCost ?? 0,
      couponCode: body.couponCode ?? null,
    });

    // 3) Crear la preferencia de pago con los datos YA VALIDADOS del pedido
    const preference = await mpPreference.create({
      body: {
        items: order.items.map((it) => ({
          id: it.product_id,
          title: it.name,
          quantity: it.quantity,
          unit_price: it.unit_price,
          currency_id: "ARS",
        })),
        ...(order.shippingCost > 0
          ? {
              shipments: {
                cost: order.shippingCost,
                mode: "not_specified" as const,
              },
            }
          : {}),
        payer: { email: body.customer.email },
        external_reference: order.id, // así lo identificamos en el webhook
        back_urls: {
          success: `${SITE_URL}/checkout/success`,
          pending: `${SITE_URL}/checkout/pending`,
          failure: `${SITE_URL}/checkout/failure`,
        },
        auto_return: "approved",
        notification_url: `${SITE_URL}/api/webhooks/mercadopago`,
        statement_descriptor: "MEYER SKINBEAUTY",
      },
    });

    if (preference.id) {
      await attachPreferenceToOrder(order.id, preference.id);
    }

    return NextResponse.json({
      orderId: order.id,
      checkoutUrl: preference.init_point,
    });
  } catch (err: any) {
    if (err instanceof OrderError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Error creando preferencia de pago:", err);
    return NextResponse.json(
      { error: "No se pudo iniciar el pago" },
      { status: 500 }
    );
  }
}
