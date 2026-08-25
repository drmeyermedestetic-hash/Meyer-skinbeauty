-- Meyer SkinBeauty — esquema de base de datos (Supabase / Postgres)
-- ---------------------------------------------------------------
-- Cubre: catálogo de productos, clientes, direcciones, pedidos,
-- items de pedido, cupones y el log idempotente de webhooks de
-- Mercado Pago.
--
-- Reglas de seguridad que este esquema hace cumplir:
--   1. El precio de un pedido siempre se calcula en el servidor a
--      partir de `products.price` / `products.sale_price` — nunca
--      se confía en lo que manda el navegador.
--   2. Un pedido solo pasa a "approved" cuando Mercado Pago lo
--      confirma por webhook (ver `payment_webhook_events`), nunca
--      solo por la vuelta del usuario a la pantalla de éxito.
--   3. Row Level Security queda habilitado en todas las tablas.
--      Las tablas sensibles (orders, order_items, customers,
--      addresses, payment_webhook_events) sólo son accesibles con
--      la service role key (uso exclusivo del servidor, nunca del
--      browser). `products` es de lectura pública para poder
--      mostrar el catálogo sin autenticación.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------
-- PRODUCTOS
-- ---------------------------------------------------------------
create table if not exists products (
  id                 uuid primary key default gen_random_uuid(),
  sku                text unique not null,
  slug               text unique not null,
  name               text not null,
  brand              text,
  category           text not null,
  category_slug      text not null,
  subcategory        text,
  short_description  text,
  description        text,
  benefits           text[] default '{}',
  key_ingredients    text[] default '{}',
  skin_type          text[] default '{}',
  usage_instructions text,
  origin             text,
  size               text,
  price              numeric(12,2),        -- NULL = precio todavía no cargado
  sale_price         numeric(12,2),
  stock              integer not null default 0,
  image_url          text,
  info_sheet_file    text,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists idx_products_category_slug on products(category_slug);
create index if not exists idx_products_is_active on products(is_active);

-- ---------------------------------------------------------------
-- CLIENTES Y DIRECCIONES
-- ---------------------------------------------------------------
create table if not exists customers (
  id         uuid primary key default gen_random_uuid(),
  -- La app siempre guarda el email en minúsculas (ver lib/orders.ts),
  -- así que un unique constraint simple alcanza para el upsert por email.
  email      text not null unique,
  first_name text,
  last_name  text,
  phone      text,
  created_at timestamptz not null default now()
);

create table if not exists addresses (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade,
  street      text not null,
  city        text,
  province    text,
  postal_code text not null,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- CUPONES (opcional, referenciado por app/api/checkout)
-- ---------------------------------------------------------------
create table if not exists coupons (
  id             uuid primary key default gen_random_uuid(),
  code           text unique not null,
  discount_type  text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(12,2) not null,
  active         boolean not null default true,
  expires_at     timestamptz,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- PEDIDOS
-- ---------------------------------------------------------------
create table if not exists orders (
  id                   uuid primary key default gen_random_uuid(),
  customer_id          uuid references customers(id),
  status               text not null default 'pending'
                         check (status in ('pending','approved','rejected','cancelled','refunded')),
  subtotal             numeric(12,2) not null default 0,
  shipping_cost        numeric(12,2) not null default 0,
  discount             numeric(12,2) not null default 0,
  total                numeric(12,2) not null default 0,
  shipping_method      text not null check (shipping_method in ('domicilio','retiro_local')),
  shipping_address_id  uuid references addresses(id),
  coupon_code          text,
  mp_preference_id     text,
  mp_payment_id        text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_mp_payment_id on orders(mp_payment_id);

create table if not exists order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references orders(id) on delete cascade,
  product_id   uuid references products(id),
  product_sku  text not null,
  name         text not null,
  unit_price   numeric(12,2) not null,
  quantity     integer not null check (quantity > 0),
  subtotal     numeric(12,2) not null
);

create index if not exists idx_order_items_order_id on order_items(order_id);

-- ---------------------------------------------------------------
-- WEBHOOKS DE MERCADO PAGO (idempotencia)
-- ---------------------------------------------------------------
create table if not exists payment_webhook_events (
  id            uuid primary key default gen_random_uuid(),
  mp_event_id   text unique not null, -- "topic:id" de la notificación
  order_id      uuid references orders(id),
  payment_id    text,
  status        text,
  raw_payload   jsonb,
  processed_at  timestamptz,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Descuento de stock atómico (usado por el webhook al aprobar un pago)
-- ---------------------------------------------------------------
create or replace function decrement_product_stock(p_product_id uuid, p_quantity integer)
returns void as $$
begin
  update products
    set stock = greatest(stock - p_quantity, 0)
    where id = p_product_id;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_products_updated_at on products;
create trigger trg_products_updated_at before update on products
  for each row execute function set_updated_at();

drop trigger if exists trg_orders_updated_at on orders;
create trigger trg_orders_updated_at before update on orders
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------
alter table products enable row level security;
alter table customers enable row level security;
alter table addresses enable row level security;
alter table coupons enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payment_webhook_events enable row level security;

-- Catálogo: lectura pública de productos activos (front usa la anon key).
drop policy if exists "products_public_read" on products;
create policy "products_public_read" on products
  for select using (is_active = true);

-- Todo lo demás (pedidos, clientes, webhooks, cupones, escritura de
-- productos) sólo se toca con la service role key desde el servidor
-- — esa key ignora RLS por diseño, así que no hace falta (ni conviene)
-- agregar policies públicas para esas tablas.
