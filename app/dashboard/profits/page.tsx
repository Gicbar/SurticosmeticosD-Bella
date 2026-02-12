import { requireAuth, getUserPermissions } from "@/lib/auth"
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
  });
}

// ✅ COMPONENTE STATCARD
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
    default: "text-muted-foreground",
    primary: "text-primary",
    accent: "text-chart-4",
  };

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
        <div className="text-xl md:text-2xl font-bold text-foreground">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ✅ PÁGINA PRINCIPAL
export default async function ProfitsPage() {
  // ✅ VALIDAR PERMISOS AL INICIO
  const permissions = await getUserPermissions();
  if (!permissions?.permissions?.rentabilidad) {
    redirect("/dashboard");
  }
  await requireAuth();

  const supabase = await createClient()

  // 1️⃣ Calcular rango del mes actual
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  // 2️⃣ Query filtrando por sale_date del mes actual
  const { data: profits, error } = await supabase
    .from("sales_profit")
    .select(`
      *,
      sales!inner (
        id,
        sale_date,
        payment_method,
        clients (name)
      )
    `)
    .gte("sales.sale_date", firstDay.toISOString())
    .lt("sales.sale_date", nextMonth.toISOString())
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error:", error)
  }

  // 3️⃣ Cálculos
  const totalSales =
    profits?.reduce((sum, p) => sum + Number(p.total_sale || 0), 0) || 0

  const totalCost =
    profits?.reduce((sum, p) => sum + Number(p.total_cost || 0), 0) || 0

  const totalProfit =
    profits?.reduce((sum, p) => sum + Number(p.profit || 0), 0) || 0

  const avgMargin = profits?.length
    ? profits.reduce((sum, p) => sum + Number(p.profit_margin || 0), 0) /
      profits.length
    : 0


  return (
    <div className="dashboard-page-container">
      {/* Header */}
      <div className="dashboard-toolbar">
        <div className="dashboard-header">
          <h1 className="dashboard-title">
            <PiggyBank className="dashboard-title-icon" />
            Análisis de Rentabilidad 
          </h1>
          <p className="dashboard-subtitle">
            {profits?.length || 0} ventas • Margen promedio <span className="font-bold text-primary">{avgMargin.toFixed(1)}%</span>
          </p>
        </div>
        <ExportProfitsButton profits={profits || []} />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:gap-5 md:grid-cols-2 lg:grid-cols-4 mb-6 animate-fadeIn">
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

      {/* Tabla de Rentabilidad */}
      <div className="card p-0 overflow-hidden animate-fadeIn">
        <ProfitsTable profits={profits || []} />
      </div>
    </div>
  );
}
