-- Enable Row Level Security on all tables
alter table public.categories enable row level security;
alter table public.clients enable row level security;
alter table public.suppliers enable row level security;
alter table public.products enable row level security;
alter table public.purchase_batches enable row level security;
alter table public.expenses enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.sales_profit enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.user_permissions enable row level security;

-- RLS Policies for categories (all authenticated users can read, only admins can modify)
create policy "Anyone can view categories"
  on public.categories for select
  using (auth.uid() is not null);

create policy "Admins can insert categories"
  on public.categories for insert
  with check (
    exists (
      select 1 from public.user_permissions
      where user_id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update categories"
  on public.categories for update
  using (
    exists (
      select 1 from public.user_permissions
      where user_id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can delete categories"
  on public.categories for delete
  using (
    exists (
      select 1 from public.user_permissions
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- RLS Policies for clients (all authenticated users can access)
create policy "Authenticated users can view clients"
  on public.clients for select
  using (auth.uid() is not null);

create policy "Authenticated users can insert clients"
  on public.clients for insert
  with check (auth.uid() is not null);

create policy "Authenticated users can update clients"
  on public.clients for update
  using (auth.uid() is not null);

create policy "Admins can delete clients"
  on public.clients for delete
  using (
    exists (
      select 1 from public.user_permissions
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- RLS Policies for suppliers (all authenticated users can access)
create policy "Authenticated users can view suppliers"
  on public.suppliers for select
  using (auth.uid() is not null);

create policy "Authenticated users can insert suppliers"
  on public.suppliers for insert
  with check (auth.uid() is not null);

create policy "Authenticated users can update suppliers"
  on public.suppliers for update
  using (auth.uid() is not null);

create policy "Admins can delete suppliers"
  on public.suppliers for delete
  using (
    exists (
      select 1 from public.user_permissions
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- RLS Policies for products (all authenticated users can access)
create policy "Authenticated users can view products"
  on public.products for select
  using (auth.uid() is not null);

create policy "Authenticated users can insert products"
  on public.products for insert
  with check (auth.uid() is not null);

create policy "Authenticated users can update products"
  on public.products for update
  using (auth.uid() is not null);

create policy "Admins can delete products"
  on public.products for delete
  using (
    exists (
      select 1 from public.user_permissions
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- RLS Policies for purchase_batches
create policy "Authenticated users can view purchase batches"
  on public.purchase_batches for select
  using (auth.uid() is not null);

create policy "Authenticated users can insert purchase batches"
  on public.purchase_batches for insert
  with check (auth.uid() is not null);

create policy "Authenticated users can update purchase batches"
  on public.purchase_batches for update
  using (auth.uid() is not null);

create policy "Admins can delete purchase batches"
  on public.purchase_batches for delete
  using (
    exists (
      select 1 from public.user_permissions
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- RLS Policies for expenses
create policy "Authenticated users can view expenses"
  on public.expenses for select
  using (auth.uid() is not null);

create policy "Authenticated users can insert expenses"
  on public.expenses for insert
  with check (auth.uid() is not null);

create policy "Users can update their own expenses"
  on public.expenses for update
  using (created_by = auth.uid());

create policy "Admins can delete expenses"
  on public.expenses for delete
  using (
    exists (
      select 1 from public.user_permissions
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- RLS Policies for sales
create policy "Authenticated users can view sales"
  on public.sales for select
  using (auth.uid() is not null);

create policy "Authenticated users can insert sales"
  on public.sales for insert
  with check (auth.uid() is not null);

create policy "Admins can update sales"
  on public.sales for update
  using (
    exists (
      select 1 from public.user_permissions
      where user_id = auth.uid() and role in ('admin', 'gerente')
    )
  );

create policy "Admins can delete sales"
  on public.sales for delete
  using (
    exists (
      select 1 from public.user_permissions
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- RLS Policies for sale_items
create policy "Authenticated users can view sale items"
  on public.sale_items for select
  using (auth.uid() is not null);

create policy "Authenticated users can insert sale items"
  on public.sale_items for insert
  with check (auth.uid() is not null);

create policy "Admins can update sale items"
  on public.sale_items for update
  using (
    exists (
      select 1 from public.user_permissions
      where user_id = auth.uid() and role in ('admin', 'gerente')
    )
  );

create policy "Admins can delete sale items"
  on public.sale_items for delete
  using (
    exists (
      select 1 from public.user_permissions
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- RLS Policies for sales_profit
create policy "Authenticated users can view sales profit"
  on public.sales_profit for select
  using (auth.uid() is not null);

create policy "Authenticated users can insert sales profit"
  on public.sales_profit for insert
  with check (auth.uid() is not null);

create policy "Admins can update sales profit"
  on public.sales_profit for update
  using (
    exists (
      select 1 from public.user_permissions
      where user_id = auth.uid() and role in ('admin', 'gerente')
    )
  );

-- RLS Policies for inventory_movements
create policy "Authenticated users can view inventory movements"
  on public.inventory_movements for select
  using (auth.uid() is not null);

create policy "Authenticated users can insert inventory movements"
  on public.inventory_movements for insert
  with check (auth.uid() is not null);

create policy "Admins can update inventory movements"
  on public.inventory_movements for update
  using (
    exists (
      select 1 from public.user_permissions
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- RLS Policies for user_permissions
create policy "Users can view their own permissions"
  on public.user_permissions for select
  using (user_id = auth.uid());

create policy "Admins can view all permissions"
  on public.user_permissions for select
  using (
    exists (
      select 1 from public.user_permissions
      where user_id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can insert permissions"
  on public.user_permissions for insert
  with check (
    exists (
      select 1 from public.user_permissions
      where user_id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update permissions"
  on public.user_permissions for update
  using (
    exists (
      select 1 from public.user_permissions
      where user_id = auth.uid() and role = 'admin'
    )
  );
