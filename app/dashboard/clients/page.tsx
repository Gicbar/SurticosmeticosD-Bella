import { requireAuth,getUserPermissions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Plus, Users, UserPlus  } from "lucide-react"
import { ClientsTable } from "@/components/clients-table"
import Link from "next/link"
import { redirect } from "next/navigation" 

export default async function ClientsPage() {
  // ✅ VALIDAR PERMISOS AL INICIO
  const permissions = await getUserPermissions()
    // Verificar si existe el permiso rentabilidad y es true
  if (!permissions?.permissions?.clientes) {
    redirect("/dashboard") // Redirige si no tiene permiso
  }
  await requireAuth()
  const supabase = await createClient()

  const { data: clients } = await supabase.from("clients").select("*").order("name", { ascending: true })

  const totalClientes = clients?.length || 0
  const clientesConEmail = clients?.filter(c => c.email).length || 0
  const clientesConTelefono = clients?.filter(c => c.phone).length || 0

  return (
    <div className="flex-1 flex flex-col bg-card/70 backdrop-blur-md p-4 md:p-6 rounded-2xl shadow-inner border border-border/20">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-4 border-b border-border">
        
        <div className="dashboard-header">
          <h1 className="dashboard-title flex items-center gap-3">
            <Users className="dashboard-title-icon h-7 w-7 icon-products" />
            Clientes
          </h1>
          <p className="dashboard-subtitle mt-1">
            {totalClientes} clientes registrados • {clientesConEmail} con email • {clientesConTelefono} con teléfono
          </p>
        </div>
        <Button  asChild  className="btn-action-new">
          <Link href="/dashboard/clients/new">
            <Plus  className="icon-plus"/>
            Nuevo Cliente
          </Link>
        </Button>
      </div>

      {/* Tabla o Estado Vacío Premium */}
      {clients && clients.length > 0 ? (
        <div className="card-dashboard p-0 overflow-hidden">
          <ClientsTable clients={clients} />
        </div>
      ) : (
        <div className="card-dashboard p-12 flex items-center justify-center">
          <div className="text-center max-w-sm group">
            <UserPlus className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4 transition-all duration-300 group-hover:scale-110" />
            <p className="text-lg font-medium text-muted-foreground mb-1">
              No hay clientes registrados
            </p>
            <p className="text-sm text-muted-foreground/70">
              Comienza creando tu primer cliente para gestionar tus ventas
            </p>
            <Button asChild className="mt-4 group bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary">
              <Link href="/dashboard/clients/new">
                <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
                Agregar Cliente
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}