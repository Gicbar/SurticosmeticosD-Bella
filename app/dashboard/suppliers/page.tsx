import { requireAuth,getUserPermissions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Plus, Truck, Package, Phone, Mail } from "lucide-react"
import { SuppliersTable } from "@/components/suppliers-table"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
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

  // ✅ COMPONENTE STATCARD
function StatCard({
  title,
  value,
  icon,
  variant = "default",
  subtitle = null
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  variant?: "default" | "primary" | "accent"
  subtitle?: string | null
}) {
  const variants = {
    default: "text-muted-foreground",
    primary: "text-primary",
    accent: "text-chart-4",
  };

  return (
    <Card className="card group hover:shadow-md transition-shadow">
      <CardHeader className="card-header flex flex-row items-center justify-between pb-2">
        <CardTitle className="card-title text-xs uppercase tracking-wide text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`h-5 w-5 ${variants[variant]} group-hover:scale-110 transition-transform duration-200`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-xl md:text-2xl font-bold text-foreground">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("*")
    .order("name", { ascending: true })

  const totalProveedores = suppliers?.length || 0
  const proveedoresConContacto = suppliers?.filter(s => s.contact).length || 0
  const proveedoresConTelefono = suppliers?.filter(s => s.phone).length || 0
  const proveedoresConEmail = suppliers?.filter(s => s.email).length || 0

  return (
    <div className="dashboard-page-container">
      {/* Header Premium */}
      <div className="dashboard-toolbar">
        <div className="dashboard-header">
          <h1 className="dashboard-title">
            <Truck className="dashboard-title-icon" />
            Proveedores
          </h1>
          <p className="dashboard-subtitle">
            {totalProveedores} proveedores • {proveedoresConContacto} con contacto • {proveedoresConTelefono} con teléfono
          </p>
        </div>
        <Button asChild className="btn-action-new">
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