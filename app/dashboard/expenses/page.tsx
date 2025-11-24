import { requireAuth,getUserPermissions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Plus, DollarSign, TrendingUp, Calendar, Receipt } from "lucide-react"
import { ExpensesTable } from "@/components/expenses-table"
import { ExpenseDialog } from "@/components/expense-dialog"
import { StatCard } from "@/components/stat-card"
import { redirect } from "next/navigation" 

export default async function ExpensesPage() {
  // ✅ VALIDAR PERMISOS AL INICIO
  const permissions = await getUserPermissions()
    // Verificar si existe el permiso rentabilidad y es true
  if (!permissions?.permissions?.gastos) {
    redirect("/dashboard") // Redirige si no tiene permiso
  }
  await requireAuth()
  const supabase = await createClient()

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .order("date", { ascending: false })

  // 🔥 CÁLCULOS PREMIUM - Múltiples métricas
  const currentMonth = new Date()
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

  const { data: monthExpenses } = await supabase
    .from("expenses")
    .select("amount, category")
    .gte("date", firstDay.toISOString())
    .lte("date", lastDay.toISOString())

  const totalMonth = monthExpenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0
  const totalGastos = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0
  const gastosOperativos = monthExpenses?.filter(exp => exp.category === "operativos").reduce((sum, exp) => sum + Number(exp.amount), 0) || 0
  const gastosGenerales = monthExpenses?.filter(exp => exp.category === "generales").reduce((sum, exp) => sum + Number(exp.amount), 0) || 0
  const promedioDiario = totalMonth / new Date().getDate()

  return (
    <div className="flex-1 flex flex-col bg-card/70 backdrop-blur-md p-4 md:p-6 rounded-2xl shadow-inner border border-border/20">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 group">
            <Receipt className="h-6 w-6 icon-inventory group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h1 className="dashboard-title">Gestión de Gastos</h1>
            <p className="dashboard-subtitle mt-1">
              {expenses?.length || 0} registros • {formatCurrency(totalMonth)} este mes
            </p>
          </div>
        </div>
        <ExpenseDialog>
          <Button className="group w-full md:w-auto bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary transition-all duration-300 shadow-md">
            <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
            Nuevo Gasto
          </Button>
        </ExpenseDialog>
      </div>

      {/* Stats Cards Premium - Reemplazan el Card simple */}
      <div className="grid gap-4 md:gap-5 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard 
          title="Gastos del Mes" 
          value={formatCurrency(totalMonth)} 
          icon={<DollarSign className="h-5 w-5" />} 
          variant="primary"
          subtitle={currentMonth.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
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
          subtitle="Admin y otros"
        />
        <StatCard 
          title="Promedio Diario" 
          value={formatCurrency(promedioDiario)} 
          icon={<Calendar className="h-5 w-5" />} 
          subtitle={`${new Date().getDate()} días del mes`}
        />
      </div>

      {/* Tabla Premium o Estado Vacío */}
      {expenses && expenses.length > 0 ? (
        <div className="card-dashboard p-0 overflow-hidden">
          <ExpensesTable expenses={expenses || []} />
        </div>
      ) : (
        <div className="card-dashboard p-12 flex items-center justify-center">
          <div className="text-center max-w-sm group">
            <Receipt className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4 transition-all duration-300 group-hover:scale-110" />
            <p className="text-lg font-medium text-muted-foreground mb-1">
              No hay gastos registrados
            </p>
            <p className="text-sm text-muted-foreground/70">
              Empieza a registrar tus gastos para controlar tu flujo de caja
            </p>
            <ExpenseDialog>
              <Button className="mt-4 group bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary">
                <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
                Agregar Gasto
              </Button>
            </ExpenseDialog>
          </div>
        </div>
      )}
    </div>
  )
}


function formatCurrency(amount: number): string {
  return amount.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}