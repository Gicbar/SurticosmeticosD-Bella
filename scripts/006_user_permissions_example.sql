-- Example INSERT for user_permissions table
-- Replace 'USER_ID_HERE' with actual user ID from auth.users

-- Example 1: Admin user
INSERT INTO user_permissions (user_id, role, permissions)
VALUES (
  'USER_ID_HERE',
  'admin',
  '{"can_manage_users": true, "can_manage_products": true, "can_manage_sales": true, "can_view_reports": true}'::jsonb
);

-- Example 2: Manager user
INSERT INTO user_permissions (user_id, role, permissions)
VALUES (
  'USER_ID_HERE',
  'gerente',
  '{"can_manage_products": true, "can_manage_sales": true, "can_view_reports": true}'::jsonb
);

-- Example 3: Salesperson user
INSERT INTO user_permissions (user_id, role, permissions)
VALUES (
  'USER_ID_HERE',
  'vendedor',
  '{"can_manage_sales": true}'::jsonb
);

-- To get user IDs, run this query:
-- SELECT id, email FROM auth.users;
