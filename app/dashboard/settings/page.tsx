import { requireAuth, getUserPermissions } from "@/lib/auth"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserManagement } from "@/components/user-management"
import { ShieldCheck, User, Settings, Mail, Key, Calendar, Lock } from "lucide-react"
import { redirect } from "next/navigation"

export default async function SettingsPage() {
  // ✅ VALIDAR PERMISOS AL INICIO
  const permissions = await getUserPermissions()
  if (!permissions?.permissions?.configuracion) {
    redirect("/dashboard")
  }

  const user = await requireAuth()

  return (
    <div className="dashboard-page-container">
      {/* Header */}
      <div className="dashboard-toolbar">
        <div className="dashboard-header">
          <h1 className="dashboard-title">
            <Settings className="dashboard-title-icon" />
            Configuración
          </h1>
          <p className="dashboard-subtitle">
            Información de cuenta, permisos y seguridad
          </p>
        </div>
      </div>

      {/* Grid de Cards */}
      <div className="grid gap-5 md:grid-cols-2 animate-fadeIn">
        {/* Información de Usuario */}
        <Card className="card">
          <CardHeader className="card-header">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle className="card-title">Información de Usuario</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border/40">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Email</span>
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium text-sm text-foreground">{user.email}</span>
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/40">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Rol</span>
              <Badge variant="outline" className="capitalize text-xs font-semibold bg-secondary/20">
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
        <Card className="card">
          <CardHeader className="card-header">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle className="card-title">Permisos del Sistema</CardTitle>
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
        <Card className="card">
          <CardHeader className="card-header">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <CardTitle className="card-title">Seguridad de la Cuenta</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border/40">
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
              <Badge variant="default" className="text-xs font-semibold bg-primary/10 text-primary">
                Activo
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Información del Sistema */}
        <Card className="card">
          <CardHeader className="card-header">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle className="card-title">Información del Sistema</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border/40">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Versión</span>
              <Badge variant="outline" className="font-mono text-xs bg-secondary/20">
                v1.0.0-premium
              </Badge>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Entorno</span>
              <Badge variant="secondary" className="text-xs font-semibold capitalize bg-accent/10 text-accent-foreground">
                {process.env.NODE_ENV || "development"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
