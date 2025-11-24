import { requireAuth,getUserPermissions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Plus, Truck, Package, Phone, Mail, MapPin } from "lucide-react"
import { SuppliersTable } from "@/components/suppliers-table"
import { StatCard } from "@/components/stat-card"
import Link from "next/link"
import { redirect } from "next/navigation" 

export default async function SuppliersPage() {

  // ✅ VALIDAR PERMISOS AL INICIO
  const permissions = await getUserPermissions()
    // Verificar si existe el permiso rentabilidad y es true
  if (!permissions?.permissions?.proveedores) {
    redirect("/dashboard") // Redirige si no tiene permiso
  }
  await requireAuth()
  const supabase = await createClient()

  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("*")
    .order("name", { ascending: true })

  const totalProveedores = suppliers?.length || 0
  const proveedoresConContacto = suppliers?.filter(s => s.contact).length || 0
  const proveedoresConTelefono = suppliers?.filter(s => s.phone).length || 0
  const proveedoresConEmail = suppliers?.filter(s => s.email).length || 0

  return (
    <div className="flex-1 flex flex-col bg-card/70 backdrop-blur-md p-4 md:p-6 rounded-2xl shadow-inner border border-border/20">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 group">
            <Truck className="h-6 w-6 icon-inventory group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h1 className="dashboard-title">Proveedores</h1>
            <p className="dashboard-subtitle mt-1">
              {totalProveedores} proveedores • {proveedoresConContacto} con contacto • {proveedoresConTelefono} con teléfono
            </p>
          </div>
        </div>
        <Button asChild className="group w-full md:w-auto bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary transition-all duration-300 shadow-md">
          <Link href="/dashboard/suppliers/new">
            <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
            Nuevo Proveedor
          </Link>
        </Button>
      </div>

      {/* Stats Cards Premium */}
      <div className="grid gap-4 md:gap-5 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard 
          title="Total Proveedores" 
          value={totalProveedores} 
          icon={<Truck className="h-5 w-5" />} 
          variant="primary"
          subtitle="Registros activos"
        />
        <StatCard 
          title="Con Contacto" 
          value={proveedoresConContacto} 
          icon={<Package className="h-5 w-5" />} 
          subtitle="Persona de contacto"
        />
        <StatCard 
          title="Con Email" 
          value={proveedoresConEmail} 
          icon={<Mail className="h-5 w-5" />} 
          variant="accent"
          subtitle="Correo electrónico"
        />
        <StatCard 
          title="Con Teléfono" 
          value={proveedoresConTelefono} 
          icon={<Phone className="h-5 w-5" />} 
          subtitle="Línea directa"
        />
      </div>

      {/* Tabla o Estado Vacío Premium */}
      {suppliers && suppliers.length > 0 ? (
        <div className="card-dashboard p-0 overflow-hidden">
          <SuppliersTable suppliers={suppliers} />
        </div>
      ) : (
        <div className="card-dashboard p-12 flex items-center justify-center">
          <div className="text-center max-w-sm group">
            <Truck className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4 transition-all duration-300 group-hover:scale-110" />
            <p className="text-lg font-medium text-muted-foreground mb-1">
              No hay proveedores registrados
            </p>
            <p className="text-sm text-muted-foreground/70">
              Crea tu primer proveedor para gestionar tus compras
            </p>
            <Button asChild className="mt-4 group bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary">
              <Link href="/dashboard/suppliers/new">
                <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
                Agregar Proveedor
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}