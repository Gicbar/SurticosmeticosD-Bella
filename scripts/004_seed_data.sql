-- Insert sample categories
insert into public.categories (name, description) values
  ('Electrónica', 'Productos electrónicos y tecnología'),
  ('Alimentos', 'Productos alimenticios'),
  ('Bebidas', 'Bebidas y refrescos'),
  ('Limpieza', 'Productos de limpieza'),
  ('Papelería', 'Artículos de oficina y papelería')
on conflict (name) do nothing;

-- Insert sample suppliers
insert into public.suppliers (name, contact, phone, email, address) values
  ('Distribuidora Tech SA', 'Juan Pérez', '555-0101', 'ventas@techsa.com', 'Av. Principal 123'),
  ('Alimentos del Valle', 'María González', '555-0102', 'info@alimentosvalle.com', 'Calle Comercio 456'),
  ('Bebidas Premium', 'Carlos Rodríguez', '555-0103', 'contacto@bebidaspremium.com', 'Zona Industrial 789')
on conflict do nothing;

-- Insert sample clients
insert into public.clients (name, email, phone, address) values
  ('Cliente General', null, null, null),
  ('Empresa ABC', 'compras@abc.com', '555-0201', 'Oficina Central 100'),
  ('Tienda XYZ', 'pedidos@xyz.com', '555-0202', 'Local Comercial 200')
on conflict do nothing;
