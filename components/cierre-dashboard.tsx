"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  CalendarCheck, ChevronLeft, ChevronRight, TrendingUp, TrendingDown,
  DollarSign, Wallet, Plus, Trash2, Lock, Unlock, RefreshCw,
  PiggyBank, Receipt, CreditCard, Info,
} from "lucide-react"
import { showSuccess, showError, showConfirm } from "@/lib/sweetalert"

// ── Utilidades ──────────────────────────────────────────────────────────────
const COP = (n: number) =>
  n.toLocaleString("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 })

// Colombia = UTC-5 sin DST.
const COL_MS = 5 * 60 * 60 * 1000
const nowCol = () => new Date(Date.now() - COL_MS)

/** Límites del mes en hora Colombia, devueltos como ISO UTC. month = 1..12 */
function monthBoundsISO(year: number, month: number) {
  const firstDay = new Date(Date.UTC(year, month - 1, 1, 5, 0, 0)).toISOString()
  const lastDay  = new Date(Date.UTC(year, month, 1, 5, 0, 0) - 1).toISOString()
  return { firstDay, lastDay }
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]
const mesLabel = (y: number, m: number) => `${MESES[m - 1]} ${y}`
const prevPeriod = (y: number, m: number) => (m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 })
const nextPeriod = (y: number, m: number) => (m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 })

interface Movimiento {
  id: string
  tipo: "APORTE" | "RETIRO"
  monto: number
  descripcion: string | null
  fecha: string
}

interface Cierre {
  id: string
  anio: number
  mes: number
  saldo_inicial: number
  total_ingresos: number
  total_gastos: number
  total_ajustes: number
  saldo_final: number
  notas: string | null
  cerrado_at: string | null
}

// ── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
  .cd-root {
    font-family: 'DM Sans', sans-serif;
    --cd-p:      var(--primary, #984ca8);
    --cd-p08:    rgba(var(--primary-rgb,152,76,168), 0.08);
    --cd-p12:    rgba(var(--primary-rgb,152,76,168), 0.12);
    --cd-txt:    #1a1a18;
    --cd-muted:  rgba(26,26,24,0.5);
    --cd-border: rgba(26,26,24,0.08);
    --cd-in:     #15803d;  --cd-in-bg:  rgba(21,128,61,0.08);
    --cd-out:    #dc2626;  --cd-out-bg: rgba(220,38,38,0.08);
    --cd-warn:   #b45309;  --cd-warn-bg:rgba(180,83,9,0.08);
  }

  /* Barra de periodo */
  .cd-period { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:20px; }
  .cd-nav { display:flex; align-items:center; gap:8px; }
  .cd-nav-btn { width:34px; height:34px; display:flex; align-items:center; justify-content:center; background:#fff; border:1px solid var(--cd-border); cursor:pointer; color:var(--cd-txt); transition:background .14s; }
  .cd-nav-btn:hover:not(:disabled) { background:var(--cd-p08); border-color:var(--cd-p); color:var(--cd-p); }
  .cd-nav-btn:disabled { opacity:.35; cursor:not-allowed; }
  .cd-period-lbl { font-family:'Cormorant Garamond',Georgia,serif; font-size:22px; color:var(--cd-txt); min-width:160px; text-align:center; text-transform:capitalize; }
  .cd-badge { display:inline-flex; align-items:center; gap:5px; font-size:10px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; padding:5px 10px; }
  .cd-badge.closed { background:var(--cd-p12); color:var(--cd-p); }
  .cd-badge.open   { background:var(--cd-warn-bg); color:var(--cd-warn); }

  /* Flujo visual de caja — la "historia" del dinero */
  .cd-flow {
    display:flex; align-items:stretch; gap:0;
    background:linear-gradient(135deg, var(--cd-p08), rgba(255,255,255,0) 60%), #fff;
    border:1px solid var(--cd-border); border-radius:2px;
    padding:22px 16px; margin-bottom:20px; overflow-x:auto;
    -webkit-overflow-scrolling:touch;
  }
  .cd-flow::-webkit-scrollbar { height:4px; }
  .cd-flow::-webkit-scrollbar-thumb { background:var(--cd-p12); }
  .cd-flow-node {
    flex:1 1 0; min-width:128px; display:flex; flex-direction:column;
    align-items:center; text-align:center; gap:9px; padding:4px 10px;
  }
  .cd-flow-ico { width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:var(--cd-p08); }
  .cd-flow-ico svg { width:18px; height:18px; color:var(--cd-p); }
  .cd-flow-ico.in  { background:var(--cd-in-bg); }  .cd-flow-ico.in svg  { color:var(--cd-in); }
  .cd-flow-ico.out { background:var(--cd-out-bg); } .cd-flow-ico.out svg { color:var(--cd-out); }
  .cd-flow-lbl { font-size:9px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--cd-muted); margin:0; }
  .cd-flow-val { font-family:'Cormorant Garamond',Georgia,serif; font-size:20px; font-weight:500; margin:0; line-height:1.05; color:var(--cd-txt); white-space:nowrap; }
  .cd-flow-val.in  { color:var(--cd-in); }
  .cd-flow-val.out { color:var(--cd-out); }
  .cd-flow-hint { font-size:10px; color:var(--cd-muted); margin:0; line-height:1.3; }
  .cd-flow-op { align-self:center; display:flex; align-items:center; justify-content:center; font-size:26px; font-weight:200; color:var(--cd-p); opacity:.5; padding:0 2px; flex-shrink:0; }
  /* Nodo final resaltado con el color de la empresa */
  .cd-flow-node.final {
    background:var(--cd-p); border-radius:4px; padding:16px 14px; margin:-6px 0;
    box-shadow:0 8px 26px rgba(var(--primary-rgb,152,76,168), .28);
  }
  .cd-flow-node.final .cd-flow-ico { background:rgba(255,255,255,.18); }
  .cd-flow-node.final .cd-flow-ico svg { color:#fff; }
  .cd-flow-node.final .cd-flow-lbl { color:rgba(255,255,255,.85); }
  .cd-flow-node.final .cd-flow-val { color:#fff; font-size:24px; }
  .cd-flow-node.final.neg { background:var(--cd-out); box-shadow:0 8px 26px rgba(220,38,38,.28); }
  .cd-flow-tag { font-size:8px; font-weight:600; letter-spacing:.1em; text-transform:uppercase; color:rgba(255,255,255,.8); background:rgba(255,255,255,.15); padding:3px 8px; border-radius:20px; }

  /* Ecuación del cierre */
  .cd-eq { background:#fff; border:1px solid var(--cd-border); padding:22px; margin-bottom:20px; }
  .cd-eq-title { font-size:10px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:var(--cd-muted); margin:0 0 16px; }
  .cd-eq-row { display:flex; align-items:center; justify-content:space-between; padding:11px 0; border-bottom:1px dashed var(--cd-border); }
  .cd-eq-row:last-of-type { border-bottom:none; }
  .cd-eq-lbl { font-size:13px; color:var(--cd-txt); display:flex; align-items:center; gap:9px; }
  .cd-eq-lbl svg { width:15px; height:15px; color:var(--cd-muted); }
  .cd-eq-hint { font-size:11px; color:var(--cd-muted); margin-left:24px; }
  .cd-eq-val { font-family:'DM Sans',sans-serif; font-size:15px; font-weight:600; white-space:nowrap; }
  .cd-eq-val.in  { color:var(--cd-in); }
  .cd-eq-val.out { color:var(--cd-out); }
  .cd-eq-final { display:flex; align-items:center; justify-content:space-between; margin-top:16px; padding-top:18px; border-top:2px solid var(--cd-txt); }
  .cd-eq-final-lbl { font-family:'Cormorant Garamond',Georgia,serif; font-size:19px; color:var(--cd-txt); display:flex; align-items:center; gap:9px; }
  .cd-eq-final-val { font-family:'Cormorant Garamond',Georgia,serif; font-size:30px; font-weight:600; color:var(--cd-p); }
  .cd-eq-final-val.neg { color:var(--cd-out); }

  /* Saldo inicial editable */
  .cd-open-edit { display:flex; align-items:center; gap:8px; }
  .cd-open-input { width:130px; height:32px; border:1px solid var(--cd-p); padding:0 10px; font-family:'DM Sans',sans-serif; font-size:14px; text-align:right; color:var(--cd-txt); }
  .cd-open-input:focus { outline:2px solid var(--cd-p12); }

  /* Bloque de movimientos */
  .cd-mov { background:#fff; border:1px solid var(--cd-border); margin-bottom:20px; }
  .cd-mov-hd { display:flex; align-items:center; justify-content:space-between; padding:16px 18px; border-bottom:1px solid var(--cd-border); }
  .cd-mov-hd h3 { font-family:'Cormorant Garamond',Georgia,serif; font-size:17px; font-weight:500; margin:0; color:var(--cd-txt); }
  .cd-mov-form { display:flex; gap:8px; flex-wrap:wrap; padding:14px 18px; background:var(--cd-p08); border-bottom:1px solid var(--cd-border); align-items:center; }
  .cd-inp { height:36px; border:1px solid var(--cd-border); padding:0 10px; font-family:'DM Sans',sans-serif; font-size:13px; background:#fff; color:var(--cd-txt); }
  .cd-inp:focus { outline:none; border-color:var(--cd-p); }
  .cd-sel { min-width:120px; }
  .cd-inp-desc { flex:1; min-width:160px; }
  .cd-inp-monto { width:130px; text-align:right; }
  .cd-btn { display:inline-flex; align-items:center; gap:7px; height:36px; padding:0 16px; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600; letter-spacing:.04em; text-transform:uppercase; transition:opacity .15s; }
  .cd-btn:hover:not(:disabled) { opacity:.88; }
  .cd-btn:disabled { opacity:.4; cursor:not-allowed; }
  .cd-btn-p { background:var(--cd-p); color:#fff; }
  .cd-btn svg { width:14px; height:14px; }
  .cd-mov-list { list-style:none; margin:0; padding:0; }
  .cd-mov-item { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 18px; border-bottom:1px solid var(--cd-border); }
  .cd-mov-item:last-child { border-bottom:none; }
  .cd-mov-info { display:flex; align-items:center; gap:12px; min-width:0; }
  .cd-mov-tag { font-size:9px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; padding:4px 8px; white-space:nowrap; }
  .cd-mov-tag.APORTE { background:var(--cd-in-bg); color:var(--cd-in); }
  .cd-mov-tag.RETIRO { background:var(--cd-out-bg); color:var(--cd-out); }
  .cd-mov-desc { font-size:13px; color:var(--cd-txt); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .cd-mov-right { display:flex; align-items:center; gap:14px; }
  .cd-mov-amt { font-size:14px; font-weight:600; white-space:nowrap; }
  .cd-mov-amt.APORTE { color:var(--cd-in); }
  .cd-mov-amt.RETIRO { color:var(--cd-out); }
  .cd-del { background:none; border:none; cursor:pointer; color:var(--cd-muted); padding:4px; display:flex; }
  .cd-del:hover { color:var(--cd-out); }
  .cd-empty { padding:22px 18px; text-align:center; font-size:12px; color:var(--cd-muted); }

  /* Aviso */
  .cd-note { display:flex; gap:10px; align-items:flex-start; background:var(--cd-warn-bg); border:1px solid rgba(180,83,9,.2); padding:12px 14px; margin-bottom:20px; font-size:12px; color:#7c3f06; line-height:1.5; }
  .cd-note svg { width:16px; height:16px; flex-shrink:0; margin-top:1px; color:var(--cd-warn); }

  /* Acciones de cierre */
  .cd-actions { display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end; margin-bottom:28px; }
  .cd-btn-close { background:var(--cd-p); color:#fff; height:44px; padding:0 26px; font-size:13px; }
  .cd-btn-reopen { background:#fff; color:var(--cd-out); border:1px solid var(--cd-out); height:44px; padding:0 22px; font-size:13px; }
  .cd-btn-reopen:hover:not(:disabled){ background:var(--cd-out-bg); }

  /* Historial */
  .cd-hist { background:#fff; border:1px solid var(--cd-border); overflow:hidden; }
  .cd-hist-hd { padding:16px 18px; border-bottom:1px solid var(--cd-border); }
  .cd-hist-hd h3 { font-family:'Cormorant Garamond',Georgia,serif; font-size:17px; font-weight:500; margin:0; color:var(--cd-txt); }
  .cd-table-wrap { overflow-x:auto; }
  .cd-table { width:100%; border-collapse:collapse; min-width:640px; }
  .cd-table th { font-size:9px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--cd-muted); text-align:right; padding:11px 14px; border-bottom:1px solid var(--cd-border); background:#fafafa; }
  .cd-table th:first-child { text-align:left; }
  .cd-table td { font-size:13px; color:var(--cd-txt); text-align:right; padding:12px 14px; border-bottom:1px solid var(--cd-border); white-space:nowrap; }
  .cd-table td:first-child { text-align:left; text-transform:capitalize; font-weight:500; }
  .cd-table tr:last-child td { border-bottom:none; }
  .cd-table .in  { color:var(--cd-in); }
  .cd-table .out { color:var(--cd-out); }
  .cd-table .final { font-weight:700; color:var(--cd-p); }

  .cd-loading { padding:60px 20px; text-align:center; color:var(--cd-muted); font-size:13px; }
`

export function CierreDashboard({ companyId }: { companyId: string }) {
  const supabase = useMemo(() => createClient(), [])
  const today = nowCol()

  const [year, setYear]   = useState(today.getUTCFullYear())
  const [month, setMonth] = useState(today.getUTCMonth() + 1)

  const [loading, setLoading]   = useState(true)
  const [userId, setUserId]     = useState<string | null>(null)

  // Datos del periodo seleccionado
  const [contado, setContado]       = useState(0)   // ventas de contado
  const [recaudo, setRecaudo]       = useState(0)   // abonos de créditos
  const [gastos, setGastos]         = useState(0)
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [cierre, setCierre]         = useState<Cierre | null>(null)      // cierre de ESTE mes (si existe)
  const [cierrePrev, setCierrePrev] = useState<Cierre | null>(null)      // cierre del mes anterior
  const [laterClosed, setLaterClosed] = useState(false)                  // ¿hay un mes posterior ya cerrado?

  // Saldo inicial manual (solo aplica en el primer cierre, sin mes anterior)
  const [saldoInicialManual, setSaldoInicialManual] = useState("")

  // Form de movimientos
  const [movTipo, setMovTipo]   = useState<"APORTE" | "RETIRO">("APORTE")
  const [movMonto, setMovMonto] = useState("")
  const [movDesc, setMovDesc]   = useState("")
  const [saving, setSaving]     = useState(false)

  const isClosed = !!cierre

  // ── Carga de datos ──────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    const { firstDay, lastDay } = monthBoundsISO(year, month)
    const prev = prevPeriod(year, month)
    const next = nextPeriod(year, month)

    const [
      { data: uData },
      { data: ventasContado },
      { data: abonos },
      { data: gastosData },
      { data: movs },
      { data: cierreActual },
      { data: cierreAnterior },
      { count: postCount },
    ] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from("sales").select("total")
        .eq("company_id", companyId).eq("is_credit", false)
        .gte("sale_date", firstDay).lte("sale_date", lastDay),
      supabase.from("debt_payments").select("amount")
        .eq("company_id", companyId)
        .gte("created_at", firstDay).lte("created_at", lastDay),
      supabase.from("expenses").select("amount")
        .eq("company_id", companyId)
        .gte("date", firstDay).lte("date", lastDay),
      supabase.from("movimientos_caja").select("*")
        .eq("company_id", companyId).eq("anio", year).eq("mes", month)
        .order("fecha", { ascending: false }),
      supabase.from("cierres_mensuales").select("*")
        .eq("company_id", companyId).eq("anio", year).eq("mes", month).maybeSingle(),
      supabase.from("cierres_mensuales").select("*")
        .eq("company_id", companyId).eq("anio", prev.y).eq("mes", prev.m).maybeSingle(),
      // ¿existe algún cierre en un periodo posterior? (bloquea reapertura)
      supabase.from("cierres_mensuales").select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .or(`anio.gt.${year},and(anio.eq.${year},mes.gt.${month})`),
    ])

    setUserId(uData?.user?.id ?? null)
    setContado((ventasContado ?? []).reduce((s, v) => s + Number(v.total || 0), 0))
    setRecaudo((abonos ?? []).reduce((s, a) => s + Number(a.amount || 0), 0))
    setGastos((gastosData ?? []).reduce((s, g) => s + Number(g.amount || 0), 0))
    setMovimientos((movs ?? []) as Movimiento[])
    setCierre((cierreActual ?? null) as Cierre | null)
    setCierrePrev((cierreAnterior ?? null) as Cierre | null)
    setLaterClosed((postCount ?? 0) > 0)
    setSaldoInicialManual("")
    setLoading(false)
  }, [supabase, companyId, year, month])

  useEffect(() => { load() }, [load])

  // ── Cálculos en vivo ────────────────────────────────────────────────────
  const ingresos = contado + recaudo
  const aportes  = movimientos.filter(m => m.tipo === "APORTE").reduce((s, m) => s + Number(m.monto), 0)
  const retiros  = movimientos.filter(m => m.tipo === "RETIRO").reduce((s, m) => s + Number(m.monto), 0)
  const ajustes  = aportes - retiros

  // Saldo inicial: si el mes ya está cerrado usamos el guardado; si no,
  // el saldo_final del mes anterior; si no hay mes anterior, el manual.
  const saldoInicial = isClosed
    ? Number(cierre!.saldo_inicial)
    : cierrePrev
      ? Number(cierrePrev.saldo_final)
      : Number(saldoInicialManual || 0)

  const saldoFinal = isClosed
    ? Number(cierre!.saldo_final)
    : saldoInicial + ingresos - gastos + ajustes

  const prev = prevPeriod(year, month)

  // ── Navegación de periodo ────────────────────────────────────────────────
  const goPrev = () => { const p = prevPeriod(year, month); setYear(p.y); setMonth(p.m) }
  const goNext = () => { const n = nextPeriod(year, month); setYear(n.y); setMonth(n.m) }
  // No permitir navegar a meses futuros
  const isFuture = year > today.getUTCFullYear() || (year === today.getUTCFullYear() && month >= today.getUTCMonth() + 1)

  // ── Movimientos ──────────────────────────────────────────────────────────
  const addMovimiento = async () => {
    const monto = Number(movMonto)
    if (!monto || monto <= 0) { showError("Ingresa un monto válido mayor a 0"); return }
    setSaving(true)
    const { error } = await supabase.from("movimientos_caja").insert({
      company_id: companyId, anio: year, mes: month,
      tipo: movTipo, monto, descripcion: movDesc.trim() || null,
      created_by: userId,
    })
    setSaving(false)
    if (error) { showError("No se pudo registrar el movimiento: " + error.message); return }
    setMovMonto(""); setMovDesc("")
    await load()
  }

  const delMovimiento = async (id: string) => {
    const ok = await showConfirm("¿Eliminar este movimiento de caja?", "Confirmar")
    if (!ok) return
    const { error } = await supabase.from("movimientos_caja").delete()
      .eq("id", id).eq("company_id", companyId)
    if (error) { showError("No se pudo eliminar: " + error.message); return }
    await load()
  }

  // ── Cerrar / Reabrir mes ─────────────────────────────────────────────────
  const cerrarMes = async () => {
    const ok = await showConfirm(
      `Vas a cerrar ${mesLabel(year, month)}.\n\n` +
      `Saldo inicial: ${COP(saldoInicial)}\n` +
      `+ Ingresos: ${COP(ingresos)}\n` +
      `− Gastos: ${COP(gastos)}\n` +
      `± Ajustes: ${COP(ajustes)}\n` +
      `= Saldo final: ${COP(saldoFinal)}\n\n` +
      `Este saldo será la base del mes siguiente.`,
      "Cerrar mes",
    )
    if (!ok) return
    setSaving(true)
    const { error } = await supabase.from("cierres_mensuales").insert({
      company_id: companyId, anio: year, mes: month,
      saldo_inicial: saldoInicial,
      total_ingresos: ingresos,
      total_gastos: gastos,
      total_ajustes: ajustes,
      saldo_final: saldoFinal,
      estado: "CERRADO",
      cerrado_por: userId,
    })
    setSaving(false)
    if (error) {
      showError(
        error.code === "23505"
          ? "Este mes ya fue cerrado."
          : "No se pudo cerrar el mes: " + error.message,
      )
      await load()
      return
    }
    showSuccess(`${mesLabel(year, month)} cerrado. Saldo final: ${COP(saldoFinal)}`)
    await load()
  }

  const reabrirMes = async () => {
    if (laterClosed) {
      showError("No puedes reabrir este mes porque ya hay un mes posterior cerrado. Reabre primero el más reciente.")
      return
    }
    const ok = await showConfirm(
      `¿Reabrir ${mesLabel(year, month)}? Se borrará el cierre guardado y podrás recalcularlo. ` +
      `Los movimientos de caja se conservan.`,
      "Reabrir mes",
    )
    if (!ok) return
    setSaving(true)
    const { error } = await supabase.from("cierres_mensuales").delete()
      .eq("id", cierre!.id).eq("company_id", companyId)
    setSaving(false)
    if (error) { showError("No se pudo reabrir: " + error.message); return }
    showSuccess(`${mesLabel(year, month)} reabierto.`)
    await load()
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="cd-root">

        {/* Barra de periodo */}
        <div className="cd-period">
          <div className="cd-nav">
            <button className="cd-nav-btn" onClick={goPrev} aria-label="Mes anterior"><ChevronLeft size={17} /></button>
            <span className="cd-period-lbl">{mesLabel(year, month)}</span>
            <button className="cd-nav-btn" onClick={goNext} disabled={isFuture} aria-label="Mes siguiente"><ChevronRight size={17} /></button>
          </div>
          <span className={`cd-badge ${isClosed ? "closed" : "open"}`}>
            {isClosed ? <><Lock size={12} /> Cerrado</> : <><Unlock size={12} /> Abierto</>}
          </span>
        </div>

        {loading ? (
          <div className="cd-loading">Cargando…</div>
        ) : (
          <>
            {/* Flujo visual de caja — la historia del dinero del mes */}
            <div className="cd-flow">
              <div className="cd-flow-node">
                <div className="cd-flow-ico"><Wallet /></div>
                <p className="cd-flow-lbl">Saldo inicial</p>
                <p className="cd-flow-val">{COP(saldoInicial)}</p>
                <p className="cd-flow-hint">
                  {cierrePrev ? `de ${MESES[prev.m - 1]}` : "base de arranque"}
                </p>
              </div>

              <div className="cd-flow-op">+</div>

              <div className="cd-flow-node">
                <div className="cd-flow-ico in"><TrendingUp /></div>
                <p className="cd-flow-lbl">Ingresos</p>
                <p className="cd-flow-val in">{COP(ingresos)}</p>
                <p className="cd-flow-hint">contado + créditos</p>
              </div>

              <div className="cd-flow-op">−</div>

              <div className="cd-flow-node">
                <div className="cd-flow-ico out"><TrendingDown /></div>
                <p className="cd-flow-lbl">Gastos</p>
                <p className="cd-flow-val out">{COP(gastos)}</p>
                <p className="cd-flow-hint">del mes</p>
              </div>

              <div className="cd-flow-op">±</div>

              <div className="cd-flow-node">
                <div className="cd-flow-ico"><RefreshCw /></div>
                <p className="cd-flow-lbl">Ajustes</p>
                <p className={`cd-flow-val ${ajustes < 0 ? "out" : ajustes > 0 ? "in" : ""}`}>{COP(ajustes)}</p>
                <p className="cd-flow-hint">aportes / retiros</p>
              </div>

              <div className="cd-flow-op">=</div>

              <div className={`cd-flow-node final ${saldoFinal < 0 ? "neg" : ""}`}>
                <div className="cd-flow-ico"><PiggyBank /></div>
                <p className="cd-flow-lbl">Saldo final</p>
                <p className="cd-flow-val">{COP(saldoFinal)}</p>
                <span className="cd-flow-tag">Base mes siguiente</span>
              </div>
            </div>

            {/* Aviso: falta cerrar el mes anterior */}
            {!isClosed && !cierrePrev && (
              <div className="cd-note">
                <Info />
                <span>
                  No hay un cierre de <strong>{mesLabel(prev.y, prev.m)}</strong>. El saldo inicial se toma como
                  <strong> {COP(0)}</strong> por defecto. Si es tu primer cierre, escribe abajo con cuánto dinero
                  arrancas; si no, cierra primero el mes anterior para que el saldo se arrastre solo.
                </span>
              </div>
            )}

            {/* Ecuación del cierre */}
            <div className="cd-eq">
              <p className="cd-eq-title">Cálculo del cierre</p>

              <div className="cd-eq-row">
                <div>
                  <span className="cd-eq-lbl"><Wallet /> Saldo inicial</span>
                  <div className="cd-eq-hint">
                    {isClosed
                      ? "Guardado al cerrar"
                      : cierrePrev
                        ? `Arrastrado de ${mesLabel(prev.y, prev.m)}`
                        : "Sin mes anterior cerrado — edítalo si es tu primer cierre"}
                  </div>
                </div>
                {(!isClosed && !cierrePrev) ? (
                  <div className="cd-open-edit">
                    <input
                      className="cd-open-input" type="number" min="0" placeholder="0"
                      value={saldoInicialManual}
                      onChange={e => setSaldoInicialManual(e.target.value)}
                    />
                  </div>
                ) : (
                  <span className="cd-eq-val">{COP(saldoInicial)}</span>
                )}
              </div>

              <div className="cd-eq-row">
                <div>
                  <span className="cd-eq-lbl"><Receipt /> + Ventas de contado</span>
                </div>
                <span className="cd-eq-val in">{COP(contado)}</span>
              </div>

              <div className="cd-eq-row">
                <div>
                  <span className="cd-eq-lbl"><CreditCard /> + Abonos de créditos</span>
                  <div className="cd-eq-hint">Dinero cobrado de ventas a crédito</div>
                </div>
                <span className="cd-eq-val in">{COP(recaudo)}</span>
              </div>

              <div className="cd-eq-row">
                <div>
                  <span className="cd-eq-lbl"><DollarSign /> − Gastos</span>
                </div>
                <span className="cd-eq-val out">{COP(gastos)}</span>
              </div>

              <div className="cd-eq-row">
                <div>
                  <span className="cd-eq-lbl"><Wallet /> ± Aportes / Retiros</span>
                </div>
                <span className={`cd-eq-val ${ajustes >= 0 ? "in" : "out"}`}>{COP(ajustes)}</span>
              </div>

              <div className="cd-eq-final">
                <span className="cd-eq-final-lbl"><PiggyBank size={19} /> Saldo final</span>
                <span className={`cd-eq-final-val ${saldoFinal < 0 ? "neg" : ""}`}>{COP(saldoFinal)}</span>
              </div>
            </div>

            {/* Movimientos de caja */}
            <div className="cd-mov">
              <div className="cd-mov-hd">
                <h3>Aportes y retiros del dueño</h3>
              </div>

              {!isClosed && (
                <div className="cd-mov-form">
                  <select className="cd-inp cd-sel" value={movTipo} onChange={e => setMovTipo(e.target.value as any)}>
                    <option value="APORTE">Aporte (+)</option>
                    <option value="RETIRO">Retiro (−)</option>
                  </select>
                  <input className="cd-inp cd-inp-monto" type="number" min="0" placeholder="Monto"
                    value={movMonto} onChange={e => setMovMonto(e.target.value)} />
                  <input className="cd-inp cd-inp-desc" type="text" placeholder="Descripción (opcional)"
                    value={movDesc} onChange={e => setMovDesc(e.target.value)} />
                  <button className="cd-btn cd-btn-p" onClick={addMovimiento} disabled={saving}>
                    <Plus /> Agregar
                  </button>
                </div>
              )}

              {movimientos.length > 0 ? (
                <ul className="cd-mov-list">
                  {movimientos.map(m => (
                    <li key={m.id} className="cd-mov-item">
                      <div className="cd-mov-info">
                        <span className={`cd-mov-tag ${m.tipo}`}>{m.tipo === "APORTE" ? "Aporte" : "Retiro"}</span>
                        <span className="cd-mov-desc">{m.descripcion || "Sin descripción"}</span>
                      </div>
                      <div className="cd-mov-right">
                        <span className={`cd-mov-amt ${m.tipo}`}>
                          {m.tipo === "APORTE" ? "+" : "−"}{COP(Number(m.monto))}
                        </span>
                        {!isClosed && (
                          <button className="cd-del" onClick={() => delMovimiento(m.id)} aria-label="Eliminar"><Trash2 size={15} /></button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="cd-empty">Sin aportes ni retiros registrados este mes.</div>
              )}
            </div>

            {/* Acciones */}
            <div className="cd-actions">
              {isClosed ? (
                <button className="cd-btn cd-btn-reopen" onClick={reabrirMes} disabled={saving || laterClosed}
                  title={laterClosed ? "Hay un mes posterior cerrado" : ""}>
                  <Unlock /> Reabrir mes
                </button>
              ) : (
                <button className="cd-btn cd-btn-close" onClick={cerrarMes} disabled={saving}>
                  <CalendarCheck /> Cerrar {mesLabel(year, month)}
                </button>
              )}
            </div>

            <HistorialCierres companyId={companyId} refreshKey={cierre?.id ?? "open"} onPick={(y, m) => { setYear(y); setMonth(m) }} />
          </>
        )}
      </div>
    </>
  )
}

// ── Historial de cierres ────────────────────────────────────────────────────
function HistorialCierres({
  companyId, refreshKey, onPick,
}: { companyId: string; refreshKey: string; onPick: (y: number, m: number) => void }) {
  const supabase = useMemo(() => createClient(), [])
  const [rows, setRows] = useState<Cierre[]>([])

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.from("cierres_mensuales").select("*")
        .eq("company_id", companyId)
        .order("anio", { ascending: false }).order("mes", { ascending: false })
        .limit(24)
      setRows((data ?? []) as Cierre[])
    })()
  }, [supabase, companyId, refreshKey])

  if (rows.length === 0) return null

  return (
    <div className="cd-hist" style={{ marginTop: 8 }}>
      <div className="cd-hist-hd"><h3>Historial de cierres</h3></div>
      <div className="cd-table-wrap">
        <table className="cd-table">
          <thead>
            <tr>
              <th>Mes</th>
              <th>Saldo inicial</th>
              <th>Ingresos</th>
              <th>Gastos</th>
              <th>Ajustes</th>
              <th>Saldo final</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => onPick(r.anio, r.mes)}>
                <td>{mesLabel(r.anio, r.mes)}</td>
                <td>{COP(Number(r.saldo_inicial))}</td>
                <td className="in">{COP(Number(r.total_ingresos))}</td>
                <td className="out">{COP(Number(r.total_gastos))}</td>
                <td>{COP(Number(r.total_ajustes))}</td>
                <td className="final">{COP(Number(r.saldo_final))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
