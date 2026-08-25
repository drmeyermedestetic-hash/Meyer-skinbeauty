// app/robots.ts
//
// /admin y /cuenta todavía no existen como páginas (no hay backoffice
// ni cuentas de cliente implementados), pero se dejan bloqueadas de
// entrada: el día que se agreguen, ya van a quedar fuera del index sin
// tener que acordarse de volver a tocar este archivo.

import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://meyerskinbeauty.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/checkout/success", "/checkout/pending", "/cuenta"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
