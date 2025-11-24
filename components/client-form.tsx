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

type Client = {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
}

export function ClientForm({ client }: { client?: Client }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: client?.name || "",
    email: client?.email || "",
    phone: client?.phone || "",
    address: client?.address || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const supabase = createClient()

    const clientData = {
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone || null,
      address: formData.address || null,
    }

    if (client) {
      const { error } = await supabase.from("clients").update(clientData).eq("id", client.id)
      if (error) {
        showError("Error al actualizar el cliente")
        setIsLoading(false)
        return
      }
      await showSuccess("Cliente actualizado correctamente")
    } else {
      const { error } = await supabase.from("clients").insert(clientData)
      if (error) {
        showError("Error al crear el cliente")
        setIsLoading(false)
        return
      }
      await showSuccess("Cliente creado correctamente")
    }

    router.push("/dashboard/clients")
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{client ? "Editar Cliente" : "Nuevo Cliente"}</CardTitle>
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
              {isLoading ? "Guardando..." : client ? "Actualizar" : "Crear"}
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
