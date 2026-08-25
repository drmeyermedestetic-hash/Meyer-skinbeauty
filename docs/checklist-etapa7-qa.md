# Meyer SkinBeauty — Checklist Etapa 7 (QA, Mobile, Seguridad, SEO, Producción)

Esto es una lista de verificación real para pasar antes de publicar la
tienda. No son cosas que yo pueda "correr" desde el chat — se hacen
sobre el proyecto ya corriendo en Claude Code / Vercel.

## 1. Mobile testing

- [ ] Probar en un iPhone real (Safari) — es el navegador donde más
      rompen los checkouts, no solo en Chrome/emulador.
- [ ] Probar con teclado abierto en el checkout: que los campos no
      queden tapados por el teclado ni por el botón de "Pagar".
- [ ] Probar el carrito drawer con 8+ productos cargados (scroll,
      que el resumen y el botón de finalizar sigan visibles).
- [ ] Probar la rotación de pantalla (horizontal) — que no rompa el layout.
- [ ] Verificar el tap target de los botones: mínimo 44x44px (los
      "+/-" de cantidad son los que más fallan en este punto).

## 2. Seguridad

- [ ] Confirmar que `MP_ACCESS_TOKEN` y `SUPABASE_SERVICE_ROLE_KEY`
      están SOLO en variables de entorno del servidor (Vercel/hosting),
      nunca en código ni en el repo.
- [ ] Confirmar que ningún endpoint acepta el precio desde el body del
      request — siempre se recalcula contra `products` en servidor
      (ver `lib/orders.ts`, Etapa 5).
- [ ] Rate limiting en `/api/checkout` y `/api/webhooks/mercadopago`
      (por ejemplo con Upstash o el rate limit de Vercel) para evitar
      abuso.
- [ ] RLS de Supabase activado y probado: un cliente logueado no debe
      poder leer pedidos de otro cliente.
- [ ] El panel `/admin` protegido con autenticación real (no solo una
      ruta "oculta").
- [ ] Sanitizar cualquier campo de texto libre que se muestre en la web
      (reseñas, notas de dirección) para evitar XSS.

## 3. SEO

- [ ] Verificar que `/sitemap.xml` y `/robots.txt` responden bien en
      producción (ver `app/sitemap.ts` y `app/robots.ts`).
- [ ] Cada página de producto tiene su `<title>`, `description`,
      OpenGraph y JSON-LD de `Product` (ver `lib/seo.ts`).
- [ ] Verificar el JSON-LD con la herramienta de Google (Rich Results
      Test) antes de publicar.
- [ ] Imágenes con `alt` descriptivo (marca + nombre del producto, no
      "imagen1.png").
- [ ] Dar de alta el sitio en Google Search Console y enviar el sitemap.

## 4. Performance (Core Web Vitals)

- [ ] Imágenes de producto en WebP/AVIF y con `next/image` (lazy
      loading automático).
- [ ] Medir con Lighthouse mobile antes de publicar — apuntar a LCP
      < 2.5s.
- [ ] Verificar que las fuentes (serif editorial + sans) usan
      `font-display: swap` para no bloquear el render.
- [ ] Revisar el bundle de JS del checkout — es la página que más
      importa que cargue rápido.

## 5. Accesibilidad

- [ ] Contraste de texto verificado, especialmente el dorado
      champagne sobre fondo negro (puede quedar bajo en contraste).
- [ ] Navegación completa por teclado en el checkout.
- [ ] Labels reales en todos los inputs del formulario (no solo
      placeholder).

## 6. Antes de pasar a producción

- [ ] Probar el flujo de compra completo con las tarjetas de prueba
      de Mercado Pago (aprobada, rechazada, pendiente).
- [ ] Confirmar que el stock se descuenta una sola vez por pedido
      (probar reenviando el mismo webhook dos veces — no debería
      duplicar el descuento).
- [ ] Cargar los precios y el stock real de los 69 productos antes de
      abrir la tienda al público.
- [ ] Definir y cargar las tarifas de envío reales (hoy están en $0
      como placeholder — ver `lib/shipping.ts`, Etapa 6).
- [ ] Configurar el dominio real y el certificado SSL.
- [ ] Backup / plan de rollback antes del lanzamiento.
