import { requireAuth, getUserPermissions } from "@/lib/auth"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserManagement } from "@/components/user-management"
import { ShieldCheck, User, Settings, Mail, Key, Calendar, Lock } from "lucide-react"
import { redirect } from "next/navigation" 

export default async function SettingsPage() {
  // ✅ VALIDAR PERMISOS AL INICIO
  const permissions = await getUserPermissions()
    // Verificar si existe el permiso rentabilidad y es true
  if (!permissions?.permissions?.configuracion) {
    redirect("/dashboard") // Redirige si no tiene permiso
  }
  const user = await requireAuth()

  return (
    <div className="flex-1 flex flex-col bg-card/70 backdrop-blur-md p-4 md:p-6 rounded-2xl shadow-inner border border-border/20">
      {/* Header Premium */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
        <div className="p-2 rounded-lg bg-primary/10 group">
          <Settings className="h-6 w-6 icon-inventory group-hover:scale-110 transition-transform" />
        </div>
        <div>
          <h1 className="dashboard-title">Configuración</h1>
          <p className="dashboard-subtitle mt-1">
            Información de cuenta, permisos y seguridad
          </p>
        </div>
      </div>

      {/* Grid de Cards Premium */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Información de Usuario */}
        <Card className="card-dashboard group">
          <CardHeader className="card-header-dashboard">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle className="card-title-dashboard">Información de Usuario</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Email</span>
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium text-sm text-foreground">{user.email}</span>
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Rol</span>
              <Badge variant="outline" className="capitalize text-xs font-semibold">
                {permissions?.role || "Usuario"}
              </Badge>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">ID de Usuario</span>
              <div className="flex items-center gap-2">
                <Key className="h-3 w-3 text-muted-foreground" />
                <span className="font-mono text-xs text-muted-foreground">
                  {user.id.slice(0, 8)}...
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Permisos del Sistema */}
        <Card className="card-dashboard group">
          <CardHeader className="card-header-dashboard">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle className="card-title-dashboard">Permisos del Sistema {permissions?.role}</CardTitle>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            {permissions?.role === "admin" ? (
              <UserManagement />
            ) : (
              <div className="space-y-4">
                {permissions?.role === "gerente" && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-chart-4/10 border border-chart-4/20">
                    <Badge variant="secondary" className="bg-chart-4 text-chart-4-foreground">Gerente</Badge>
                    <div>
                      <p className="text-sm font-medium text-foreground">Acceso a reportes y gestión</p>
                      <p className="text-xs text-muted-foreground">Ventas, inventario y rentabilidad</p>
                    </div>
                  </div>
                )}
                {permissions?.role === "vendedor" && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-chart-2/10 border border-chart-2/20">
                    <Badge variant="secondary" className="bg-chart-2 text-chart-2-foreground">Vendedor</Badge>
                    <div>
                      <p className="text-sm font-medium text-foreground">Acceso al punto de venta</p>
                      <p className="text-xs text-muted-foreground">Consultas básicas y ventas</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seguridad */}
        <Card className="card-dashboard group">
          <CardHeader className="card-header-dashboard">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <CardTitle className="card-title-dashboard">Seguridad de la Cuenta</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Último acceso</span>
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium text-sm text-foreground">
                  {new Date().toLocaleDateString("es-ES", { dateStyle: "medium" })}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Estado</span>
              <Badge variant="default" className="text-xs font-semibold">
                Activo
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Información del Sistema */}
        <Card className="card-dashboard group">
          <CardHeader className="card-header-dashboard">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle className="card-title-dashboard">Información del Sistema</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Versión</span>
              <Badge variant="outline" className="font-mono text-xs">
                v1.0.0-premium
              </Badge>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Entorno</span>
              <Badge variant="secondary" className="text-xs font-semibold capitalize">
                {process.env.NODE_ENV || "development"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}