// ════════════════════════════════════════════════════════════════
// app/dashboard/sales/page.tsx
// ════════════════════════════════════════════════════════════════
import { getUserPermissions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { SalesTable } from "@/components/sales-table"
import { SalesFilters } from "@/components/sales-filters"
import { ExportSalesButton } from "@/components/export-sales-button"
import { ShoppingCart, DollarSign } from "lucide-react"
import { redirect } from "next/navigation"

const PAGE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');

  .sp-root {
    font-family: 'DM Sans', sans-serif;
    --sp-p:      var(--primary, #984ca8);
    --sp-p10:    rgba(var(--primary-rgb, 152,76,168), 0.10);
    --sp-txt:    #1a1a18;
    --sp-muted:  #1a1a18;
    --sp-border: rgba(26,26,24,0.08);
  }

  /* Header */
  .sp-header {
    display: flex; flex-direction: column; gap: 16px;
    padding-bottom: 22px;
    border-bottom: 1px solid var(--sp-border);
    margin-bottom: 24px;
  }
  @media (min-width: 640px) {
    .sp-header { flex-direction: row; align-items: center; justify-content: space-between; }
  }
  .sp-title-wrap {}
  .sp-title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 22px; font-weight: 400; color: var(--sp-txt); margin: 0;
    display: flex; align-items: center; gap: 10px;
  }
  .sp-title-dot { width: 8px; height: 8px; background: var(--sp-p); flex-shrink: 0; }
  .sp-sub { font-size: 12px; color: var(--sp-muted); margin: 3px 0 0; }

  /* Grid stats */
  .sp-stats {
    display: grid; gap: 14px;
    grid-template-columns: 1fr;
    margin-bottom: 20px;
  }
  @media (min-width: 480px) { .sp-stats { grid-template-columns: repeat(2, 1fr); } }

  /* Stat card */
  .sp-stat {
    background: #fff;
    border: 1px solid var(--sp-border);
    padding: 16px 20px;
    display: flex; align-items: center; gap: 14px;
    transition: box-shadow 0.2s;
    position: relative; overflow: hidden;
  }
  .sp-stat:hover { box-shadow: 0 4px 16px rgba(var(--sp-p, 152,76,168), 0.07); }
  .sp-stat::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: var(--sp-p); opacity: 0; transition: opacity 0.2s;
  }
  .sp-stat:hover::before { opacity: 1; }

  .sp-stat-icon {
    width: 38px; height: 38px;
    background: var(--sp-p10);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .sp-stat-icon svg { color: var(--sp-p); width: 16px; height: 16px; }
  .sp-stat-label {
    font-size: 9px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--sp-muted); margin: 0 0 4px;
  }
  .sp-stat-val {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 22px; font-weight: 500; color: var(--sp-txt); margin: 0; line-height: 1;
  }
  .sp-stat-sub { font-size: 10px; color: var(--sp-muted); margin: 3px 0 0; }

  /* Secciones */
  .sp-section { margin-bottom: 16px; }

  /* Tabla wrapper */
  .sp-table-wrap {
    background: #fff;
    border: 1px solid var(--sp-border);
    overflow: hidden;
  }
`

function fmt(v: number) {
  return v.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })
}

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; client?: string }>
}) {
  const permissionsData = await getUserPermissions()
  const perms = permissionsData?.permissions
  if (!perms?.ventas) redirect("/dashboard")
  const companyId = permissionsData.company_id
  if (!companyId) redirect("/auth/sin-empresa")

  const showFinancials = perms?.rentabilidad === true
  const params  = await searchParams
  const supabase = await createClient()

  const now      = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  let selectQuery = "*, clients(name)"
  if (showFinancials) selectQuery += ", sales_profit(profit, profit_margin)"

  let query = supabase.from("sales").select(selectQuery)
    .eq("company_id", companyId)
    .gte("sale_date", firstDay.toISOString())
    .lt("sale_date", nextMonth.toISOString())
    .order("sale_date", { ascending: false })

  if (params.from) query = query.gte("sale_date", params.from)
  if (params.to)   query = query.lte("sale_date", params.to)
  if (params.client && params.client !== "all") query = query.eq("client_id", params.client)

  const { data: sales } = await query

  const totalSales   = sales?.length || 0
  const totalRevenue = showFinancials ? (sales?.reduce((s, v) => s + Number(v.total), 0) || 0) : 0

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <div className="sp-root">

        {/* Header */}
        <div className="sp-header">
          <div className="sp-title-wrap">
            <h1 className="sp-title">
              <span className="sp-title-dot" aria-hidden />
              Historial de Ventas
            </h1>
            <p className="sp-sub">Gestión y seguimiento de transacciones</p>
          </div>
          <ExportSalesButton sales={sales || []} hasFinancialPermission={showFinancials} />
        </div>

        {/* Stats */}
        <div className="sp-stats">
          <div className="sp-stat">
            <div className="sp-stat-icon"><ShoppingCart /></div>
            <div>
              <p className="sp-stat-label">Transacciones</p>
              <p className="sp-stat-val">{totalSales}</p>
              <p className="sp-stat-sub">Ventas en el período</p>
            </div>
          </div>
          {showFinancials && (
            <div className="sp-stat">
              <div className="sp-stat-icon"><DollarSign /></div>
              <div>
                <p className="sp-stat-label">Total mes</p>
                <p className="sp-stat-val">{fmt(totalRevenue)}</p>
                <p className="sp-stat-sub">Facturación bruta</p>
              </div>
            </div>
          )}
        </div>

        {/* Filtros */}
        <div className="sp-section">
          <SalesFilters companyId={companyId} />
        </div>

        {/* Tabla */}
        <div className="sp-table-wrap">
          <SalesTable sales={sales || []} showFinancialColumns={showFinancials} />
        </div>

      </div>
    </>
  )
}
