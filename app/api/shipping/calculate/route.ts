// app/api/shipping/calculate/route.ts
//
// El checkout llama a este endpoint cuando el usuario carga su código
// postal, y muestra las opciones que devuelve (retiro en local + envío
// a domicilio con su costo y tiempo estimado).

import { NextRequest, NextResponse } from "next/server";
import { getShippingQuotes } from "@/lib/shipping";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body?.postalCode) {
    return NextResponse.json({ error: "Falta el código postal" }, { status: 400 });
  }

  const quotes = await getShippingQuotes({
    postalCode: String(body.postalCode),
    province: body.province ?? "",
    city: body.city ?? "",
  });

  return NextResponse.json({ quotes });
}
