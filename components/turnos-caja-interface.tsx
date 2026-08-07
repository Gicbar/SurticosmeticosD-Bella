"use client"
import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { showError, showSuccess, showInput, showConfirm, showSelect } from "@/lib/sweetalert"

const FORMA_PAGO_OPTS = [
  { value: "efectivo", label: "💵 Efectivo" },
  { value: "banco",    label: "🏦 Banco (transferencia / tarjeta)" },
]
import {
  Lock, Unlock, HandCoins, ChevronDown, Check, History, AlertTriangle,
} from "lucide-react"

const TC_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  .tc-root { font-family: 'DM Sans', sans-serif; --tc-p: var(--primary, #984ca8); --tc-p10: rgba(var(--primary-rgb,152,76,168), 0.10); --tc-txt: #1a1a18; --tc-muted: rgba(26,26,24,0.45); --tc-border: rgba(26,26,24,0.08); --tc-ok: #15803d; --tc-ok10: rgba(21,128,61,0.08); --tc-warn: #b45309; --tc-warn10: rgba(180,83,9,0.08); }

  .tc-card { background: #fff; border: 1px solid var(--tc-border); overflow: hidden; }
  .tc-card-hd { padding: 14px 18px 12px; border-bottom: 1px solid var(--tc-border); display: flex; align-items: center; gap: 8px; }
  .tc-card-hd-icon { width: 26px; height: 26px; background: var(--tc-p10); display: flex; align-items: center; justify-content: center; }
  .tc-card-hd-icon svg { color: var(--tc-p); width: 13px; height: 13px; }
  .tc-card-hd-icon.ok { background: var(--tc-ok10); }
  .tc-card-hd-icon.ok svg { color: var(--tc-ok); }
  .tc-card-title { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--tc-txt); margin: 0; }
  .tc-card-body { padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; }

  .tc-lbl { display: block; font-size: 9px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; color: var(--tc-muted); margin-bottom: 5px; }
  .tc-inp { width: 100%; height: 40px; padding: 0 12px; border: 1px solid var(--tc-border); font-family: 'DM Sans', sans-serif; font-size: 13px; outline: none; }
  .tc-g2 { display: grid; gap: 10px; grid-template-columns: 1fr 1fr; }
  @media (max-width: 420px) { .tc-g2 { grid-template-columns: 1fr; } }

  .tc-sel-wrap { position: relative; }
  .tc-sel-btn { width: 100%; height: 40px; padding: 0 34px 0 12px; border: 1px solid var(--tc-border); background: #fff; cursor: pointer; font-size: 13px; display: flex; align-items: center; }
  .tc-sel-dd { position: absolute; top: calc(100% + 3px); left: 0; right: 0; background: #fff; border: 1px solid var(--tc-border); box-shadow: 0 8px 24px rgba(26,26,24,.10); z-index: 700; max-height: 180px; overflow-y: auto; }
  .tc-sel-opt { padding: 9px 12px; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; }
  .tc-sel-opt:hover { background: var(--tc-p10); }

  .tc-btn { height: 40px; padding: 0 16px; border: none; background: var(--tc-p); color: #fff; cursor: pointer; font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; display: flex; align-items: center; justify-content: center; gap: 6px; }
  .tc-btn:disabled { opacity: .4; cursor: not-allowed; }
  .tc-btn.danger { background: #dc2626; }
  .tc-btn.secondary { background: #fff; border: 1px solid var(--tc-border); color: var(--tc-txt); }
  .tc-spin { width: 12px; height: 12px; border: 2px solid rgba(255,255,255,.3); border-top-color: #fff; border-radius: 50%; animation: tc-spin .7s linear infinite; }
  @keyframes tc-spin { to { transform: rotate(360deg); } }

  .tc-info-row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid var(--tc-border); font-size: 12px; }
  .tc-info-row:last-child { border-bottom: none; }
  .tc-info-row strong { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 15px; font-weight: 500; }

  .tc-hint-warn { font-size: 11px; color: var(--tc-warn); margin: 6px 0 0; line-height: 1.5; }

  .tc-table-wrap { overflow-x: auto; }
  .tc-table { width: 100%; border-collapse: collapse; }
  .tc-th { padding: 10px 16px; text-align: left; background: rgba(26,26,24,0.02); font-size: 9px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: var(--tc-muted); border-bottom: 1px solid var(--tc-border); white-space: nowrap; }
  .tc-td { padding: 10px 16px; font-size: 12px; color: var(--tc-txt); border-bottom: 1px solid var(--tc-border); white-space: nowrap; }
  .tc-diff-pos { color: var(--tc-ok); }
  .tc-diff-neg { color: #dc2626; }

  .tc-empty { padding: 20px 18px; text-align: center; font-size: 12px; color: var(--tc-muted); }

  .tc-deuda-row { display: flex; align-items: center; gap: 10px; padding: 10px 16px; border-bottom: 1px solid var(--tc-border); }
  .tc-deuda-row:last-child { border-bottom: none; }
  .tc-deuda-info { flex: 1; min-width: 0; }
  .tc-deuda-name { font-size: 13px; font-weight: 500; margin: 0; }
  .tc-deuda-sub { font-size: 11px; color: var(--tc-muted); margin: 2px 0 0; }
  .tc-deuda-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; font-size: 9px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
  .tc-deuda-badge.pendiente { background: var(--tc-warn10); color: var(--tc-warn); }
  .tc-deuda-badge.parcial   { background: rgba(3,105,161,0.08); color: #0369a1; }
`

type Caja = { id: string; nombre: string; activa: boolean }
type Turno = {
  id: string; caja_id: string
  saldo_apertura: number
  abierto_en: string
  cajas: { nombre: string } | null
}
type TurnoHistorial = {
  id: string
  saldo_apertura: number
  saldo_cierre_esperado: number | null
  saldo_cierre_contado: number | null
  diferencia: number | null
  abierto_en: string
  cerrado_en: string | null
  cajas: { nombre: string } | null
  cajero_id: string
}
type Recogida = { id: string; monto: number; entregado_a: string | null; creado_en: string }
type DeudaCajero = {
  id: string; cajero_id: string
  monto_original: number; monto_pagado: number; monto_pendiente: number
  estado: string; creado_en: string
}

const fmt = (v: number) => Number(v).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })
const fmtDate = (iso: string) => new Date(iso).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })

export function TurnosCajaInterface({ companyId }: { companyId: string }) {
  const [loading, setLoading] = useState(true)
  const [turnoActivo, setTurnoActivo] = useState<Turno | null>(null)
  const [historial, setHistorial] = useState<TurnoHistorial[]>([])
  const [recogidas, setRecogidas] = useState<Recogida[]>([])
  const [ventasEfectivo, setVentasEfectivo] = useState(0)
  const [emails, setEmails] = useState<Record<string, string>>({})
  const [deudasCajero, setDeudasCajero] = useState<DeudaCajero[]>([])
  const [processingDeuda, setProcessingDeuda] = useState<string | null>(null)
  // Cajas activas SIN turno abierto (por nadie) — solo esas se pueden elegir
  // al abrir turno. La gestión de cajas (crear/activar/desactivar) vive
  // aparte en /dashboard/cajas, solo para administradores.
  const [cajasLibres, setCajasLibres] = useState<Caja[]>([])

  // Abrir turno
  const [cajaId, setCajaId] = useState("")
  const [cajaSelOpen, setCajaSelOpen] = useState(false)
  const [saldoApertura, setSaldoApertura] = useState("0")
  const [openingTurno, setOpeningTurno] = useState(false)

  // Recogida
  const [montoRecogida, setMontoRecogida] = useState("")
  const [entregadoA, setEntregadoA] = useState("")
  const [savingRecogida, setSavingRecogida] = useState(false)

  const [closingTurno, setClosingTurno] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const [{ data: cajasData }, { data: turno }, { data: hist }, { data: deudas }, { data: turnosAbiertos }] = await Promise.all([
        supabase.from("cajas").select("id, nombre, activa").eq("empresa_id", companyId).eq("activa", true).order("nombre"),
        user ? supabase.from("turnos_caja")
          .select("id, caja_id, saldo_apertura, abierto_en, cajas(nombre)")
          .eq("empresa_id", companyId).eq("cajero_id", user.id).eq("estado", "abierto")
          .order("abierto_en", { ascending: false }).limit(1).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.from("turnos_caja")
          .select("id, saldo_apertura, saldo_cierre_esperado, saldo_cierre_contado, diferencia, abierto_en, cerrado_en, cajero_id, cajas(nombre)")
          .eq("empresa_id", companyId).eq("estado", "cerrado")
          .order("cerrado_en", { ascending: false }).limit(20),
        supabase.from("deudas_cajero")
          .select("id, cajero_id, monto_original, monto_pagado, monto_pendiente, estado, creado_en")
          .eq("empresa_id", companyId).neq("estado", "cancelada")
          .order("creado_en", { ascending: false }),
        // Turnos abiertos de CUALQUIER cajero — para saber qué cajas ya están
        // ocupadas y no ofrecerlas al abrir un turno nuevo (1 usuario por caja).
        supabase.from("turnos_caja").select("caja_id").eq("empresa_id", companyId).eq("estado", "abierto"),
      ])

      setTurnoActivo((turno as any) || null)
      setHistorial((hist || []) as unknown as TurnoHistorial[])
      setDeudasCajero(deudas || [])

      const ocupadas = new Set((turnosAbiertos || []).map(t => t.caja_id))
      setCajasLibres((cajasData || []).filter(c => !ocupadas.has(c.id)))

      const ids = Array.from(new Set([
        ...(hist || []).map((h: any) => h.cajero_id),
        ...(deudas || []).map((d: any) => d.cajero_id),
      ].filter(Boolean)))
      if (ids.length > 0) {
        const { data: userRows } = await supabase.from("user_permissions_with_email").select("user_id, email").in("user_id", ids)
        const map: Record<string, string> = {}
        for (const u of userRows || []) map[u.user_id] = u.email
        setEmails(map)
      }

      if (turno) {
        const [{ data: recs }, { data: ventas }] = await Promise.all([
          supabase.from("recogidas_efectivo").select("id, monto, entregado_a, creado_en").eq("turno_id", (turno as any).id).order("creado_en", { ascending: false }),
          supabase.from("sales").select("total").eq("turno_caja_id", (turno as any).id).eq("payment_method", "efectivo").eq("is_credit", false),
        ])
        setRecogidas(recs || [])
        setVentasEfectivo((ventas || []).reduce((s, v: any) => s + Number(v.total), 0))
      } else {
        setRecogidas([]); setVentasEfectivo(0)
      }
    } finally { setLoading(false) }
  }, [companyId])

  useEffect(() => { load() }, [load])

  const totalRecogido = recogidas.reduce((s, r) => s + Number(r.monto), 0)
  const saldoEsperado = turnoActivo ? Number(turnoActivo.saldo_apertura) + ventasEfectivo - totalRecogido : 0

  const handleAbrirTurno = async () => {
    if (!cajaId) return showError("Selecciona una caja")
    const apertura = parseFloat(saldoApertura) || 0
    setOpeningTurno(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from("turnos_caja").insert({
        empresa_id: companyId, caja_id: cajaId, cajero_id: user?.id,
        saldo_apertura: apertura, estado: "abierto",
      })
      if (error) {
        // 23505 = unique_violation. La BD garantiza (scripts/014) que solo
        // puede haber un turno abierto por caja y uno por cajero — si otro
        // usuario se adelantó a abrir esta misma caja entre que cargó la
        // lista y que dio clic, el mensaje explica por qué falló.
        if (error.code === "23505") {
          throw new Error("Esta caja ya fue tomada por otro usuario, o ya tienes otro turno abierto. Actualiza e intenta de nuevo.")
        }
        throw error
      }
      await showSuccess("Turno abierto")
      setCajaId(""); setSaldoApertura("0")
      await load()
    } catch (err: any) {
      showError(err.message || "Error al abrir el turno")
    } finally { setOpeningTurno(false) }
  }

  const handleRecogida = async () => {
    if (!turnoActivo) return
    const monto = parseFloat(montoRecogida)
    if (isNaN(monto) || monto <= 0) return showError("Ingresa un monto válido")
    setSavingRecogida(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from("recogidas_efectivo").insert({
        empresa_id: companyId, turno_id: turnoActivo.id, monto,
        recogido_por: user?.id, entregado_a: entregadoA.trim() || null,
      })
      if (error) throw error
      setMontoRecogida(""); setEntregadoA("")
      await load()
    } catch (err: any) {
      showError(err.message || "Error al registrar la recogida")
    } finally { setSavingRecogida(false) }
  }

  const handleCerrarTurno = async () => {
    if (!turnoActivo) return
    const input = await showInput(
      "Cerrar turno",
      `Saldo esperado en caja: ${fmt(saldoEsperado)}\nIngresa el efectivo contado físicamente`,
      "number"
    )
    if (input === null) return
    const contado = parseFloat(input)
    if (isNaN(contado)) return showError("Monto inválido")
    const ok = await showConfirm(`Diferencia: ${fmt(contado - saldoEsperado)}. Esta acción cierra el turno.`, "¿Confirmar cierre?")
    if (!ok) return

    setClosingTurno(true)
    try {
      const supabase = createClient()
      // El saldo esperado se recalcula del lado del servidor (autoritativo);
      // si hay faltante (diferencia < 0) la RPC crea automáticamente una
      // deuda_cajero a cargo del cajero — decisión tomada explícitamente
      // por el usuario. Un sobrante no genera nada adicional.
      const { data, error } = await supabase.rpc("rpc_cerrar_turno_caja", {
        p_turno_id: turnoActivo.id,
        p_saldo_contado: contado,
      })
      if (error) throw error
      const diferenciaFinal = (data as any)?.diferencia ?? (contado - saldoEsperado)
      if (diferenciaFinal < 0) {
        await showSuccess(
          `Faltante de ${fmt(Math.abs(diferenciaFinal))} registrado como deuda del cajero`,
          "Turno cerrado con faltante"
        )
      } else {
        await showSuccess("Turno cerrado correctamente")
      }
      await load()
    } catch (err: any) {
      showError(err.message || "Error al cerrar el turno")
    } finally { setClosingTurno(false) }
  }

  const handlePagoDeudaCajero = async (deuda: DeudaCajero) => {
    const input = await showInput(
      "Registrar pago",
      `Saldo pendiente: ${fmt(deuda.monto_pendiente)}\nIngresa el monto que paga el cajero`,
      "number"
    )
    if (input === null) return
    const monto = parseFloat(input)
    if (isNaN(monto) || monto <= 0) return showError("Monto inválido")
    if (monto > Number(deuda.monto_pendiente)) return showError(`El pago supera el saldo (${fmt(deuda.monto_pendiente)})`)

    const formaPago = await showSelect("¿Cómo pagó el cajero?", FORMA_PAGO_OPTS, "efectivo")
    if (formaPago === null) return

    setProcessingDeuda(deuda.id)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.rpc("rpc_registrar_pago_cajero", {
        p_deuda_id: deuda.id, p_monto: monto, p_user_id: user?.id, p_forma_pago: formaPago,
      })
      if (error) throw error
      await showSuccess(`Pago de ${fmt(monto)} registrado`)
      await load()
    } catch (err: any) {
      showError(err.message || "Error al registrar el pago")
    } finally { setProcessingDeuda(null) }
  }

  const selectedCaja = cajasLibres.find(c => c.id === cajaId)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: TC_CSS }} />
      <div className="tc-root">
        <div style={{ maxWidth: 460, marginBottom: 20 }}>

          {/* ── Turno actual ── */}
          <div className="tc-card">
            <div className="tc-card-hd">
              <div className={`tc-card-hd-icon${turnoActivo ? " ok" : ""}`}>{turnoActivo ? <Unlock /> : <Lock />}</div>
              <p className="tc-card-title">{turnoActivo ? "Turno abierto" : "Abrir turno"}</p>
            </div>
            <div className="tc-card-body">
              {loading ? null : turnoActivo ? (
                <>
                  <div className="tc-info-row"><span>Caja</span><strong>{turnoActivo.cajas?.nombre ?? "—"}</strong></div>
                  <div className="tc-info-row"><span>Abierto desde</span><span>{fmtDate(turnoActivo.abierto_en)}</span></div>
                  <div className="tc-info-row"><span>Saldo de apertura</span><strong>{fmt(turnoActivo.saldo_apertura)}</strong></div>
                  <div className="tc-info-row"><span>Ventas en efectivo</span><strong>{fmt(ventasEfectivo)}</strong></div>
                  <div className="tc-info-row"><span>Recogidas</span><strong>-{fmt(totalRecogido)}</strong></div>
                  <div className="tc-info-row"><span>Saldo esperado ahora</span><strong>{fmt(saldoEsperado)}</strong></div>

                  <div style={{ marginTop: 6 }}>
                    <p className="tc-lbl">Registrar recogida de efectivo</p>
                    <div className="tc-g2">
                      <input className="tc-inp" type="number" min={1} placeholder="Monto" value={montoRecogida}
                        disabled={savingRecogida} onChange={e => setMontoRecogida(e.target.value)} />
                      <input className="tc-inp" placeholder="Entregado a (opcional)" value={entregadoA}
                        disabled={savingRecogida} onChange={e => setEntregadoA(e.target.value)} />
                    </div>
                    <button className="tc-btn secondary" style={{ marginTop: 8, width: "100%" }} onClick={handleRecogida} disabled={savingRecogida}>
                      {savingRecogida ? <div className="tc-spin" style={{ borderTopColor: "var(--tc-p)" }} /> : <><HandCoins size={13} />Registrar recogida</>}
                    </button>
                  </div>

                  <button className="tc-btn danger" style={{ marginTop: 6 }} onClick={handleCerrarTurno} disabled={closingTurno}>
                    {closingTurno ? <><div className="tc-spin" />Cerrando…</> : <><Lock size={13} />Cerrar turno (arqueo)</>}
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <label className="tc-lbl">Caja</label>
                    <div className="tc-sel-wrap">
                      <button type="button" className="tc-sel-btn" onClick={() => setCajaSelOpen(o => !o)} disabled={openingTurno}>
                        {selectedCaja?.nombre ?? (cajasLibres.length === 0 ? "No hay cajas libres" : "Selecciona una caja")}
                      </button>
                      <ChevronDown size={13} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "rgba(26,26,24,.4)" }} aria-hidden />
                      {cajaSelOpen && cajasLibres.length > 0 && (
                        <div className="tc-sel-dd" role="listbox">
                          {cajasLibres.map(c => (
                            <div key={c.id} className="tc-sel-opt" onClick={() => { setCajaId(c.id); setCajaSelOpen(false) }}>
                              {c.nombre}{cajaId === c.id && <Check size={11} aria-hidden />}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {!loading && cajasLibres.length === 0 && (
                      <p className="tc-hint-warn">
                        Todas las cajas están ocupadas o no hay ninguna creada. Un administrador
                        las gestiona en <strong>Cajas</strong> (menú Sistema).
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="tc-lbl">Saldo de apertura</label>
                    <input className="tc-inp" type="number" min={0} value={saldoApertura} disabled={openingTurno}
                      onChange={e => setSaldoApertura(e.target.value)} />
                  </div>
                  <button className="tc-btn" onClick={handleAbrirTurno} disabled={openingTurno || cajasLibres.length === 0}>
                    {openingTurno ? <><div className="tc-spin" />Abriendo…</> : <><Unlock size={13} />Abrir turno</>}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Deudas por faltantes de caja ── */}
        {deudasCajero.length > 0 && (
          <div className="tc-card" style={{ marginBottom: 20 }}>
            <div className="tc-card-hd">
              <div className="tc-card-hd-icon" style={{ background: "var(--tc-warn10)" }}>
                <AlertTriangle style={{ color: "var(--tc-warn)" }} />
              </div>
              <p className="tc-card-title">Deudas por faltantes de caja</p>
            </div>
            {deudasCajero.map(d => (
              <div key={d.id} className="tc-deuda-row">
                <div className="tc-deuda-info">
                  <p className="tc-deuda-name">{emails[d.cajero_id] ?? "Cajero"}</p>
                  <p className="tc-deuda-sub">
                    Pendiente: <strong>{fmt(d.monto_pendiente)}</strong> de {fmt(d.monto_original)} · {fmtDate(d.creado_en)}
                  </p>
                </div>
                <span className={`tc-deuda-badge ${d.estado}`}>{d.estado}</span>
                <button className="tc-btn secondary" style={{ width: "auto", padding: "0 12px" }}
                  disabled={processingDeuda === d.id}
                  onClick={() => handlePagoDeudaCajero(d)}>
                  {processingDeuda === d.id ? <div className="tc-spin" style={{ borderTopColor: "var(--tc-p)" }} /> : <><HandCoins size={12} />Registrar pago</>}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Historial ── */}
        <div className="tc-card">
          <div className="tc-card-hd">
            <div className="tc-card-hd-icon"><History /></div>
            <p className="tc-card-title">Historial de turnos cerrados</p>
          </div>
          {historial.length === 0 ? (
            <p className="tc-empty">Sin turnos cerrados todavía</p>
          ) : (
            <div className="tc-table-wrap">
              <table className="tc-table">
                <thead>
                  <tr>
                    <th className="tc-th">Caja</th>
                    <th className="tc-th">Cajero</th>
                    <th className="tc-th">Apertura</th>
                    <th className="tc-th">Esperado</th>
                    <th className="tc-th">Contado</th>
                    <th className="tc-th">Diferencia</th>
                    <th className="tc-th">Cerrado</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map(h => (
                    <tr key={h.id}>
                      <td className="tc-td">{h.cajas?.nombre ?? "—"}</td>
                      <td className="tc-td">{emails[h.cajero_id] ?? "—"}</td>
                      <td className="tc-td">{fmt(h.saldo_apertura)}</td>
                      <td className="tc-td">{h.saldo_cierre_esperado != null ? fmt(h.saldo_cierre_esperado) : "—"}</td>
                      <td className="tc-td">{h.saldo_cierre_contado != null ? fmt(h.saldo_cierre_contado) : "—"}</td>
                      <td className={`tc-td ${h.diferencia != null && h.diferencia < 0 ? "tc-diff-neg" : "tc-diff-pos"}`}>
                        {h.diferencia != null ? fmt(h.diferencia) : "—"}
                      </td>
                      <td className="tc-td">{h.cerrado_en ? fmtDate(h.cerrado_en) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
