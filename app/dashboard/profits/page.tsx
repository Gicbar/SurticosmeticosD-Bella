import { requireAuth , getUserPermissions} from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card" 
import { PiggyBank, TrendingUp, ShoppingCart, DollarSign, Percent, Plus } from "lucide-react"
import { ProfitsTable } from "@/components/profits-table"
import { ExportProfitsButton } from "@/components/export-profits-button"
import { redirect } from "next/navigation" 

// ✅ FUNCIÓN FORMATCURRENCY
function formatCurrency(amount: number): string {
  return amount.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

// ✅ COMPONENTE STATCARD PREMIUM
function StatCard({ 
  title, 
  value, 
  icon, 
  variant = "default",
  subtitle = null
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  variant?: "default" | "primary" | "accent"
  subtitle?: string | null
}) {
  const variants = {
    default: "icon-inventory",
    primary: "text-primary",
    accent: "text-chart-4",
  }
  
  return (
    <Card className="card-dashboard group">
      <CardHeader className="card-header-dashboard flex flex-row items-center justify-between pb-2">
        <CardTitle className="card-title-dashboard text-xs uppercase tracking-wide">
          {title}
        </CardTitle>
        <div className={`${variants[variant]} group-hover:scale-110 transition-transform duration-200`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="card-value-dashboard text-xl md:text-2xl font-bold">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}

// ✅ PÁGINA PRINCIPAL
export default async function ProfitsPage() {
   // ✅ VALIDAR PERMISOS AL INICIO
  const permissions = await getUserPermissions()
  
  // Verificar si existe el permiso rentabilidad y es true
  if (!permissions?.permissions?.rentabilidad) {
    redirect("/dashboard") // Redirige si no tiene permiso
  }

  await requireAuth()
  const supabase = await createClient()

  const { data: profits } = await supabase
    .from("sales_profit")
    .select(`
      *,
      sales (
        id,
        sale_date,
        payment_method,
        clients (name)
      )
    `)
    .order("created_at", { ascending: false })

  // Cálculos
  const totalSales = profits?.reduce((sum, p) => sum + Number(p.total_sale), 0) || 0
  const totalCost = profits?.reduce((sum, p) => sum + Number(p.total_cost), 0) || 0
  const totalProfit = profits?.reduce((sum, p) => sum + Number(p.profit), 0) || 0
  const avgMargin =
    profits?.length
      ? profits.reduce((sum, p) => sum + Number(p.profit_margin), 0) / profits.length
      : 0

  return (
    <div className="flex-1 flex flex-col bg-card/70 backdrop-blur-md p-4 md:p-6 rounded-2xl shadow-inner border border-border/20">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 group">
            <PiggyBank className="h-6 w-6 icon-inventory group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h1 className="dashboard-title">Análisis de Rentabilidad</h1>
            <p className="dashboard-subtitle mt-1">
              {profits?.length || 0} ventas • Margen promedio {avgMargin.toFixed(1)}%
            </p>
          </div>
        </div>
        <ExportProfitsButton />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:gap-5 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard 
          title="Ventas Totales" 
          value={formatCurrency(totalSales)} 
          icon={<ShoppingCart className="h-5 w-5" />} 
          variant="primary"
          subtitle={`${profits?.length || 0} transacciones`}
        />
        <StatCard 
          title="Costo Total" 
          value={formatCurrency(totalCost)} 
          icon={<DollarSign className="h-5 w-5" />} 
          subtitle="Inversión en productos"
        />
        <StatCard 
          title="Ganancia Neta" 
          value={formatCurrency(totalProfit)} 
          icon={<TrendingUp className="h-5 w-5" />} 
          variant="accent"
          subtitle="Utilidad después de costos"
        />
        <StatCard 
          title="Margen Promedio" 
          value={`${avgMargin.toFixed(1)}%`} 
          icon={<Percent className="h-5 w-5" />} 
          subtitle="Rentabilidad media"
        />
      </div>

      {/* Tabla Container */}
      <div className="card-dashboard p-0 overflow-hidden">
        <ProfitsTable profits={profits || []} />
      </div>
    </div>
  )
}