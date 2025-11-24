// components/expenses-table.tsx
"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Calendar, DollarSign, Tag, Receipt } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { ExpenseDialog } from "@/components/expense-dialog"
import { showError, showConfirm, showSuccess } from "@/lib/sweetalert"
import { format } from "date-fns"
import { es } from "date-fns/locale"

type Expense = {
  id: string
  description: string
  amount: number
  category: string | null
  date: string
}

export function ExpensesTable({ expenses }: { expenses: Expense[] }) {
  const router = useRouter()

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm(
      "Esta acción eliminará el gasto permanentemente del registro",
      "¿Eliminar gasto?"
    )

    if (!confirmed) return

    const supabase = createClient()
    const { error } = await supabase.from("expenses").delete().eq("id", id)

    if (error) {
      showError(error.message, "Error al eliminar")
    } else {
      await showSuccess("Gasto eliminado correctamente", "Registro actualizado")
      router.refresh()
    }
  }

  // ✅ BADGE POR CATEGORÍA - Con fallback seguro
  const CategoryBadge = ({ category }: { category: string | null }) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
      operativos: { variant: "default", icon: <Receipt className="h-3 w-3" /> },
      generales: { variant: "secondary", icon: <Tag className="h-3 w-3" /> },
      // Puedes añadir más categorías aquí (ej: marketing, transporte, etc.)
    }

    // Fallback seguro: si la categoría no existe en el objeto, usa outline
    const defaultConfig = { variant: "outline" as const, icon: <Tag className="h-3 w-3" /> }
    const config = category && variants[category] ? variants[category] : defaultConfig

    return (
      <Badge variant={config.variant} className="gap-1 text-xs font-medium">
        {config.icon}
        {category || "Sin categoría"}
      </Badge>
    )
  }

  return (
    <div className="table-container">
      <Table className="table-base min-w-[900px]">
        <TableHeader className="table-header sticky top-0 z-10 bg-card/95 backdrop-blur-md">
          <TableRow className="table-row">
            <TableHead className="table-cell">Fecha</TableHead>
            <TableHead className="table-cell">Descripción</TableHead>
            <TableHead className="table-cell">Categoría</TableHead>
            <TableHead className="table-cell text-right">Monto</TableHead>
            <TableHead className="table-cell text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.length === 0 ? (
            // ✅ ESTADO VACÍO PREMIUM
            <TableRow className="table-row">
              <TableCell colSpan={5} className="table-cell">
                <div className="py-12 flex items-center justify-center">
                  <div className="text-center max-w-sm group">
                    <Receipt className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4 transition-all duration-300 group-hover:scale-110" />
                    <p className="text-lg font-medium text-muted-foreground mb-1">
                      No hay gastos registrados
                    </p>
                    <p className="text-sm text-muted-foreground/70">
                      Registra tus primeros gastos para controlar tu flujo de caja
                    </p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            expenses.map((expense) => (
              <TableRow 
                key={expense.id} 
                className="table-row transition-all duration-200 hover:bg-primary/5 hover:translate-x-1"
              >
                {/* Fecha con ícono y formato premium */}
                <TableCell className="table-cell">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(expense.date), "dd MMM yyyy", { locale: es })}
                  </div>
                </TableCell>

                {/* Descripción con ícono */}
                <TableCell className="table-cell">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-muted-foreground group-hover:text-chart-5" />
                    <span className="font-medium text-sm text-foreground">{expense.description}</span>
                  </div>
                </TableCell>

                {/* Categoría con Badge premium (AHORA CON FALLBACK SEGURO) */}
                <TableCell className="table-cell">
                  <CategoryBadge category={expense.category} />
                </TableCell>

                {/* Monto con ícono y formato currency */}
                <TableCell className="table-cell text-right">
                  <div className="flex justify-end items-center gap-1 group">
                    <DollarSign className="h-3 w-3 text-destructive group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-sm text-destructive">
                      {formatCurrency(expense.amount)}
                    </span>
                  </div>
                </TableCell>

                {/* Acciones con micro-animaciones */}
                <TableCell className="table-cell">
                  <div className="flex justify-end gap-1">
                    <ExpenseDialog expense={expense}>
                      <Button variant="ghost" size="icon" className="group" title="Editar">
                        <Edit className="h-4 w-4 text-muted-foreground group-hover:text-chart-2 transition-all group-hover:scale-110" />
                      </Button>
                    </ExpenseDialog>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(expense.id)}
                      className="group"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground group-hover:text-destructive transition-all group-hover:scale-110" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

// ✅ FUNCIÓN FORMATCURRENCY - Consistente con el sistema
function formatCurrency(amount: number | string | null | undefined): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (numAmount === null || numAmount === undefined || isNaN(numAmount)) {
    return "$0"
  }
  
  return numAmount.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}