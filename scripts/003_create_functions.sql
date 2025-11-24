-- Function to automatically create user permissions on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_permissions (user_id, role, permissions)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'vendedor'),
    '{}'::jsonb
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Trigger to create user permissions on signup
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Function to get current stock for a product (sum of remaining quantities in batches)
create or replace function public.get_product_stock(product_uuid uuid)
returns integer
language plpgsql
security definer
as $$
declare
  total_stock integer;
begin
  select coalesce(sum(remaining_quantity), 0)
  into total_stock
  from public.purchase_batches
  where product_id = product_uuid;
  
  return total_stock;
end;
$$;

-- Function to get products with low stock
create or replace function public.get_low_stock_products()
returns table (
  id uuid,
  name text,
  current_stock bigint,
  min_stock integer
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    p.id,
    p.name,
    coalesce(sum(pb.remaining_quantity), 0) as current_stock,
    p.min_stock
  from public.products p
  left join public.purchase_batches pb on p.id = pb.product_id
  group by p.id, p.name, p.min_stock
  having coalesce(sum(pb.remaining_quantity), 0) <= p.min_stock;
end;
$$;

-- Function to process sale with FIFO inventory deduction
create or replace function public.process_sale_fifo(
  p_product_id uuid,
  p_quantity integer,
  p_sale_id uuid,
  p_unit_price decimal
)
returns void
language plpgsql
security definer
as $$
declare
  remaining_qty integer := p_quantity;
  batch_record record;
  qty_to_deduct integer;
begin
  -- Loop through batches in FIFO order (oldest first)
  for batch_record in
    select id, remaining_quantity, purchase_price
    from public.purchase_batches
    where product_id = p_product_id and remaining_quantity > 0
    order by purchase_date asc
  loop
    if remaining_qty <= 0 then
      exit;
    end if;

    -- Calculate how much to deduct from this batch
    qty_to_deduct := least(batch_record.remaining_quantity, remaining_qty);

    -- Update batch remaining quantity
    update public.purchase_batches
    set remaining_quantity = remaining_quantity - qty_to_deduct
    where id = batch_record.id;

    -- Insert sale item record
    insert into public.sale_items (sale_id, product_id, batch_id, quantity, unit_price, subtotal)
    values (
      p_sale_id,
      p_product_id,
      batch_record.id,
      qty_to_deduct,
      p_unit_price,
      qty_to_deduct * p_unit_price
    );

    -- Reduce remaining quantity
    remaining_qty := remaining_qty - qty_to_deduct;
  end loop;

  -- If we couldn't fulfill the entire quantity, raise an error
  if remaining_qty > 0 then
    raise exception 'Stock insuficiente para completar la venta';
  end if;
end;
$$;
