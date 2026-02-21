import { getUserPermissions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, DollarSign, TrendingUp, Calendar, Receipt } from "lucide-react"
import { ExpensesTable } from "@/components/expenses-table"
import { ExpenseDialog } from "@/components/expense-dialog"
import { redirect } from "next/navigation"

function formatCurrency(amount: number): string {
  return amount.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

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
    primary: "text-primary",
    accent: "text-chart-4",
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

export default async function ExpensesPage() {
  // ── 1. Permisos + company_id en una sola llamada ──────────────────────────
  const permissions = await getUserPermissions()

  if (!permissions?.permissions?.gastos) {
    redirect("/dashboard")
  }

  const companyId = permissions.company_id
  if (!companyId) redirect("/auth/sin-empresa")

  // ── 2. Fechas del mes actual ───────────────────────────────────────────────
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

  const supabase = await createClient()

  // ── 3. Todas las queries filtradas por empresa ────────────────────────────
  const [{ data: expenses }, { data: monthExpenses }] = await Promise.all([
    supabase
      .from("expenses")
      .select("*")
      .eq("company_id", companyId)              // ← FILTRO MULTIEMPRESA
      .order("date", { ascending: false }),

    supabase
      .from("expenses")
      .select("amount, category")
      .eq("company_id", companyId)              // ← FILTRO MULTIEMPRESA
      .gte("date", firstDay)
      .lte("date", lastDay),
  ])

  // ── 4. Métricas solo de esta empresa ─────────────────────────────────────
  const totalMonth        = monthExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
  const totalGastos       = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
  const gastosOperativos  = monthExpenses?.filter((e) => e.category === "operativos").reduce((sum, e) => sum + Number(e.amount), 0) || 0
  const gastosGenerales   = monthExpenses?.filter((e) => e.category === "generales").reduce((sum, e) => sum + Number(e.amount), 0) || 0
  const promedioDiario    = now.getDate() > 0 ? totalMonth / now.getDate() : 0

  return (
    <div className="dashboard-page-container">
      {/* Header */}
      <div className="dashboard-toolbar">
        <div className="dashboard-header">
          <h1 className="dashboard-title">
            <Receipt className="dashboard-title-icon" />
            Gestión de Gastos
          </h1>
          <p className="dashboard-subtitle">
            {expenses?.length || 0} registros •{" "}
            <span className="font-bold text-primary">{formatCurrency(totalMonth)}</span> este mes
          </p>
        </div>
        {/* companyId al dialog para que el insert lo incluya */}
        <ExpenseDialog companyId={companyId}>
          <Button className="btn-action-new">
            <Plus className="icon-plus" />
            Nuevo Gasto
          </Button>
        </ExpenseDialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:gap-5 md:grid-cols-2 lg:grid-cols-4 mb-6 animate-fadeIn">
        <StatCard
          title="Gastos del Mes"
          value={formatCurrency(totalMonth)}
          icon={<DollarSign className="h-5 w-5" />}
          variant="primary"
          subtitle={now.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
        />
        <StatCard
          title="Gastos Operativos"
          value={formatCurrency(gastosOperativos)}
          icon={<TrendingUp className="h-5 w-5" />}
          subtitle="Operación diaria"
        />
        <StatCard
          title="Gastos Generales"
          value={formatCurrency(gastosGenerales)}
          icon={<Receipt className="h-5 w-5" />}
          variant="accent"
          subtitle="Administrativos y otros"
        />
        <StatCard
          title="Promedio Diario"
          value={formatCurrency(promedioDiario)}
          icon={<Calendar className="h-5 w-5" />}
          subtitle={`${now.getDate()} días del mes`}
        />
      </div>

      {/* Tabla o Estado vacío */}
      {expenses && expenses.length > 0 ? (
        <div className="card p-0 overflow-hidden animate-fadeIn">
          <ExpensesTable expenses={expenses} companyId={companyId} />
        </div>
      ) : (
        <div className="card p-12 flex items-center justify-center animate-fadeIn">
          <div className="text-center max-w-sm space-y-4">
            <div className="w-20 h-20 mx-auto flex items-center justify-center rounded-full bg-gradient-to-br from-secondary to-primary/20">
              <Receipt className="h-10 w-10 text-primary/50" />
            </div>
            <p className="text-lg font-medium text-muted-foreground">No hay gastos registrados</p>
            <p className="text-sm text-muted-foreground/70">
              Empieza a registrar tus gastos para controlar tu flujo de caja
            </p>
            <ExpenseDialog companyId={companyId}>
              <Button className="btn-action-new mt-4">
                <Plus className="icon-plus" />
                Agregar Gasto
              </Button>
            </ExpenseDialog>
          </div>
        </div>
      )}
    </div>
  )
}
