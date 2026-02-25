import { getUserPermissions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import {
  Package, ShoppingCart, TrendingUp, AlertTriangle,
  DollarSign, Users, CalendarDays, ArrowUpRight,
} from "lucide-react"
import { LowStockAlert } from "@/components/low-stock-alert"
import { RecentSales } from "@/components/recent-sales"
import { cn } from "@/lib/utils"
import { redirect } from "next/navigation"

// ⚠️ Ningún color de acento hardcodeado — todo usa var(--primary)
// Las cards responden automáticamente al theme de la empresa en BD
const PAGE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

  .dash-page { font-family: 'DM Sans', sans-serif; }
  .dash-serif { font-family: 'Cormorant Garamond', Georgia, serif; }

  /* ── Header de página ───────────────────────────────────────────────────── */
  .dash-page-header {
    display: flex; flex-direction: column; gap: 16px;
    padding-bottom: 24px;
    border-bottom: 1px solid rgba(26,26,24,0.08);
    margin-bottom: 28px;
  }
  @media (min-width: 640px) {
    .dash-page-header { flex-direction: row; align-items: center; justify-content: space-between; }
  }

  .dash-page-title {
    font-size: 22px; font-weight: 400; color: #1a1a18; margin: 0;
    display: flex; align-items: center; gap: 10px;
  }
  /* Cuadrito de acento — var(--primary) */
  .dash-page-title-dot {
    width: 8px; height: 8px;
    background: var(--primary, #984ca8);
    flex-shrink: 0;
  }
  .dash-page-sub { font-size: 12px; color: rgba(26,26,24,0.45); margin: 4px 0 0; }

  /* Badge de fecha — ícono usa var(--primary) */
  .dash-date-badge {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 8px 14px;
    background: white;
    border: 1px solid rgba(26,26,24,0.1);
    font-size: 12px; color: rgba(26,26,24,0.6); flex-shrink: 0;
  }
  .dash-date-badge strong { color: #1a1a18; font-weight: 500; }
  .dash-date-icon { color: var(--primary, #984ca8); }

  /* ── Grid KPIs ──────────────────────────────────────────────────────────── */
  .dash-grid {
    display: grid; gap: 16px;
    grid-template-columns: 1fr;
    margin-bottom: 28px;
  }
  @media (min-width: 640px)  { .dash-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 1024px) { .dash-grid { grid-template-columns: repeat(3, 1fr); } }

  /* ── StatCard ───────────────────────────────────────────────────────────── */
  .stat-card {
    background: white;
    border: 1px solid rgba(26,26,24,0.08);
    padding: 20px 22px;
    position: relative; overflow: hidden;
    transition: box-shadow 0.2s, transform 0.2s;
  }
  .stat-card:hover {
    box-shadow: 0 4px 20px rgba(var(--primary-rgb, 152,76,168), 0.08);
    transform: translateY(-1px);
  }
  /* Barra superior — var(--primary) en hover */
  .stat-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: var(--primary, #984ca8);
    opacity: 0; transition: opacity 0.2s;
  }
  .stat-card:hover::before { opacity: 1; }

  /* Alerta stock bajo — rojo fijo, no sigue el theme */
  .stat-card.stat-alert { border-color: rgba(220,38,38,0.2); background: #fffbfb; }
  .stat-card.stat-alert::before { background: #dc2626; opacity: 1; }

  .stat-card-top {
    display: flex; align-items: flex-start;
    justify-content: space-between; gap: 12px; margin-bottom: 16px;
  }
  .stat-card-label {
    font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
    color: rgba(26,26,24,0.4); font-weight: 500; margin: 0;
  }

  /* Ícono — fondo y color usan var(--primary) */
  .stat-card-icon {
    width: 34px; height: 34px; flex-shrink: 0;
    background: rgba(var(--primary-rgb, 152,76,168), 0.08);
    display: flex; align-items: center; justify-content: center;
  }
  .stat-card-icon svg { color: var(--primary, #984ca8); width: 15px; height: 15px; }

  .stat-card.stat-alert .stat-card-icon { background: rgba(220,38,38,0.07); }
  .stat-card.stat-alert .stat-card-icon svg { color: #dc2626; }

  .stat-card-value {
    font-size: 26px; font-weight: 500; color: #1a1a18;
    line-height: 1.1; margin: 0 0 4px;
    font-family: 'Cormorant Garamond', Georgia, serif;
  }
  .stat-card-sub { font-size: 11px; color: rgba(26,26,24,0.38); margin: 0; }

  /* Badge — var(--primary) */
  .stat-badge {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 9px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
    background: rgba(var(--primary-rgb, 152,76,168), 0.08);
    color: var(--primary, #984ca8);
    padding: 3px 8px; margin-top: 8px;
  }

  /* Fondo decorativo — var(--primary) muy suave */
  .stat-card-bg {
    position: absolute; right: -20px; bottom: -20px;
    width: 80px; height: 80px;
    background: rgba(var(--primary-rgb, 152,76,168), 0.06);
    border-radius: 50%; pointer-events: none;
  }
  .stat-card.stat-alert .stat-card-bg { background: rgba(220,38,38,0.05); }

  /* ── Tablas inferiores ──────────────────────────────────────────────────── */
  .dash-bottom { display: grid; gap: 16px; grid-template-columns: 1fr; }
  @media (min-width: 768px) { .dash-bottom { grid-template-columns: 5fr 7fr; } }

  .dash-bottom-card {
    background: white;
    border: 1px solid rgba(26,26,24,0.08);
    overflow: hidden;
  }

  /* Estado vacío */
  .dash-empty {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    min-height: 200px; text-align: center;
    border: 1px dashed rgba(26,26,24,0.12);
    padding: 40px 24px; background: white;
  }
  .dash-empty-icon {
    width: 40px; height: 40px;
    background: rgba(var(--primary-rgb, 152,76,168), 0.07);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 16px;
  }
  .dash-empty-icon svg { color: var(--primary, #984ca8); }
`

interface UserPermissions {
  ventas: boolean; productos: boolean; categorias: boolean; inventario: boolean
  rentabilidad: boolean; clientes: boolean; proveedores: boolean
  gastos: boolean; configuracion: boolean; [key: string]: boolean
}

export default async function DashboardPage() {
  const permData = await getUserPermissions()
  if (!permData?.company_id) redirect("/auth/sin-empresa")

  const companyId = permData.company_id
  const perms: UserPermissions = permData.permissions || {
    ventas: false, productos: false, inventario: false, rentabilidad: false,
    clientes: false, categorias: false, proveedores: false, gastos: false, configuracion: false,
  }

  const supabase = await createClient()
  const since30d = new Date()
  since30d.setDate(since30d.getDate() - 30)
  const since30dISO = since30d.toISOString()

  const [
    { count: productsCount },
    { count: salesCount },
    { data: salesTotal },
    { data: profitDataRaw },
    { count: lowStockCount },
    { count: clientsCount },
  ] = await Promise.all([
    perms.productos
      ? supabase.from("products").select("*", { count: "exact", head: true }).eq("company_id", companyId)
      : Promise.resolve({ count: 0 }),
    perms.ventas
      ? supabase.from("sales").select("*", { count: "exact", head: true }).eq("company_id", companyId).gte("sale_date", since30dISO)
      : Promise.resolve({ count: 0 }),
    perms.rentabilidad
      ? supabase.from("sales").select("total").eq("company_id", companyId).gte("sale_date", since30dISO)
      : Promise.resolve({ data: [] }),
    perms.rentabilidad
      ? supabase.from("sales_profit").select("profit").eq("company_id", companyId).gte("created_at", since30dISO)
      : Promise.resolve({ data: [] }),
    perms.inventario
      ? supabase.rpc("get_low_stock_products", { p_company_id: companyId }, { count: "exact", head: true })
      : Promise.resolve({ count: 0 }),
    perms.clientes
      ? supabase.from("clients").select("*", { count: "exact", head: true }).eq("company_id", companyId)
      : Promise.resolve({ count: 0 }),
  ])

  const totalRevenue = (salesTotal as any[])?.reduce((s, v) => s + Number(v.total), 0) || 0
  const totalProfit  = (profitDataRaw as any[])?.reduce((s, v) => s + Number(v.profit), 0) || 0
  const fmt = (v: number) =>
    v.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })
  const today = new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })
  const hasAnyPerm = Object.values(perms).some(Boolean)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <div className="dash-page">

        <div className="dash-page-header">
          <div>
            <h1 className="dash-page-title dash-serif">
              <span className="dash-page-title-dot" aria-hidden />
              Panel de Control
            </h1>
            <p className="dash-page-sub">Resumen de tu empresa — últimos 30 días</p>
          </div>
          <div className="dash-date-badge">
            <CalendarDays size={13} className="dash-date-icon" />
            <span>HOY: <strong>{today}</strong></span>
          </div>
        </div>

        {hasAnyPerm && (
          <div className="dash-grid">
            {perms.productos && <StatCard label="Productos Activos" value={productsCount || 0} sub="Referencias en catálogo" icon={<Package />} />}
            {perms.ventas && <StatCard label="Ventas del Mes" value={salesCount || 0} sub="Transacciones completadas" icon={<ShoppingCart />} />}
            {perms.rentabilidad && <StatCard label="Ingresos Totales" value={fmt(totalRevenue)} sub="Facturación (30 días)" icon={<DollarSign />} />}
            {perms.rentabilidad && <StatCard label="Ganancia Neta" value={fmt(totalProfit)} sub="Utilidad real" icon={<TrendingUp />} badge="Neto" />}
            {perms.inventario && <StatCard label="Alertas de Stock" value={lowStockCount || 0} sub="Productos por agotarse" icon={<AlertTriangle />} alert={Number(lowStockCount) > 0} />}
            {perms.clientes && <StatCard label="Clientes Totales" value={clientsCount || 0} sub="Base de datos activa" icon={<Users />} />}
          </div>
        )}

        {(perms.inventario || perms.ventas) && (
          <div className="dash-bottom">
            {perms.inventario && <div className="dash-bottom-card"><LowStockAlert companyId={companyId} /></div>}
            {perms.ventas && <div className={cn("dash-bottom-card", !perms.inventario && "col-span-2")}><RecentSales companyId={companyId} /></div>}
          </div>
        )}

        {!hasAnyPerm && (
          <div className="dash-empty">
            <div className="dash-empty-icon"><Users size={18} /></div>
            <p style={{ fontSize: 13, fontWeight: 500, color: "#1a1a18", margin: "0 0 6px" }}>Vista limitada</p>
            <p style={{ fontSize: 12, color: "rgba(26,26,24,0.45)", margin: 0, maxWidth: 280 }}>
              Tu cuenta no tiene permisos habilitados. Contacta al administrador.
            </p>
          </div>
        )}
      </div>
    </>
  )
}

function StatCard({ label, value, sub, icon, badge, alert }: {
  label: string; value: string | number; sub: string
  icon: React.ReactNode; badge?: string; alert?: boolean
}) {
  return (
    <div className={cn("stat-card", alert && "stat-alert")}>
      <div className="stat-card-top">
        <p className="stat-card-label">{label}</p>
        <div className="stat-card-icon" aria-hidden>{icon}</div>
      </div>
      <p className="stat-card-value">{value}</p>
      <p className="stat-card-sub">{sub}</p>
      {badge && (
        <div className="stat-badge">
          <ArrowUpRight size={9} />
          {badge}
        </div>
      )}
      <div className="stat-card-bg" aria-hidden />
    </div>
  )
}
