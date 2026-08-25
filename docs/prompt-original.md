# Prompt original — Meyer SkinBeauty

Transcripción del prompt que dio origen al proyecto (viene embebido como
imagen dentro de `etapa-1-mockup-pantallas.png`, junto al mockup de las
12 pantallas aprobadas). El título de la imagen está estilizado/generado
y algunas letras salieron distorsionadas — se transcribe la lectura más
fiel posible; el resto del texto se lee claro.

---

**PROMPT PARA CLAUDE**
**DESARROLLAR TIENDA ONLINE MEYER SKINBEAUTY**

Quiero que actúes como un equipo senior de diseño, desarrollo y
ecommerce para crear una tienda online premium para Meyer SkinBeauty.
Debe ser una plataforma completa, moderna, elegante y funcional, con
la siguiente estructura y características:

- ✅ Diseño visual basado en mi estética (fotos y referencias).
- ✅ Categorías: Skincare Coreano, Medical Skincare, Makeup, Labios,
  Mascarillas, Body & Fragrances, Novedades, Ofertas.
- ✅ Home con hero, categorías circulares, productos destacados,
  sección editorial y más.
- ✅ Filtros avanzados por categoría, marca, tipo de producto, tipo
  de piel, necesidades y precio.
- ✅ Ficha de producto con galería, descripción, beneficios,
  ingredientes, tipo de piel, modo de uso y stock.
- ✅ Carrito lateral, checkout simple y rápido.
- ✅ Integración con Mercado Pago (tarjetas, transferencias, etc.).
- ✅ Envíos a todo el país (con configuración de costos).
- ✅ Gestión de stock, pedidos y pagos.
- ✅ Panel administrativo completo.
- ✅ Buscador inteligente.
- ✅ Sección de contenido editorial.
- ✅ WhatsApp flotante.
- ✅ Diseño responsive y optimizado para mobile first.
- ✅ SEO completo y URLs amigables.
- ✅ Tecnología: Next.js + TypeScript + **Tailwind CSS**.
- ✅ Base de datos: Supabase/PostgreSQL.
- ✅ Sin exponer claves privadas en el frontend.

El resultado debe sentirse como la extensión digital de mi clínica: la
misma identidad, los mismos tonos, el mismo nivel de lujo, medicina y
belleza.

Antes de programar, presentá la propuesta visual y estructural (como
un mockup) para que pueda revisarla y aprobarla.

*Meyer SkinBeauty*

---

## Notas contra lo que hay hoy en el repo

- **Tailwind CSS**: el prompt lo pedía como parte del stack. Este
  proyecto se construyó con CSS plano (`app/globals.css`), portado
  directamente del prototipo HTML aprobado, para tener fidelidad
  pixel a pixel con el diseño ya validado. Es una desviación
  consciente del stack pedido, no un olvido — no hay necesidad
  funcional de migrar a Tailwind mientras el resultado visual sea el
  aprobado.
- **Categoría "Makeup"**: confirmada acá como parte del alcance
  original. El catálogo real (`meyer_catalogo_real_2.xlsx`) todavía no
  trae productos de esa categoría — falta cargarlos cuando estén
  definidos.
- **Filtros avanzados** (marca, tipo de producto, tipo de piel,
  necesidades, precio): el prompt los pedía explícitamente. Hoy
  `/categoria/[slug]` sólo tiene los rótulos "Filtrar"/"Ordenar" sin
  lógica real detrás — pendiente.
- **Buscador inteligente, sección editorial ("The Meyer Edit"),
  WhatsApp flotante**: confirmados como parte del alcance original,
  con pantalla propia en el mockup (`etapa-1-mockup-pantallas.png`,
  pantallas 9, 11 y 12) — ninguno está construido todavía.
