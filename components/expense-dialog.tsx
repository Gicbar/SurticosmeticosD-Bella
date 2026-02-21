"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { showError, showSuccess } from "@/lib/sweetalert"
import { DollarSign, Calendar, Tag } from "lucide-react"

type Expense = {
  id: string
  description: string
  amount: number
  category: string | null
  date: string
}

interface ExpenseDialogProps {
  expense?: Expense
  children: React.ReactNode
  companyId: string   // ← requerido: viene desde el server component
}

export function ExpenseDialog({ expense, children, companyId }: ExpenseDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Categorías de gastos de esta empresa (tabla categories_expense es global,
  // pero si en el futuro la segmentas por empresa, solo cambia la query aquí)
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])

  const [formData, setFormData] = useState({
    description: expense?.description || "",
    amount: expense?.amount?.toString() || "",
    category: expense?.category?.toString() || "",
    date: expense?.date
      ? new Date(expense.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
  })

  // ── Cargar categorías de gastos ─────────────────────────────────────────
  // categories_expense no tiene company_id en el schema actual (es global).
  // Si en el futuro la segmentas, agrega .eq("company_id", companyId) aquí.
  useEffect(() => {
    const fetchCategories = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("categories_expense")
        .select("id, name")
        .order("name")
      setCategories(data || [])
    }
    fetchCategories()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.description.trim() || !formData.amount || !formData.date) {
      showError("Por favor completa todos los campos requeridos")
      return
    }

    setIsLoading(true)
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        showError("Usuario no autenticado", "Error de autenticación")
        setIsLoading(false)
        return
      }

      const expenseData = {
        description: formData.description.trim(),
        amount: Number.parseFloat(formData.amount),
        // category en tu schema es bigint (FK a categories_expense)
        category: formData.category ? Number.parseInt(formData.category) : null,
        date: new Date(formData.date).toISOString(),
        created_by: user.id,
        company_id: companyId,   // ← SIEMPRE presente en insert y update
      }

      if (expense) {
        const { error } = await supabase
          .from("expenses")
          .update(expenseData)
          .eq("id", expense.id)
          .eq("company_id", companyId)   // ← doble filtro en update
        if (error) throw error

        setOpen(false)
        await new Promise((resolve) => setTimeout(resolve, 150))
        await showSuccess("Gasto actualizado correctamente")
      } else {
        const { error } = await supabase.from("expenses").insert(expenseData)
        if (error) throw error

        setOpen(false)
        await new Promise((resolve) => setTimeout(resolve, 150))
        await showSuccess("Gasto creado correctamente")
      }

      setFormData({
        description: "",
        amount: "",
        category: "",
        date: new Date().toISOString().split("T")[0],
      })
      router.refresh()
    } catch (error: any) {
      showError(error.message || "Error inesperado al guardar el gasto")
      console.error("Error completo:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            {expense ? "Editar Gasto" : "Nuevo Gasto"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción *</Label>
            <Textarea
              id="description"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isLoading}
              placeholder="Ej: Pago de renta, Suministros de oficina..."
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Monto */}
            <div className="space-y-2">
              <Label htmlFor="amount">Monto *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  disabled={isLoading}
                  placeholder="0.00"
                  className="pl-9"
                />
              </div>
            </div>

            {/* Fecha */}
            <div className="space-y-2">
              <Label htmlFor="date">Fecha *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="date"
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  disabled={isLoading}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Categoría — dropdown con categories_expense */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Tag className="h-4 w-4" />
              Categoría
            </Label>
            <Select
              value={formData.category}
              onValueChange={(v) => setFormData({ ...formData, category: v })}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botones */}
          <div className="flex gap-2 justify-end pt-4 border-t border-border/20">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.description.trim() || !formData.amount}
              className="min-w-[100px]"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  Guardando...
                </span>
              ) : expense ? (
                "Actualizar"
              ) : (
                "Crear Gasto"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
