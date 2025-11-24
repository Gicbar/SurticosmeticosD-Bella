-- Create categories table
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamp with time zone default now()
);

-- Create clients table
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  address text,
  created_at timestamp with time zone default now()
);

-- Create suppliers table
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text,
  phone text,
  email text,
  address text,
  created_at timestamp with time zone default now()
);

-- Create products table
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  barcode text unique,
  category_id uuid references public.categories(id) on delete set null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  sale_price decimal(10, 2) not null,
  min_stock integer default 0,
  created_at timestamp with time zone default now()
);

-- Create purchase_batches table (for FIFO inventory tracking)
create table if not exists public.purchase_batches (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade not null,
  quantity integer not null,
  purchase_price decimal(10, 2) not null,
  purchase_date timestamp with time zone default now(),
  remaining_quantity integer not null,
  created_at timestamp with time zone default now()
);

-- Create expenses table
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  amount decimal(10, 2) not null,
  category text,
  date timestamp with time zone default now(),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- Create sales table
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  total decimal(10, 2) not null,
  payment_method text not null,
  sale_date timestamp with time zone default now(),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- Create sale_items table
create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid references public.sales(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete restrict not null,
  batch_id uuid references public.purchase_batches(id) on delete restrict not null,
  quantity integer not null,
  unit_price decimal(10, 2) not null,
  subtotal decimal(10, 2) not null,
  created_at timestamp with time zone default now()
);

-- Create sales_profit table
create table if not exists public.sales_profit (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid references public.sales(id) on delete cascade not null unique,
  total_cost decimal(10, 2) not null,
  total_sale decimal(10, 2) not null,
  profit decimal(10, 2) not null,
  profit_margin decimal(5, 2) not null,
  created_at timestamp with time zone default now()
);

-- Create inventory_movements table
create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade not null,
  movement_type text not null check (movement_type in ('entrada', 'salida', 'ajuste')),
  quantity integer not null,
  reason text,
  date timestamp with time zone default now(),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- Create user_permissions table
create table if not exists public.user_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  role text not null check (role in ('admin', 'vendedor', 'gerente')),
  permissions jsonb default '{}',
  created_at timestamp with time zone default now()
);

-- Create indexes for better performance
create index if not exists idx_products_barcode on public.products(barcode);
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_purchase_batches_product on public.purchase_batches(product_id);
create index if not exists idx_sales_date on public.sales(sale_date);
create index if not exists idx_sale_items_sale on public.sale_items(sale_id);
create index if not exists idx_inventory_movements_product on public.inventory_movements(product_id);
