import { getUserPermissions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SalesTable } from "@/components/sales-table"
import { SalesFilters } from "@/components/sales-filters"
import { ExportSalesButton } from "@/components/export-sales-button"
import { Receipt, DollarSign, ShoppingCart, TrendingUp, Lock } from "lucide-react"
import { redirect } from "next/navigation"
import { cn } from "@/lib/utils"

// ── UTILS ──────────────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return amount.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

// ── STAT CARD PREMIUM ─────────────────────────────────────────────
function StatCard({
  title,
  value,
  icon,
  variant = "default",
  subtitle = null,
  className,
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  variant?: "default" | "primary" | "accent" | "muted"
  subtitle?: string | null
  className?: string
}) {
  const variants = {
    default: "text-foreground/80",
    primary: "text-primary",
    accent: "text-chart-4",
    muted: "text-muted-foreground",
  }

  return (
    <Card className={cn("card-dashboard group overflow-hidden relative", className)}>
      <CardHeader className="card-header-dashboard flex flex-row items-center justify-between pb-2">
        <CardTitle className="card-title-dashboard text-xs uppercase tracking-wide font-bold text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn(
          "p-2 rounded-xl bg-secondary/50 transition-all duration-300 group-hover:scale-110 group-hover:bg-secondary",
          variants[variant]
        )}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="card-value-dashboard text-2xl font-bold tracking-tight">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1 font-medium">{subtitle}</p>
        )}
        
        {/* Efecto Glow Sutil */}
        <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-primary/5 rounded-full blur-xl pointer-events-none group-hover:bg-primary/10 transition-colors" />
      </CardContent>
    </Card>
  )
}

// ── PAGE ───────────────────────────────────────────────────────────
export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; client?: string }>
}) {
  // 1. ✅ VALIDAR PERMISOS
  const permissionsData = await getUserPermissions()
  const perms = permissionsData?.permissions
  
  // Si no tiene permiso base de ventas, fuera.
  if (!perms?.ventas) {
    redirect("/dashboard")
  }

  // Flag específico para datos financieros (Rentabilidad)
  const showFinancials = perms?.rentabilidad === true

  const params = await searchParams
  const supabase = await createClient()

  // 2. ✅ CONSTRUIR CONSULTA SEGURA
  // Si no hay permiso de rentabilidad, NO pedimos sales_profit
  let selectQuery = "*, clients(name)"
  if (showFinancials) {
    selectQuery += ", sales_profit(profit, profit_margin)"
  }

  let query = supabase
    .from("sales")
    .select(selectQuery)
    .order("sale_date", { ascending: false })

  if (params.from) query = query.gte("sale_date", params.from)
  if (params.to) query = query.lte("sale_date", params.to)
  if (params.client) query = query.eq("client_id", params.client)

  const { data: sales } = await query

  // 3. ✅ CÁLCULOS CONDICIONALES
  const totalSales = sales?.length || 0
  
  // Solo calculamos dinero si tiene permisos
  const totalRevenue = showFinancials 
    ? sales?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0 
    : 0

  const totalProfit = showFinancials
    ? sales?.reduce((sum, sale) => sum + Number(sale.sales_profit?.[0]?.profit || 0), 0) || 0
    : 0

  return (
    <div className="flex-1 flex flex-col bg-card/70 backdrop-blur-md p-4 md:p-6 rounded-2xl shadow-inner border border-border/20 space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-border/50">
        <div className="flex items-center gap-4">
          <div>
          <h1 className="dashboard-title flex items-center gap-3">
            <Receipt className="h-7 w-7 icon-products" />
            Historial de Ventas
          </h1>
          <p className="dashboard-subtitle mt-1">
            Gestión y seguimiento de transacciones
          </p>
        </div>
        </div>
        
        {/* El botón de exportar también debería recibir el flag si quieres ocultar columnas en el Excel */}
        <ExportSalesButton sales={sales || []} hasFinancialPermission={showFinancials} />
      </div>

      {/* STATS CARDS GRID - Se adapta dinámicamente */}
      <div className={cn(
        "grid gap-4 md:gap-6",
        showFinancials ? "md:grid-cols-3" : "md:grid-cols-1 max-w-sm" // Si solo hay 1 card, limitamos el ancho
      )}>
        
        {/* CARD 1: Cantidad (Siempre visible) */}
        <StatCard
          title="Transacciones"
          value={totalSales}
          icon={<ShoppingCart className="h-5 w-5" />}
          variant="primary"
          subtitle="Ventas registradas en periodo"
        />

        {/* CARDS FINANCIERAS: Solo si showFinancials es true */}
        {showFinancials && (
          <>
            <StatCard
              title="Ingresos Totales"
              value={formatCurrency(totalRevenue)}
              icon={<DollarSign className="h-5 w-5" />}
              variant="default"
              subtitle="Facturación bruta"
            />
            <StatCard
              title="Ganancia Neta"
              value={formatCurrency(totalProfit)}
              icon={<TrendingUp className="h-5 w-5" />}
              variant="accent"
              subtitle="Utilidad real calculada"
            />
          </>
        )}
      </div>

      {/* FILTROS */}
      <div className="bg-card/40 p-1 rounded-xl">
        <SalesFilters />
      </div>

      {/* TABLA */}
      <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm">
        {/* Pasamos el flag a la tabla para que oculte columnas de 'Total' o 'Ganancia' si es necesario */}
        <SalesTable 
          sales={sales || []} 
          showFinancialColumns={showFinancials} 
        />
      </div>
    </div>
  )
}