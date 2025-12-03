"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { showError, showSuccess } from "@/lib/sweetalert"
import { Phone, Mail, MapPin, Building2, User } from "lucide-react"

export function SupplierForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    email: "",
    phone: "",
    address: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.from("suppliers").insert(formData)

      if (error) throw error

      await showSuccess("Proveedor registrado correctamente")
      router.push("/dashboard/suppliers")
      router.refresh()
    } catch (error: any) {
      showError(error.message || "Error al registrar el proveedor")
      console.error("Error completo:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Nombre del Proveedor */}
      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Building2 className="h-4 w-4" />
          Nombre del Proveedor *
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
          placeholder="Nombre de la empresa o proveedor"
          className="input-modern h-10"
          disabled={isLoading}
        />
      </div>

      {/* Nombre de Contacto */}
      <div className="space-y-2">
        <Label htmlFor="contact" className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <User className="h-4 w-4" />
          Nombre de Contacto
        </Label>
        <Input
          id="contact"
          value={formData.contact}
          onChange={(e) => setFormData({...formData, contact: e.target.value})}
          placeholder="Persona de contacto"
          className="input-modern h-10"
          disabled={isLoading}
        />
      </div>

      {/* Correo y Teléfono */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Mail className="h-4 w-4" />
            Correo Electrónico
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            placeholder="correo@proveedor.com"
            className="input-modern h-10"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Phone className="h-4 w-4" />
            Teléfono *
          </Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            required
            placeholder="Número de contacto"
            className="input-modern h-10"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Dirección */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="address" className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <MapPin className="h-4 w-4" />
            Dirección
          </Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
            placeholder="Dirección completa"
            className="input-modern h-10"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-3 justify-end pt-4 border-t border-border/20">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/suppliers")}
          disabled={isLoading}
          className="btn-elegant-secondary"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !formData.name || !formData.phone}
          className="btn-action-new min-w-[120px]"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Guardando...
            </span>
          ) : (
            "Registrar Proveedor"
          )}
        </Button>
      </div>
    </form>
  )
}
