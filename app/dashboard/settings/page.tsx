// app/dashboard/settings/page.tsx
import { getUserPermissions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { UserManagement } from "@/components/user-management"
import { CompanySettingsForm } from "@/components/CompanySettingsForm"
import {
  ShieldCheck, User, Settings, Mail, Key, Calendar, Lock, Building2, CheckCircle2, XCircle,
  ShoppingCart, BarChart2, Megaphone, Package, FolderTree, TrendingUp, Truck,
  PiggyBank, Users, DollarSign, CreditCard, Layers, ClipboardList,
} from "lucide-react"
import { redirect } from "next/navigation"
import {
  PERMISSIONS_BY_GROUP, GROUP_LABELS, PERMISSION_KEYS,
  normalizePermissions,
} from "@/lib/permissions"

const ICONS: Record<string, any> = {
  ShoppingCart, BarChart2, Megaphone, Package, FolderTree, TrendingUp, Truck,
  PiggyBank, Users, DollarSign, CreditCard, Layers, ClipboardList, Settings,
}

const ROLE_CONFIG: Record<string, { label: string; cls: string }> = {
  admin:    { label: "Administrador", cls: "role-admin" },
  gerente:  { label: "Gerente",       cls: "role-gerente" },
  vendedor: { label: "Vendedor",      cls: "role-vendedor" },
}

const pageCSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
.cfg {
  font-family:'DM Sans',sans-serif;
  --p:var(--primary,#984ca8);
  --p10:rgba(var(--primary-rgb,152,76,168),.10);
  --p20:rgba(var(--primary-rgb,152,76,168),.20);
  --txt:#1a1a18;
  --muted:rgba(26,26,24,.45);
  --border:rgba(26,26,24,.08);
  --row:rgba(26,26,24,.02);
  --ok:#16a34a;
}
.cfg-hd { display:flex; flex-direction:column; gap:14px; padding-bottom:20px; border-bottom:1px solid var(--border); margin-bottom:22px; }
.cfg-title { font-family:'Cormorant Garamond',Georgia,serif; font-size:22px; font-weight:400; color:var(--txt); margin:0; display:flex; align-items:center; gap:10px; }
.cfg-dot { width:8px; height:8px; background:var(--p); flex-shrink:0; }
.cfg-sub { font-size:12px; color:var(--muted); margin:3px 0 0; }
.cfg-grid { display:grid; gap:16px; grid-template-columns:1fr; }
@media(min-width:768px){ .cfg-grid{ grid-template-columns:1fr 1fr; } }
.cfg-card { background:#fff; border:1px solid var(--border); overflow:hidden; }
.cfg-card.full { grid-column:1/-1; }
.cfg-card-hd { padding:14px 18px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:8px; }
.cfg-card-ico { width:26px; height:26px; background:var(--p10); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.cfg-card-ico svg { color:var(--p); width:12px; height:12px; }
.cfg-card-title { font-size:11px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--txt); margin:0; }
.cfg-card-badge { margin-left:auto; padding:2px 9px; font-size:8px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; border:1px solid var(--p); color:var(--p); background:var(--p10); }
.cfg-card-body { padding:18px; }

.cfg-row { display:flex; align-items:center; justify-content:space-between; padding:11px 0; border-bottom:1px solid var(--border); }
.cfg-row:last-child { border-bottom:none; }
.cfg-row-lbl { font-size:9px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:var(--muted); }
.cfg-row-val { display:flex; align-items:center; gap:6px; font-size:12px; font-weight:500; color:var(--txt); }
.cfg-row-val svg { width:11px; height:11px; color:var(--muted); }
.cfg-mono { font-family:monospace; font-size:10px; color:var(--muted); background:var(--row); padding:2px 8px; border:1px solid var(--border); }

.cfg-role { padding:2px 10px; font-size:9px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; }
.role-admin    { background:var(--p10); color:var(--p); border:1px solid var(--p20); }
.role-gerente  { background:rgba(217,119,6,.09); color:#d97706; border:1px solid rgba(217,119,6,.2); }
.role-vendedor { background:rgba(22,163,74,.09); color:#16a34a; border:1px solid rgba(22,163,74,.2); }

.cfg-active { padding:2px 9px; font-size:9px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; background:rgba(22,163,74,.1); color:#16a34a; border:1px solid rgba(22,163,74,.2); }
.cfg-version { padding:2px 9px; font-family:monospace; font-size:9px; background:var(--row); border:1px solid var(--border); color:var(--muted); }
.cfg-env { padding:2px 9px; font-size:9px; font-weight:700; text-transform:uppercase; background:rgba(26,26,24,.06); border:1px solid var(--border); color:var(--muted); }

/* ── Permisos agrupados (vista lectura para no-admins) ── */
.cfg-perms-bar {
  display:flex; align-items:center; justify-content:space-between;
  background:var(--row); border:1px solid var(--border);
  padding:9px 13px; margin-bottom:12px;
}
.cfg-perms-bar-lbl { font-size:9px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:var(--muted); }
.cfg-perms-bar-cnt {
  font-family:'Cormorant Garamond',serif; font-size:18px; font-weight:500; color:var(--p);
}
.cfg-group { background:#fff; border:1px solid var(--border); margin-bottom:10px; }
.cfg-group-hd {
  display:flex; align-items:center; gap:8px; padding:9px 12px;
  background:var(--row); border-bottom:1px solid var(--border);
}
.cfg-group-name {
  font-size:9px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:var(--p);
}
.cfg-group-cnt { font-size:9px; color:var(--muted); padding:1px 7px; background:#fff; border:1px solid var(--border); }

.cfg-perm-grid { display:grid; gap:6px; padding:10px; grid-template-columns:1fr 1fr; }
@media(max-width:540px){ .cfg-perm-grid{ grid-template-columns:1fr; } }

.cfg-perm-row {
  display:flex; align-items:center; gap:9px;
  padding:8px 10px; border:1px solid var(--border); background:#fff;
}
.cfg-perm-row.on  { border-color:var(--p20); background:var(--p10); }
.cfg-perm-row.off { opacity:.55; }
.cfg-perm-ico-wrap {
  width:24px; height:24px; flex-shrink:0;
  background:var(--row); display:flex; align-items:center; justify-content:center;
  color:var(--muted);
}
.cfg-perm-row.on .cfg-perm-ico-wrap { background:var(--p20); color:var(--p); }
.cfg-perm-ico-wrap svg { width:12px; height:12px; }
.cfg-perm-info { flex:1; min-width:0; }
.cfg-perm-name { font-size:11px; font-weight:600; color:var(--txt); margin:0; }
.cfg-perm-row.on .cfg-perm-name { color:var(--p); }
.cfg-perm-hint { font-size:9px; color:var(--muted); margin:2px 0 0; line-height:1.35; }
.cfg-perm-check svg { width:14px; height:14px; }
.cfg-perm-row.on  .cfg-perm-check svg { color:var(--ok); }
.cfg-perm-row.off .cfg-perm-check svg { color:rgba(26,26,24,.20); }
`

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
  const perms = normalizePermissions(permissions?.permissions || {})
  const activeCount = Object.values(perms).filter(Boolean).length
  const totalCount  = PERMISSION_KEYS.length

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

          {/* ── Empresa ── */}
          <div className="cfg-card full">
            <div className="cfg-card-hd">
              <div className="cfg-card-ico" aria-hidden><Building2 /></div>
              <span className="cfg-card-title">Información de la Empresa</span>
              {isAdmin && <span className="cfg-card-badge">Solo admins</span>}
            </div>
            <div className="cfg-card-body">
              {company
                ? <CompanySettingsForm company={company} isAdmin={isAdmin} />
                : <p style={{ fontSize: 12, color: "rgba(26,26,24,.45)" }}>No se encontró información de la empresa.</p>
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
                  {new Date(user?.last_sign_in_at || Date.now()).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </div>
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
                <span className="cfg-row-val" style={{ textTransform: "capitalize" }}>
                  {user?.app_metadata?.provider || "email"}
                </span>
              </div>
              <div className="cfg-row">
                <span className="cfg-row-lbl">Cuenta creada</span>
                <span className="cfg-row-val">
                  <Calendar />
                  {new Date(user?.created_at || Date.now()).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>

          {/* ── Permisos del Sistema (ancho completo cuando admin) ── */}
          <div className={`cfg-card ${isAdmin ? "full" : ""}`}>
            <div className="cfg-card-hd">
              <div className="cfg-card-ico" aria-hidden><ShieldCheck /></div>
              <span className="cfg-card-title">
                {isAdmin ? "Gestión de Permisos por Usuario" : "Mis Permisos"}
              </span>
              {isAdmin && <span className="cfg-card-badge">Admin</span>}
            </div>
            <div className="cfg-card-body">
              {isAdmin ? (
                <UserManagement />
              ) : (
                <>
                  <div className="cfg-perms-bar">
                    <span className="cfg-perms-bar-lbl">Permisos activos</span>
                    <span className="cfg-perms-bar-cnt">{activeCount} / {totalCount}</span>
                  </div>

                  {(Object.keys(PERMISSIONS_BY_GROUP) as Array<keyof typeof PERMISSIONS_BY_GROUP>).map(grpKey => {
                    const grp = PERMISSIONS_BY_GROUP[grpKey]
                    const onCount = grp.filter(p => perms[p.key]).length
                    return (
                      <div key={grpKey} className="cfg-group">
                        <div className="cfg-group-hd">
                          <span className="cfg-group-name">{GROUP_LABELS[grpKey]}</span>
                          <span className="cfg-group-cnt">{onCount}/{grp.length}</span>
                        </div>
                        <div className="cfg-perm-grid">
                          {grp.map(p => {
                            const on = !!perms[p.key]
                            const Icon = ICONS[p.icon] || ShieldCheck
                            return (
                              <div key={p.key} className={`cfg-perm-row ${on ? "on" : "off"}`}>
                                <span className="cfg-perm-ico-wrap" aria-hidden>
                                  <Icon />
                                </span>
                                <div className="cfg-perm-info">
                                  <p className="cfg-perm-name">{p.label}</p>
                                  <p className="cfg-perm-hint">{p.hint}</p>
                                </div>
                                <span className="cfg-perm-check" aria-hidden>
                                  {on ? <CheckCircle2 /> : <XCircle />}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          </div>

          {/* ── Sistema ── */}
          {!isAdmin && (
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
          )}

          {isAdmin && (
            <div className="cfg-card full">
              <div className="cfg-card-hd">
                <div className="cfg-card-ico" aria-hidden><Settings /></div>
                <span className="cfg-card-title">Sistema</span>
              </div>
              <div className="cfg-card-body" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 0 }}>
                <div className="cfg-row" style={{ borderBottom: "none", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
                  <span className="cfg-row-lbl">Versión</span>
                  <span className="cfg-version">v1.0.0-multiempresa</span>
                </div>
                <div className="cfg-row" style={{ borderBottom: "none", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
                  <span className="cfg-row-lbl">Entorno</span>
                  <span className="cfg-env">{process.env.NODE_ENV || "development"}</span>
                </div>
                <div className="cfg-row" style={{ borderBottom: "none", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
                  <span className="cfg-row-lbl">Empresa activa</span>
                  <span className="cfg-mono">{companyId.slice(0, 8)}…</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
