# Meyer SkinBeauty

Tienda online para venta de skincare — Next.js (App Router) + Supabase +
Mercado Pago.

## Estado del proyecto

Este es el proyecto real (no un prototipo estático): páginas de Next.js,
API routes, y un catálogo de **69 productos reales** cargado desde
`meyer_catalogo_real_2.xlsx`. Para que funcione de punta a punta falta
conectar un proyecto de Supabase y credenciales de Mercado Pago —
ver "Cómo dejarlo funcionando" abajo.

## Estructura

```
app/
  page.tsx                        Home (categorías, destacados, novedades)
  categoria/[slug]/page.tsx       Listado por categoría
  producto/[sku]/page.tsx         Ficha de producto
  checkout/page.tsx               Checkout (datos, envío, resumen)
  checkout/success|pending|failure/page.tsx   Vuelta de Mercado Pago
  api/checkout/route.ts           Crea el pedido "pending" + preferencia de MP
  api/webhooks/mercadopago/route.ts  Confirma el pago (idempotente)
components/                       UI (Header, CartDrawer, ProductCard, ...)
lib/
  products.ts                     Catálogo (Supabase si está configurado, si no data/catalog.json)
  orders.ts                       Pedidos: precio/stock SIEMPRE recalculados en servidor
  mercadopago.ts                  Cliente de Mercado Pago (server-only)
  supabase.ts                     Clientes de Supabase (público + admin/service role)
  shipping.ts                     Envíos (Etapa 6): zonas manuales por CP + adapter para correo real
  seo.ts                          Metadata, OpenGraph y JSON-LD (Product, Breadcrumb, Organization)
  cart-context.tsx                Carrito client-side (Context + localStorage)
app/api/shipping/calculate/route.ts   Cotización de envío que consume el checkout
app/sitemap.ts / app/robots.ts    /sitemap.xml y /robots.txt dinámicos (sólo rutas que existen hoy)
data/
  catalog.json / categories.json  Catálogo real normalizado desde el xlsx
  meyer_catalogo_real_2.xlsx      Archivo original de la clienta (referencia)
supabase/
  schema.sql                      Esquema completo (productos, pedidos, webhooks, RLS)
scripts/
  seed-products.ts                Carga data/catalog.json en Supabase
docs/
  design-prototype.html           Prototipo visual original (referencia de diseño)
  etapa-5-mercadopago-notas-originales.md
  checklist-etapa7-qa.md          Checklist de QA/seguridad/SEO/perf antes de producción (manual)
```

## Reglas de seguridad (se mantienen en todo el código)

1. El front nunca manda precios — sólo `{ product_id (sku), quantity }`.
   `lib/orders.ts` recalcula todo contra la tabla `products`.
2. Un pedido sólo pasa a `approved` cuando Mercado Pago lo confirma por
   webhook (`app/api/webhooks/mercadopago/route.ts`), verificando la
   firma **y** consultando el pago directo contra la API de Mercado
   Pago — nunca sólo porque el usuario volvió a la pantalla de éxito.
3. El webhook es idempotente: la misma notificación (o un reintento)
   nunca descuenta stock ni actualiza el pedido dos veces.
4. Row Level Security habilitado en toda la base; sólo `products` es de
   lectura pública, todo lo demás requiere la service role key
   (server-only, nunca se expone al navegador).

## Cómo dejarlo funcionando

```bash
npm install
cp .env.example .env.local   # completar con credenciales reales
```

1. **Supabase**: crear un proyecto, correr `supabase/schema.sql` en el
   SQL Editor, y completar `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` en
   `.env.local`.
2. **Cargar el catálogo real**: `npm run seed:products`. Ojo:
   `precio`, `precio_oferta` y `stock` llegan vacíos en el xlsx
   original — hay que completarlos a mano en Supabase (o en
   `data/catalog.json` antes de sembrar) antes de poder vender cada
   producto. Mientras no tengan precio, el sitio los muestra como
   "Precio a confirmar" y el botón de compra queda deshabilitado.
3. **Mercado Pago**: cargar `MERCADOPAGO_ACCESS_TOKEN`,
   `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` y `MERCADOPAGO_WEBHOOK_SECRET`
   desde el panel de developers, y configurar la `notification_url`
   (`{tu dominio}/api/webhooks/mercadopago`) una vez desplegado.
4. **Fotos de producto**: las imágenes que había son fichas
   informativas completas (con texto), no fotos limpias del envase —
   por eso el catálogo hoy muestra un ícono en vez de foto. Cuando haya
   fotos reales, se suben y se completa `image_url` en `products`.
5. `npm run dev` y probar el flujo completo con tarjetas de prueba de
   Mercado Pago antes de pasar a producción.

## Envíos (Etapa 6)

`lib/shipping.ts` calcula el envío por zona a partir del código postal
(Fase 1: reglas manuales — San Miguel de Tucumán, resto de Tucumán,
resto del país). Los costos están en **$0 como placeholder** — hay que
cargar las tarifas reales antes de publicar. Está armado con un
`ShippingProviderAdapter`: para conectar un correo real (Andreani,
Correo Argentino, OCA) alcanza con implementar esa interfaz y
cambiar una línea, sin tocar el checkout ni `app/api/shipping/calculate`.

**Importante**: esta cotización es sólo para mostrarle un precio al
usuario antes de pagar — el costo que efectivamente se cobra se
recalcula igual en `app/api/checkout` (server-side), como todo lo demás.

## SEO (Etapa 7, parcial)

`app/sitemap.ts`, `app/robots.ts` y `lib/seo.ts` ya están integrados:
cada producto y categoría trae su `<title>`/`description`/OpenGraph
(`generateMetadata`) y JSON-LD (`Product`, `BreadcrumbList`;
`Organization` una vez en el layout raíz). El sitemap sólo lista rutas
que existen de verdad hoy — `/novedades`, `/ofertas` y
`/the-meyer-edit` quedan afuera hasta que tengan una página real
detrás (hoy "novedades/destacados" son sólo secciones de la home).

`docs/checklist-etapa7-qa.md` es la lista de verificación manual
(mobile, seguridad, performance, accesibilidad) a repasar antes de
publicar — no es código, son pasos a probar sobre el sitio ya
desplegado.

## Qué falta (por etapa)

- **Etapa 6 — tarifas reales**: `lib/shipping.ts` ya tiene la
  arquitectura (zonas + adapter), pero los costos siguen en $0 — falta
  cargar las tarifas reales y, más adelante, conectar un correo de
  verdad en vez de las reglas manuales.
- **Etapa 7 — el resto del checklist**: rate limiting en
  `/api/checkout` y `/api/webhooks/mercadopago`, panel `/admin` con
  autenticación real, imágenes con `next/image` + `alt` descriptivo,
  y todo lo demás en `docs/checklist-etapa7-qa.md`.
- Cuentas de cliente, historial de pedidos, emails transaccionales,
  cupón editable desde el checkout (el backend ya lo soporta, falta
  el campo en la UI) — sin etapa asignada todavía.
