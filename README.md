# Meyer SkinBeauty

Tienda online para venta de skincare — Next.js (App Router) + Supabase +
Mercado Pago, con panel de administración propio.

## Estado del proyecto

Este es el proyecto real (no un prototipo estático): páginas de Next.js,
API routes, un catálogo de **69 productos reales** cargado desde
`meyer_catalogo_real_2.xlsx`, y un panel `/admin` con login y CRUD de
productos/pedidos. Para que funcione de punta a punta falta conectar
un proyecto de Supabase y credenciales de Mercado Pago — ver "Cómo
dejarlo funcionando" abajo.

## Estructura

```
app/
  layout.tsx                      Layout raíz (compartido por tienda y /admin)
  (storefront)/                   Todo el sitio público, con su propio chrome
    layout.tsx                       (CartProvider, Header, CartDrawer, footer)
    page.tsx                         Home (categorías, destacados, novedades)
    categoria/[slug]/page.tsx        Listado por categoría
    producto/[sku]/page.tsx          Ficha de producto
    checkout/page.tsx                Checkout (datos, envío, resumen)
    checkout/success|pending|failure/page.tsx   Vuelta de Mercado Pago
  admin/
    login/page.tsx                   Login (Supabase Auth)
    (panel)/                         Todo lo protegido: layout con sidebar +
                                      requireAdminOrRedirect()
      productos/                       Listado, alta y edición
      pedidos/                         Listado, detalle y cambio manual de estado
  api/
    checkout/route.ts                Crea el pedido "pending" + preferencia de MP
    webhooks/mercadopago/route.ts    Confirma el pago (idempotente)
    shipping/calculate/route.ts      Cotización de envío para el checkout
    admin/products, admin/orders     CRUD del panel (sólo admins)
  sitemap.ts / robots.ts           /sitemap.xml y /robots.txt dinámicos
proxy.ts                          Exige sesión de Supabase Auth en /admin/**
                                   (antes "middleware.ts" — Next.js 16 renombró el archivo)
components/                       UI de la tienda (Header, CartDrawer, ProductCard, ...)
components/admin/                 UI del panel (tablas, formularios, nav, status)
lib/
  products.ts                     Catálogo público (Supabase con RLS, o data/catalog.json)
  orders.ts                       Pedidos: precio/stock SIEMPRE recalculados en servidor
  admin-catalog.ts                Resuelve/crea marca y categoría a partir de texto libre
  admin-auth.ts                   "¿Esta sesión es un admin de verdad?" (admin_users)
  mercadopago.ts                  Cliente de Mercado Pago (server-only)
  supabase.ts                     Clientes de Supabase (público + admin/service role)
  supabase-server.ts              Cliente ligado a la sesión (cookies) — Server Components/API
  supabase-browser.ts             Cliente para el login del panel (navegador)
  shipping.ts                     Envíos (Etapa 6): zonas manuales por CP + adapter para correo real
  seo.ts                          Metadata, OpenGraph y JSON-LD (Product, Breadcrumb, Organization)
  cart-context.tsx                Carrito client-side (Context + localStorage)
data/
  catalog.json / categories.json  Catálogo real normalizado desde el xlsx
  meyer_catalogo_real_2.xlsx      Archivo original de la clienta (referencia)
supabase/
  schema.sql                      Esquema completo: catálogo normalizado, cuentas,
                                   pedidos, cupones, favoritos, editorial, admins, RLS
scripts/
  seed-products.ts                Carga data/catalog.json en Supabase (marcas/categorías incl.)
docs/
  etapa-1-propuesta-diseno-arquitectura.html   Brief maestro: identidad, paleta, tipografía,
                                                sitemap, modelo de datos, roadmap Etapa 1-7
  design-prototype.html           Prototipo visual original de la tienda (referencia)
  admin-prototype.html            Prototipo visual original del panel admin (referencia)
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
   nunca descuenta stock, ni "gasta" un cupón, ni actualiza el pedido
   dos veces.
4. Row Level Security habilitado en toda la base. `products`,
   `brands`, `categories` y `editorial_posts` (publicados) son de
   lectura pública; un cliente logueado sólo ve sus propios
   pedidos/direcciones/favoritos. Todo lo demás — escritura de
   catálogo, pedidos, webhooks, cupones, `admin_users` — sólo se toca
   con la service role key desde el servidor.
5. El panel `/admin` tiene dos capas: `proxy.ts` exige una sesión de
   Supabase Auth válida para entrar a `/admin/**`; cada página/API
   además verifica con la service role que esa cuenta esté en
   `admin_users` (`lib/admin-auth.ts`) — una cuenta cualquiera logueada
   no alcanza para ser admin.

## Cómo dejarlo funcionando

```bash
npm install
cp .env.example .env.local   # completar con credenciales reales
```

1. **Supabase**: crear un proyecto, correr `supabase/schema.sql` en el
   SQL Editor, y completar `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` en
   `.env.local`.
2. **Cargar el catálogo real**: `npm run seed:products` (crea/resuelve
   marcas y categorías, y siembra los 69 productos). Ojo: `precio`,
   `precio_oferta` y `stock` llegan vacíos en el xlsx original — hay
   que completarlos a mano en Supabase o desde `/admin/productos`
   antes de poder vender cada producto. Mientras no tengan precio, el
   sitio los muestra como "Precio a confirmar" y el botón de compra
   queda deshabilitado.
3. **Primer usuario admin**: el panel no tiene alta de admins desde la
   UI (a propósito). Para crear el primero:
   1. Supabase Dashboard → Authentication → Add user (o
      `supabase.auth.admin.createUser`) — crear el usuario con email y
      contraseña.
   2. En el SQL Editor, insertar su fila en `admin_users`:
      ```sql
      insert into admin_users (auth_user_id, full_name, role)
      values ('<uuid del usuario creado arriba>', 'Nombre Apellido', 'admin');
      ```
   3. Entrar a `/admin/login` con ese email/contraseña.
4. **Mercado Pago**: cargar `MERCADOPAGO_ACCESS_TOKEN`,
   `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` y `MERCADOPAGO_WEBHOOK_SECRET`
   desde el panel de developers, y configurar la `notification_url`
   (`{tu dominio}/api/webhooks/mercadopago`) una vez desplegado.
5. **Fotos de producto**: las imágenes que había son fichas
   informativas completas (con texto), no fotos limpias del envase —
   por eso el catálogo hoy muestra un ícono en vez de foto. Cuando haya
   fotos reales, se pueden cargar por URL desde `/admin/productos`
   (campo "URL de imagen principal") una vez que estén subidas a algún
   storage (ej. Supabase Storage).
6. `npm run dev` y probar el flujo completo con tarjetas de prueba de
   Mercado Pago antes de pasar a producción.

## Base de datos (Etapa 3, revisada)

`supabase/schema.sql` normaliza marcas y categorías en tablas propias
(`brands`, `categories` — esta última con `parent_id` para
subcategorías) en vez de guardarlas como texto suelto en `products`.
También suma, listas para usarse cuando haya UI para ellas:

- **Cuentas de cliente** vía Supabase Auth (`customers.auth_user_id`,
  opcional — el checkout sigue funcionando 100% como invitado).
- **Favoritos** (`favorites`) y **contenido editorial** / "The Meyer
  Edit" (`editorial_posts`).
- **Cupones** con `usage_limit`/`times_used` y ventana de vigencia
  (`valid_from`/`valid_until`); `times_used` se incrementa recién
  cuando el pago se aprueba de verdad (no al crear el pedido pending),
  para no "gastar" el cupón en carritos que nunca se pagan.
- **`admin_users`**, con rol (`admin`/`editor`), para el panel.
- `orders.order_number` autogenerado (`MSB-000123`) vía secuencia +
  trigger, en vez de derivarlo del UUID del pedido.

`lib/products.ts` (catálogo público) sigue devolviendo el mismo
`Product` "plano" de siempre (marca y categoría como texto) — arma eso
con un `join` a `brands`/`categories`, así que ningún componente de la
tienda tuvo que cambiar.

## Panel /admin (MVP)

Alcance de esta primera vuelta: **login + CRUD de productos + gestión
de pedidos**. Cupones, stock con alertas, dashboard con KPIs y "The
Meyer Edit" quedan para una vuelta siguiente (la base de datos ya está
lista para todo eso).

- `/admin/login` — email/contraseña contra Supabase Auth.
- `/admin/productos` — listado con búsqueda, alta y edición. Marca y
  categoría son texto libre: si no existen se crean solas
  (`lib/admin-catalog.ts`), no hace falta una pantalla aparte de
  gestión de marcas/categorías todavía.
- `/admin/pedidos` — listado y detalle (items, cliente, dirección,
  totales) con cambio manual de estado, pensado para excepciones
  (reembolso gestionado fuera de Mercado Pago, cancelación). El camino
  normal de confirmación sigue siendo únicamente el webhook.
- "Eliminar" un producto en realidad lo desactiva (`active = false`):
  puede estar referenciado desde pedidos ya hechos.

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

## Brief maestro (Etapa 1) y tipografía

`docs/etapa-1-propuesta-diseno-arquitectura.html` es el brief original
de identidad/arquitectura/roadmap — confirma que las 7 etapas que este
README ya venía siguiendo son las correctas. Dos cosas que trajo y que
se corrigieron:

- **Tipografía real**: el brief pide una serif editorial "de la misma
  familia visual del cartel MEYER" (Cormorant Garamond o Playfair
  Display) + una sans funcional para precios/checkout (Inter o
  Helvetica Neue) — el sitio venía usando sólo las fuentes de sistema
  de fallback. Ahora carga **Playfair Display** + **Inter** vía
  `next/font/google` en el layout raíz (autohospedadas, sin requests
  externos en runtime, `font-display: swap`), con el mismo fallback de
  siempre por si el build no tiene salida a internet.
- El resto del brief (paleta, sitemap, modelo de datos, componentes)
  ya estaba implementado o coincide con lo que se venía construyendo.

## Qué falta

- **Etapa 6 — tarifas reales**: `lib/shipping.ts` ya tiene la
  arquitectura (zonas + adapter), pero los costos siguen en $0 — falta
  cargar las tarifas reales y, más adelante, conectar un correo de
  verdad en vez de las reglas manuales.
- **Etapa 7 — el resto del checklist**: rate limiting en
  `/api/checkout` y `/api/webhooks/mercadopago`, imágenes con
  `next/image` + `alt` descriptivo, y todo lo demás en
  `docs/checklist-etapa7-qa.md`.
- **Admin**: dashboard con KPIs, gestión de cupones desde la UI,
  alertas de stock bajo, "The Meyer Edit" (editorial), gestión de
  marcas/categorías como pantalla propia (hoy se resuelven solas al
  cargar un producto).
- **Storefront**: cuentas de cliente (login + historial de pedidos +
  favoritos — la base ya lo soporta), emails transaccionales, cupón
  editable desde el checkout (el backend ya lo soporta, falta el campo
  en la UI), buscador, botón flotante de WhatsApp (número de contacto
  pendiente de definir).
- **Categoría "Makeup"**: aparece en el sitemap del brief pero no en
  el catálogo real que se cargó (`meyer_catalogo_real_2.xlsx` sólo
  trae las 5 categorías actuales) — falta confirmar si hay productos
  de maquillaje reales para sumarla, o si quedó del brief inicial.
