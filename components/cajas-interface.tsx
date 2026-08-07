"use client"
import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { showError, showSuccess } from "@/lib/sweetalert"
import { Building2, Plus, Lock, Unlock } from "lucide-react"

const CJ_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  .cj-root { font-family: 'DM Sans', sans-serif; --cj-p: var(--primary, #984ca8); --cj-p10: rgba(var(--primary-rgb,152,76,168), 0.10); --cj-txt: #1a1a18; --cj-muted: rgba(26,26,24,0.45); --cj-border: rgba(26,26,24,0.08); --cj-ok: #15803d; --cj-ok10: rgba(21,128,61,0.08); --cj-warn: #b45309; --cj-warn10: rgba(180,83,9,0.08); }

  .cj-card { background: #fff; border: 1px solid var(--cj-border); overflow: hidden; margin-bottom: 20px; }
  .cj-card-hd { padding: 14px 18px 12px; border-bottom: 1px solid var(--cj-border); display: flex; align-items: center; gap: 8px; }
  .cj-card-hd-icon { width: 26px; height: 26px; background: var(--cj-p10); display: flex; align-items: center; justify-content: center; }
  .cj-card-hd-icon svg { color: var(--cj-p); width: 13px; height: 13px; }
  .cj-card-title { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--cj-txt); margin: 0; }
  .cj-card-body { padding: 16px 18px; }

  .cj-row { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--cj-border); }
  .cj-row:last-child { border-bottom: none; }
  .cj-row-info { flex: 1; min-width: 0; }
  .cj-row-name { font-size: 14px; font-weight: 500; margin: 0; }
  .cj-row-sub { font-size: 11px; color: var(--cj-muted); margin: 3px 0 0; }

  .cj-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; font-size: 9px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
  .cj-badge.activa   { background: var(--cj-ok10); color: var(--cj-ok); }
  .cj-badge.inactiva { background: rgba(26,26,24,0.06); color: var(--cj-muted); }
  .cj-badge.libre    { background: var(--cj-ok10); color: var(--cj-ok); }
  .cj-badge.ocupada  { background: var(--cj-warn10); color: var(--cj-warn); }

  .cj-toggle-btn { height: 32px; padding: 0 12px; border: 1px solid var(--cj-border); background: #fff; cursor: pointer; font-size: 10px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; display: flex; align-items: center; gap: 6px; color: var(--cj-txt); }
  .cj-toggle-btn:hover:not(:disabled) { border-color: var(--cj-p); color: var(--cj-p); }
  .cj-toggle-btn:disabled { opacity: .4; cursor: not-allowed; }

  .cj-new-row { display: flex; gap: 8px; margin-top: 4px; }
  .cj-inp { flex: 1; height: 40px; padding: 0 12px; border: 1px solid var(--cj-border); font-family: 'DM Sans', sans-serif; font-size: 13px; outline: none; }
  .cj-btn { height: 40px; padding: 0 16px; border: none; background: var(--cj-p); color: #fff; cursor: pointer; font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; display: flex; align-items: center; gap: 6px; }
  .cj-btn:disabled { opacity: .4; cursor: not-allowed; }
  .cj-spin { width: 12px; height: 12px; border: 2px solid rgba(255,255,255,.3); border-top-color: #fff; border-radius: 50%; animation: cj-spin .7s linear infinite; }
  @keyframes cj-spin { to { transform: rotate(360deg); } }

  .cj-empty { padding: 24px 0; text-align: center; font-size: 12px; color: var(--cj-muted); }
  .cj-hint { font-size: 11px; color: var(--cj-muted); margin: 10px 0 0; line-height: 1.5; }
`

type Caja = { id: string; nombre: string; activa: boolean }

export function CajasInterface({ companyId }: { companyId: string }) {
  const [loading, setLoading] = useState(true)
  const [cajas, setCajas] = useState<Caja[]>([])
  const [ocupadas, setOcupadas] = useState<Record<string, string>>({}) // caja_id -> email del cajero
  const [nombre, setNombre] = useState("")
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const [{ data: cajasData }, { data: turnosAbiertos }] = await Promise.all([
        supabase.from("cajas").select("id, nombre, activa").eq("empresa_id", companyId).order("nombre"),
        supabase.from("turnos_caja").select("caja_id, cajero_id").eq("empresa_id", companyId).eq("estado", "abierto"),
      ])
      setCajas(cajasData || [])

      const cajeroIds = Array.from(new Set((turnosAbiertos || []).map(t => t.cajero_id).filter(Boolean)))
      let emails: Record<string, string> = {}
      if (cajeroIds.length > 0) {
        const { data: userRows } = await supabase.from("user_permissions_with_email").select("user_id, email").in("user_id", cajeroIds)
        emails = Object.fromEntries((userRows || []).map(u => [u.user_id, u.email]))
      }
      const map: Record<string, string> = {}
      for (const t of turnosAbiertos || []) {
        map[t.caja_id] = emails[t.cajero_id] ?? "un cajero"
      }
      setOcupadas(map)
    } finally { setLoading(false) }
  }, [companyId])

  useEffect(() => { load() }, [load])

  const handleNuevaCaja = async () => {
    if (!nombre.trim()) return showError("Ingresa un nombre para la caja")
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("cajas").insert({ empresa_id: companyId, nombre: nombre.trim() })
      if (error) throw error
      setNombre("")
      await load()
    } catch (err: any) {
      showError(err.message || "Error al crear la caja")
    } finally { setSaving(false) }
  }

  const handleToggleActiva = async (caja: Caja) => {
    setTogglingId(caja.id)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("cajas").update({ activa: !caja.activa }).eq("id", caja.id)
      if (error) throw error
      await load()
    } catch (err: any) {
      showError(err.message || "Error al actualizar la caja")
    } finally { setTogglingId(null) }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CJ_CSS }} />
      <div className="cj-root">
        <div className="cj-card">
          <div className="cj-card-hd">
            <div className="cj-card-hd-icon"><Building2 /></div>
            <p className="cj-card-title">Cajas registradas</p>
          </div>
          <div className="cj-card-body">
            {loading ? (
              <p className="cj-empty">Cargando…</p>
            ) : cajas.length === 0 ? (
              <p className="cj-empty">Sin cajas registradas todavía</p>
            ) : cajas.map(c => {
              const ocupante = ocupadas[c.id]
              return (
                <div key={c.id} className="cj-row">
                  <div className="cj-row-info">
                    <p className="cj-row-name">{c.nombre}</p>
                    <p className="cj-row-sub">
                      {ocupante ? `En uso por ${ocupante}` : "Sin turno abierto ahora"}
                    </p>
                  </div>
                  <span className={`cj-badge ${c.activa ? "activa" : "inactiva"}`}>{c.activa ? "Activa" : "Inactiva"}</span>
                  <span className={`cj-badge ${ocupante ? "ocupada" : "libre"}`}>
                    {ocupante ? <Lock size={9} /> : <Unlock size={9} />}
                    {ocupante ? "Ocupada" : "Libre"}
                  </span>
                  <button className="cj-toggle-btn" disabled={togglingId === c.id || !!ocupante}
                    title={ocupante ? "No se puede desactivar una caja en uso" : undefined}
                    onClick={() => handleToggleActiva(c)}>
                    {togglingId === c.id ? <div className="cj-spin" style={{ borderTopColor: "var(--cj-p)" }} /> : c.activa ? "Desactivar" : "Activar"}
                  </button>
                </div>
              )
            })}

            <div className="cj-new-row">
              <input className="cj-inp" placeholder="Nombre de la nueva caja" value={nombre}
                disabled={saving} onChange={e => setNombre(e.target.value)} />
              <button className="cj-btn" onClick={handleNuevaCaja} disabled={saving}>
                {saving ? <div className="cj-spin" /> : <><Plus size={13} />Agregar caja</>}
              </button>
            </div>
            <p className="cj-hint">
              Solo administradores gestionan cajas desde aquí. El uso diario (abrir/cerrar turno,
              recogidas de efectivo) se hace en <strong>Cajas y Turnos</strong>, donde cada usuario
              elige una caja libre — el sistema no permite dos turnos abiertos a la vez en la misma caja.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
