"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { showError, showSuccess } from "@/lib/sweetalert"
import {
  Users, Shield, ChevronDown, Check, RefreshCw,
  CheckCircle2, XCircle,
  ShoppingCart, BarChart2, Megaphone, Package, FolderTree, TrendingUp, Truck,
  PiggyBank, DollarSign, CreditCard, Layers, ClipboardList, Settings, Sparkles,
  ListChecks, Eraser,
} from "lucide-react"
import {
  PERMISSIONS_BY_GROUP, GROUP_LABELS, PERMISSION_KEYS, ROLE_LABELS,
  defaultPermissionsForRole, normalizePermissions,
  type PermissionKey, type Role,
} from "@/lib/permissions"

// ── Mapeo de iconos lucide por nombre (los importamos arriba para tree-shaking)
const ICONS: Record<string, any> = {
  ShoppingCart, BarChart2, Megaphone, Package, FolderTree, TrendingUp, Truck,
  PiggyBank, Users, DollarSign, CreditCard, Layers, ClipboardList, Settings,
}

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
.um-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; gap:8px; flex-wrap:wrap; }
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

/* ── Buscador rápido ── */
.um-search {
  flex:1; min-width:160px; height:32px; padding:0 12px;
  border:1px solid var(--border); background:#fff;
  font-family:'DM Sans',sans-serif; font-size:12px; color:var(--txt);
  outline:none; transition:border-color .14s;
}
.um-search:focus { border-color:var(--p); }

/* ── Lista de usuarios ── */
.um-list { display:flex; flex-direction:column; gap:8px; }

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
.um-user-meta  { display:flex; align-items:center; gap:6px; margin-top:2px; flex-wrap:wrap; }
.um-role-badge { padding:1px 8px; font-size:8px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; }
.role-admin    { background:var(--p10); color:var(--p); border:1px solid var(--p20); }
.role-gerente  { background:rgba(217,119,6,.09); color:#d97706; border:1px solid rgba(217,119,6,.2); }
.role-vendedor { background:rgba(22,163,74,.09); color:#16a34a; border:1px solid rgba(22,163,74,.2); }
.um-pcount {
  font-size:9px; color:var(--muted);
  padding:1px 7px; background:var(--row); border:1px solid var(--border);
}
.um-expand-ico { width:14px; height:14px; color:var(--muted); flex-shrink:0; transition:transform .2s; }
.um-expand-ico.open { transform:rotate(180deg); }

/* ── Panel expandido ── */
.um-panel { border-top:1px solid var(--border); padding:14px; background:var(--row); }
.um-panel-section + .um-panel-section { margin-top:16px; }

.um-panel-title {
  font-size:9px; font-weight:700; letter-spacing:.2em; text-transform:uppercase;
  color:var(--muted); margin-bottom:9px;
  display:flex; align-items:center; gap:6px;
}
.um-panel-title svg { width:11px; height:11px; }

/* ── Selector de rol ── */
.um-role-row {
  display:flex; gap:14px; align-items:flex-start; flex-wrap:wrap;
  margin-bottom:6px;
}
.um-role-wrap { min-width:200px; }
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

/* ── Quick actions ── */
.um-quick {
  display:flex; flex-wrap:wrap; gap:6px;
  padding:8px; background:#fff; border:1px solid var(--border);
}
.um-quick-lbl {
  font-size:9px; font-weight:700; letter-spacing:.18em; text-transform:uppercase;
  color:var(--muted); padding:5px 8px 5px 4px; align-self:center;
  display:flex; align-items:center; gap:5px;
}
.um-quick-lbl svg { width:11px; height:11px; }
.um-quick-btn {
  display:inline-flex; align-items:center; gap:5px;
  height:28px; padding:0 11px; border:1px solid var(--border); background:#fff;
  font-family:'DM Sans',sans-serif; font-size:10px; font-weight:600;
  letter-spacing:.06em; text-transform:uppercase; color:rgba(26,26,24,.65);
  cursor:pointer; transition:all .12s;
}
.um-quick-btn:hover { border-color:var(--p); color:var(--p); }
.um-quick-btn svg { width:10px; height:10px; }
.um-quick-btn.on { background:var(--p10); border-color:var(--p20); color:var(--p); }

/* ── Permisos agrupados ── */
.um-group { background:#fff; border:1px solid var(--border); margin-top:8px; }
.um-group-hd {
  display:flex; align-items:center; gap:10px;
  padding:9px 12px; background:var(--row);
  border-bottom:1px solid var(--border);
}
.um-group-hd-name {
  font-size:9px; font-weight:700; letter-spacing:.2em; text-transform:uppercase;
  color:var(--p);
}
.um-group-hd-cnt {
  font-size:9px; color:var(--muted);
  padding:1px 7px; background:#fff; border:1px solid var(--border);
}
.um-group-hd-actions {
  margin-left:auto; display:flex; gap:5px;
}
.um-group-mini-btn {
  height:22px; padding:0 8px; border:1px solid var(--border); background:#fff;
  font-family:'DM Sans',sans-serif; font-size:9px; font-weight:600;
  letter-spacing:.05em; text-transform:uppercase; color:var(--muted);
  cursor:pointer; transition:all .12s;
}
.um-group-mini-btn:hover { border-color:var(--p); color:var(--p); }

.um-group-grid {
  display:grid; gap:6px; padding:10px;
  grid-template-columns:1fr 1fr;
}
@media(max-width:540px){ .um-group-grid{ grid-template-columns:1fr; } }

.um-perm {
  display:flex; align-items:center; gap:9px;
  padding:8px 10px; border:1px solid var(--border); background:#fff;
  cursor:pointer; transition:border-color .14s, background .14s;
  text-align:left;
}
.um-perm:hover { border-color:var(--p); }
.um-perm.on  { border-color:var(--p20); background:var(--p10); }
.um-perm.off { opacity:.65; }
.um-perm-ico-wrap {
  width:24px; height:24px; flex-shrink:0;
  background:var(--row); display:flex; align-items:center; justify-content:center;
  color:var(--muted); transition:all .14s;
}
.um-perm.on .um-perm-ico-wrap { background:var(--p20); color:var(--p); }
.um-perm-ico-wrap svg { width:12px; height:12px; }
.um-perm-info { flex:1; min-width:0; }
.um-perm-name { font-size:11px; font-weight:600; color:var(--txt); margin:0; }
.um-perm.on .um-perm-name { color:var(--p); }
.um-perm-hint { font-size:9px; color:var(--muted); margin:2px 0 0; line-height:1.35; }
.um-perm-check { flex-shrink:0; }
.um-perm-check svg { width:14px; height:14px; }
.um-perm.on .um-perm-check  svg { color:var(--ok); }
.um-perm.off .um-perm-check svg { color:rgba(26,26,24,.20); }

/* ── Pie del panel ── */
.um-panel-foot {
  display:flex; gap:8px; justify-content:space-between; align-items:center;
  margin-top:14px; border-top:1px solid var(--border); padding-top:12px;
  flex-wrap:wrap;
}
.um-summary { font-size:10px; color:var(--muted); }
.um-summary strong { color:var(--p); font-weight:600; }
.um-foot-actions { display:flex; gap:6px; }
.um-btn-cancel {
  height:36px; padding:0 14px; border:1px solid var(--border); background:#fff;
  font-family:'DM Sans',sans-serif; font-size:11px; color:rgba(26,26,24,.6);
  cursor:pointer; transition:border-color .14s; text-decoration:none;
}
.um-btn-cancel:hover { border-color:var(--txt); color:var(--txt); }
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

const ROLES: Role[] = ["admin", "gerente", "vendedor"]

const ROLE_CLS: Record<Role, string> = {
  admin: "role-admin", gerente: "role-gerente", vendedor: "role-vendedor",
}

type AppUser = {
  id:          string
  user_id:     string
  email:       string
  role:        Role
  permissions: Record<string, boolean>
}

// ── RoleSelect ────────────────────────────────────────────────────────────────
function RoleSelect({ value, onChange, disabled }: {
  value: Role; onChange: (v: Role) => void; disabled?: boolean
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
        {ROLE_LABELS[value]}
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

// ── Componente principal ──────────────────────────────────────────────────────
export function UserManagement() {
  const [users, setUsers]       = useState<AppUser[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [search, setSearch]     = useState("")
  const [drafts, setDrafts]     = useState<Record<string, { role: Role; permissions: Record<PermissionKey, boolean> }>>({})

  const load = async () => {
    setLoading(true)
    const { data, error } = await createClient()
      .from("user_permissions_with_email")
      .select("id, user_id, email, role, permissions")
      .order("email")
    if (error) showError(error.message)
    else setUsers((data || []) as AppUser[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleExpand = (u: AppUser) => {
    if (expanded === u.id) { setExpanded(null); return }
    setExpanded(u.id)
    if (!drafts[u.id]) {
      setDrafts(d => ({
        ...d,
        [u.id]: {
          role: (u.role as Role) || "vendedor",
          permissions: normalizePermissions(u.permissions),
        },
      }))
    }
  }

  const setDraftRole = (id: string, role: Role) =>
    setDrafts(d => ({ ...d, [id]: { ...d[id], role } }))

  const togglePerm = (id: string, key: PermissionKey) =>
    setDrafts(d => ({
      ...d,
      [id]: {
        ...d[id],
        permissions: { ...d[id].permissions, [key]: !d[id].permissions?.[key] },
      },
    }))

  const setAllPerms = (id: string, value: boolean) =>
    setDrafts(d => ({
      ...d,
      [id]: {
        ...d[id],
        permissions: PERMISSION_KEYS.reduce((acc, k) => { acc[k] = value; return acc }, {} as Record<PermissionKey, boolean>),
      },
    }))

  const setGroupPerms = (id: string, keys: PermissionKey[], value: boolean) =>
    setDrafts(d => {
      const next = { ...d[id].permissions }
      for (const k of keys) next[k] = value
      return { ...d, [id]: { ...d[id], permissions: next } }
    })

  const applyRoleTemplate = (id: string, role: Role) =>
    setDrafts(d => ({
      ...d,
      [id]: { role, permissions: defaultPermissionsForRole(role) },
    }))

  const cancelDraft = (id: string) => {
    setDrafts(d => {
      const { [id]: _drop, ...rest } = d
      return rest
    })
    setExpanded(null)
  }

  const handleSave = async (u: AppUser) => {
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
      setDrafts(d => {
        const { [u.id]: _drop, ...rest } = d
        return rest
      })
    } catch (err: any) {
      showError(err.message || "Error al guardar")
    } finally {
      setSaving(null)
    }
  }

  const filteredUsers = users.filter(u =>
    !search.trim() || u.email.toLowerCase().includes(search.trim().toLowerCase())
  )

  if (loading) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="um" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
          <div style={{ width: 18, height: 18, border: "2px solid rgba(26,26,24,.15)", borderTopColor: "var(--primary,#984ca8)", borderRadius: "50%", animation: "umSpin .7s linear infinite" }} />
        </div>
      </>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="um">
        <div className="um-header">
          <span className="um-count">
            {users.length} usuario{users.length !== 1 ? "s" : ""} en esta empresa
          </span>
          <input
            className="um-search"
            placeholder="Filtrar por email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className={`um-refresh${loading ? " spin" : ""}`} onClick={load} aria-label="Recargar usuarios">
            <RefreshCw aria-hidden />
          </button>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="um-empty">
            <Users aria-hidden />
            <p className="um-empty-t">
              {search ? "Sin coincidencias para tu búsqueda" : "No hay usuarios registrados"}
            </p>
          </div>
        ) : (
          <div className="um-list">
            {filteredUsers.map(u => {
              const isOpen   = expanded === u.id
              const draft    = drafts[u.id]
              const isSaving = saving === u.id
              const activePermsCount = Object.values(u.permissions || {}).filter(Boolean).length
              const totalPerms = PERMISSION_KEYS.length

              return (
                <div key={u.id} className="um-user">
                  <div className="um-user-hd" onClick={() => handleExpand(u)}>
                    <div className="um-avatar" aria-hidden>
                      {u.email?.charAt(0) || "?"}
                    </div>
                    <div className="um-user-info">
                      <div className="um-user-email">{u.email}</div>
                      <div className="um-user-meta">
                        <span className={`um-role-badge ${ROLE_CLS[u.role as Role] || "role-vendedor"}`}>
                          {ROLE_LABELS[u.role as Role] || u.role}
                        </span>
                        <span className="um-pcount">
                          {activePermsCount} / {totalPerms} permisos
                        </span>
                      </div>
                    </div>
                    <ChevronDown className={`um-expand-ico${isOpen ? " open" : ""}`} aria-hidden />
                  </div>

                  {isOpen && draft && (
                    <div className="um-panel">

                      {/* Sección 1: Rol + plantillas */}
                      <div className="um-panel-section">
                        <div className="um-role-row">
                          <div className="um-role-wrap">
                            <div className="um-role-lbl">Rol del usuario</div>
                            <RoleSelect
                              value={draft.role}
                              onChange={v => setDraftRole(u.id, v)}
                              disabled={isSaving}
                            />
                          </div>
                          <div style={{ flex: 1, minWidth: 200 }}>
                            <div className="um-role-lbl">Plantillas rápidas</div>
                            <div className="um-quick">
                              <span className="um-quick-lbl">
                                <Sparkles aria-hidden /> Aplicar plantilla
                              </span>
                              {ROLES.map(r => (
                                <button
                                  key={r}
                                  type="button"
                                  className="um-quick-btn"
                                  onClick={() => applyRoleTemplate(u.id, r)}
                                  disabled={isSaving}
                                  title={`Aplica los permisos por defecto de ${ROLE_LABELS[r]}`}
                                >
                                  {ROLE_LABELS[r]}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Sección 2: Atajos globales */}
                      <div className="um-panel-section">
                        <div className="um-panel-title">
                          <ListChecks aria-hidden /> Atajos
                        </div>
                        <div className="um-quick">
                          <button
                            type="button"
                            className="um-quick-btn"
                            onClick={() => setAllPerms(u.id, true)}
                            disabled={isSaving}
                          >
                            <CheckCircle2 aria-hidden /> Marcar todos
                          </button>
                          <button
                            type="button"
                            className="um-quick-btn"
                            onClick={() => setAllPerms(u.id, false)}
                            disabled={isSaving}
                          >
                            <Eraser aria-hidden /> Desmarcar todos
                          </button>
                        </div>
                      </div>

                      {/* Sección 3: Permisos agrupados */}
                      <div className="um-panel-section">
                        <div className="um-panel-title">
                          <Shield aria-hidden /> Permisos del menú
                        </div>

                        {(Object.keys(PERMISSIONS_BY_GROUP) as Array<keyof typeof PERMISSIONS_BY_GROUP>).map(grpKey => {
                          const grp = PERMISSIONS_BY_GROUP[grpKey]
                          const grpKeys = grp.map(p => p.key)
                          const onCount = grpKeys.filter(k => draft.permissions?.[k]).length
                          return (
                            <div key={grpKey} className="um-group">
                              <div className="um-group-hd">
                                <span className="um-group-hd-name">{GROUP_LABELS[grpKey]}</span>
                                <span className="um-group-hd-cnt">{onCount}/{grp.length}</span>
                                <div className="um-group-hd-actions">
                                  <button type="button" className="um-group-mini-btn"
                                    onClick={() => setGroupPerms(u.id, grpKeys, true)} disabled={isSaving}>
                                    Todos
                                  </button>
                                  <button type="button" className="um-group-mini-btn"
                                    onClick={() => setGroupPerms(u.id, grpKeys, false)} disabled={isSaving}>
                                    Ninguno
                                  </button>
                                </div>
                              </div>
                              <div className="um-group-grid">
                                {grp.map(p => {
                                  const on = !!draft.permissions?.[p.key]
                                  const Icon = ICONS[p.icon] || Shield
                                  return (
                                    <button
                                      key={p.key}
                                      type="button"
                                      className={`um-perm ${on ? "on" : "off"}`}
                                      onClick={() => togglePerm(u.id, p.key)}
                                      disabled={isSaving}
                                    >
                                      <span className="um-perm-ico-wrap" aria-hidden>
                                        <Icon />
                                      </span>
                                      <span className="um-perm-info">
                                        <p className="um-perm-name">{p.label}</p>
                                        <p className="um-perm-hint">{p.hint}</p>
                                      </span>
                                      <span className="um-perm-check" aria-hidden>
                                        {on ? <CheckCircle2 /> : <XCircle />}
                                      </span>
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Footer */}
                      <div className="um-panel-foot">
                        <span className="um-summary">
                          <strong>
                            {Object.values(draft.permissions).filter(Boolean).length}
                          </strong>{" "}
                          de <strong>{PERMISSION_KEYS.length}</strong> permisos activos
                        </span>
                        <div className="um-foot-actions">
                          <button type="button" className="um-btn-cancel"
                            onClick={() => cancelDraft(u.id)} disabled={isSaving}>
                            Cancelar
                          </button>
                          <button type="button" className="um-btn-save"
                            onClick={() => handleSave(u)} disabled={isSaving}>
                            {isSaving
                              ? <><div className="um-spin" />Guardando…</>
                              : <><Shield size={11} aria-hidden />Guardar cambios</>}
                          </button>
                        </div>
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
