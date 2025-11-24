"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Truck, Calendar, User, Phone, Mail, MapPin } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { showError, showConfirm, showSuccess } from "@/lib/sweetalert"
import { format } from "date-fns"
import { es } from "date-fns/locale"

type Supplier = {
  id: string
  name: string
  contact: string | null
  phone: string | null
  email: string | null
  address: string | null
  created_at: string
}

export function SuppliersTable({ suppliers }: { suppliers: Supplier[] }) {
  const router = useRouter()

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm(
      "Esta acción eliminará el proveedor permanentemente",
      "¿Eliminar proveedor?"
    )

    if (!confirmed) return

    const supabase = createClient()
    const { error } = await supabase.from("suppliers").delete().eq("id", id)

    if (error) {
      showError(error.message, "Error al eliminar")
    } else {
      await showSuccess("Proveedor eliminado correctamente", "Registro actualizado")
      router.refresh()
    }
  }

  return (
    <div className="table-container">
      <Table className="table-base min-w-[1000px]">
        <TableHeader className="table-header sticky top-0 z-10 bg-card/95 backdrop-blur-md">
          <TableRow className="table-row">
            <TableHead className="table-cell">Proveedor</TableHead>
            <TableHead className="table-cell">Contacto</TableHead>
            <TableHead className="table-cell">Teléfono</TableHead>
            <TableHead className="table-cell">Email</TableHead>
            <TableHead className="table-cell">Dirección</TableHead>
            <TableHead className="table-cell">Registro</TableHead>
            <TableHead className="table-cell text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.length === 0 ? (
            // ✅ ESTADO VACÍO PREMIUM
            <TableRow className="table-row">
              <TableCell colSpan={7} className="table-cell">
                <div className="py-12 flex items-center justify-center">
                  <div className="text-center max-w-sm">
                    <Truck className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">No hay proveedores</p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            suppliers.map((supplier) => (
              <TableRow 
                key={supplier.id} 
                className="table-row transition-all duration-200 hover:bg-primary/5 hover:translate-x-1"
              >
                {/* Proveedor con ícono */}
                <TableCell className="table-cell">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground group-hover:text-chart-5" />
                    <span className="font-medium text-sm text-foreground">{supplier.name}</span>
                  </div>
                </TableCell>

                {/* Contacto con ícono */}
                <TableCell className="table-cell">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className={`text-sm ${supplier.contact ? "text-foreground" : "text-muted-foreground"}`}>
                      {supplier.contact || "N/A"}
                    </span>
                  </div>
                </TableCell>

                {/* Teléfono con ícono y badge */}
                <TableCell className="table-cell">
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    {supplier.phone ? (
                      <Badge variant="outline" className="text-xs font-mono">
                        {supplier.phone}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">N/A</span>
                    )}
                  </div>
                </TableCell>

                {/* Email con ícono */}
                <TableCell className="table-cell">
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className={`text-sm ${supplier.email ? "text-foreground" : "text-muted-foreground"}`}>
                      {supplier.email || "N/A"}
                    </span>
                  </div>
                </TableCell>

                {/* Dirección con ícono */}
                <TableCell className="table-cell">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className={`text-sm ${supplier.address ? "text-foreground" : "text-muted-foreground"}`}>
                      {supplier.address ? supplier.address.substring(0, 25) + "..." : "N/A"}
                    </span>
                  </div>
                </TableCell>

                {/* Fecha de registro */}
                <TableCell className="table-cell">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(supplier.created_at), "dd MMM yyyy", { locale: es })}
                  </div>
                </TableCell>

                {/* Acciones con micro-animaciones */}
                <TableCell className="table-cell">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" asChild className="group" title="Editar">
                      <Link href={`/dashboard/suppliers/${supplier.id}/edit`}>
                        <Edit className="h-4 w-4 text-muted-foreground group-hover:text-chart-2 transition-all group-hover:scale-110" />
                      </Link>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(supplier.id)}
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