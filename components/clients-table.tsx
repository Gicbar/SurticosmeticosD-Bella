"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Users } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { showError, showConfirm, showSuccess } from "@/lib/sweetalert"

export function ClientsTable({ clients }: { clients: any[] }) {
  const router = useRouter()
  const handleDelete = async (id: string) => {
    if (await showConfirm("Irreversible", "¿Eliminar Cliente?")) {
      const { error } = await createClient().from("clients").delete().eq("id", id)
      if (error) showError("Error")
      else { showSuccess("Eliminado"); router.refresh(); }
    }
  }

  return (
    <div className="table-container">
      <Table className="table-base">
        <TableHeader className="table-header">
          <TableRow className="table-row">
            <TableHead className="table-cell">Nombre</TableHead>
            <TableHead className="table-cell">Contacto</TableHead>
            <TableHead className="table-cell">Ubicación</TableHead>
            <TableHead className="table-cell text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.length === 0 ? (
            <TableRow className="table-row">
              <TableCell colSpan={4} className="table-cell">
                <div className="empty-state-box">
                  <Users className="empty-state-icon" />
                  <p className="empty-state-title">No hay clientes</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            clients.map((client) => (
              <TableRow key={client.id} className="table-row">
                <TableCell className="table-cell font-medium">{client.name}</TableCell>
                <TableCell className="table-cell">
                   <div className="flex flex-col text-xs text-muted-foreground">
                     <span>{client.email}</span>
                     <span>{client.phone}</span>
                   </div>
                </TableCell>
                <TableCell className="table-cell text-sm text-muted-foreground">{client.address || "N/A"}</TableCell>
                <TableCell className="table-cell text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" asChild className="btn-elegant-ghost">
                      <Link href={`/dashboard/clients/${client.id}/edit`}><Edit className="h-4 w-4" /></Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(client.id)} className="btn-elegant-danger">
                      <Trash2 className="h-4 w-4" />
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