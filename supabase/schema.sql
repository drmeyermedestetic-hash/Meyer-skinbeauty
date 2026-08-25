-- Meyer SkinBeauty — esquema de base de datos (Supabase / Postgres)
-- ---------------------------------------------------------------
-- Cubre: marcas, categorías (con subcategorías), catálogo de
-- productos, cuentas de cliente (Supabase Auth), direcciones,
-- favoritos, cupones, pedidos, items de pedido, contenido editorial
-- ("The Meyer Edit"), usuarios administradores y el log idempotente
-- de webhooks de Mercado Pago.
--
-- Reglas de seguridad que este esquema hace cumplir:
--   1. El precio de un pedido siempre se calcula en el servidor a
--      partir de `products.price` / `products.sale_price` — nunca
--      se confía en lo que manda el navegador.
--   2. Un pedido solo pasa a "approved" cuando Mercado Pago lo
--      confirma por webhook (ver `payment_webhook_events`), nunca
--      solo por la vuelta del usuario a la pantalla de éxito.
--   3. Row Level Security queda habilitado en todas las tablas.
--      `products`, `brands`, `categories` y `editorial_posts`
--      (publicados) son de lectura pública. Un cliente autenticado
--      sólo puede leer sus propios pedidos/direcciones/favoritos
--      (auth.uid() = customers.auth_user_id). Todo lo demás —
--      escritura de catálogo, pedidos, webhooks, cupones — sólo se
--      toca con la service role key desde el servidor.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------
-- MARCAS
-- ---------------------------------------------------------------
create table if not exists brands (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  slug       text not null unique,
  logo_url   text,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- CATEGORÍAS (con subcategorías vía parent_id)
-- ---------------------------------------------------------------
create table if not exists categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  parent_id  uuid references categories(id) on delete set null,
  sort_order int not null default 0,
  active     boolean not null default true,
  unique (name, parent_id)
);

create index if not exists idx_categories_parent_id on categories(parent_id);

-- ---------------------------------------------------------------
-- PRODUCTOS
-- ---------------------------------------------------------------
create table if not exists products (
  id                 uuid primary key default gen_random_uuid(),
  sku                text unique not null,
  slug               text unique not null,
  name               text not null,
  brand_id           uuid references brands(id),
  category_id        uuid references categories(id), -- apunta a la subcategoría cuando existe, si no a la categoría
  short_description  text,
  description        text,       -- "qué es"
  benefits           text[] default '{}',
  key_ingredients    text[] default '{}',
  skin_types         text[] default '{}',
  skin_concerns      text[] default '{}',
  how_to_use         text,
  warnings           text,
  country_of_origin  text,
  size               text,
  price              numeric(12,2),        -- NULL = precio todavía no cargado
  sale_price         numeric(12,2),
  stock              integer not null default 0,
  low_stock_threshold integer not null default 5,
  featured           boolean not null default false,
  best_seller        boolean not null default false,
  new_arrival        boolean not null default false,
  active             boolean not null default true,
  main_image         text,
  gallery_images     text[] default '{}',
  information_image  text, -- ficha informativa (infografía), no es la foto de producto
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists idx_products_category_id on products(category_id);
create index if not exists idx_products_brand_id on products(brand_id);
create index if not exists idx_products_active on products(active);

-- ---------------------------------------------------------------
-- CLIENTES Y DIRECCIONES
-- Cuenta de cliente es opcional: el checkout admite compra como
-- invitado (auth_user_id null); si el cliente se loguea con Supabase
-- Auth, auth_user_id lo vincula a su fila.
-- ---------------------------------------------------------------
create table if not exists customers (
  id           uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  -- La app siempre guarda el email en minúsculas (ver lib/orders.ts),
  -- así que un unique constraint simple alcanza para el upsert por email.
  email        text not null unique,
  first_name   text,
  last_name    text,
  phone        text,
  created_at   timestamptz not null default now()
);

create unique index if not exists idx_customers_auth_user_id on customers(auth_user_id) where auth_user_id is not null;

create table if not exists addresses (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid references customers(id) on delete cascade,
  street          text not null,
  number          text,
  floor_apartment text,
  city            text,
  province        text,
  postal_code     text not null,
  notes           text,
  is_default      boolean not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists idx_addresses_customer_id on addresses(customer_id);

-- ---------------------------------------------------------------
-- FAVORITOS
-- ---------------------------------------------------------------
create table if not exists favorites (
  customer_id uuid not null references customers(id) on delete cascade,
  product_id  uuid not null references products(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (customer_id, product_id)
);

-- ---------------------------------------------------------------
-- CUPONES
-- ---------------------------------------------------------------
create table if not exists coupons (
  id             uuid primary key default gen_random_uuid(),
  code           text unique not null,
  discount_type  text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(12,2) not null,
  active         boolean not null default true,
  valid_from     timestamptz,
  valid_until    timestamptz,
  usage_limit    integer,
  times_used     integer not null default 0,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- PEDIDOS
-- ---------------------------------------------------------------
create sequence if not exists order_number_seq start 1;

create table if not exists orders (
  id                   uuid primary key default gen_random_uuid(),
  order_number         text unique, -- se autogenera en el trigger de abajo (ej: MSB-000123)
  customer_id          uuid references customers(id),
  status               text not null default 'pending'
                         check (status in ('pending','approved','rejected','cancelled','refunded')),
  subtotal             numeric(12,2) not null default 0,
  shipping_cost        numeric(12,2) not null default 0,
  discount             numeric(12,2) not null default 0,
  total                numeric(12,2) not null default 0,
  shipping_method      text not null check (shipping_method in ('domicilio','retiro_local')),
  shipping_address_id  uuid references addresses(id),
  coupon_id            uuid references coupons(id),
  payment_provider     text default 'mercado_pago',
  mp_preference_id     text,
  mp_payment_id        text,
  payment_status       text, -- estado crudo de Mercado Pago, para auditoría
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_customer_id on orders(customer_id);
create index if not exists idx_orders_mp_payment_id on orders(mp_payment_id);

create or replace function set_order_number()
returns trigger as $$
begin
  if new.order_number is null then
    new.order_number := 'MSB-' || lpad(nextval('order_number_seq')::text, 6, '0');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_orders_order_number on orders;
create trigger trg_orders_order_number before insert on orders
  for each row execute function set_order_number();

create table if not exists order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references orders(id) on delete cascade,
  product_id   uuid references products(id),
  product_sku  text not null,
  product_name text not null, -- snapshot al momento de compra
  unit_price   numeric(12,2) not null,
  quantity     integer not null check (quantity > 0),
  line_total   numeric(12,2) not null
);

create index if not exists idx_order_items_order_id on order_items(order_id);

-- ---------------------------------------------------------------
-- WEBHOOKS DE MERCADO PAGO (idempotencia)
-- ---------------------------------------------------------------
create table if not exists payment_webhook_events (
  id            uuid primary key default gen_random_uuid(),
  mp_event_id   text unique not null, -- "payment:{id}:{status}" de la notificación
  order_id      uuid references orders(id),
  payment_id    text,
  status        text,
  raw_payload   jsonb,
  processed_at  timestamptz,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- CONTENIDO EDITORIAL ("The Meyer Edit")
-- ---------------------------------------------------------------
create table if not exists editorial_posts (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  slug        text not null unique,
  category    text, -- Skincare, K-Beauty, Medical Skincare, Rutinas...
  cover_image text,
  content     text,
  published   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- ADMINISTRADORES DEL PANEL /admin
-- Para crear el primer admin: crear el usuario en Supabase Auth
-- (dashboard o supabase.auth.admin) y después insertar acá su
-- auth_user_id — ver README.
-- ---------------------------------------------------------------
create table if not exists admin_users (
  id           uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name    text,
  role         text not null default 'admin' check (role in ('admin', 'editor')),
  created_at   timestamptz not null default now()
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
-- Uso de cupón atómico (usado por el webhook al aprobar un pago con cupón)
-- ---------------------------------------------------------------
create or replace function increment_coupon_usage(p_coupon_id uuid)
returns void as $$
begin
  update coupons set times_used = times_used + 1 where id = p_coupon_id;
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

drop trigger if exists trg_editorial_posts_updated_at on editorial_posts;
create trigger trg_editorial_posts_updated_at before update on editorial_posts
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------
alter table brands enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table customers enable row level security;
alter table addresses enable row level security;
alter table favorites enable row level security;
alter table coupons enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payment_webhook_events enable row level security;
alter table editorial_posts enable row level security;
alter table admin_users enable row level security;

-- Catálogo: lectura pública de lo activo (front usa la anon key).
drop policy if exists "brands_public_read" on brands;
create policy "brands_public_read" on brands for select using (active = true);

drop policy if exists "categories_public_read" on categories;
create policy "categories_public_read" on categories for select using (active = true);

drop policy if exists "products_public_read" on products;
create policy "products_public_read" on products for select using (active = true);

drop policy if exists "editorial_posts_public_read" on editorial_posts;
create policy "editorial_posts_public_read" on editorial_posts for select using (published = true);

-- Cliente autenticado: sólo puede ver lo suyo. Esto no se usa todavía
-- (el checkout es guest-only por ahora), pero deja la base lista para
-- cuando haya login de cliente.
drop policy if exists "customers_read_own" on customers;
create policy "customers_read_own" on customers
  for select using (auth.uid() = auth_user_id);

drop policy if exists "addresses_read_own" on addresses;
create policy "addresses_read_own" on addresses
  for select using (
    customer_id in (select id from customers where auth_user_id = auth.uid())
  );

drop policy if exists "orders_read_own" on orders;
create policy "orders_read_own" on orders
  for select using (
    customer_id in (select id from customers where auth_user_id = auth.uid())
  );

drop policy if exists "order_items_read_own" on order_items;
create policy "order_items_read_own" on order_items
  for select using (
    order_id in (
      select o.id from orders o
      join customers c on c.id = o.customer_id
      where c.auth_user_id = auth.uid()
    )
  );

drop policy if exists "favorites_own" on favorites;
create policy "favorites_own" on favorites
  for all using (
    customer_id in (select id from customers where auth_user_id = auth.uid())
  );

-- admin_users: un admin logueado puede leer su propia fila (para que
-- el panel /admin verifique el rol); nada más se expone por RLS.
drop policy if exists "admin_users_read_own" on admin_users;
create policy "admin_users_read_own" on admin_users
  for select using (auth.uid() = auth_user_id);

-- coupons y payment_webhook_events: sin policies públicas — sólo la
-- service role key (server-only) los toca.
