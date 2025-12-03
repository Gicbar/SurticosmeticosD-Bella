import { requireAuth, getUserPermissions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, DollarSign, TrendingUp, Calendar, Receipt } from "lucide-react"
import { ExpensesTable } from "@/components/expenses-table"
import { ExpenseDialog } from "@/components/expense-dialog"
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

export default async function ExpensesPage() {
  // ✅ VALIDAR PERMISOS AL INICIO
  const permissions = await getUserPermissions();
  if (!permissions?.permissions?.gastos) {
    redirect("/dashboard");
  }
  await requireAuth();

  const supabase = await createClient();
  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .order("date", { ascending: false });

  // 🔥 CÁLCULOS - Múltiples métricas
  const currentMonth = new Date();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const { data: monthExpenses } = await supabase
    .from("expenses")
    .select("amount, category")
    .gte("date", firstDay.toISOString())
    .lte("date", lastDay.toISOString());

  const totalMonth = monthExpenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
  const totalGastos = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
  const gastosOperativos = monthExpenses?.filter(exp => exp.category === "operativos").reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
  const gastosGenerales = monthExpenses?.filter(exp => exp.category === "generales").reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
  const promedioDiario = totalMonth / new Date().getDate();

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
            {expenses?.length || 0} registros • <span className="font-bold text-primary">{formatCurrency(totalMonth)}</span> este mes
          </p>
        </div>
        <ExpenseDialog>
          <Button className="btn-action-new">
            <Plus className="icon-plus" />
            Nuevo Gasto
          </Button>
        </ExpenseDialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:gap-5 md:grid-cols-2 lg:grid-cols-4 mb-6 animate-fadeIn">
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
          subtitle="Administrativos y otros"
        />
        <StatCard
          title="Promedio Diario"
          value={formatCurrency(promedioDiario)}
          icon={<Calendar className="h-5 w-5" />}
          subtitle={`${new Date().getDate()} días del mes`}
        />
      </div>

      {/* Tabla o Estado Vacío */}
      {expenses && expenses.length > 0 ? (
        <div className="card p-0 overflow-hidden animate-fadeIn">
          <ExpensesTable expenses={expenses || []} />
        </div>
      ) : (
        <div className="card p-12 flex items-center justify-center animate-fadeIn">
          <div className="text-center max-w-sm space-y-4">
            <div className="w-20 h-20 mx-auto flex items-center justify-center rounded-full bg-gradient-to-br from-secondary to-primary/20">
              <Receipt className="h-10 w-10 text-primary/50" />
            </div>
            <p className="text-lg font-medium text-muted-foreground">
              No hay gastos registrados
            </p>
            <p className="text-sm text-muted-foreground/70">
              Empieza a registrar tus gastos para controlar tu flujo de caja
            </p>
            <ExpenseDialog>
              <Button className="btn-action-new mt-4">
                <Plus className="icon-plus" />
                Agregar Gasto
              </Button>
            </ExpenseDialog>
          </div>
        </div>
      )}
    </div>
  );
}
