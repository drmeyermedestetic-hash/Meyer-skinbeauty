// app/api/admin/orders/[id]/route.ts
// Cambio manual de estado de un pedido — sólo admins autenticados.
// Pensado para casos excepcionales (ej: reembolso gestionado fuera de
// Mercado Pago, cancelación pedida por el cliente) — el camino normal
// pending -> approved/rejected sigue siendo el webhook de Mercado Pago
// (app/api/webhooks/mercadopago), nunca este endpoint.

import { NextRequest, NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/lib/supabase";

const ALLOWED_STATUSES = ["pending", "approved", "rejected", "cancelled", "refunded"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminForApi();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  if (!body?.status || !ALLOWED_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("orders").update({ status: body.status }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
