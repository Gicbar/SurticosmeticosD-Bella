// app/dashboard/settings/page.tsx
import { getUserPermissions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { UserManagement } from "@/components/user-management"
import { CompanySettingsForm } from "@/components/CompanySettingsForm"
import {
  ShieldCheck, User, Settings, Mail, Key, Calendar, Lock, Building2, CheckCircle2, XCircle,
} from "lucide-react"
import { redirect } from "next/navigation"

const PERMISSION_LABELS: Record<string, string> = {
  productos:"Productos", inventario:"Inventario", ventas:"Ventas / POS",
  clientes:"Clientes", proveedores:"Proveedores", categorias:"Categorías",
  gastos:"Gastos", reportes:"Reportes", rentabilidad:"Rentabilidad",  creditos:"Duedas Clientes", configuracion:"Configuración",
}

const ROLE_CONFIG: Record<string, { label:string; cls:string }> = {
  admin:    { label:"Administrador", cls:"role-admin" },
  gerente:  { label:"Gerente",       cls:"role-gerente" },
  vendedor: { label:"Vendedor",      cls:"role-vendedor" },
}

const pageCSS = [
  "@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');",
  ".cfg { font-family:'DM Sans',sans-serif; --p:var(--primary,#984ca8); --p10:rgba(var(--primary-rgb,152,76,168),.10); --p20:rgba(var(--primary-rgb,152,76,168),.20); --txt:#1a1a18; --muted:rgba(26,26,24,.45); --border:rgba(26,26,24,.08); --row:rgba(26,26,24,.02); --ok:#16a34a; }",
  ".cfg-hd { display:flex; flex-direction:column; gap:14px; padding-bottom:20px; border-bottom:1px solid var(--border); margin-bottom:22px; }",
  ".cfg-title { font-family:'Cormorant Garamond',Georgia,serif; font-size:22px; font-weight:400; color:var(--txt); margin:0; display:flex; align-items:center; gap:10px; }",
  ".cfg-dot { width:8px; height:8px; background:var(--p); flex-shrink:0; }",
  ".cfg-sub { font-size:12px; color:var(--muted); margin:3px 0 0; }",
  ".cfg-grid { display:grid; gap:16px; grid-template-columns:1fr; }",
  "@media(min-width:768px){ .cfg-grid{ grid-template-columns:1fr 1fr; } }",
  ".cfg-card { background:#fff; border:1px solid var(--border); overflow:hidden; }",
  ".cfg-card.full { grid-column:1/-1; }",
  ".cfg-card-hd { padding:14px 18px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:8px; }",
  ".cfg-card-ico { width:26px; height:26px; background:var(--p10); display:flex; align-items:center; justify-content:center; flex-shrink:0; }",
  ".cfg-card-ico svg { color:var(--p); width:12px; height:12px; }",
  ".cfg-card-title { font-size:11px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--txt); margin:0; }",
  ".cfg-card-badge { margin-left:auto; padding:2px 9px; font-size:8px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; border:1px solid var(--p); color:var(--p); background:var(--p10); }",
  ".cfg-card-body { padding:18px; }",
  ".cfg-row { display:flex; align-items:center; justify-content:space-between; padding:11px 0; border-bottom:1px solid var(--border); }",
  ".cfg-row:last-child { border-bottom:none; }",
  ".cfg-row-lbl { font-size:9px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:var(--muted); }",
  ".cfg-row-val { display:flex; align-items:center; gap:6px; font-size:12px; font-weight:500; color:var(--txt); }",
  ".cfg-row-val svg { width:11px; height:11px; color:var(--muted); }",
  ".cfg-mono { font-family:monospace; font-size:10px; color:var(--muted); background:var(--row); padding:2px 8px; border:1px solid var(--border); }",
  ".cfg-role { padding:2px 10px; font-size:9px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; }",
  ".role-admin   { background:var(--p10); color:var(--p); border:1px solid var(--p20); }",
  ".role-gerente { background:rgba(217,119,6,.09); color:#d97706; border:1px solid rgba(217,119,6,.2); }",
  ".role-vendedor{ background:rgba(22,163,74,.09); color:#16a34a; border:1px solid rgba(22,163,74,.2); }",
  ".cfg-active { padding:2px 9px; font-size:9px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; background:rgba(22,163,74,.1); color:#16a34a; border:1px solid rgba(22,163,74,.2); }",
  ".cfg-version { padding:2px 9px; font-family:monospace; font-size:9px; background:var(--row); border:1px solid var(--border); color:var(--muted); }",
  ".cfg-env { padding:2px 9px; font-size:9px; font-weight:700; text-transform:uppercase; background:rgba(26,26,24,.06); border:1px solid var(--border); color:var(--muted); }",
  ".cfg-perm-grid { display:flex; flex-direction:column; gap:6px; }",
  ".cfg-perm-row { display:flex; align-items:center; justify-content:space-between; padding:8px 12px; border:1px solid var(--border); }",
  ".cfg-perm-row.on { background:var(--p10); border-color:var(--p20); }",
  ".cfg-perm-row.off { opacity:.55; }",
  ".cfg-perm-name { font-size:12px; font-weight:500; color:var(--txt); }",
  ".cfg-perm-row.on .cfg-perm-name { color:var(--p); }",
  ".cfg-perm-ico svg { width:14px; height:14px; }",
  ".cfg-perm-ico.on svg { color:var(--p); }",
  ".cfg-perm-ico.off svg { color:var(--muted); }",
].join("\n")

export default async function SettingsPage() {
  const permissions = await getUserPermissions()
  if (!permissions?.permissions?.configuracion) redirect("/dashboard")
  const companyId = permissions.company_id
  if (!companyId) redirect("/auth/sin-empresa")

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: company } = await supabase
    .from("companies").select("id, name, slug, domain, phone, created_at")
    .eq("id", companyId).single()

  const isAdmin = permissions?.role === "admin"
  const roleConfig = ROLE_CONFIG[permissions?.role] || ROLE_CONFIG.vendedor
  const perms: Record<string, boolean> = permissions?.permissions || {}

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: pageCSS }} />
      <div className="cfg">
        <div className="cfg-hd">
          <div>
            <h1 className="cfg-title"><span className="cfg-dot" aria-hidden />Configuración</h1>
            <p className="cfg-sub">Cuenta, empresa y permisos del sistema</p>
          </div>
        </div>

        <div className="cfg-grid">

          {/* ── Empresa (ancho completo) ── */}
          <div className="cfg-card full">
            <div className="cfg-card-hd">
              <div className="cfg-card-ico" aria-hidden><Building2 /></div>
              <span className="cfg-card-title">Información de la Empresa</span>
              {isAdmin && <span className="cfg-card-badge">Solo admins</span>}
            </div>
            <div className="cfg-card-body">
              {company
                ? <CompanySettingsForm company={company} isAdmin={isAdmin} />
                : <p style={{ fontSize:12, color:"rgba(26,26,24,.45)" }}>No se encontró información de la empresa.</p>
              }
            </div>
          </div>

          {/* ── Mi cuenta ── */}
          <div className="cfg-card">
            <div className="cfg-card-hd">
              <div className="cfg-card-ico" aria-hidden><User /></div>
              <span className="cfg-card-title">Mi Cuenta</span>
            </div>
            <div className="cfg-card-body">
              <div className="cfg-row">
                <span className="cfg-row-lbl">Email</span>
                <span className="cfg-row-val"><Mail />{user?.email}</span>
              </div>
              <div className="cfg-row">
                <span className="cfg-row-lbl">Rol</span>
                <span className={`cfg-role ${roleConfig.cls}`}>{roleConfig.label}</span>
              </div>
              <div className="cfg-row">
                <span className="cfg-row-lbl">ID Usuario</span>
                <span className="cfg-row-val"><Key /><span className="cfg-mono">{user?.id.slice(0, 12)}…</span></span>
              </div>
              <div className="cfg-row">
                <span className="cfg-row-lbl">Último acceso</span>
                <span className="cfg-row-val">
                  <Calendar />
                  {new Date(user?.last_sign_in_at || Date.now()).toLocaleDateString("es-CO", { day:"2-digit", month:"short", year:"numeric" })}
                </span>
              </div>
            </div>
          </div>

          {/* ── Permisos ── */}
          <div className="cfg-card">
            <div className="cfg-card-hd">
              <div className="cfg-card-ico" aria-hidden><ShieldCheck /></div>
              <span className="cfg-card-title">Permisos del Sistema</span>
            </div>
            <div className="cfg-card-body">
              {isAdmin ? (
                <UserManagement />
              ) : (
                <div className="cfg-perm-grid">                  
                  {Object.entries(PERMISSION_LABELS).map(([key, label]) => {
                    const on = !!perms[key]
                    return (
                      <div key={key} className={`cfg-perm-row ${on ? "on" : "off"}`}>
                        <span className="cfg-perm-name">{label}</span>
                        <span className={`cfg-perm-ico ${on ? "on" : "off"}`}>
                          {on ? <CheckCircle2 aria-hidden /> : <XCircle aria-hidden />}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Seguridad ── */}
          <div className="cfg-card">
            <div className="cfg-card-hd">
              <div className="cfg-card-ico" aria-hidden><Lock /></div>
              <span className="cfg-card-title">Seguridad</span>
            </div>
            <div className="cfg-card-body">
              <div className="cfg-row">
                <span className="cfg-row-lbl">Estado de sesión</span>
                <span className="cfg-active">● Activa</span>
              </div>
              <div className="cfg-row">
                <span className="cfg-row-lbl">Proveedor</span>
                <span className="cfg-row-val" style={{ textTransform:"capitalize" }}>
                  {user?.app_metadata?.provider || "email"}
                </span>
              </div>
              <div className="cfg-row">
                <span className="cfg-row-lbl">Cuenta creada</span>
                <span className="cfg-row-val">
                  <Calendar />
                  {new Date(user?.created_at || Date.now()).toLocaleDateString("es-CO", { day:"2-digit", month:"short", year:"numeric" })}
                </span>
              </div>
            </div>
          </div>

          {/* ── Sistema ── */}
          <div className="cfg-card">
            <div className="cfg-card-hd">
              <div className="cfg-card-ico" aria-hidden><Settings /></div>
              <span className="cfg-card-title">Sistema</span>
            </div>
            <div className="cfg-card-body">
              <div className="cfg-row">
                <span className="cfg-row-lbl">Versión</span>
                <span className="cfg-version">v1.0.0-multiempresa</span>
              </div>
              <div className="cfg-row">
                <span className="cfg-row-lbl">Entorno</span>
                <span className="cfg-env">{process.env.NODE_ENV || "development"}</span>
              </div>
              <div className="cfg-row">
                <span className="cfg-row-lbl">Empresa activa</span>
                <span className="cfg-mono">{companyId.slice(0, 8)}…</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
