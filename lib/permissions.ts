// lib/permissions.ts
// ════════════════════════════════════════════════════════════════════════════
// Catálogo único de permisos del sistema.
// Esta es la FUENTE DE VERDAD: cualquier permiso debe definirse aquí.
// Sidebar, gestión de usuarios y página de configuración consumen este módulo.
// ════════════════════════════════════════════════════════════════════════════

export type PermissionKey =
  | "ventas"
  | "reportes"
  | "campanias"
  | "productos"
  | "categorias"
  | "inventario"
  | "proveedores"
  | "rentabilidad"
  | "clientes"
  | "gastos"
  | "creditos"
  | "cuentas_por_pagar"
  | "devoluciones"
  | "ordenes_compra"
  | "comisiones"
  | "control_regulatorio"
  | "cajas"
  | "cajas_turnos"
  | "cierres"
  | "kits"
  | "pedidos_catalogo"
  | "configuracion"

export type PermissionGroup = "principal" | "operacion" | "catalogo" | "compras" | "gestion" | "cumplimiento" | "sistema"

export type PermissionDef = {
  key:       PermissionKey
  label:     string
  group:     PermissionGroup
  hint:      string
  /** Path principal en el dashboard (informativo). */
  path?:     string
  /** Nombre del icono de lucide-react asociado. */
  icon:      string
}

/** Etiquetas de los grupos para mostrar en la UI. */
export const GROUP_LABELS: Record<PermissionGroup, string> = {
  principal:    "Principal",
  operacion:    "Operación",
  catalogo:     "Catálogo",
  compras:      "Compras",
  gestion:      "Gestión",
  cumplimiento: "Cumplimiento",
  sistema:      "Sistema",
}

/** Definición canónica de cada permiso del sistema.
 *  Mantiene el mismo orden y agrupación que el sidebar (dashboard-sidebar.tsx).
 *  Reorganizado 2026-07-21: "Catálogo" y "Gestión" habían crecido demasiado al
 *  sumar los módulos de droguería; ahora cada grupo tiene un criterio único
 *  (ver comentario de dashboard-sidebar.tsx para el detalle del porqué). */
export const PERMISSIONS: PermissionDef[] = [
  // Principal — lo que se usa a cada momento del día (POS + su turno)
  { key: "ventas",            group: "principal", label: "Ventas / POS",         hint: "Acceso al Punto de Venta y a la lista de Ventas",         path: "/dashboard/pos",                icon: "ShoppingCart" },
  { key: "cajas_turnos",      group: "principal", label: "Cajas y Turnos",       hint: "Apertura/cierre de caja con arqueo, recogidas de efectivo",  path: "/dashboard/turnos-caja",        icon: "Landmark" },

  // Operación — el ciclo de una venta: registrarla, devolverla, analizarla
  { key: "reportes",          group: "operacion", label: "Reportes",             hint: "Dashboard de reportes y análisis",                          path: "/dashboard/reports",            icon: "BarChart2" },
  { key: "devoluciones",      group: "operacion", label: "Devoluciones",         hint: "Devoluciones, garantías y notas crédito/débito",             path: "/dashboard/devoluciones",       icon: "Undo2" },
  { key: "campanias",         group: "operacion", label: "Campañas Descuento",   hint: "Gestión de campañas de descuento publicables",              path: "/dashboard/campanias",          icon: "Megaphone" },
  { key: "pedidos_catalogo",  group: "operacion", label: "Pedidos del Catálogo", hint: "Pedidos generados desde el catálogo público",               path: "/dashboard/pedidos-catalogo",   icon: "ClipboardList" },

  // Catálogo — SOLO maestros de producto (nada transaccional aquí)
  { key: "productos",         group: "catalogo",  label: "Productos",            hint: "Crear y editar productos",                                   path: "/dashboard/products",           icon: "Package" },
  { key: "categorias",        group: "catalogo",  label: "Categorías",           hint: "Categorías de productos",                                    path: "/dashboard/categories",         icon: "FolderTree" },
  { key: "inventario",        group: "catalogo",  label: "Inventario",           hint: "Lotes de compra, stock y movimientos",                       path: "/dashboard/inventory",          icon: "TrendingUp" },
  { key: "kits",              group: "catalogo",  label: "Kits Promoción",       hint: "Kits combinados para vender en POS por código",              path: "/dashboard/kits",               icon: "Layers" },

  // Compras — todo lo relacionado a proveedores (maestro + flujo + deuda)
  { key: "proveedores",       group: "compras",   label: "Proveedores",          hint: "Maestro de proveedores",                                     path: "/dashboard/suppliers",          icon: "Truck" },
  { key: "ordenes_compra",    group: "compras",   label: "Órdenes de Compra",    hint: "Pedidos a proveedores previos a la recepción de mercancía",  path: "/dashboard/purchase-orders",    icon: "FileText" },
  { key: "cuentas_por_pagar", group: "compras",   label: "Cuentas por Pagar",    hint: "Deudas pendientes de pago a proveedores",                    path: "/dashboard/supplier-debts",     icon: "Wallet" },

  // Gestión — clientes y finanzas del negocio
  { key: "clientes",          group: "gestion",   label: "Clientes",             hint: "Maestro de clientes",                                        path: "/dashboard/clients",            icon: "Users" },
  { key: "creditos",          group: "gestion",   label: "Créditos / Deudas",    hint: "Deudas pendientes de cobro a clientes",                      path: "/dashboard/debts",              icon: "CreditCard" },
  { key: "gastos",            group: "gestion",   label: "Gastos",               hint: "Registro y reporte de gastos del negocio",                   path: "/dashboard/expenses",           icon: "DollarSign" },
  { key: "rentabilidad",      group: "gestion",   label: "Rentabilidad",         hint: "Costos, márgenes y utilidad por venta",                      path: "/dashboard/profits",            icon: "PiggyBank" },
  { key: "comisiones",        group: "gestion",   label: "Comisiones",          hint: "Comisiones por producto vendido, por vendedor",              path: "/dashboard/comisiones",         icon: "Percent" },
  { key: "cierres",           group: "gestion",   label: "Cierre de Mes",        hint: "Cruce de ingresos y gastos con saldo que arrastra al mes siguiente", path: "/dashboard/cierres",   icon: "CalendarCheck" },

  // Cumplimiento — trazabilidad regulatoria (hoy: droguería)
  { key: "control_regulatorio", group: "cumplimiento", label: "Control Regulatorio", hint: "Libro de sustancias controladas y cadena de frío (droguería)", path: "/dashboard/control-regulatorio", icon: "ShieldCheck" },

  // Sistema — configuración y administración de infraestructura del negocio
  { key: "cajas",             group: "sistema",   label: "Cajas",                hint: "Alta/baja de cajas registradoras — solo administración, no uso diario", path: "/dashboard/cajas",     icon: "Building2" },
  { key: "configuracion",     group: "sistema",   label: "Configuración",        hint: "Información de la empresa, usuarios y permisos",             path: "/dashboard/settings",           icon: "Settings" },
]

/** Lista plana de keys, en el orden canónico. */
export const PERMISSION_KEYS: PermissionKey[] = PERMISSIONS.map(p => p.key)

/** Map para acceso O(1) por key. */
export const PERMISSIONS_BY_KEY: Record<PermissionKey, PermissionDef> =
  PERMISSIONS.reduce((acc, p) => { acc[p.key] = p; return acc }, {} as Record<PermissionKey, PermissionDef>)

/** Permisos agrupados, manteniendo orden de aparición. */
export const PERMISSIONS_BY_GROUP: Record<PermissionGroup, PermissionDef[]> = {
  principal:    PERMISSIONS.filter(p => p.group === "principal"),
  operacion:    PERMISSIONS.filter(p => p.group === "operacion"),
  catalogo:     PERMISSIONS.filter(p => p.group === "catalogo"),
  compras:      PERMISSIONS.filter(p => p.group === "compras"),
  gestion:      PERMISSIONS.filter(p => p.group === "gestion"),
  cumplimiento: PERMISSIONS.filter(p => p.group === "cumplimiento"),
  sistema:      PERMISSIONS.filter(p => p.group === "sistema"),
}

// ── Plantillas por rol ──────────────────────────────────────────────────────
// Sirven como punto de partida cuando un admin asigna un rol; siguen siendo
// editables individualmente.

export type Role = "admin" | "gerente" | "vendedor"

export const ROLE_LABELS: Record<Role, string> = {
  admin:    "Administrador",
  gerente:  "Gerente",
  vendedor: "Vendedor",
}

/** Devuelve un Record<PermissionKey, boolean> con todas las keys en false. */
export function emptyPermissions(): Record<PermissionKey, boolean> {
  return PERMISSION_KEYS.reduce((acc, k) => { acc[k] = false; return acc }, {} as Record<PermissionKey, boolean>)
}

/** Devuelve un Record<PermissionKey, boolean> con todas las keys en true. */
export function allPermissions(): Record<PermissionKey, boolean> {
  return PERMISSION_KEYS.reduce((acc, k) => { acc[k] = true; return acc }, {} as Record<PermissionKey, boolean>)
}

/** Plantilla de permisos por defecto según rol. */
export function defaultPermissionsForRole(role: Role): Record<PermissionKey, boolean> {
  if (role === "admin") return allPermissions()

  if (role === "gerente") {
    // Todo excepto configuración (los admins gestionan usuarios).
    return PERMISSION_KEYS.reduce((acc, k) => {
      acc[k] = k !== "configuracion"
      return acc
    }, {} as Record<PermissionKey, boolean>)
  }

  // vendedor: operación de mostrador. Incluye cajas_turnos porque el cajero
  // necesita poder abrir/cerrar su propio turno en el día a día.
  const allowed: PermissionKey[] = [
    "ventas", "clientes", "productos", "kits", "pedidos_catalogo", "cajas_turnos",
  ]
  const base = emptyPermissions()
  for (const k of allowed) base[k] = true
  return base
}

/** Normaliza un objeto de permisos asegurando que tenga todas las keys conocidas. */
export function normalizePermissions(perms: Record<string, boolean> | null | undefined): Record<PermissionKey, boolean> {
  const out = emptyPermissions()
  if (!perms) return out
  for (const k of PERMISSION_KEYS) {
    if (typeof perms[k] === "boolean") out[k] = perms[k]
  }
  return out
}
