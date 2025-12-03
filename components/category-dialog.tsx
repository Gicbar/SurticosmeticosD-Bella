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

type Category = {
  id: string
  name: string
  description: string | null
}

export function CategoryDialog({ category, children }: { category?: Category; children: React.ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: category?.name || "",
    description: category?.description || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const supabase = createClient()

    try {
      if (category) {
        const { error } = await supabase.from("categories").update(formData).eq("id", category.id)
        if (error) throw error
        
        // ✅ CIERRA EL MODAL PRIMERO
        setOpen(false)
        // Pequeño delay para que se cierre el DOM
        await new Promise(resolve => setTimeout(resolve, 100))
        await showSuccess("Categoría actualizada correctamente")
      } else {
        const { error } = await supabase.from("categories").insert(formData)
        if (error) throw error
        
        // ✅ CIERRA EL MODAL PRIMERO
        setOpen(false)
        // Pequeño delay para que se cierre el DOM
        await new Promise(resolve => setTimeout(resolve, 100))
        await showSuccess("Categoría creada correctamente")
      }

      // Reset form
      setFormData({ name: "", description: "" })
      router.refresh()
    } catch (error: any) {
      // ✅ Muestra error específico
      showError(error.message || "Error inesperado")
      console.error("Error completo:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return ( 
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{category ? "Editar Categoría" : "Nueva Categoría"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name.trim()}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  Guardando...
                </span>
              ) : category ? (
                "Actualizar"
              ) : (
                "Crear"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}