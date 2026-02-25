"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { showError, showSuccess, showConfirm } from "@/lib/sweetalert"
import {
  Users, Shield, ChevronDown, Check, X, Edit,
  CheckCircle2, XCircle, RefreshCw,
} from "lucide-react"

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
.um {
  font-family:'DM Sans',sans-serif;
  --p:      var(--primary,#984ca8);
  --p10:    rgba(var(--primary-rgb,152,76,168),.10);
  --p20:    rgba(var(--primary-rgb,152,76,168),.20);
  --txt:    #1a1a18;
  --muted:  rgba(26,26,24,.45);
  --border: rgba(26,26,24,.08);
  --row:    rgba(26,26,24,.02);
  --ok:     #16a34a;
  --warn:   #d97706;
  --danger: #dc2626;
}

/* ── Header del panel ── */
.um-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
.um-count  { font-size:11px; color:var(--muted); }
.um-refresh {
  width:30px; height:30px; border:1px solid var(--border); background:#fff; cursor:pointer;
  display:flex; align-items:center; justify-content:center; color:var(--muted);
  transition:border-color .14s, color .14s;
}
.um-refresh:hover { border-color:var(--p); color:var(--p); }
.um-refresh svg   { width:12px; height:12px; }
.um-refresh.spin svg { animation:umSpin .7s linear infinite; }
@keyframes umSpin { to{ transform:rotate(360deg); } }

/* ── Lista de usuarios ── */
.um-list { display:flex; flex-direction:column; gap:8px; }

/* Card de usuario */
.um-user { border:1px solid var(--border); background:#fff; overflow:hidden; }
.um-user-hd {
  display:flex; align-items:center; gap:10px; padding:11px 13px;
  cursor:pointer; transition:background .1s;
}
.um-user-hd:hover { background:var(--row); }
.um-avatar {
  width:32px; height:32px; background:var(--p10); flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
  font-size:12px; font-weight:700; color:var(--p); text-transform:uppercase;
}
.um-user-info { flex:1; min-width:0; }
.um-user-email { font-size:12px; font-weight:500; color:var(--txt); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.um-user-meta  { display:flex; align-items:center; gap:6px; margin-top:2px; }
.um-role-badge { padding:1px 8px; font-size:8px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; }
.role-admin    { background:var(--p10); color:var(--p); border:1px solid var(--p20); }
.role-gerente  { background:rgba(217,119,6,.09); color:#d97706; border:1px solid rgba(217,119,6,.2); }
.role-vendedor { background:rgba(22,163,74,.09); color:#16a34a; border:1px solid rgba(22,163,74,.2); }
.um-expand-ico { width:14px; height:14px; color:var(--muted); flex-shrink:0; transition:transform .2s; }
.um-expand-ico.open { transform:rotate(180deg); }

/* Panel expandido */
.um-panel { border-top:1px solid var(--border); padding:14px; background:var(--row); }
.um-panel-title { font-size:9px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:var(--muted); margin-bottom:10px; }

/* Selector de rol */
.um-role-wrap { margin-bottom:14px; }
.um-role-lbl  { font-size:9px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:var(--muted); margin-bottom:5px; }
.um-sel { position:relative; max-width:220px; }
.um-sel-btn {
  width:100%; height:38px; padding:0 34px 0 12px;
  border:1px solid var(--border); background:#fff; cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:12px; color:var(--txt);
  display:flex; align-items:center; outline:none;
  transition:border-color .14s;
}
.um-sel-btn:focus { border-color:var(--p); }
.um-sel-chev { position:absolute; right:10px; top:50%; transform:translateY(-50%); color:var(--muted); pointer-events:none; width:12px; height:12px; transition:transform .14s; }
.um-sel-chev.open { transform:translateY(-50%) rotate(180deg); }
.um-sel-dd {
  position:absolute; top:calc(100% + 3px); left:0; right:0;
  background:#fff; border:1px solid var(--border);
  box-shadow:0 8px 20px rgba(26,26,24,.08); z-index:50;
}
.um-sel-opt {
  padding:9px 12px; font-size:12px; color:var(--txt); cursor:pointer;
  display:flex; align-items:center; justify-content:space-between; min-height:36px;
  transition:background .1s;
}
.um-sel-opt:hover { background:var(--p10); }
.um-sel-opt.s     { color:var(--p); font-weight:600; }
.um-sel-opt svg   { width:11px; height:11px; }

/* Permisos grid */
.um-perms-grid { display:grid; gap:5px; grid-template-columns:1fr 1fr; }
@media(max-width:400px){ .um-perms-grid{ grid-template-columns:1fr; } }
.um-perm-toggle {
  display:flex; align-items:center; justify-content:space-between;
  padding:7px 10px; border:1px solid var(--border); background:#fff; cursor:pointer;
  transition:border-color .14s, background .14s;
}
.um-perm-toggle:hover { border-color:var(--p); }
.um-perm-toggle.on  { border-color:var(--p20); background:var(--p10); }
.um-perm-toggle.off { opacity:.65; }
.um-perm-name { font-size:11px; font-weight:500; color:var(--txt); }
.um-perm-toggle.on .um-perm-name { color:var(--p); }
.um-perm-ico svg { width:12px; height:12px; }
.um-perm-ico.on  svg { color:var(--p); }
.um-perm-ico.off svg { color:var(--muted); }

/* Pie del panel */
.um-panel-foot { display:flex; gap:8px; justify-content:flex-end; margin-top:14px; border-top:1px solid var(--border); padding-top:12px; }
.um-btn-save {
  height:36px; padding:0 18px; border:none; background:var(--p); cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:11px; font-weight:600;
  letter-spacing:.07em; text-transform:uppercase; color:#fff;
  display:flex; align-items:center; gap:5px; transition:opacity .14s;
}
.um-btn-save:hover:not(:disabled) { opacity:.88; }
.um-btn-save:disabled { opacity:.4; cursor:not-allowed; }
.um-spin { width:11px; height:11px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:umSpin .7s linear infinite; }

/* Vacío */
.um-empty { display:flex; flex-direction:column; align-items:center; gap:8px; padding:32px 20px; text-align:center; }
.um-empty svg { color:var(--p); opacity:.25; width:28px; height:28px; }
.um-empty-t { font-size:12px; font-weight:500; color:var(--txt); margin:0; }
`

// ── Constantes ────────────────────────────────────────────────────────────────
const PERMISSION_LABELS: Record<string, string> = {
  productos:     "Productos",
  inventario:    "Inventario",
  ventas:        "Ventas / POS",
  clientes:      "Clientes",
  proveedores:   "Proveedores",
  categorias:    "Categorías",
  gastos:        "Gastos",
  reportes:      "Reportes",
  rentabilidad:  "Rentabilidad",
  configuracion: "Configuración",
}

const ROLES = ["admin", "gerente", "vendedor"] as const
const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador", gerente: "Gerente", vendedor: "Vendedor",
}
const ROLE_CLS: Record<string, string> = {
  admin: "role-admin", gerente: "role-gerente", vendedor: "role-vendedor",
}

type User = {
  id:          string
  user_id:     string
  email:       string
  role:        string
  permissions: Record<string, boolean>
}

// ── RoleSelect — sin Radix ────────────────────────────────────────────────────
function RoleSelect({ value, onChange, disabled }: {
  value: string; onChange: (v: string) => void; disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const id = setTimeout(() => document.addEventListener("mousedown", h), 10)
    return () => { clearTimeout(id); document.removeEventListener("mousedown", h) }
  }, [open])

  return (
    <div className="um-sel" ref={ref}>
      <button type="button" className="um-sel-btn"
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled} aria-haspopup="listbox" aria-expanded={open}>
        {ROLE_LABELS[value] || value}
      </button>
      <ChevronDown className={`um-sel-chev${open ? " open" : ""}`} aria-hidden />
      {open && (
        <div className="um-sel-dd" role="listbox">
          {ROLES.map(r => (
            <div key={r}
              className={`um-sel-opt${value === r ? " s" : ""}`}
              role="option" aria-selected={value === r}
              onClick={() => { onChange(r); setOpen(false) }}>
              {ROLE_LABELS[r]}
              {value === r && <Check aria-hidden />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── UserManagement ────────────────────────────────────────────────────────────
export function UserManagement() {
  const [users, setUsers]     = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [drafts, setDrafts]   = useState<Record<string, { role:string; permissions:Record<string,boolean> }>>({})

  const load = async () => {
    setLoading(true)
    const { data, error } = await createClient()
      .from("user_permissions_with_email")
      .select("id, user_id, email, role, permissions")
      .order("email")
    if (error) showError(error.message)
    else setUsers(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Inicializar borrador cuando se expande un usuario
  const handleExpand = (u: User) => {
    const id = u.id
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    if (!drafts[id]) {
      setDrafts(d => ({
        ...d,
        [id]: { role: u.role, permissions: { ...u.permissions } },
      }))
    }
  }

  const setDraftRole = (id: string, role: string) =>
    setDrafts(d => ({ ...d, [id]: { ...d[id], role } }))

  const togglePerm = (id: string, key: string) =>
    setDrafts(d => ({
      ...d,
      [id]: {
        ...d[id],
        permissions: { ...d[id].permissions, [key]: !d[id].permissions?.[key] },
      },
    }))

  const handleSave = async (u: User) => {
    const draft = drafts[u.id]
    if (!draft) return
    setSaving(u.id)
    try {
      const { error } = await createClient()
        .from("user_permissions")
        .update({ role: draft.role, permissions: draft.permissions })
        .eq("id", u.id)
      if (error) throw error
      await showSuccess(`Permisos de ${u.email} actualizados`)
      setUsers(us => us.map(x => x.id === u.id
        ? { ...x, role: draft.role, permissions: draft.permissions }
        : x
      ))
      setExpanded(null)
    } catch (err: any) {
      showError(err.message || "Error al guardar")
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="um" style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:32 }}>
          <div style={{ width:18, height:18, border:"2px solid rgba(26,26,24,.15)", borderTopColor:"var(--primary,#984ca8)", borderRadius:"50%", animation:"umSpin .7s linear infinite" }} />
        </div>
      </>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="um">
        <div className="um-header">
          <span className="um-count">{users.length} usuario{users.length !== 1 ? "s" : ""} en esta empresa</span>
          <button className={`um-refresh${loading ? " spin" : ""}`} onClick={load} aria-label="Recargar usuarios">
            <RefreshCw aria-hidden />
          </button>
        </div>

        {users.length === 0 ? (
          <div className="um-empty">
            <Users aria-hidden />
            <p className="um-empty-t">No hay usuarios registrados</p>
          </div>
        ) : (
          <div className="um-list">
            {users.map(u => {
              const isOpen  = expanded === u.id
              const draft   = drafts[u.id]
              const isSaving= saving === u.id

              return (
                <div key={u.id} className="um-user">
                  {/* Cabecera del usuario */}
                  <div className="um-user-hd" onClick={() => handleExpand(u)}>
                    <div className="um-avatar" aria-hidden>
                      {u.email?.charAt(0) || "?"}
                    </div>
                    <div className="um-user-info">
                      <div className="um-user-email">{u.email}</div>
                      <div className="um-user-meta">
                        <span className={`um-role-badge ${ROLE_CLS[u.role] || "role-vendedor"}`}>
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </div>
                    </div>
                    <ChevronDown className={`um-expand-ico${isOpen ? " open" : ""}`} aria-hidden />
                  </div>

                  {/* Panel de edición */}
                  {isOpen && draft && (
                    <div className="um-panel">
                      {/* Rol */}
                      <div className="um-role-wrap">
                        <div className="um-role-lbl">Rol del usuario</div>
                        <RoleSelect
                          value={draft.role}
                          onChange={v => setDraftRole(u.id, v)}
                          disabled={isSaving}
                        />
                      </div>

                      {/* Permisos */}
                      <div className="um-panel-title">Permisos de acceso</div>
                      <div className="um-perms-grid">
                        {Object.entries(PERMISSION_LABELS).map(([key, label]) => {
                          const on = !!draft.permissions?.[key]
                          return (
                            <button
                              key={key}
                              type="button"
                              className={`um-perm-toggle ${on ? "on" : "off"}`}
                              onClick={() => togglePerm(u.id, key)}
                              disabled={isSaving}
                            >
                              <span className="um-perm-name">{label}</span>
                              <span className={`um-perm-ico ${on ? "on" : "off"}`}>
                                {on ? <CheckCircle2 aria-hidden /> : <XCircle aria-hidden />}
                              </span>
                            </button>
                          )
                        })}
                      </div>

                      {/* Footer */}
                      <div className="um-panel-foot">
                        <button type="button" className="um-btn-save"
                          onClick={() => handleSave(u)} disabled={isSaving}>
                          {isSaving
                            ? <><div className="um-spin" />Guardando…</>
                            : <><Shield size={11} aria-hidden />Guardar permisos</>}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
