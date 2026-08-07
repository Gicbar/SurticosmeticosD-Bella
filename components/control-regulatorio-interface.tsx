"use client"
import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { showError, showSuccess } from "@/lib/sweetalert"
import { ShieldCheck, Thermometer, Plus, ChevronDown, Check } from "lucide-react"

const CR_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  .cr-root { font-family: 'DM Sans', sans-serif; --cr-p: var(--primary, #984ca8); --cr-p10: rgba(var(--primary-rgb,152,76,168), 0.10); --cr-txt: #1a1a18; --cr-muted: rgba(26,26,24,0.45); --cr-border: rgba(26,26,24,0.08); --cr-ok: #15803d; --cr-ok10: rgba(21,128,61,0.08); --cr-warn: #b45309; --cr-warn10: rgba(180,83,9,0.08); }
  .cr-grid { display: grid; gap: 20px; grid-template-columns: 1fr; }
  @media (min-width: 900px) { .cr-grid { grid-template-columns: 1fr 1fr; } }

  .cr-card { background: #fff; border: 1px solid var(--cr-border); overflow: hidden; }
  .cr-card-hd { padding: 14px 18px 12px; border-bottom: 1px solid var(--cr-border); display: flex; align-items: center; gap: 8px; }
  .cr-card-hd-icon { width: 26px; height: 26px; background: var(--cr-p10); display: flex; align-items: center; justify-content: center; }
  .cr-card-hd-icon svg { color: var(--cr-p); width: 13px; height: 13px; }
  .cr-card-title { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--cr-txt); margin: 0; }
  .cr-card-body { padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; }

  .cr-lbl { display: block; font-size: 9px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; color: var(--cr-muted); margin-bottom: 5px; }
  .cr-inp, .cr-textarea { width: 100%; height: 40px; padding: 0 12px; border: 1px solid var(--cr-border); font-family: 'DM Sans', sans-serif; font-size: 13px; outline: none; }
  .cr-textarea { height: auto; min-height: 60px; padding: 10px 12px; resize: vertical; }
  .cr-g2 { display: grid; gap: 10px; grid-template-columns: 1fr 1fr; }
  @media (max-width: 420px) { .cr-g2 { grid-template-columns: 1fr; } }

  .cr-sel-wrap { position: relative; }
  .cr-sel-btn { width: 100%; height: 40px; padding: 0 34px 0 12px; border: 1px solid var(--cr-border); background: #fff; cursor: pointer; font-size: 13px; display: flex; align-items: center; }
  .cr-sel-dd { position: absolute; top: calc(100% + 3px); left: 0; right: 0; background: #fff; border: 1px solid var(--cr-border); box-shadow: 0 8px 24px rgba(26,26,24,.10); z-index: 700; max-height: 180px; overflow-y: auto; }
  .cr-sel-opt { padding: 9px 12px; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; }
  .cr-sel-opt:hover { background: var(--cr-p10); }

  .cr-check-row { display: flex; align-items: center; gap: 9px; padding: 9px 12px; border: 1.5px solid var(--cr-border); cursor: pointer; }
  .cr-check-row.on { border-color: var(--cr-ok); background: var(--cr-ok10); }
  .cr-check-box { width: 17px; height: 17px; flex-shrink: 0; border: 1.5px solid rgba(26,26,24,.2); display: flex; align-items: center; justify-content: center; }
  .cr-check-row.on .cr-check-box { background: var(--cr-ok); border-color: var(--cr-ok); }
  .cr-check-box svg { width: 10px; height: 10px; color: #fff; }
  .cr-check-txt { font-size: 12px; color: var(--cr-txt); }

  .cr-btn-save { height: 40px; padding: 0 18px; border: none; background: var(--cr-p); color: #fff; cursor: pointer; font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; display: flex; align-items: center; justify-content: center; gap: 6px; }
  .cr-btn-save:disabled { opacity: .4; cursor: not-allowed; }
  .cr-spin { width: 12px; height: 12px; border: 2px solid rgba(255,255,255,.3); border-top-color: #fff; border-radius: 50%; animation: cr-spin .7s linear infinite; }
  @keyframes cr-spin { to { transform: rotate(360deg); } }

  .cr-list { max-height: 320px; overflow-y: auto; border-top: 1px solid var(--cr-border); }
  .cr-list-row { padding: 10px 18px; border-bottom: 1px solid var(--cr-border); font-size: 12px; }
  .cr-list-row:last-child { border-bottom: none; }
  .cr-list-main { display: flex; justify-content: space-between; font-weight: 500; color: var(--cr-txt); }
  .cr-list-sub { color: var(--cr-muted); font-size: 11px; margin-top: 2px; }
  .cr-temp-badge { padding: 2px 8px; font-size: 10px; font-weight: 700; }
  .cr-temp-badge.ok   { background: var(--cr-ok10); color: var(--cr-ok); }
  .cr-temp-badge.warn { background: var(--cr-warn10); color: var(--cr-warn); }
  .cr-empty { padding: 24px 18px; text-align: center; font-size: 12px; color: var(--cr-muted); }
`

type ProductoControlado = { id: string; name: string }

type Dispensacion = {
  id: string
  paciente_nombre: string
  medico_nombre: string
  cantidad_dispensada: number
  fecha_dispensacion: string
  products: { name: string } | null
}

type Temperatura = {
  id: string
  temperatura_c: number
  dentro_de_rango: boolean
  observaciones: string | null
  fecha_hora: string
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })

export function ControlRegulatorioInterface({ companyId }: { companyId: string }) {
  const [productos, setProductos] = useState<ProductoControlado[]>([])
  const [dispensaciones, setDispensaciones] = useState<Dispensacion[]>([])
  const [temperaturas, setTemperaturas] = useState<Temperatura[]>([])
  const [loadingLists, setLoadingLists] = useState(true)

  // Form: dispensación
  const [dProductoId, setDProductoId] = useState("")
  const [dSelOpen, setDSelOpen] = useState(false)
  const [dPaciente, setDPaciente] = useState("")
  const [dDocPaciente, setDDocPaciente] = useState("")
  const [dMedico, setDMedico] = useState("")
  const [dRegMedico, setDRegMedico] = useState("")
  const [dFormula, setDFormula] = useState("")
  const [dCantidad, setDCantidad] = useState("1")
  const [savingD, setSavingD] = useState(false)

  // Form: temperatura
  const [tTemp, setTTemp] = useState("")
  const [tDentroRango, setTDentroRango] = useState(true)
  const [tObs, setTObs] = useState("")
  const [savingT, setSavingT] = useState(false)

  const load = useCallback(async () => {
    setLoadingLists(true)
    try {
      const supabase = createClient()
      const [{ data: prods }, { data: disps }, { data: temps }] = await Promise.all([
        supabase.from("products").select("id, name").eq("company_id", companyId).eq("es_controlado", true).order("name"),
        supabase.from("control_sustancias_dispensacion")
          .select("id, paciente_nombre, medico_nombre, cantidad_dispensada, fecha_dispensacion, products(name)")
          .eq("empresa_id", companyId).order("fecha_dispensacion", { ascending: false }).limit(50),
        supabase.from("control_cadena_frio")
          .select("id, temperatura_c, dentro_de_rango, observaciones, fecha_hora")
          .eq("empresa_id", companyId).order("fecha_hora", { ascending: false }).limit(50),
      ])
      setProductos(prods || [])
      setDispensaciones((disps || []) as unknown as Dispensacion[])
      setTemperaturas(temps || [])
    } finally { setLoadingLists(false) }
  }, [companyId])

  useEffect(() => { load() }, [load])

  const selectedProducto = productos.find(p => p.id === dProductoId)

  const handleSubmitDispensacion = async () => {
    if (!dProductoId) return showError("Selecciona el producto controlado")
    if (!dPaciente.trim() || !dDocPaciente.trim()) return showError("Indica nombre y documento del paciente")
    if (!dMedico.trim() || !dRegMedico.trim()) return showError("Indica nombre y registro profesional del médico")
    const cantidad = parseInt(dCantidad)
    if (isNaN(cantidad) || cantidad <= 0) return showError("Cantidad inválida")

    setSavingD(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from("control_sustancias_dispensacion").insert({
        empresa_id: companyId,
        producto_id: dProductoId,
        paciente_nombre: dPaciente.trim(),
        paciente_documento: dDocPaciente.trim(),
        medico_nombre: dMedico.trim(),
        medico_registro_profesional: dRegMedico.trim(),
        numero_formula: dFormula.trim() || null,
        cantidad_dispensada: cantidad,
        creado_por: user?.id,
      })
      if (error) throw error
      await showSuccess("Dispensación registrada en el libro de control")
      setDProductoId(""); setDPaciente(""); setDDocPaciente("")
      setDMedico(""); setDRegMedico(""); setDFormula(""); setDCantidad("1")
      await load()
    } catch (err: any) {
      showError(err.message || "Error al registrar")
    } finally { setSavingD(false) }
  }

  const handleSubmitTemperatura = async () => {
    const temp = parseFloat(tTemp)
    if (isNaN(temp)) return showError("Ingresa una temperatura válida")
    setSavingT(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from("control_cadena_frio").insert({
        empresa_id: companyId,
        temperatura_c: temp,
        dentro_de_rango: tDentroRango,
        observaciones: tObs.trim() || null,
        responsable: user?.id,
      })
      if (error) throw error
      await showSuccess("Registro de temperatura guardado")
      setTTemp(""); setTDentroRango(true); setTObs("")
      await load()
    } catch (err: any) {
      showError(err.message || "Error al registrar")
    } finally { setSavingT(false) }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CR_CSS }} />
      <div className="cr-root">
        <div className="cr-grid">

          {/* ── Libro de control de sustancias ── */}
          <div className="cr-card">
            <div className="cr-card-hd">
              <div className="cr-card-hd-icon"><ShieldCheck /></div>
              <p className="cr-card-title">Libro de control de sustancias</p>
            </div>
            <div className="cr-card-body">
              <div>
                <label className="cr-lbl">Producto controlado *</label>
                <div className="cr-sel-wrap">
                  <button type="button" className="cr-sel-btn" onClick={() => setDSelOpen(o => !o)} disabled={savingD}>
                    {selectedProducto?.name ?? (productos.length === 0 ? "Sin productos marcados como controlados" : "Selecciona un producto")}
                  </button>
                  <ChevronDown size={13} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "rgba(26,26,24,.4)" }} aria-hidden />
                  {dSelOpen && productos.length > 0 && (
                    <div className="cr-sel-dd" role="listbox">
                      {productos.map(p => (
                        <div key={p.id} className="cr-sel-opt" onClick={() => { setDProductoId(p.id); setDSelOpen(false) }}>
                          {p.name}{dProductoId === p.id && <Check size={11} aria-hidden />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="cr-g2">
                <div>
                  <label className="cr-lbl">Paciente *</label>
                  <input className="cr-inp" value={dPaciente} disabled={savingD} onChange={e => setDPaciente(e.target.value)} placeholder="Nombre completo" />
                </div>
                <div>
                  <label className="cr-lbl">Documento *</label>
                  <input className="cr-inp" value={dDocPaciente} disabled={savingD} onChange={e => setDDocPaciente(e.target.value)} placeholder="Número" />
                </div>
              </div>
              <div className="cr-g2">
                <div>
                  <label className="cr-lbl">Médico prescriptor *</label>
                  <input className="cr-inp" value={dMedico} disabled={savingD} onChange={e => setDMedico(e.target.value)} placeholder="Nombre" />
                </div>
                <div>
                  <label className="cr-lbl">Registro profesional *</label>
                  <input className="cr-inp" value={dRegMedico} disabled={savingD} onChange={e => setDRegMedico(e.target.value)} placeholder="N.º registro médico" />
                </div>
              </div>
              <div className="cr-g2">
                <div>
                  <label className="cr-lbl">N.º fórmula</label>
                  <input className="cr-inp" value={dFormula} disabled={savingD} onChange={e => setDFormula(e.target.value)} placeholder="Opcional" />
                </div>
                <div>
                  <label className="cr-lbl">Cantidad dispensada *</label>
                  <input className="cr-inp" type="number" min={1} value={dCantidad} disabled={savingD} onChange={e => setDCantidad(e.target.value)} />
                </div>
              </div>
              <button className="cr-btn-save" onClick={handleSubmitDispensacion} disabled={savingD || productos.length === 0}>
                {savingD ? <><div className="cr-spin" />Guardando…</> : <><Plus size={13} />Registrar dispensación</>}
              </button>
            </div>
            <div className="cr-list">
              {loadingLists ? (
                <div className="cr-empty">Cargando…</div>
              ) : dispensaciones.length === 0 ? (
                <div className="cr-empty">Sin dispensaciones registradas</div>
              ) : dispensaciones.map(d => (
                <div key={d.id} className="cr-list-row">
                  <div className="cr-list-main">
                    <span>{d.products?.name ?? "Producto"} × {d.cantidad_dispensada}</span>
                    <span>{fmtDate(d.fecha_dispensacion)}</span>
                  </div>
                  <div className="cr-list-sub">Paciente: {d.paciente_nombre} · Médico: {d.medico_nombre}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Cadena de frío ── */}
          <div className="cr-card">
            <div className="cr-card-hd">
              <div className="cr-card-hd-icon"><Thermometer /></div>
              <p className="cr-card-title">Control de cadena de frío</p>
            </div>
            <div className="cr-card-body">
              <div className="cr-g2">
                <div>
                  <label className="cr-lbl">Temperatura (°C) *</label>
                  <input className="cr-inp" type="number" step="0.1" value={tTemp} disabled={savingT}
                    onChange={e => setTTemp(e.target.value)} placeholder="Ej: 4.5" />
                </div>
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <div
                    role="checkbox" aria-checked={tDentroRango} tabIndex={0}
                    className={`cr-check-row${tDentroRango ? " on" : ""}`}
                    style={{ width: "100%" }}
                    onClick={() => !savingT && setTDentroRango(v => !v)}
                    onKeyDown={e => { if ((e.key === " " || e.key === "Enter") && !savingT) setTDentroRango(v => !v) }}
                  >
                    <div className="cr-check-box">{tDentroRango && <Check aria-hidden />}</div>
                    <span className="cr-check-txt">Dentro del rango seguro</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="cr-lbl">Observaciones</label>
                <textarea className="cr-textarea" value={tObs} disabled={savingT}
                  onChange={e => setTObs(e.target.value)} placeholder="Ej: falla eléctrica, mantenimiento..." />
              </div>
              <button className="cr-btn-save" onClick={handleSubmitTemperatura} disabled={savingT}>
                {savingT ? <><div className="cr-spin" />Guardando…</> : <><Plus size={13} />Registrar lectura</>}
              </button>
            </div>
            <div className="cr-list">
              {loadingLists ? (
                <div className="cr-empty">Cargando…</div>
              ) : temperaturas.length === 0 ? (
                <div className="cr-empty">Sin registros de temperatura</div>
              ) : temperaturas.map(t => (
                <div key={t.id} className="cr-list-row">
                  <div className="cr-list-main">
                    <span>{Number(t.temperatura_c).toFixed(1)}°C</span>
                    <span className={`cr-temp-badge ${t.dentro_de_rango ? "ok" : "warn"}`}>
                      {t.dentro_de_rango ? "Normal" : "Fuera de rango"}
                    </span>
                  </div>
                  <div className="cr-list-sub">{fmtDate(t.fecha_hora)}{t.observaciones ? ` · ${t.observaciones}` : ""}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
