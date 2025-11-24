"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { showError, showSuccess } from "@/lib/sweetalert"
import { DollarSign, Calendar, Tag } from "lucide-react"

type Expense = {
  id: string
  description: string
  amount: number
  category: string | null
  date: string
}

export function ExpenseDialog({ expense, children }: { expense?: Expense; children: React.ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    description: expense?.description || "",
    amount: expense?.amount?.toString() || "",
    category: expense?.category || "",
    date: expense?.date ? new Date(expense.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validación frontend
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
        category: formData.category?.trim() || null,
        date: new Date(formData.date).toISOString(),
        created_by: user.id,
      }

      if (expense) {
        const { error } = await supabase.from("expenses").update(expenseData).eq("id", expense.id)
        if (error) throw error
        
        // ✅ CIERRA EL MODAL PRIMERO
        setOpen(false)
        await new Promise(resolve => setTimeout(resolve, 150))
        await showSuccess("Gasto actualizado correctamente")
      } else {
        const { error } = await supabase.from("expenses").insert(expenseData)
        if (error) throw error
        
        // ✅ CIERRA EL MODAL PRIMERO
        setOpen(false)
        await new Promise(resolve => setTimeout(resolve, 150))
        await showSuccess("Gasto creado correctamente")
      }

      // Reset form
      setFormData({ 
        description: "", 
        amount: "", 
        category: "", 
        date: new Date().toISOString().split("T")[0] 
      })
      router.refresh()
    } catch (error: any) {
      // ✅ Muestra error específico de la base de datos
      showError(error.message || "Error inesperado al guardar el gasto")
      console.error("Error completo:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card/90 backdrop-blur-md border border-border/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {expense ? (
              <><DollarSign className="h-5 w-5 text-primary" /> Editar Gasto</>
            ) : (
              <><DollarSign className="h-5 w-5 text-primary" /> Nuevo Gasto</>
            )}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="space-y-2">
              <Label htmlFor="amount">Monto *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                disabled={isLoading}
                placeholder="0.00"
                prefix={<DollarSign className="h-4 w-4 text-muted-foreground" />}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Fecha *</Label>
              <Input
                id="date"
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoría</Label>
            <Input
              id="category"
              placeholder="Ej: Servicios, Suministros, Salarios, Transporte"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              disabled={isLoading}
              prefix={<Tag className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

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