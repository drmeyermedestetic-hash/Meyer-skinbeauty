// lib/orders.ts
// Helpers de pedidos contra Supabase. Server-only.
//
// Regla de seguridad central de todo este módulo: el front SOLO manda
// { product_id (sku), quantity } — el precio, el nombre y la
// disponibilidad de stock se leen SIEMPRE de la tabla `products` acá
// adentro. Nunca se confía en un precio que venga del navegador.

import { getSupabaseAdminClient } from "@/lib/supabase";
import type { ShippingMethod } from "@/lib/types";

export interface CreatePendingOrderInput {
  customerId?: string | null;
  customer?: {
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  } | null;
  items: Array<{ product_id: string; quantity: number }>; // product_id = sku
  shippingMethod: ShippingMethod;
  shippingAddressId?: string | null;
  shippingAddress?: {
    street: string;
    city?: string;
    province?: string;
    postalCode: string;
  } | null;
  shippingCost?: number;
  couponCode?: string | null;
}

export interface OrderItemResult {
  product_id: string; // sku, para que el front construya la preferencia de MP
  name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export interface PendingOrderResult {
  id: string;
  status: "pending";
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  items: OrderItemResult[];
}

export class OrderError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * Crea un pedido en estado "pending", validando stock y recalculando
 * cada precio contra la tabla `products`. Devuelve el pedido con los
 * precios ya validados, listos para armar la preferencia de Mercado Pago.
 */
export async function createPendingOrder(
  input: CreatePendingOrderInput
): Promise<PendingOrderResult> {
  if (!input.items?.length) {
    throw new OrderError("Carrito vacío");
  }
  if (input.shippingMethod !== "domicilio" && input.shippingMethod !== "retiro_local") {
    throw new OrderError("Método de envío inválido");
  }

  const supabase = getSupabaseAdminClient();

  // Cliente + dirección: se guardan tal cual los tipeó (no afectan el
  // precio, así que no hace falta "validarlos" contra nada server-side
  // más que sanitizar tipos básicos).
  let customerId = input.customerId ?? null;
  if (!customerId && input.customer?.email) {
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .upsert(
        {
          email: input.customer.email.trim().toLowerCase(),
          first_name: input.customer.firstName ?? null,
          last_name: input.customer.lastName ?? null,
          phone: input.customer.phone ?? null,
        },
        { onConflict: "email" }
      )
      .select("id")
      .single();
    if (customerError) throw customerError;
    customerId = customer.id;
  }

  let shippingAddressId = input.shippingAddressId ?? null;
  if (!shippingAddressId && input.shippingAddress?.street) {
    const { data: address, error: addressError } = await supabase
      .from("addresses")
      .insert({
        customer_id: customerId,
        street: input.shippingAddress.street,
        city: input.shippingAddress.city ?? null,
        province: input.shippingAddress.province ?? null,
        postal_code: input.shippingAddress.postalCode,
      })
      .select("id")
      .single();
    if (addressError) throw addressError;
    shippingAddressId = address.id;
  }

  const skus = input.items.map((it) => it.product_id);
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, sku, name, price, sale_price, stock, active")
    .in("sku", skus);

  if (productsError) throw productsError;

  const bySku = new Map((products ?? []).map((p) => [p.sku, p]));
  const orderItems: (OrderItemResult & { productId: string })[] = [];

  for (const line of input.items) {
    const qty = Number(line.quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new OrderError(`Cantidad inválida para ${line.product_id}`);
    }
    const product = bySku.get(line.product_id);
    if (!product || !product.active) {
      throw new OrderError(`Producto no disponible: ${line.product_id}`);
    }
    const price = product.sale_price ?? product.price;
    if (price === null || price === undefined) {
      throw new OrderError(
        `El producto ${product.name} todavía no tiene precio cargado`
      );
    }
    if (product.stock < qty) {
      throw new OrderError(`Sin stock suficiente de ${product.name}`, 409);
    }
    orderItems.push({
      productId: product.id,
      product_id: product.sku,
      name: product.name,
      unit_price: Number(price),
      quantity: qty,
      subtotal: Number(price) * qty,
    });
  }

  const subtotal = orderItems.reduce((sum, it) => sum + it.subtotal, 0);

  let discount = 0;
  let couponId: string | null = null;
  if (input.couponCode) {
    const { data: coupon } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", input.couponCode.trim().toUpperCase())
      .eq("active", true)
      .maybeSingle();
    const now = new Date();
    const withinWindow =
      coupon &&
      (!coupon.valid_from || new Date(coupon.valid_from) <= now) &&
      (!coupon.valid_until || new Date(coupon.valid_until) > now);
    const withinLimit =
      coupon && (coupon.usage_limit === null || coupon.times_used < coupon.usage_limit);
    if (coupon && withinWindow && withinLimit) {
      couponId = coupon.id;
      discount =
        coupon.discount_type === "percentage"
          ? Math.round((subtotal * Number(coupon.discount_value)) / 100)
          : Number(coupon.discount_value);
      discount = Math.min(discount, subtotal);
    }
    // Un código inválido/vencido/agotado se ignora silenciosamente: no
    // bloqueamos el checkout por eso. times_used recién se incrementa
    // cuando el pago se aprueba de verdad (ver applyPaymentResult) para
    // no "gastar" el cupón en carritos que nunca se pagan.
  }

  const shippingCost =
    input.shippingMethod === "retiro_local" ? 0 : Number(input.shippingCost ?? 0);
  const total = subtotal - discount + shippingCost;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: customerId,
      status: "pending",
      subtotal,
      shipping_cost: shippingCost,
      discount,
      total,
      shipping_method: input.shippingMethod,
      shipping_address_id: shippingAddressId,
      coupon_id: couponId,
    })
    .select("id")
    .single();

  if (orderError) throw orderError;

  const { error: itemsError } = await supabase.from("order_items").insert(
    orderItems.map((it) => ({
      order_id: order.id,
      product_id: it.productId,
      product_sku: it.product_id,
      product_name: it.name,
      unit_price: it.unit_price,
      quantity: it.quantity,
      line_total: it.subtotal,
    }))
  );

  if (itemsError) throw itemsError;

  return {
    id: order.id,
    status: "pending",
    subtotal,
    shippingCost,
    discount,
    total,
    items: orderItems.map(({ productId, ...rest }) => rest),
  };
}

/** Guarda la preferencia de Mercado Pago generada para un pedido. */
export async function attachPreferenceToOrder(
  orderId: string,
  preferenceId: string
) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("orders")
    .update({ mp_preference_id: preferenceId })
    .eq("id", orderId);
  if (error) throw error;
}

/**
 * Registra un evento de webhook de forma idempotente. Devuelve
 * `alreadyProcessed: true` si ese evento ya se había procesado antes
 * (mismo topic+id de Mercado Pago), para que el handler no vuelva a
 * aplicar side effects (descontar stock, etc.) dos veces.
 */
export async function recordWebhookEvent(params: {
  mpEventId: string;
  paymentId?: string | null;
  status?: string | null;
  rawPayload: unknown;
}): Promise<{ alreadyProcessed: boolean; eventRowId: string }> {
  const supabase = getSupabaseAdminClient();

  const { data: existing } = await supabase
    .from("payment_webhook_events")
    .select("id, processed_at")
    .eq("mp_event_id", params.mpEventId)
    .maybeSingle();

  if (existing) {
    return { alreadyProcessed: Boolean(existing.processed_at), eventRowId: existing.id };
  }

  const { data: inserted, error } = await supabase
    .from("payment_webhook_events")
    .insert({
      mp_event_id: params.mpEventId,
      payment_id: params.paymentId ?? null,
      status: params.status ?? null,
      raw_payload: params.rawPayload as any,
    })
    .select("id")
    .single();

  if (error) {
    // Condición de carrera: otro request insertó el mismo evento primero.
    if (error.code === "23505") {
      const { data: raceExisting } = await supabase
        .from("payment_webhook_events")
        .select("id, processed_at")
        .eq("mp_event_id", params.mpEventId)
        .single();
      return {
        alreadyProcessed: Boolean(raceExisting?.processed_at),
        eventRowId: raceExisting?.id ?? "",
      };
    }
    throw error;
  }

  return { alreadyProcessed: false, eventRowId: inserted.id };
}

/**
 * Aplica el resultado final de un pago verificado contra la API de
 * Mercado Pago: actualiza el pedido y, si fue aprobado, descuenta
 * stock. Se llama únicamente desde el webhook, nunca desde las
 * pantallas de retorno del checkout.
 */
export async function applyPaymentResult(params: {
  orderId: string;
  eventRowId: string;
  paymentId: string;
  mpStatus: string; // "approved" | "rejected" | "in_process" | "cancelled" | "refunded" | ...
}) {
  const supabase = getSupabaseAdminClient();

  const status = mapMpStatusToOrderStatus(params.mpStatus);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, status, coupon_id")
    .eq("id", params.orderId)
    .single();
  if (orderError) throw orderError;

  // Idempotencia adicional: si el pedido ya está aprobado, no volvemos
  // a descontar stock ni a "gastar" el cupón aunque llegue una
  // notificación repetida.
  if (order.status !== "approved" && status === "approved") {
    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("product_id, quantity")
      .eq("order_id", params.orderId);
    if (itemsError) throw itemsError;

    for (const item of items ?? []) {
      if (!item.product_id) continue;
      const { error: stockError } = await supabase.rpc("decrement_product_stock", {
        p_product_id: item.product_id,
        p_quantity: item.quantity,
      });
      // Si el RPC no existe todavía (falta correrlo en Supabase), no
      // rompemos la confirmación del pago por eso — se loguea.
      if (stockError) console.error("No se pudo descontar stock:", stockError);
    }

    if (order.coupon_id) {
      const { error: couponError } = await supabase.rpc("increment_coupon_usage", {
        p_coupon_id: order.coupon_id,
      });
      if (couponError) console.error("No se pudo actualizar el uso del cupón:", couponError);
    }
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({ status, mp_payment_id: params.paymentId })
    .eq("id", params.orderId);
  if (updateError) throw updateError;

  await supabase
    .from("payment_webhook_events")
    .update({ processed_at: new Date().toISOString(), order_id: params.orderId })
    .eq("id", params.eventRowId);
}

function mapMpStatusToOrderStatus(
  mpStatus: string
): "approved" | "rejected" | "pending" | "cancelled" | "refunded" {
  switch (mpStatus) {
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    case "cancelled":
      return "cancelled";
    case "refunded":
    case "charged_back":
      return "refunded";
    default:
      return "pending"; // in_process, pending, etc.
  }
}

export async function getOrderById(orderId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, status, subtotal, shipping_cost, discount, total, created_at")
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
