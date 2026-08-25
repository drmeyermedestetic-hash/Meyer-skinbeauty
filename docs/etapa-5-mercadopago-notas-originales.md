# Meyer SkinBeauty — Integración Mercado Pago (Etapa 5)

Este paquete contiene el código real para conectar el checkout con
Mercado Pago Argentina, siguiendo las reglas de seguridad del prompt
original: nunca se guardan datos de tarjeta, el precio final siempre
se calcula en el servidor (nunca se confía en lo que manda el
navegador), y una compra solo se marca como pagada cuando Mercado
Pago lo confirma por webhook — nunca solo porque el usuario volvió a
la pantalla de éxito.

## Qué incluye

- `lib/mercadopago.ts` — cliente de Mercado Pago (server-only).
- `lib/orders.ts` — helpers de pedidos contra Supabase (usa las
  tablas `orders` / `order_items` / `payment_webhook_events` del
  `schema.sql` de la Etapa 3).
- `app/api/checkout/route.ts` — crea el pedido en estado `pending` y
  la preferencia de pago.
- `app/api/webhooks/mercadopago/route.ts` — recibe la notificación de
  Mercado Pago, verifica el pago contra su API, y recién ahí actualiza
  el pedido y descuenta stock. Es idempotente: un mismo evento nunca
  se procesa dos veces.
- `app/checkout/success|pending|failure/page.tsx` — las tres pantallas
  de retorno del checkout de Mercado Pago.
- `.env.example` — variables necesarias.

## Qué falta para que funcione de verdad

Este código es real y sigue el patrón oficial del SDK de Mercado
Pago, pero **no puede ejecutarse ni desplegarse desde este chat** —
acá solo genero archivos estáticos, no hay servidor Next.js corriendo
ni base de datos conectada. Para dejarlo funcionando en producción,
el paso natural es llevar este proyecto (junto con `schema.sql` y el
diseño de la Etapa 1-2) a **Claude Code**, donde sí se puede:

1. Instalar el SDK oficial: `npm install mercadopago @supabase/supabase-js`
2. Completar los `TODO` de `lib/orders.ts` con las queries reales a
   Supabase (crear el pedido, validar stock, aplicar cupón).
3. Cargar las variables de `.env.example` con las credenciales reales
   (nunca commitear el `.env.local`).
4. Configurar la `notification_url` en el panel de Mercado Pago para
   que apunte al dominio real una vez desplegado.
5. Probar el flujo completo con las tarjetas de prueba de Mercado
   Pago antes de pasar a producción.

## Próxima etapa

Etapa 6 — envíos (cálculo por código postal, retiro en local).
