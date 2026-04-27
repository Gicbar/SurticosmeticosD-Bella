# Sistema de Permisos — Documentación

Última actualización: 2026-04-25.

---

## 1. Idea general

El sistema gestiona el acceso a cada pantalla del dashboard mediante un **booleano por
permiso** almacenado en `public.user_permissions.permissions` (jsonb). Cada pantalla
del dashboard valida su permiso al cargar (server-side) y el sidebar oculta los items
para los que el usuario no tiene permiso.

La **fuente única de verdad** vive en **`lib/permissions.ts`**: si añades una pantalla
nueva al sistema, registra su permiso allí y todas las capas (sidebar, configuración,
gestión de usuarios) lo recogerán automáticamente.

---

## 2. Catálogo de permisos

Los permisos están agrupados igual que el menú lateral.

| Key                  | Grupo      | Pantalla(s)                                | Path                              |
|----------------------|------------|--------------------------------------------|-----------------------------------|
| `ventas`             | Principal  | Punto de Venta + lista de Ventas           | /dashboard/pos, /dashboard/sales  |
| `reportes`           | Operación  | Reportes / análisis                        | /dashboard/reports                |
| `campanias`          | Operación  | Campañas de descuento                      | /dashboard/campanias              |
| `pedidos_catalogo`   | Operación  | Pedidos generados desde el catálogo público | /dashboard/pedidos-catalogo      |
| `productos`          | Catálogo   | Productos                                  | /dashboard/products               |
| `categorias`         | Catálogo   | Categorías                                 | /dashboard/categories             |
| `inventario`         | Catálogo   | Lotes, stock, movimientos                  | /dashboard/inventory              |
| `proveedores`        | Catálogo   | Proveedores                                | /dashboard/suppliers              |
| `kits`               | Catálogo   | Kits promocionales (parte del catálogo)    | /dashboard/kits                   |
| `clientes`           | Gestión    | Maestro de clientes                        | /dashboard/clients                |
| `creditos`           | Gestión    | Deudas pendientes de cobro                 | /dashboard/debts                  |
| `gastos`             | Gestión    | Gastos del negocio                         | /dashboard/expenses               |
| `rentabilidad`       | Gestión    | Costos, márgenes, utilidad                 | /dashboard/profits                |
| `configuracion`      | Sistema    | Información de empresa, usuarios, permisos | /dashboard/settings               |

> Nota: el ítem "Panel General" del sidebar (`/dashboard`) **no tiene permiso** asociado
> y siempre es visible para usuarios autenticados con empresa activa.

---

## 3. Plantillas por rol

`defaultPermissionsForRole(role)` devuelve un set de permisos sugeridos según el rol.
Se aplican como **plantilla rápida** desde la pantalla de configuración pero siguen
siendo editables booleano por booleano.

| Rol           | Permisos por defecto                                                      |
|---------------|---------------------------------------------------------------------------|
| `admin`       | **Todos**                                                                 |
| `gerente`     | Todos **excepto** `configuracion` (solo admins gestionan usuarios)        |
| `vendedor`    | `ventas`, `clientes`, `productos`, `kits`, `pedidos_catalogo`             |

---

## 4. Capas y archivos involucrados

```
lib/permissions.ts          — Catálogo, tipos, plantillas, helpers (FUENTE DE VERDAD)
        │
        ├──► components/dashboard-sidebar.tsx
        │       Lee la key `key` de cada item y oculta los que el usuario no tiene
        │
        ├──► components/user-management.tsx
        │       Vista admin: edita rol + permisos por usuario, agrupados por sección,
        │       con plantillas por rol y atajos "Marcar/Desmarcar todos".
        │
        ├──► app/dashboard/settings/page.tsx
        │       Vista no-admin: muestra los permisos propios agrupados, en solo lectura.
        │       Vista admin: incrusta UserManagement.
        │
        └──► app/dashboard/<pantalla>/page.tsx
                Server Component que valida `permissions?.permissions?.<key>` y redirige
                a /dashboard si el usuario no tiene la key.
```

---

## 5. Cómo agregar una pantalla nueva al sistema

1. **Define el permiso** en `lib/permissions.ts`:
   ```ts
   { key: "mi_nueva_pantalla", group: "gestion", label: "Mi pantalla nueva",
     hint: "Descripción breve…", path: "/dashboard/mi-nueva", icon: "Star" },
   ```
   Y agrégalo al tipo `PermissionKey`.

2. **Importa el icono** en `components/user-management.tsx` y `app/dashboard/settings/page.tsx`
   y agrégalo al map `ICONS`.

3. **Añade la entrada al sidebar** en `components/dashboard-sidebar.tsx` con `key`
   coincidente.

4. **Valida el permiso en la pantalla**:
   ```ts
   const permissions = await getUserPermissions()
   if (!permissions?.permissions?.mi_nueva_pantalla) redirect("/dashboard")
   ```

5. (Opcional) Actualiza las plantillas por rol en `defaultPermissionsForRole()` si el
   nuevo permiso debe estar habilitado para `gerente` o `vendedor` por defecto.

---

## 6. Modelo de datos (BD)

```sql
public.user_permissions(
  id           uuid PRIMARY KEY,
  user_id      uuid REFERENCES auth.users(id),
  role         text,         -- 'admin' | 'gerente' | 'vendedor'
  permissions  jsonb         -- { ventas: true, productos: true, ... }
)

public.user_companies(
  user_id    uuid,
  company_id uuid,
  role       text
)

-- Vista usada por la gestión de usuarios:
public.user_permissions_with_email   (id, user_id, email, role, permissions)
```

`getUserPermissions()` en `lib/auth.ts` une estas tablas y retorna un objeto plano
con `permissions`, `role`, `company_id`, `company`. Las pantallas consumen ese objeto
para validar en SSR.

---

## 7. Bugs corregidos en esta entrega

- **`/dashboard/debts`** validaba `ventas` en lugar de `creditos`. Corregido.
- **`/dashboard/pedidos-catalogo`** reusaba `kits`. Ahora tiene su propia key
  `pedidos_catalogo`.
- El sidebar tenía un tipo de permisos incompleto: faltaban `pedidos_catalogo` y
  `reportes` en la interfaz local. Completado.
- `PERMISSION_LABELS` duplicado entre `user-management.tsx` y `settings/page.tsx`,
  con divergencias entre ambos (faltaba `kits`, `campanias`, `creditos` en uno u otro).
  Eliminado: ambos consumen ahora `lib/permissions.ts`.

---

## 8. Mejoras UX implementadas en la pantalla de configuración

- Permisos agrupados por sección (Operación / Catálogo / Gestión) con icono y descripción.
- Buscador rápido para filtrar usuarios por email (admins).
- Botones "Marcar todos / Desmarcar todos".
- Botones por grupo: "Todos / Ninguno".
- Plantillas rápidas por rol (Admin / Gerente / Vendedor) que aplican el set sugerido.
- Cancelar edición sin guardar.
- Contador en vivo de permisos activos vs. total.
- Vista de solo lectura para usuarios no-admin con su propio set de permisos.
