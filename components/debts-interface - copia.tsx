"use client"
import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  AlertCircle, CheckCircle2, Clock, DollarSign, Filter,
  MessageCircle, Minus, Plus, Search, Users, X, ChevronDown,
  ChevronUp, CreditCard, RefreshCw, TrendingDown,
} from "lucide-react"
import { showSuccess, showError, showWarning, showInput } from "@/lib/sweetalert"

// ── CSS ───────────────────────────────────────────────────────────────────────
const DEBTS_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  .db-root {
    font-family: 'DM Sans', sans-serif;
    --db-p:       var(--primary, #984ca8);
    --db-p10:     rgba(var(--primary-rgb,152,76,168), 0.10);
    --db-p20:     rgba(var(--primary-rgb,152,76,168), 0.20);
    --db-txt:     #1a1a18;
    --db-muted:   rgba(26,26,24,0.45);
    --db-border:  rgba(26,26,24,0.08);
    /* Semáforo de estados */
    --db-pending: #b45309;  --db-pending-bg: rgba(180,83,9,0.08);
    --db-partial: #0369a1;  --db-partial-bg: rgba(3,105,161,0.08);
    --db-paid:    #15803d;  --db-paid-bg:    rgba(21,128,61,0.08);
    --db-cancel:  rgba(26,26,24,0.4); --db-cancel-bg: rgba(26,26,24,0.06);
  }

  /* ── Totalizadores ── */
  .db-stats {
    display: grid; gap: 12px;
    grid-template-columns: repeat(2, 1fr);
  }
  @media (min-width: 640px) { .db-stats { grid-template-columns: repeat(4, 1fr); } }

  .db-stat {
    background: #fff; border: 1px solid var(--db-border);
    padding: 16px 18px;
  }
  .db-stat-label {
    font-size: 9px; font-weight: 600; letter-spacing: 0.18em;
    text-transform: uppercase; color: var(--db-muted); margin: 0 0 8px;
  }
  .db-stat-val {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 24px; font-weight: 400; margin: 0; line-height: 1; color: var(--db-txt);
  }
  .db-stat-val.danger  { color: var(--db-pending); }
  .db-stat-val.primary { color: var(--db-p); }
  .db-stat-val.success { color: var(--db-paid); }
  .db-stat-sub { font-size: 10px; color: var(--db-muted); margin: 4px 0 0; }

  /* ── Card base ── */
  .db-card { background: #fff; border: 1px solid var(--db-border); overflow: hidden; }
  .db-card-hd {
    padding: 14px 18px 12px; border-bottom: 1px solid var(--db-border);
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  }
  .db-card-hd-icon {
    width: 26px; height: 26px; background: var(--db-p10);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .db-card-hd-icon svg { color: var(--db-p); width: 13px; height: 13px; }
  .db-card-title {
    font-size: 11px; font-weight: 600; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--db-txt); margin: 0;
  }

  /* ── Filtros ── */
  .db-filters {
    display: flex; gap: 8px; align-items: center; flex-wrap: wrap; padding: 14px 18px;
    border-bottom: 1px solid var(--db-border);
  }
  .db-input-wrap { position: relative; flex: 1; min-width: 160px; }
  .db-input-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--db-muted); pointer-events: none; }
  .db-input {
    width: 100%; height: 38px; padding: 0 12px 0 34px;
    border: 1px solid var(--db-border); background: #fff;
    font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--db-txt);
    outline: none; transition: border-color 0.15s; -webkit-appearance: none;
  }
  .db-input:focus { border-color: var(--db-p); }
  .db-input::placeholder { color: var(--db-muted); }

  /* Chips de filtro de estado */
  .db-filter-chips { display: flex; gap: 6px; flex-wrap: wrap; }
  .db-chip {
    padding: 5px 12px; border: 1px solid var(--db-border); background: #fff;
    font-size: 10px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;
    cursor: pointer; color: var(--db-muted); transition: all 0.14s; white-space: nowrap;
  }
  .db-chip:hover { border-color: var(--db-p20); color: var(--db-p); }
  .db-chip.active { background: var(--db-p); border-color: var(--db-p); color: #fff; }
  .db-chip.pending { }
  .db-chip.pending.active { background: var(--db-pending); border-color: var(--db-pending); }
  .db-chip.paid.active    { background: var(--db-paid);    border-color: var(--db-paid); }
  .db-chip.partial.active { background: var(--db-partial); border-color: var(--db-partial); }

  /* ── Tabla de deudas ── */
  .db-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .db-table { width: 100%; border-collapse: collapse; }
  .db-th {
    padding: 10px 16px; text-align: left; background: rgba(26,26,24,0.02);
    font-size: 9px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase;
    color: var(--db-muted); border-bottom: 1px solid var(--db-border); white-space: nowrap;
  }
  .db-th:last-child { text-align: right; }
  .db-tr {
    border-bottom: 1px solid var(--db-border); transition: background 0.12s; cursor: pointer;
  }
  .db-tr:last-child { border-bottom: none; }
  .db-tr:hover { background: rgba(26,26,24,0.02); }
  .db-tr.expanded { background: rgba(26,26,24,0.02); }
  .db-td {
    padding: 13px 16px; font-size: 13px; color: var(--db-txt); vertical-align: middle;
  }
  .db-td:last-child { text-align: right; }

  /* Nombre cliente */
  .db-client-name { font-weight: 500; margin: 0 0 2px; font-size: 13px; }
  .db-client-date { font-size: 10px; color: var(--db-muted); margin: 0; }

  /* Montos */
  .db-amt {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 15px; font-weight: 400;
  }
  .db-amt.danger  { color: var(--db-pending); }
  .db-amt.success { color: var(--db-paid); }
  .db-amt.muted   { color: var(--db-muted); }

  /* Barra de progreso de pago */
  .db-progress-wrap { display: flex; align-items: center; gap: 8px; min-width: 100px; }
  .db-progress-bar  { flex: 1; height: 4px; background: var(--db-border); overflow: hidden; }
  .db-progress-fill { height: 100%; background: var(--db-p); transition: width 0.3s; }
  .db-progress-fill.paid    { background: var(--db-paid); }
  .db-progress-fill.partial { background: var(--db-partial); }
  .db-progress-pct { font-size: 10px; color: var(--db-muted); white-space: nowrap; }

  /* Badge estado */
  .db-badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 8px; font-size: 9px; font-weight: 600;
    letter-spacing: 0.1em; text-transform: uppercase; white-space: nowrap;
  }
  .db-badge.pending { background: var(--db-pending-bg); color: var(--db-pending); }
  .db-badge.partial { background: var(--db-partial-bg); color: var(--db-partial); }
  .db-badge.paid    { background: var(--db-paid-bg);    color: var(--db-paid); }
  .db-badge.cancelled { background: var(--db-cancel-bg); color: var(--db-cancel); }

  /* ── Fila expandida (detalle + acciones) ── */
  .db-expand-row td { padding: 0; }
  .db-expand-body {
    padding: 16px 20px; border-top: 1px solid var(--db-border);
    background: rgba(26,26,24,0.015);
    display: flex; gap: 16px; flex-wrap: wrap;
  }

  /* Sección de productos de la venta */
  .db-expand-items { flex: 1; min-width: 220px; }
  .db-expand-title {
    font-size: 9px; font-weight: 600; letter-spacing: 0.16em;
    text-transform: uppercase; color: var(--db-muted); margin: 0 0 10px;
  }
  .db-item-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--db-border); }
  .db-item-row:last-child { border-bottom: none; }
  .db-item-name { font-size: 12px; color: var(--db-txt); }
  .db-item-price { font-size: 12px; color: var(--db-muted); }

  /* Historial de abonos */
  .db-expand-payments { flex: 1; min-width: 200px; }
  .db-payment-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--db-border); }
  .db-payment-row:last-child { border-bottom: none; }
  .db-payment-date  { font-size: 11px; color: var(--db-muted); }
  .db-payment-amt   { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 14px; color: var(--db-paid); }

  /* Acciones */
  .db-expand-actions { display: flex; flex-direction: column; gap: 8px; min-width: 180px; align-self: flex-start; }
  .db-action-btn {
    display: flex; align-items: center; justify-content: center; gap: 7px;
    width: 100%; height: 40px; border: none; cursor: pointer;
    font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 600;
    letter-spacing: 0.08em; text-transform: uppercase; transition: opacity 0.15s;
  }
  .db-action-btn:hover:not(:disabled) { opacity: 0.85; }
  .db-action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .db-action-btn.primary { background: var(--db-p);       color: #fff; }
  .db-action-btn.success { background: var(--db-paid);    color: #fff; }
  .db-action-btn.wa      { background: #25d366;            color: #fff; }
  .db-action-btn.outline {
    background: transparent; color: var(--db-txt);
    border: 1px solid var(--db-border);
  }
  .db-action-btn.outline:hover:not(:disabled) { border-color: var(--db-p); color: var(--db-p); opacity: 1; }

  /* ── Empty state ── */
  .db-empty {
    padding: 60px 20px; text-align: center;
    display: flex; flex-direction: column; align-items: center; gap: 12px;
  }
  .db-empty-icon {
    width: 56px; height: 56px; background: var(--db-p10);
    display: flex; align-items: center; justify-content: center; border-radius: 50%;
  }
  .db-empty-icon svg { color: var(--db-p); opacity: 0.5; width: 24px; height: 24px; }
  .db-empty-title { font-size: 14px; font-weight: 500; color: var(--db-txt); margin: 0; }
  .db-empty-sub   { font-size: 12px; color: var(--db-muted); margin: 0; }

  /* ── Spinner ── */
  .db-spinner-wrap { padding: 40px; display: flex; justify-content: center; }
  .db-spinner {
    width: 24px; height: 24px; border: 2px solid var(--db-border);
    border-top-color: var(--db-p); border-radius: 50%;
    animation: db-spin 0.7s linear infinite;
  }
  @keyframes db-spin { to { transform: rotate(360deg); } }

  /* ── Responsive ── */
  @media (max-width: 640px) {
    .db-hide-mobile { display: none; }
    .db-td, .db-th  { padding: 10px 12px; }
    .db-expand-body  { flex-direction: column; }
    .db-expand-actions { width: 100%; }
  }
`

// ── Tipos ─────────────────────────────────────────────────────────────────────
type DebtStatus = "pending" | "partial" | "paid" | "cancelled"

type SaleItem = {
  id: string
  product_id: string
  quantity: number
  unit_price: number
  subtotal: number
  products: { name: string }
}

type DebtPayment = {
  id: string
  amount: number
  notes: string | null
  created_at: string
}

type Debt = {
  id: string
  sale_id: string
  client_id: string
  original_amount: number
  paid_amount: number
  remaining_amount: number
  status: DebtStatus
  notes: string | null
  due_date: string | null
  created_at: string
  paid_at: string | null
  clients: { name: string; phone: string | null }
  sales: { created_at: string }
  // cargados bajo demanda
  sale_items?: SaleItem[]
  debt_payments?: DebtPayment[]
}

type Stats = {
  total_deudas:   number
  saldo_pendiente: number
  total_cobrado:  number
  deudores:       number
}

type FilterStatus = "all" | DebtStatus

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (v: number) =>
  v.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })

const statusLabel: Record<DebtStatus, string> = {
  pending:   "Pendiente",
  partial:   "Abonado",
  paid:      "Pagado",
  cancelled: "Cancelado",
}

// ── Componente principal ──────────────────────────────────────────────────────
interface DebtsInterfaceProps { companyId: string }

export function DebtsInterface({ companyId }: DebtsInterfaceProps) {
  const [debts, setDebts]           = useState<Debt[]>([])
  const [stats, setStats]           = useState<Stats>({ total_deudas: 0, saldo_pendiente: 0, total_cobrado: 0, deudores: 0 })
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState("")
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)   // id de la deuda en proceso

  // ── Carga de deudas ────────────────────────────────────────────────────────
  const loadDebts = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("customer_debts")
        .select(`
          id, sale_id, client_id,
          original_amount, paid_amount, remaining_amount,
          status, notes, due_date, created_at, paid_at,
          clients ( name, phone ),
          sales   ( created_at )
        `)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })

      if (error) throw error
      const rows = (data || []) as Debt[]
      setDebts(rows)

      // Calcular totalizadores
      const active = rows.filter(d => d.status !== "cancelled")
      setStats({
        total_deudas:    active.length,
        saldo_pendiente: active.filter(d => d.status !== "paid").reduce((s, d) => s + Number(d.remaining_amount), 0),
        total_cobrado:   active.reduce((s, d) => s + Number(d.paid_amount), 0),
        deudores:        new Set(active.filter(d => d.status !== "paid").map(d => d.client_id)).size,
      })
    } catch (err) {
      console.error(err)
    } finally { setLoading(false) }
  }, [companyId])

  useEffect(() => { loadDebts() }, [loadDebts])

  // ── Cargar detalle (items + pagos) de una deuda ────────────────────────────
  const loadDetail = async (debt: Debt) => {
    if (debt.sale_items) return   // ya cargado
    setLoadingDetail(debt.id)
    try {
      const supabase = createClient()
      const [{ data: items }, { data: payments }] = await Promise.all([
        supabase.from("sale_items")
          .select("id, product_id, quantity, unit_price, subtotal, products(name)")
          .eq("sale_id", debt.sale_id).eq("company_id", companyId),
        supabase.from("debt_payments")
          .select("id, amount, notes, created_at")
          .eq("debt_id", debt.id).order("created_at", { ascending: true }),
      ])
      setDebts(prev => prev.map(d => d.id === debt.id
        ? { ...d, sale_items: items || [], debt_payments: payments || [] } : d))
    } finally { setLoadingDetail(null) }
  }

  const handleExpand = async (debt: Debt) => {
    if (expandedId === debt.id) { setExpandedId(null); return }
    setExpandedId(debt.id)
    await loadDetail(debt)
  }

  // ── Registrar abono ────────────────────────────────────────────────────────
  const handleAbono = async (debt: Debt) => {
    const input = await showInput(
      "Registrar abono",
      `Saldo pendiente: ${fmt(Number(debt.remaining_amount))}\nIngresa el monto del abono`,
      "number"
    )
    if (input === null) return
    const amount = parseFloat(input)
    if (isNaN(amount) || amount <= 0) return showError("Monto inválido", "")
    if (amount > Number(debt.remaining_amount))
      return showError(`El abono supera el saldo (${fmt(Number(debt.remaining_amount))})`, "")

    setProcessing(debt.id)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase.rpc("register_debt_payment", {
        p_debt_id:  debt.id,
        p_amount:   amount,
        p_user_id:  user?.id,
      })
      if (error) throw error

      await showSuccess(
        `Abono de ${fmt(amount)} registrado correctamente`,
        amount >= Number(debt.remaining_amount) ? "¡Deuda saldada!" : "Abono registrado"
      )
      await loadDebts()
      // Refrescar detalle si estaba expandido
      setDebts(prev => prev.map(d => d.id === debt.id ? { ...d, sale_items: undefined, debt_payments: undefined } : d))
    } catch (err) {
      showError(err instanceof Error ? err.message : "Error al registrar abono", "Error")
    } finally { setProcessing(null) }
  }

  // ── Marcar pagada completa ────────────────────────────────────────────────
  const handleMarkPaid = async (debt: Debt) => {
    if (Number(debt.remaining_amount) <= 0) return
    setProcessing(debt.id)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.rpc("register_debt_payment", {
        p_debt_id: debt.id,
        p_amount:  Number(debt.remaining_amount),
        p_notes:   "Pago total",
        p_user_id: user?.id,
      })
      if (error) throw error
      await showSuccess(`Deuda de ${fmt(Number(debt.original_amount))} saldada`, "¡Pagada!")
      await loadDebts()
      setDebts(prev => prev.map(d => d.id === debt.id ? { ...d, sale_items: undefined, debt_payments: undefined } : d))
    } catch (err) {
      showError(err instanceof Error ? err.message : "Error", "Error")
    } finally { setProcessing(null) }
  }

  // ── Enviar WhatsApp ───────────────────────────────────────────────────────
  const handleWhatsApp = async (debt: Debt) => {
    const phone = debt.clients?.phone
    if (!phone) return showWarning("Sin teléfono", "El cliente no tiene número de WhatsApp registrado")

    // Cargar items si hace falta
    let items = debt.sale_items
    if (!items) {
      const supabase = createClient()
      const { data } = await supabase.from("sale_items")
        .select("id, quantity, unit_price, subtotal, products(name)")
        .eq("sale_id", debt.sale_id).eq("company_id", companyId)
      items = data || []
      setDebts(prev => prev.map(d => d.id === debt.id ? { ...d, sale_items: items } : d))
    }

    // Cargar plantilla de la BD
    const supabase = createClient()
    const { data: setting } = await supabase
      .from("companies")
      .select("plantilla_cobro,name")
      .eq("id", companyId)
      .single()

    const itemLines = (items || [])
      .map(i => `• ${(i.products as any)?.name ?? "Producto"} × ${i.quantity}  ${fmt(Number(i.subtotal))}`)
      .join("\n")
    // Plantilla por defecto si no hay configuración
    const template = setting?.plantilla_cobro ??
      `👋 Hola *{cliente}*, te contactamos para recordarte una deuda pendiente con nosotros.\n\n📋 Detalle:\n{productos}\n\n💰 Total: *{total}*\n✅ Pagado: *{pagado}*\n⏳ Saldo pendiente: *{saldo}*\n\nPor favor coordina tu pago. ¡Gracias! 🙏`

    const msg = template
      .replace(/{cliente}/g,  debt.clients?.name ?? "Cliente")
      .replace(/{empresa}/g,  setting?.name)
      .replace(/{productos}/g, itemLines)
      .replace(/{total}/g,    fmt(Number(debt.original_amount)))
      .replace(/{pagado}/g,   fmt(Number(debt.paid_amount)))
      .replace(/{saldo}/g,    fmt(Number(debt.remaining_amount)))
      .replace(/{fecha}/g,    fmtDate(debt.created_at))
    
    const cleanPhone = phone.replace(/\D/g, "")
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`
    window.open(url, "_blank", "noopener")
  }

  // ── Filtrado ──────────────────────────────────────────────────────────────
  const visible = debts.filter(d => {
    if (filterStatus !== "all" && d.status !== filterStatus) return false
    if (search) {
      const q = search.toLowerCase()
      return d.clients?.name?.toLowerCase().includes(q)
    }
    return true
  })

  const filterChips: { key: FilterStatus; label: string; className: string }[] = [
    { key: "all",       label: "Todas",     className: "" },
    { key: "pending",   label: "Pendiente", className: "pending" },
    { key: "partial",   label: "Abonado",   className: "partial" },
    { key: "paid",      label: "Pagado",    className: "paid" },
  ]

  // ── Progreso de pago ──────────────────────────────────────────────────────
  const getPct = (d: Debt) => {
    const orig = Number(d.original_amount)
    if (!orig) return 0
    return Math.min(100, Math.round((Number(d.paid_amount) / orig) * 100))
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: DEBTS_CSS }} />
      <div className="db-root" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ══ TOTALIZADORES ═══════════════════════════════════════════════════ */}
        <div className="db-stats">
          {/* Saldo pendiente total */}
          <div className="db-stat">
            <p className="db-stat-label">Saldo pendiente</p>
            <p className="db-stat-val danger">{fmt(stats.saldo_pendiente)}</p>
            <p className="db-stat-sub">{stats.total_deudas} deuda{stats.total_deudas !== 1 ? "s" : ""} activa{stats.total_deudas !== 1 ? "s" : ""}</p>
          </div>

          {/* Total cobrado */}
          <div className="db-stat">
            <p className="db-stat-label">Total cobrado</p>
            <p className="db-stat-val success">{fmt(stats.total_cobrado)}</p>
            <p className="db-stat-sub">Abonos recibidos</p>
          </div>

          {/* Deudores activos */}
          <div className="db-stat">
            <p className="db-stat-label">Clientes con deuda</p>
            <p className="db-stat-val primary">{stats.deudores}</p>
            <p className="db-stat-sub">Con saldo pendiente</p>
          </div>

          {/* Total comprometido */}
          <div className="db-stat">
            <p className="db-stat-label">Total comprometido</p>
            <p className="db-stat-val">{fmt(stats.saldo_pendiente + stats.total_cobrado)}</p>
            <p className="db-stat-sub">Deudas originales</p>
          </div>
        </div>

        {/* ══ TABLA DE DEUDAS ══════════════════════════════════════════════════ */}
        <div className="db-card">
          {/* Header con botón refresh */}
          <div className="db-card-hd">
            <div className="db-card-hd-icon"><TrendingDown /></div>
            <p className="db-card-title">Control de deudas</p>
            <button
              onClick={loadDebts}
              title="Actualizar"
              style={{
                marginLeft: "auto", background: "none", border: "1px solid var(--db-border)",
                width: 32, height: 32, cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", color: "var(--db-muted)",
                transition: "color 0.15s",
              }}
            >
              <RefreshCw size={13} />
            </button>
          </div>

          {/* Filtros */}
          <div className="db-filters">
            {/* Búsqueda */}
            <div className="db-input-wrap">
              <span className="db-input-icon"><Search size={13} /></span>
              <input className="db-input" placeholder="Buscar cliente..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Chips de estado */}
            <div className="db-filter-chips">
              {filterChips.map(c => (
                <button
                  key={c.key}
                  className={`db-chip ${c.className}${filterStatus === c.key ? " active" : ""}`}
                  onClick={() => setFilterStatus(c.key)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tabla */}
          {loading ? (
            <div className="db-spinner-wrap"><div className="db-spinner" /></div>
          ) : visible.length === 0 ? (
            <div className="db-empty">
              <div className="db-empty-icon"><DollarSign /></div>
              <p className="db-empty-title">
                {search || filterStatus !== "all"
                  ? "Sin resultados para ese filtro"
                  : "No hay deudas registradas"}
              </p>
              <p className="db-empty-sub">
                {search || filterStatus !== "all"
                  ? "Intenta con otra búsqueda"
                  : "Las ventas a crédito aparecerán aquí"}
              </p>
            </div>
          ) : (
            <div className="db-table-wrap">
              <table className="db-table">
                <thead>
                  <tr>
                    <th className="db-th">Cliente</th>
                    <th className="db-th db-hide-mobile">Fecha venta</th>
                    <th className="db-th">Saldo</th>
                    <th className="db-th db-hide-mobile">Progreso</th>
                    <th className="db-th">Estado</th>
                    <th className="db-th" style={{ width: 32 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(debt => {
                    const pct = getPct(debt)
                    const isExpanded = expandedId === debt.id
                    const isProc    = processing === debt.id
                    return (
                      <>
                        {/* Fila principal */}
                        <tr
                          key={debt.id}
                          className={`db-tr${isExpanded ? " expanded" : ""}`}
                          onClick={() => handleExpand(debt)}
                        >
                          <td className="db-td">
                            <p className="db-client-name">{debt.clients?.name}</p>
                            <p className="db-client-date">Orig: {fmt(Number(debt.original_amount))}</p>
                          </td>

                          <td className="db-td db-hide-mobile">
                            <span style={{ fontSize: 12, color: "var(--db-muted)" }}>
                              {debt.sales?.created_at ? fmtDate(debt.sales.created_at) : "—"}
                            </span>
                          </td>

                          <td className="db-td">
                            <span className={`db-amt ${debt.status === "paid" ? "success" : "danger"}`}>
                              {fmt(Number(debt.remaining_amount))}
                            </span>
                          </td>

                          <td className="db-td db-hide-mobile">
                            <div className="db-progress-wrap">
                              <div className="db-progress-bar">
                                <div
                                  className={`db-progress-fill ${debt.status}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="db-progress-pct">{pct}%</span>
                            </div>
                          </td>

                          <td className="db-td">
                            <span className={`db-badge ${debt.status}`}>
                              {debt.status === "pending"   && <Clock size={9} />}
                              {debt.status === "partial"   && <CreditCard size={9} />}
                              {debt.status === "paid"      && <CheckCircle2 size={9} />}
                              {debt.status === "cancelled" && <X size={9} />}
                              {statusLabel[debt.status]}
                            </span>
                          </td>

                          <td className="db-td">
                            {isExpanded
                              ? <ChevronUp size={14} style={{ color: "var(--db-muted)" }} />
                              : <ChevronDown size={14} style={{ color: "var(--db-muted)" }} />
                            }
                          </td>
                        </tr>

                        {/* Fila expandida */}
                        {isExpanded && (
                          <tr key={`${debt.id}-exp`} className="db-expand-row">
                            <td colSpan={6}>
                              <div className="db-expand-body">

                                {/* Productos de la venta */}
                                <div className="db-expand-items">
                                  <p className="db-expand-title">Productos en la venta</p>
                                  {loadingDetail === debt.id ? (
                                    <div style={{ display: "flex", justifyContent: "center", padding: 16 }}>
                                      <div className="db-spinner" />
                                    </div>
                                  ) : (debt.sale_items || []).length === 0 ? (
                                    <p style={{ fontSize: 12, color: "var(--db-muted)" }}>Sin items</p>
                                  ) : (debt.sale_items || []).map(item => (
                                    <div key={item.id} className="db-item-row">
                                      <span className="db-item-name">
                                        {(item.products as any)?.name ?? "—"} × {item.quantity}
                                      </span>
                                      <span className="db-item-price">{fmt(Number(item.subtotal))}</span>
                                    </div>
                                  ))}
                                </div>

                                {/* Historial de abonos */}
                                <div className="db-expand-payments">
                                  <p className="db-expand-title">Historial de abonos</p>
                                  {(debt.debt_payments || []).length === 0 ? (
                                    <p style={{ fontSize: 12, color: "var(--db-muted)" }}>Sin abonos registrados</p>
                                  ) : (debt.debt_payments || []).map(p => (
                                    <div key={p.id} className="db-payment-row">
                                      <span className="db-payment-date">{fmtDate(p.created_at)}</span>
                                      <span className="db-payment-amt">+{fmt(Number(p.amount))}</span>
                                    </div>
                                  ))}
                                  {/* Resumen */}
                                  {Number(debt.paid_amount) > 0 && (
                                    <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid var(--db-border)", display: "flex", justifyContent: "space-between" }}>
                                      <span style={{ fontSize: 10, color: "var(--db-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Total abonado</span>
                                      <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, color: "var(--db-paid)" }}>
                                        {fmt(Number(debt.paid_amount))}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Botones de acción */}
                                {debt.status !== "paid" && debt.status !== "cancelled" && (
                                  <div className="db-expand-actions">
                                    {/* Registrar abono */}
                                    <button
                                      className="db-action-btn primary"
                                      disabled={!!isProc}
                                      onClick={e => { e.stopPropagation(); handleAbono(debt) }}
                                    >
                                      <Plus size={13} />
                                      Registrar abono
                                    </button>

                                    {/* Marcar pagada total */}
                                    <button
                                      className="db-action-btn success"
                                      disabled={!!isProc}
                                      onClick={e => { e.stopPropagation(); handleMarkPaid(debt) }}
                                    >
                                      <CheckCircle2 size={13} />
                                      Marcar pagada
                                    </button>

                                    {/* WhatsApp recordatorio */}
                                    <button
                                      className="db-action-btn wa"
                                      disabled={!debt.clients?.phone}
                                      title={!debt.clients?.phone ? "El cliente no tiene teléfono" : ""}
                                      onClick={e => { e.stopPropagation(); handleWhatsApp(debt) }}
                                    >
                                      <MessageCircle size={13} />
                                      Recordatorio WS
                                    </button>
                                  </div>
                                )}

                                {/* Si ya está pagada, solo WA */}
                                {debt.status === "paid" && (
                                  <div className="db-expand-actions">
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", background: "var(--db-paid-bg)", color: "var(--db-paid)" }}>
                                      <CheckCircle2 size={14} />
                                      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                                        Deuda saldada
                                      </span>
                                    </div>
                                    {debt.paid_at && (
                                      <span style={{ fontSize: 10, color: "var(--db-muted)", textAlign: "center" }}>
                                        {fmtDate(debt.paid_at)}
                                      </span>
                                    )}
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
