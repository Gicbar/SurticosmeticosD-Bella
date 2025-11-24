"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { showError, showSuccess } from "@/lib/sweetalert"

type Supplier = {
  id: string
  name: string
  contact: string | null
  phone: string | null
  email: string | null
  address: string | null
}

export function SupplierForm({ supplier }: { supplier?: Supplier }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: supplier?.name || "",
    contact: supplier?.contact || "",
    phone: supplier?.phone || "",
    email: supplier?.email || "",
    address: supplier?.address || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const supabase = createClient()

    const supplierData = {
      name: formData.name,
      contact: formData.contact || null,
      phone: formData.phone || null,
      email: formData.email || null,
      address: formData.address || null,
    }

    if (supplier) {
      const { error } = await supabase.from("suppliers").update(supplierData).eq("id", supplier.id)
      if (error) {
        showError("Error al actualizar el proveedor")
        setIsLoading(false)
        return
      }
      await showSuccess("Proveedor actualizado correctamente")
    } else {
      const { error } = await supabase.from("suppliers").insert(supplierData)
      if (error) {
        showError("Error al crear el proveedor")
        setIsLoading(false)
        return
      }
      await showSuccess("Proveedor creado correctamente")
    }

    router.push("/dashboard/suppliers")
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{supplier ? "Editar Proveedor" : "Nuevo Proveedor"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">Persona de Contacto</Label>
              <Input
                id="contact"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : supplier ? "Actualizar" : "Crear"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
