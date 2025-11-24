"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { showSuccess, showError } from "@/lib/sweetalert"
import { Package } from "lucide-react"

type UserPermission = {
  id: string
  user_id: string
  role: string
  permissions: any
}

type UserEmail = {
  id: string
  email: string
}

type CombinedUser = UserPermission & {
  users?: { email: string } | null
}

export function UserManagement() {
  const [users, setUsers] = useState<CombinedUser[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      // ✅ CONSULTA 1: Obtener permisos de usuarios
      const { data: permissions, error: permError } = await supabase
        .from("user_permissions")
        .select("*")
        .order("role")

      if (permError) {
        console.error("[v0] Error fetching permissions:", permError)
        showError(`Error al cargar permisos: ${permError.message}`)
        setUsers([])
        return
      }

      if (!permissions || permissions.length === 0) {
        setUsers([])
        return
      }

      // ✅ CONSULTA 2: Obtener emails de los usuarios
      const userIds = permissions.map(p => p.user_id).filter(Boolean)
      
      const { data: usersData, error: usersError } = await supabase
        .from("auth.users") // Usa "users" si está en schema public
        .select("id, email")
        .in("id", userIds)

      if (usersError) {
        console.warn("[v0] Could not fetch emails:", usersError)
        // Continuar sin emails, no es crítico
      }

      // ✅ COMBINAR datos
      const combined: CombinedUser[] = permissions.map(perm => ({
        ...perm,
        users: usersData?.find(u => u.id === perm.user_id) || null
      }))

      setUsers(combined)
    } catch (error: any) {
      console.error("[v0] Unexpected error:", error)
      showError(`Error inesperado: ${error.message}`)
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from("user_permissions")
        .update({ role: newRole })
        .eq("user_id", userId)

      if (error) {
        console.error("[v0] Error updating role:", error)
        showError(`Error al actualizar: ${error.message}`)
        return
      }

      await showSuccess("Rol actualizado correctamente!")
      fetchUsers() // Recargar datos actualizados
    } catch (error: any) {
      showError(`Error: ${error.message}`)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Package className="h-8 w-8 text-primary animate-spin" />
        <span className="ml-3 text-muted-foreground">Cargando usuarios...</span>
      </div>
    )
  }

  return (
    <div className="rounded-md border bg-card shadow-sm">
      <div className="px-5 py-4 border-b border-border bg-card/50">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Gestión de Usuarios
        </h2>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Rol Actual</TableHead>
            <TableHead>Cambiar Rol</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p>No hay usuarios registrados</p>
                <p className="text-xs mt-1">Asegúrate de tener permisos de administrador</p>
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.users?.email || (
                    <span className="text-muted-foreground">Email no disponible</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize text-xs sm:text-sm">
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select 
                    value={user.role} 
                    onValueChange={(value) => handleRoleChange(user.user_id, value)}
                  >
                    <SelectTrigger className="w-32 xs:w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="gerente">Gerente</SelectItem>
                      <SelectItem value="vendedor">Vendedor</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}