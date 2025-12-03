"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { showError, showSuccess } from "@/lib/sweetalert"

export function ClientForm({ client }: { client?: any }) {
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
    const payload = { ...formData, email: formData.email || null, phone: formData.phone || null, address: formData.address || null }

    const { error } = client 
      ? await supabase.from("clients").update(payload).eq("id", client.id)
      : await supabase.from("clients").insert(payload)

    if (error) { showError("Error"); setIsLoading(false); }
    else { await showSuccess(client ? "Actualizado" : "Creado"); router.push("/dashboard/clients"); router.refresh(); }
  }

  return (
    <Card className="card max-w-2xl mx-auto">
      <CardHeader className="card-header">
        <CardTitle className="card-title">{client ? "Editar Cliente" : "Nuevo Cliente"}</CardTitle>
      </CardHeader>
      <CardContent className="card-content">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-modern" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-modern" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Textarea id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="input-modern min-h-[100px]" />
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()} className="btn-elegant-secondary">Cancelar</Button>
            <Button type="submit" disabled={isLoading} className="btn-action-new">{isLoading ? "Guardando..." : "Guardar Cliente"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}