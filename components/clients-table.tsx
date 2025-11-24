"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { showError, showConfirm, showSuccess } from "@/lib/sweetalert"

type Client = {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
}

export function ClientsTable({ clients }: { clients: Client[] }) {
  const router = useRouter()

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm("Esta acción no se puede deshacer", "¿Eliminar este cliente?")

    if (!confirmed) return

    const supabase = createClient()
    const { error } = await supabase.from("clients").delete().eq("id", id)

    if (error) {
      showError("Error al eliminar el cliente")
    } else {
      await showSuccess("Cliente eliminado correctamente")
      router.refresh()
    }
  }

  return (
    <div  className="table-container">
      <Table>
        <TableHeader className="table-header">
          <TableRow  className="table-row">
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Dirección</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.length === 0 ? (
            <TableRow  className="table-row">
              <TableCell colSpan={5} className="table-cell">
                No hay clientes registrados
              </TableCell>
            </TableRow>
          ) : (
            clients.map((client) => (
              <TableRow key={client.id}  className="table-row">
                <TableCell className="table-cell">{client.name}</TableCell>
                <TableCell className="table-cell">{client.email || "N/A"}</TableCell>
                <TableCell className="table-cell">{client.phone || "N/A"}</TableCell>
                <TableCell className="table-cell">{client.address || "N/A"}</TableCell>
                <TableCell className="table-cell">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/dashboard/clients/${client.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(client.id)}>
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
