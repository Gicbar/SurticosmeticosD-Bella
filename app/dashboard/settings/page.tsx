import { getUserPermissions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserManagement } from "@/components/user-management"
import { CompanySettingsForm } from "@/components/CompanySettingsForm"
import {
  ShieldCheck, User, Settings, Mail, Key, Calendar,
  Lock, Building2, Phone, Globe, Hash, CheckCircle2, XCircle,
} from "lucide-react"
import { redirect } from "next/navigation"

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PERMISSION_LABELS: Record<string, string> = {
  productos:      "Productos",
  inventario:     "Inventario",
  ventas:         "Ventas / POS",
  clientes:       "Clientes",
  proveedores:    "Proveedores",
  categorias:     "Categorías",
  gastos:         "Gastos",
  reportes:       "Reportes",
  rentabilidad:   "Rentabilidad",
  configuracion:  "Configuración",
}

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  admin:    { label: "Administrador", color: "bg-primary/10 text-primary border-primary/20" },
  gerente:  { label: "Gerente",       color: "bg-chart-4/10 text-chart-4 border-chart-4/20" },
  vendedor: { label: "Vendedor",      color: "bg-chart-2/10 text-chart-2 border-chart-2/20" },
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default async function SettingsPage() {
  // ── 1. Permisos + company_id ──────────────────────────────────────────────
  const permissions = await getUserPermissions()

  if (!permissions?.permissions?.configuracion) {
    redirect("/dashboard")
  }

  const companyId = permissions.company_id
  if (!companyId) redirect("/auth/sin-empresa")

  // ── 2. Datos de la empresa ────────────────────────────────────────────────
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: company } = await supabase
    .from("companies")
    .select("id, name, slug, domain, phone, created_at")
    .eq("id", companyId)
    .single()


  const isAdmin = permissions?.role === "admin"
  const roleConfig = ROLE_CONFIG[permissions?.role] || ROLE_CONFIG.vendedor
  const permissionsObj: Record<string, boolean> = permissions?.permissions || {}

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
            Cuenta, empresa y permisos del sistema
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 animate-fadeIn">

        {/* ── Información de la Empresa ─────────────────────────────────── */}
        <Card className="card md:col-span-2">
          <CardHeader className="card-header">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle className="card-title">Información de la Empresa</CardTitle>
              {isAdmin && (
                <Badge variant="outline" className="ml-auto text-[10px] font-medium text-primary border-primary/30">
                  Solo admins pueden editar
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {company ? (
              <CompanySettingsForm company={company} isAdmin={isAdmin} />
            ) : (
              <p className="text-sm text-muted-foreground">No se encontró información de la empresa.</p>
            )}
          </CardContent>
        </Card>

        {/* ── Información del Usuario ───────────────────────────────────── */}
        <Card className="card">
          <CardHeader className="card-header">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle className="card-title">Mi Cuenta</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-1">
            <div className="flex justify-between items-center py-3 border-b border-border/40">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Email</span>
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium text-sm">{user?.email}</span>
              </div>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-border/40">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Rol</span>
              <Badge className={`text-xs font-semibold border ${roleConfig.color}`}>
                {roleConfig.label}
              </Badge>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-border/40">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">ID de Usuario</span>
              <div className="flex items-center gap-2">
                <Key className="h-3 w-3 text-muted-foreground" />
                <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {user?.id.slice(0, 12)}...
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center py-3">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Último acceso</span>
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium text-sm">
                  {new Date(user?.last_sign_in_at || Date.now()).toLocaleDateString("es-ES", {
                    day: "2-digit", month: "short", year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Permisos del Sistema ──────────────────────────────────────── */}
        <Card className="card">
          <CardHeader className="card-header">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle className="card-title">Permisos del Sistema</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isAdmin ? (
              /* Admin ve gestión de usuarios */
              <UserManagement />
            ) : (
              <div className="space-y-2">
                {Object.entries(PERMISSION_LABELS).map(([key, label]) => {
                  const hasPermission = !!permissionsObj[key]
                  return (
                    <div
                      key={key}
                      className={`flex items-center justify-between py-2 px-3 rounded-lg border ${
                        hasPermission
                          ? "bg-primary/5 border-primary/10"
                          : "bg-muted/30 border-border/30 opacity-60"
                      }`}
                    >
                      <span className="text-sm font-medium">{label}</span>
                      {hasPermission ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Seguridad ────────────────────────────────────────────────── */}
        <Card className="card">
          <CardHeader className="card-header">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <CardTitle className="card-title">Seguridad</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-1">
            <div className="flex justify-between items-center py-3 border-b border-border/40">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Estado de sesión</span>
              <Badge className="text-xs font-semibold bg-primary/10 text-primary border-primary/20">
                ● Activa
              </Badge>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-border/40">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Proveedor</span>
              <span className="font-medium text-sm capitalize">
                {user?.app_metadata?.provider || "email"}
              </span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Cuenta creada</span>
              <span className="font-medium text-sm">
                {new Date(user?.created_at || Date.now()).toLocaleDateString("es-ES", {
                  day: "2-digit", month: "short", year: "numeric",
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* ── Sistema ──────────────────────────────────────────────────── */}
        <Card className="card">
          <CardHeader className="card-header">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle className="card-title">Sistema</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-1">
            <div className="flex justify-between items-center py-3 border-b border-border/40">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Versión</span>
              <Badge variant="outline" className="font-mono text-xs bg-secondary/20">
                v1.0.0-multiempresa
              </Badge>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-border/40">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Entorno</span>
              <Badge variant="secondary" className="text-xs font-semibold capitalize">
                {process.env.NODE_ENV || "development"}
              </Badge>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Empresa activa</span>
              <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {companyId.slice(0, 8)}...
              </span>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
