"use client"
import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  CheckCircle2, Clock, DollarSign, Plus, Search, X,
  ChevronDown, ChevronUp, CreditCard, RefreshCw, Wallet, Truck,
} from "lucide-react"
import { showSuccess, showError, showInput, showSelect } from "@/lib/sweetalert"

const FORMA_PAGO_OPTS = [
  { value: "efectivo", label: "💵 Efectivo (sale del negocio)" },
  { value: "banco",    label: "🏦 Banco (transferencia / tarjeta)" },
]

// ── CSS ── (mismo sistema de tokens que debts-interface.tsx, prefijo "sp-")
const SP_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  .sp-root {
    font-family: 'DM Sans', sans-serif;
    --sp-p:       var(--primary, #984ca8);
    --sp-p10:     rgba(var(--primary-rgb,152,76,168), 0.10);
    --sp-txt:     #1a1a18;
    --sp-muted:   rgba(26,26,24,0.45);
    --sp-border:  rgba(26,26,24,0.08);
    --sp-pending: #b45309;  --sp-pending-bg: rgba(180,83,9,0.08);
    --sp-partial: #0369a1;  --sp-partial-bg: rgba(3,105,161,0.08);
    --sp-paid:    #15803d;  --sp-paid-bg:    rgba(21,128,61,0.08);
    --sp-cancel:  rgba(26,26,24,0.4); --sp-cancel-bg: rgba(26,26,24,0.06);
  }

  .sp-stats { display: grid; gap: 12px; grid-template-columns: repeat(2,1fr); }
  @media (min-width: 640px) { .sp-stats { grid-template-columns: repeat(3,1fr); } }
  .sp-stat { background: #fff; border: 1px solid var(--sp-border); padding: 16px 18px; }
  .sp-stat-label { font-size: 9px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--sp-muted); margin: 0 0 8px; }
  .sp-stat-val { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 24px; font-weight: 400; margin: 0; line-height: 1; color: var(--sp-txt); }
  .sp-stat-val.danger  { color: var(--sp-pending); }
  .sp-stat-val.success { color: var(--sp-paid); }
  .sp-stat-sub { font-size: 10px; color: var(--sp-muted); margin: 4px 0 0; }

  .sp-card { background: #fff; border: 1px solid var(--sp-border); overflow: hidden; }
  .sp-card-hd { padding: 14px 18px 12px; border-bottom: 1px solid var(--sp-border); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .sp-card-hd-icon { width: 26px; height: 26px; background: var(--sp-p10); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .sp-card-hd-icon svg { color: var(--sp-p); width: 13px; height: 13px; }
  .sp-card-title { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--sp-txt); margin: 0; }

  .sp-filters { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; padding: 14px 18px; border-bottom: 1px solid var(--sp-border); }
  .sp-input-wrap { position: relative; flex: 1; min-width: 160px; }
  .sp-input-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--sp-muted); pointer-events: none; }
  .sp-input {
    width: 100%; height: 38px; padding: 0 12px 0 34px;
    border: 1px solid var(--sp-border); background: #fff;
    font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--sp-txt);
    outline: none; transition: border-color 0.15s; -webkit-appearance: none;
  }
  .sp-input:focus { border-color: var(--sp-p); }
  .sp-input::placeholder { color: var(--sp-muted); }

  .sp-filter-chips { display: flex; gap: 6px; flex-wrap: wrap; }
  .sp-chip { padding: 5px 12px; border: 1px solid var(--sp-border); background: #fff; font-size: 10px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; color: var(--sp-muted); transition: all 0.14s; white-space: nowrap; }
  .sp-chip:hover { border-color: var(--sp-p); color: var(--sp-p); }
  .sp-chip.active { background: var(--sp-p); border-color: var(--sp-p); color: #fff; }
  .sp-chip.pending.active { background: var(--sp-pending); border-color: var(--sp-pending); }
  .sp-chip.paid.active    { background: var(--sp-paid);    border-color: var(--sp-paid); }
  .sp-chip.partial.active { background: var(--sp-partial); border-color: var(--sp-partial); }

  .sp-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .sp-table { width: 100%; border-collapse: collapse; }
  .sp-th { padding: 10px 16px; text-align: left; background: rgba(26,26,24,0.02); font-size: 9px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: var(--sp-muted); border-bottom: 1px solid var(--sp-border); white-space: nowrap; }
  .sp-th:last-child { text-align: right; }
  .sp-tr { border-bottom: 1px solid var(--sp-border); transition: background 0.12s; cursor: pointer; }
  .sp-tr:last-child { border-bottom: none; }
  .sp-tr:hover { background: rgba(26,26,24,0.02); }
  .sp-tr.expanded { background: rgba(26,26,24,0.02); }
  .sp-td { padding: 13px 16px; font-size: 13px; color: var(--sp-txt); vertical-align: middle; }
  .sp-td:last-child { text-align: right; }

  .sp-supplier-name { font-weight: 500; margin: 0 0 2px; font-size: 13px; }
  .sp-supplier-sub { font-size: 10px; color: var(--sp-muted); margin: 0; }

  .sp-amt { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 15px; font-weight: 400; }
  .sp-amt.danger  { color: var(--sp-pending); }
  .sp-amt.success { color: var(--sp-paid); }

  .sp-progress-wrap { display: flex; align-items: center; gap: 8px; min-width: 100px; }
  .sp-progress-bar  { flex: 1; height: 4px; background: var(--sp-border); overflow: hidden; }
  .sp-progress-fill { height: 100%; background: var(--sp-p); transition: width 0.3s; }
  .sp-progress-fill.pagada  { background: var(--sp-paid); }
  .sp-progress-fill.parcial { background: var(--sp-partial); }
  .sp-progress-pct { font-size: 10px; color: var(--sp-muted); white-space: nowrap; }

  .sp-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; font-size: 9px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; white-space: nowrap; }
  .sp-badge.pendiente { background: var(--sp-pending-bg); color: var(--sp-pending); }
  .sp-badge.parcial   { background: var(--sp-partial-bg); color: var(--sp-partial); }
  .sp-badge.pagada    { background: var(--sp-paid-bg);    color: var(--sp-paid); }
  .sp-badge.cancelada { background: var(--sp-cancel-bg);  color: var(--sp-cancel); }

  .sp-expand-row td { padding: 0; }
  .sp-expand-body {
    padding: 16px 20px; border-top: 1px solid var(--sp-border);
    background: rgba(26,26,24,0.015);
    display: flex; gap: 16px; flex-wrap: wrap;
  }
  .sp-expand-payments { flex: 1; min-width: 220px; }
  .sp-expand-title { font-size: 9px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: var(--sp-muted); margin: 0 0 10px; }
  .sp-payment-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--sp-border); }
  .sp-payment-row:last-child { border-bottom: none; }
  .sp-payment-date { font-size: 11px; color: var(--sp-muted); }
  .sp-payment-amt  { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 14px; color: var(--sp-paid); }

  .sp-expand-actions { display: flex; flex-direction: column; gap: 8px; min-width: 200px; align-self: flex-start; }
  .sp-action-btn {
    display: flex; align-items: center; justify-content: center; gap: 7px;
    width: 100%; height: 38px; border: none; cursor: pointer;
    font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 600;
    letter-spacing: 0.08em; text-transform: uppercase; transition: opacity 0.15s;
  }
  .sp-action-btn:hover:not(:disabled) { opacity: 0.85; }
  .sp-action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .sp-action-btn.primary { background: var(--sp-p);    color: #fff; }
  .sp-action-btn.success { background: var(--sp-paid); color: #fff; }

  .sp-empty { padding: 60px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px; }
  .sp-empty-icon { width: 56px; height: 56px; background: var(--sp-p10); display: flex; align-items: center; justify-content: center; border-radius: 50%; }
  .sp-empty-icon svg { color: var(--sp-p); opacity: 0.5; width: 24px; height: 24px; }
  .sp-empty-title { font-size: 14px; font-weight: 500; color: var(--sp-txt); margin: 0; }
  .sp-empty-sub   { font-size: 12px; color: var(--sp-muted); margin: 0; }

  .sp-spinner-wrap { padding: 40px; display: flex; justify-content: center; }
  .sp-spinner { width: 24px; height: 24px; border: 2px solid var(--sp-border); border-top-color: var(--sp-p); border-radius: 50%; animation: sp-spin 0.7s linear infinite; }
  @keyframes sp-spin { to { transform: rotate(360deg); } }
  .sp-btn-spin { width: 13px; height: 13px; border: 2px solid rgba(255,255,255,0.35); border-top-color: white; border-radius: 50%; animation: sp-spin 0.7s linear infinite; flex-shrink: 0; }

  @media (max-width: 640px) {
    .sp-hide-mobile { display: none; }
    .sp-td, .sp-th  { padding: 10px 12px; }
    .sp-expand-body { flex-direction: column; }
    .sp-expand-actions { width: 100%; }
  }
`

// ── Tipos ─────────────────────────────────────────────────────────────────────
type EstadoDeuda = "pendiente" | "parcial" | "pagada" | "cancelada"

type Pago = {
  id: string
  monto: number
  notas: string | null
  creado_en: string
}

type Deuda = {
  id: string
  proveedor_id: string
  lote_id: string | null
  monto_original: number
  monto_pagado: number
  monto_pendiente: number
  estado: EstadoDeuda
  notas: string | null
  fecha_vencimiento: string | null
  creado_en: string
  suppliers: { name: string; phone: string | null } | null
  purchase_batches?: { products: { name: string } | null } | null
  pagos_deuda_proveedor?: Pago[]
}

type Stats = {
  saldo_pendiente: number
  total_pagado:    number
  proveedores_con_deuda: number
}

type FilterStatus = "all" | EstadoDeuda

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (v: number) =>
  v.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })

const statusLabel: Record<EstadoDeuda, string> = {
  pendiente: "Pendiente",
  parcial:   "Abonado",
  pagada:    "Pagado",
  cancelada: "Cancelado",
}

// ── Componente ────────────────────────────────────────────────────────────────
interface SupplierDebtsInterfaceProps { companyId: string }

export function SupplierDebtsInterface({ companyId }: SupplierDebtsInterfaceProps) {
  const [debts, setDebts]               = useState<Deuda[]>([])
  const [stats, setStats]               = useState<Stats>({ saldo_pendiente: 0, total_pagado: 0, proveedores_con_deuda: 0 })
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState("")
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")
  const [expandedId, setExpandedId]     = useState<string | null>(null)
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null)
  const [processing, setProcessing]     = useState<string | null>(null)

  const loadDebts = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("deudas_proveedor")
        .select(`
          id, proveedor_id, lote_id,
          monto_original, monto_pagado, monto_pendiente,
          estado, notas, fecha_vencimiento, creado_en,
          suppliers ( name, phone ),
          purchase_batches ( products ( name ) )
        `)
        .eq("empresa_id", companyId)
        .order("creado_en", { ascending: false })

      if (error) throw error
      const rows = (data || []) as unknown as Deuda[]
      setDebts(rows)

      const active = rows.filter(d => d.estado !== "cancelada")
      setStats({
        saldo_pendiente: active.filter(d => d.estado !== "pagada").reduce((s, d) => s + Number(d.monto_pendiente), 0),
        total_pagado:    active.reduce((s, d) => s + Number(d.monto_pagado), 0),
        proveedores_con_deuda: new Set(active.filter(d => d.estado !== "pagada").map(d => d.proveedor_id)).size,
      })
    } catch (err) {
      console.error(err)
    } finally { setLoading(false) }
  }, [companyId])

  useEffect(() => { loadDebts() }, [loadDebts])

  const loadDetail = async (debt: Deuda) => {
    if (debt.pagos_deuda_proveedor) return
    setLoadingDetail(debt.id)
    try {
      const supabase = createClient()
      const { data: pagos } = await supabase
        .from("pagos_deuda_proveedor")
        .select("id, monto, notas, creado_en")
        .eq("deuda_id", debt.id).order("creado_en", { ascending: true })
      setDebts(prev => prev.map(d =>
        d.id === debt.id ? { ...d, pagos_deuda_proveedor: pagos || [] } : d
      ))
    } finally { setLoadingDetail(null) }
  }

  const handleExpand = async (debt: Deuda) => {
    if (expandedId === debt.id) { setExpandedId(null); return }
    setExpandedId(debt.id)
    await loadDetail(debt)
  }

  const handlePago = async (debt: Deuda) => {
    const input = await showInput(
      "Registrar pago",
      `Saldo pendiente: ${fmt(Number(debt.monto_pendiente))}\nIngresa el monto del pago`,
      "number"
    )
    if (input === null) return
    const amount = parseFloat(input)
    if (isNaN(amount) || amount <= 0) return showError("Monto inválido", "")
    if (amount > Number(debt.monto_pendiente))
      return showError(`El pago supera el saldo (${fmt(Number(debt.monto_pendiente))})`, "")

    const formaPago = await showSelect("¿Cómo se pagó?", FORMA_PAGO_OPTS, "efectivo")
    if (formaPago === null) return

    setProcessing(debt.id)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.rpc("rpc_registrar_pago_proveedor", {
        p_deuda_id: debt.id, p_monto: amount, p_user_id: user?.id, p_forma_pago: formaPago,
      })
      if (error) throw error
      await showSuccess(
        `Pago de ${fmt(amount)} registrado correctamente`,
        amount >= Number(debt.monto_pendiente) ? "¡Deuda saldada!" : "Pago registrado"
      )
      await loadDebts()
      setDebts(prev => prev.map(d => d.id === debt.id ? { ...d, pagos_deuda_proveedor: undefined } : d))
    } catch (err) {
      showError(err instanceof Error ? err.message : "Error al registrar pago", "Error")
    } finally { setProcessing(null) }
  }

  const handleMarkPaid = async (debt: Deuda) => {
    if (Number(debt.monto_pendiente) <= 0) return
    const formaPago = await showSelect("¿Cómo se pagó el saldo?", FORMA_PAGO_OPTS, "efectivo")
    if (formaPago === null) return
    setProcessing(debt.id)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.rpc("rpc_registrar_pago_proveedor", {
        p_deuda_id: debt.id, p_monto: Number(debt.monto_pendiente),
        p_notas: "Pago total", p_user_id: user?.id, p_forma_pago: formaPago,
      })
      if (error) throw error
      await showSuccess(`Deuda de ${fmt(Number(debt.monto_original))} saldada`, "¡Pagada!")
      await loadDebts()
      setDebts(prev => prev.map(d => d.id === debt.id ? { ...d, pagos_deuda_proveedor: undefined } : d))
    } catch (err) {
      showError(err instanceof Error ? err.message : "Error", "Error")
    } finally { setProcessing(null) }
  }

  const visible = debts.filter(d => {
    if (filterStatus !== "all" && d.estado !== filterStatus) return false
    if (search) return d.suppliers?.name?.toLowerCase().includes(search.toLowerCase())
    return true
  })

  const filterChips: { key: FilterStatus; label: string; cls: string }[] = [
    { key: "all",       label: "Todas",     cls: "" },
    { key: "pendiente", label: "Pendiente", cls: "pending" },
    { key: "parcial",   label: "Abonado",   cls: "partial" },
    { key: "pagada",    label: "Pagado",    cls: "paid" },
  ]

  const getPct = (d: Deuda) => {
    const orig = Number(d.monto_original)
    if (!orig) return 0
    return Math.min(100, Math.round((Number(d.monto_pagado) / orig) * 100))
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SP_CSS }} />
      <div className="sp-root" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ══ TOTALIZADORES ════════════════════════════════════════════════════ */}
        <div className="sp-stats">
          <div className="sp-stat">
            <p className="sp-stat-label">Saldo pendiente</p>
            <p className="sp-stat-val danger">{fmt(stats.saldo_pendiente)}</p>
            <p className="sp-stat-sub">Por pagar a proveedores</p>
          </div>
          <div className="sp-stat">
            <p className="sp-stat-label">Total pagado</p>
            <p className="sp-stat-val success">{fmt(stats.total_pagado)}</p>
            <p className="sp-stat-sub">Pagos realizados</p>
          </div>
          <div className="sp-stat">
            <p className="sp-stat-label">Proveedores con deuda</p>
            <p className="sp-stat-val">{stats.proveedores_con_deuda}</p>
            <p className="sp-stat-sub">Con saldo pendiente</p>
          </div>
        </div>

        {/* ══ TABLA ════════════════════════════════════════════════════════════ */}
        <div className="sp-card">
          <div className="sp-card-hd">
            <div className="sp-card-hd-icon"><Wallet /></div>
            <p className="sp-card-title">Cuentas por pagar a proveedor</p>
            <button
              onClick={loadDebts} title="Actualizar"
              style={{ marginLeft: "auto", background: "none", border: "1px solid var(--sp-border)", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--sp-muted)" }}
            >
              <RefreshCw size={13} />
            </button>
          </div>

          <div className="sp-filters">
            <div className="sp-input-wrap">
              <span className="sp-input-icon"><Search size={13} /></span>
              <input className="sp-input" placeholder="Buscar proveedor..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="sp-filter-chips">
              {filterChips.map(c => (
                <button
                  key={c.key}
                  className={`sp-chip ${c.cls}${filterStatus === c.key ? " active" : ""}`}
                  onClick={() => setFilterStatus(c.key)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="sp-spinner-wrap"><div className="sp-spinner" /></div>
          ) : visible.length === 0 ? (
            <div className="sp-empty">
              <div className="sp-empty-icon"><DollarSign /></div>
              <p className="sp-empty-title">
                {search || filterStatus !== "all" ? "Sin resultados para ese filtro" : "No hay cuentas por pagar registradas"}
              </p>
              <p className="sp-empty-sub">
                {search || filterStatus !== "all" ? "Intenta con otra búsqueda" : "Las compras a crédito registradas desde Inventario aparecerán aquí"}
              </p>
            </div>
          ) : (
            <div className="sp-table-wrap">
              <table className="sp-table">
                <thead>
                  <tr>
                    <th className="sp-th">Proveedor</th>
                    <th className="sp-th sp-hide-mobile">Producto / lote</th>
                    <th className="sp-th">Saldo</th>
                    <th className="sp-th sp-hide-mobile">Progreso</th>
                    <th className="sp-th">Estado</th>
                    <th className="sp-th" style={{ width: 32 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(debt => {
                    const pct        = getPct(debt)
                    const isExpanded = expandedId === debt.id
                    const isProc     = processing === debt.id
                    const isActive   = debt.estado !== "pagada" && debt.estado !== "cancelada"

                    return (
                      <>
                        <tr
                          key={debt.id}
                          className={`sp-tr${isExpanded ? " expanded" : ""}`}
                          onClick={() => handleExpand(debt)}
                        >
                          <td className="sp-td">
                            <p className="sp-supplier-name">{debt.suppliers?.name ?? "—"}</p>
                            <p className="sp-supplier-sub">Orig: {fmt(Number(debt.monto_original))}</p>
                          </td>
                          <td className="sp-td sp-hide-mobile">
                            <span style={{ fontSize: 12, color: "var(--sp-muted)" }}>
                              {debt.purchase_batches?.products?.name ?? "—"}
                            </span>
                          </td>
                          <td className="sp-td">
                            <span className={`sp-amt ${debt.estado === "pagada" ? "success" : "danger"}`}>
                              {fmt(Number(debt.monto_pendiente))}
                            </span>
                          </td>
                          <td className="sp-td sp-hide-mobile">
                            <div className="sp-progress-wrap">
                              <div className="sp-progress-bar">
                                <div className={`sp-progress-fill ${debt.estado}`} style={{ width: `${pct}%` }} />
                              </div>
                              <span className="sp-progress-pct">{pct}%</span>
                            </div>
                          </td>
                          <td className="sp-td">
                            <span className={`sp-badge ${debt.estado}`}>
                              {debt.estado === "pendiente" && <Clock size={9} />}
                              {debt.estado === "parcial"   && <CreditCard size={9} />}
                              {debt.estado === "pagada"    && <CheckCircle2 size={9} />}
                              {debt.estado === "cancelada" && <X size={9} />}
                              {statusLabel[debt.estado]}
                            </span>
                          </td>
                          <td className="sp-td">
                            {isExpanded
                              ? <ChevronUp size={14} style={{ color: "var(--sp-muted)" }} />
                              : <ChevronDown size={14} style={{ color: "var(--sp-muted)" }} />
                            }
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr key={`${debt.id}-exp`} className="sp-expand-row">
                            <td colSpan={6}>
                              <div className="sp-expand-body">

                                <div className="sp-expand-payments">
                                  <p className="sp-expand-title">Historial de pagos</p>
                                  {loadingDetail === debt.id ? (
                                    <div style={{ display: "flex", justifyContent: "center", padding: 16 }}>
                                      <div className="sp-spinner" />
                                    </div>
                                  ) : (debt.pagos_deuda_proveedor || []).length === 0 ? (
                                    <p style={{ fontSize: 12, color: "var(--sp-muted)" }}>Sin pagos registrados</p>
                                  ) : (debt.pagos_deuda_proveedor || []).map(p => (
                                    <div key={p.id} className="sp-payment-row">
                                      <span className="sp-payment-date">{fmtDate(p.creado_en)}</span>
                                      <span className="sp-payment-amt">+{fmt(Number(p.monto))}</span>
                                    </div>
                                  ))}
                                  {Number(debt.monto_pagado) > 0 && (
                                    <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid var(--sp-border)", display: "flex", justifyContent: "space-between" }}>
                                      <span style={{ fontSize: 10, color: "var(--sp-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Total pagado</span>
                                      <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, color: "var(--sp-paid)" }}>
                                        {fmt(Number(debt.monto_pagado))}
                                      </span>
                                    </div>
                                  )}
                                  {debt.fecha_vencimiento && (
                                    <p style={{ fontSize: 11, color: "var(--sp-muted)", marginTop: 10 }}>
                                      Vence: {fmtDate(debt.fecha_vencimiento)}
                                    </p>
                                  )}
                                  {debt.notas && (
                                    <p style={{ fontSize: 11, color: "var(--sp-muted)", marginTop: 6 }}>{debt.notas}</p>
                                  )}
                                </div>

                                {isActive && (
                                  <div className="sp-expand-actions">
                                    <button
                                      className="sp-action-btn primary"
                                      disabled={!!isProc}
                                      onClick={e => { e.stopPropagation(); handlePago(debt) }}
                                    >
                                      <Plus size={13} />Registrar pago
                                    </button>
                                    <button
                                      className="sp-action-btn success"
                                      disabled={!!isProc}
                                      onClick={e => { e.stopPropagation(); handleMarkPaid(debt) }}
                                    >
                                      <CheckCircle2 size={13} />Marcar pagada
                                    </button>
                                  </div>
                                )}

                                {debt.estado === "pagada" && (
                                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", background: "var(--sp-paid-bg)", color: "var(--sp-paid)", alignSelf: "flex-start" }}>
                                    <CheckCircle2 size={14} />
                                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Deuda saldada</span>
                                  </div>
                                )}

                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </>
  )
}
