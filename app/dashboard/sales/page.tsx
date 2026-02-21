import { getUserPermissions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SalesTable } from "@/components/sales-table"
import { SalesFilters } from "@/components/sales-filters"
import { ExportSalesButton } from "@/components/export-sales-button"
import { Receipt, DollarSign, ShoppingCart } from "lucide-react"
import { redirect } from "next/navigation"
import { cn } from "@/lib/utils"

// ─── formatCurrency ───────────────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return amount.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  icon,
  variant = "default",
  subtitle = null,
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  variant?: "default" | "primary" | "accent"
  subtitle?: string | null
}) {
  const variants = {
    default: "text-muted-foreground",
    primary:  "text-primary",
    accent:   "text-chart-4",
  }

  return (
    <Card className="card group hover:shadow-md transition-shadow">
      <CardHeader className="card-header flex flex-row items-center justify-between pb-2">
        <CardTitle className="card-title text-xs uppercase tracking-wide text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`h-5 w-5 ${variants[variant]} group-hover:scale-110 transition-transform duration-200`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-xl md:text-2xl font-bold text-foreground">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}

// ─── SalesPage ────────────────────────────────────────────────────────────────
export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; client?: string }>
}) {
  // ── 1. Permisos + company_id ──────────────────────────────────────────────
  const permissionsData = await getUserPermissions()
  const perms = permissionsData?.permissions

  if (!perms?.ventas) {
    redirect("/dashboard")
  }

  const companyId = permissionsData.company_id
  if (!companyId) redirect("/auth/sin-empresa")

  // Flag para datos financieros (solo si tiene permiso de rentabilidad)
  const showFinancials = perms?.rentabilidad === true

  const params = await searchParams
  const supabase = await createClient()

  // ── 2. Query filtrada por empresa ─────────────────────────────────────────
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  let selectQuery = "*, clients(name)"
  if (showFinancials) {
    selectQuery += ", sales_profit(profit, profit_margin)"
  }

  let query = supabase
    .from("sales")
    .select(selectQuery)
    .eq("company_id", companyId)              // ← FILTRO MULTIEMPRESA
    .gte("sale_date", firstDay.toISOString())
    .lt("sale_date", nextMonth.toISOString())
    .order("sale_date", { ascending: false })

  if (params.from)   query = query.gte("sale_date", params.from)
  if (params.to)     query = query.lte("sale_date", params.to)
  if (params.client && params.client !== "all")
                     query = query.eq("client_id", params.client)

  const { data: sales } = await query

  // ── 3. Métricas ───────────────────────────────────────────────────────────
  const totalSales   = sales?.length || 0
  const totalRevenue = showFinancials
    ? sales?.reduce((sum, s) => sum + Number(s.total), 0) || 0
    : 0

  return (
    <div className="dashboard-page-container">
      {/* Header */}
      <div className="dashboard-toolbar">
        <div className="dashboard-header">
          <h1 className="dashboard-title">
            <Receipt className="dashboard-title-icon" />
            Historial de Ventas
          </h1>
          <p className="dashboard-subtitle">Gestión y seguimiento de transacciones</p>
        </div>
        <ExportSalesButton sales={sales || []} hasFinancialPermission={showFinancials} />
      </div>

      {/* Stats */}
      <div
        className={cn(
          "grid gap-4 md:gap-6 mb-6",
          showFinancials ? "md:grid-cols-2" : "md:grid-cols-1 max-w-sm"
        )}
      >
        <StatCard
          title="Transacciones"
          value={totalSales}
          icon={<ShoppingCart className="h-5 w-5" />}
          variant="primary"
          subtitle="Ventas registradas en el periodo"
        />
        {showFinancials && (
          <StatCard
            title="Total Mes Actual"
            value={formatCurrency(totalRevenue)}
            icon={<DollarSign className="h-5 w-5" />}
            variant="default"
            subtitle="Facturación bruta"
          />
        )}
      </div>

      {/* Filtros — pasa companyId para filtrar clientes del dropdown */}
      <div className="bg-card/40 p-1 rounded-xl mb-4">
        <SalesFilters companyId={companyId} />
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm">
        <SalesTable sales={sales || []} showFinancialColumns={showFinancials} />
      </div>
    </div>
  )
}
