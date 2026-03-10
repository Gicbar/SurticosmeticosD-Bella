// ════════════════════════════════════════════════════════════════
// app/dashboard/sales/page.tsx
// ════════════════════════════════════════════════════════════════
import { getUserPermissions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { SalesTable } from "@/components/sales-table"
import { SalesFilters } from "@/components/sales-filters"
import { ExportSalesButton } from "@/components/export-sales-button"
import { ShoppingCart, DollarSign, Banknote, Clock, AlertTriangle } from "lucide-react"
import { redirect } from "next/navigation"

// ── Zona horaria Colombia: UTC-5 sin DST ─────────────────────────────────────
// El servidor corre en UTC. Corregimos restando 5h para obtener la fecha local.
const COL_OFFSET_MS = 5 * 60 * 60 * 1000

/** Convierte un Date UTC al equivalente en hora Colombia (solo para cálculos de fecha) */
function toColombiaDate(utc: Date): Date {
  return new Date(utc.getTime() - COL_OFFSET_MS)
}

/** Inicio del mes actual expresado en UTC, pero referenciado a medianoche Colombia */
function mesActualUTC(): { firstDay: Date; nextMonth: Date } {
  const local = toColombiaDate(new Date())
  const y = local.getUTCFullYear()
  const m = local.getUTCMonth()
  // medianoche 00:00 Colombia = 05:00 UTC
  const firstDay  = new Date(Date.UTC(y, m,     1, 5, 0, 0))
  const nextMonth = new Date(Date.UTC(y, m + 1, 1, 5, 0, 0))
  return { firstDay, nextMonth }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v: number) =>
  v.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })

function pct(part: number, total: number): string {
  if (!total) return "0%"
  return `${Math.round((part / total) * 100)}%`
}

/** Suma todos los debt_payments de una deuda */
function sumaAbonos(debt: any): number {
  return ((debt?.debt_payments ?? []) as any[])
    .reduce((s: number, p: any) => s + Number(p.amount || 0), 0)
}

// ── CSS ──────────────────────────────────────────────────────────────────────
const PAGE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');

  .sp-root {
    font-family: 'DM Sans', sans-serif;
    --sp-p:       var(--primary, #984ca8);
    --sp-p10:     rgba(var(--primary-rgb, 152,76,168), 0.10);
    --sp-txt:     #1a1a18;
    --sp-muted:   rgba(26,26,24, .45);
    --sp-border:  rgba(26,26,24, 0.08);
    --sp-ok:      #16a34a;
    --sp-ok-bg:   rgba(22,163,74, 0.07);
    --sp-ok-br:   rgba(22,163,74, 0.20);
    --sp-credit:  #b45309;
    --sp-cred-bg: rgba(180,83,9, 0.07);
    --sp-cred-br: rgba(180,83,9, 0.20);
    --sp-danger:  #dc2626;
    --sp-dan-bg:  rgba(220,38,38, 0.06);
    --sp-dan-br:  rgba(220,38,38, 0.20);
  }

  /* ── Header ── */
  .sp-header {
    display: flex; flex-direction: column; gap: 16px;
    padding-bottom: 22px; border-bottom: 1px solid var(--sp-border); margin-bottom: 24px;
  }
  @media (min-width: 640px) {
    .sp-header { flex-direction: row; align-items: center; justify-content: space-between; }
  }
  .sp-title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 22px; font-weight: 400; color: var(--sp-txt); margin: 0;
    display: flex; align-items: center; gap: 10px;
  }
  .sp-title-dot { width: 8px; height: 8px; background: var(--sp-p); flex-shrink: 0; }
  .sp-sub { font-size: 12px; color: var(--sp-muted); margin: 3px 0 0; }

  /* ── KPIs ── */
  .sp-kpis {
    display: grid; gap: 12px; grid-template-columns: 1fr;
    margin-bottom: 12px;
  }
  @media (min-width: 480px) { .sp-kpis { grid-template-columns: repeat(2, 1fr); } }

  .sp-kpi {
    background: #fff; border: 1px solid var(--sp-border); padding: 16px 18px;
    display: flex; align-items: center; gap: 14px;
    transition: box-shadow 0.18s, transform 0.18s; position: relative; overflow: hidden;
  }
  .sp-kpi:hover { box-shadow: 0 4px 16px var(--sp-p10); transform: translateY(-1px); }
  .sp-kpi::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: var(--sp-p); opacity: 0; transition: opacity 0.18s;
  }
  .sp-kpi:hover::before { opacity: 1; }
  .sp-kpi-ico {
    width: 38px; height: 38px; background: var(--sp-p10);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .sp-kpi-ico svg { color: var(--sp-p); width: 16px; height: 16px; }
  .sp-kpi-lbl {
    font-size: 9px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--sp-muted); margin: 0 0 4px;
  }
  .sp-kpi-val {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 22px; font-weight: 500; color: var(--sp-txt); margin: 0; line-height: 1;
  }
  .sp-kpi-sub { font-size: 10px; color: var(--sp-muted); margin: 3px 0 0; }

  /* ── Cards de cartera ── */
  .sp-carteras {
    display: grid; gap: 12px; grid-template-columns: 1fr; margin-bottom: 20px;
  }
  @media (min-width: 700px)  { .sp-carteras { grid-template-columns: 1fr 1fr; } }
  @media (min-width: 1100px) { .sp-carteras { grid-template-columns: 1fr 1fr 1fr; } }

  .sp-card {
    background: #fff; border: 1px solid var(--sp-border);
    position: relative; overflow: hidden;
    transition: box-shadow 0.18s, transform 0.18s;
  }
  .sp-card:hover { transform: translateY(-1px); box-shadow: 0 4px 18px rgba(26,26,24,.07); }

  /* Franja top de color por variante */
  .sp-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
  }
  .sp-card.ok     ::before, .sp-card.ok    ::before { background: var(--sp-ok); }
  .sp-card.warn   ::before { background: var(--sp-credit); }
  .sp-card.danger ::before { background: var(--sp-danger); }
  /* Hack: ::before en el elemento raíz */
  .sp-card.ok     { border-top: 3px solid var(--sp-ok); }
  .sp-card.warn   { border-top: 3px solid var(--sp-credit); }
  .sp-card.danger { border-top: 3px solid var(--sp-danger); }

  /* Header del card */
  .sp-card-hd {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 18px 12px; border-bottom: 1px solid var(--sp-border);
  }
  .sp-card-hd-left { display: flex; align-items: center; gap: 10px; }

  .sp-card-ico {
    width: 30px; height: 30px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .sp-card.ok     .sp-card-ico { background: var(--sp-ok-bg); }
  .sp-card.ok     .sp-card-ico svg { color: var(--sp-ok);     width:13px; height:13px; }
  .sp-card.warn   .sp-card-ico { background: var(--sp-cred-bg); }
  .sp-card.warn   .sp-card-ico svg { color: var(--sp-credit); width:13px; height:13px; }
  .sp-card.danger .sp-card-ico { background: var(--sp-dan-bg); }
  .sp-card.danger .sp-card-ico svg { color: var(--sp-danger); width:13px; height:13px; }

  .sp-card-title {
    font-size: 9px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--sp-muted); margin: 0;
  }
  .sp-card-pill {
    font-size: 9px; font-weight: 700; padding: 2px 7px; letter-spacing: .06em; margin-left: 6px;
  }
  .sp-card.ok     .sp-card-pill { background: var(--sp-ok-bg);   color: var(--sp-ok); }
  .sp-card.warn   .sp-card-pill { background: var(--sp-cred-bg); color: var(--sp-credit); }
  .sp-card.danger .sp-card-pill { background: var(--sp-dan-bg);  color: var(--sp-danger); }

  .sp-card-total {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 20px; font-weight: 500; line-height: 1;
  }
  .sp-card.ok     .sp-card-total { color: var(--sp-ok); }
  .sp-card.warn   .sp-card-total { color: var(--sp-credit); }
  .sp-card.danger .sp-card-total { color: var(--sp-danger); }

  /* Filas del card */
  .sp-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 11px 18px; border-bottom: 1px solid var(--sp-border); gap: 12px;
  }
  .sp-row:last-child { border-bottom: none; }
  .sp-row-left { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .sp-row-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .sp-row-lbl { font-size: 11px; color: var(--sp-txt); }
  .sp-row-sub { font-size: 10px; color: var(--sp-muted); margin-top: 1px; }
  .sp-row-val {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 15px; font-weight: 500; white-space: nowrap; flex-shrink: 0;
  }

  /* Variantes de fila */
  .sp-row.r-ok     .sp-row-dot { background: var(--sp-ok); }
  .sp-row.r-ok     .sp-row-val { color: var(--sp-ok); }
  .sp-row.r-warn   .sp-row-dot { background: var(--sp-credit); }
  .sp-row.r-warn   .sp-row-val { color: var(--sp-credit); }
  .sp-row.r-danger .sp-row-dot { background: var(--sp-danger); }
  .sp-row.r-danger .sp-row-val { color: var(--sp-danger); }
  .sp-row.r-muted  .sp-row-dot { background: rgba(26,26,24,.2); }
  .sp-row.r-muted  .sp-row-val { color: var(--sp-muted); }

  /* Barra de progreso */
  .sp-progress {
    padding: 10px 18px 14px; border-top: 1px solid var(--sp-border);
  }
  .sp-progress-hd {
    display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;
  }
  .sp-progress-lbl { font-size: 9px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--sp-muted); }
  .sp-progress-pct { font-size: 10px; font-weight: 700; color: var(--sp-ok); }
  .sp-progress-track { width: 100%; height: 5px; background: rgba(26,26,24,.07); overflow: hidden; }
  .sp-progress-fill  { height: 100%; background: var(--sp-ok); transition: width .3s; }

  /* Pill de antigüedad */
  .sp-age-pill {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 8px; font-size: 9px; font-weight: 700; letter-spacing: .06em;
    background: var(--sp-dan-bg); color: var(--sp-danger); white-space: nowrap;
  }

  /* Secciones */
  .sp-section { margin-bottom: 16px; }
  .sp-table-wrap { background: #fff; border: 1px solid var(--sp-border); overflow: hidden; }
`

// ── Labels de método de pago ─────────────────────────────────────────────────
const METHOD_LABELS: Record<string, string> = {
  efectivo:       "Efectivo",
  tarjeta:        "Tarjeta",
  transferencia:  "Transferencia",
  credito:        "Crédito",
}

// ── Página ───────────────────────────────────────────────────────────────────
export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; client?: string }>
}) {
  const permissionsData = await getUserPermissions()
  const perms = permissionsData?.permissions
  if (!perms?.ventas) redirect("/dashboard")
  const companyId = permissionsData.company_id
  if (!companyId) redirect("/auth/sin-empresa")

  const showFinancials = perms?.rentabilidad === true
  const params   = await searchParams
  const supabase = await createClient()

  const { firstDay, nextMonth } = mesActualUTC()

  // ── Query 1: ventas del período para la tabla ─────────────────────────────
  let selectQuery =
    "id, total, payment_method, sale_date, is_credit, clients(name), " +
    "customer_debts(status, original_amount, debt_payments(amount))"
  if (showFinancials) selectQuery += ", sales_profit(profit, profit_margin)"

  let q = supabase
    .from("sales")
    .select(selectQuery)
    .eq("company_id", companyId)
    .gte("sale_date", firstDay.toISOString())
    .lt("sale_date",  nextMonth.toISOString())
    .order("sale_date", { ascending: false })

  if (params.from)  q = q.gte("sale_date", params.from)
  if (params.to)    q = q.lte("sale_date", params.to)
  if (params.client && params.client !== "all") q = q.eq("client_id", params.client)

  // ── Query 2: cartera vencida — créditos de meses anteriores aún abiertos ──
  // Independiente de los filtros de la tabla para mostrar siempre la foto real.
  const [{ data: sales }, { data: rawVencidas }] = await Promise.all([
    q,
    supabase
      .from("sales")
      .select("id, total, sale_date, clients(name), customer_debts(status, original_amount, debt_payments(amount))")
      .eq("company_id", companyId)
      .eq("is_credit", true)
      .lt("sale_date", firstDay.toISOString())
      .order("sale_date", { ascending: false }),
  ])


  const all = sales || []

  // ════════════════════════════════════════════════════════════════
  // CÁLCULOS DE CARTERA
  // ════════════════════════════════════════════════════════════════
  // Reglas:
  //  · CORRIENTE  = todo el dinero que YA ENTRÓ A CAJA en el período:
  //                 (a) ventas al contado (total completo)
  //                 (b) créditos con status="paid" (total completo, ya fue cobrado)
  //                 (c) abonos recibidos en créditos aún abiertos (partial/pending)
  //
  //  · FINANCIADA = dinero que TODAVÍA FALTA cobrar del mes actual:
  //                 sum(original_amount - abonos) para créditos pending/partial
  //
  //  · VENCIDA    = mismo cálculo que financiada pero de meses anteriores
  // ════════════════════════════════════════════════════════════════

  /** Estado de la deuda de una venta */
  const dStatus = (s: any): string | null => s.customer_debts?.[0]?.status ?? null
  const dDebt   = (s: any) => s.customer_debts?.[0] ?? null

  // ── Totales brutos del período ────────────────────────────────────────────
  const totalVentas = all.length
  const totalBruto  = all.reduce((s, v) => s + Number(v.total), 0)

  // ── (a) Contado puro: ventas NO a crédito ────────────────────────────────
  const ventasContado     = all.filter(s => !s.is_credit)
  const totalContado      = ventasContado.reduce((s, v) => s + Number(v.total), 0)

  // Desglose por método para mostrar en el card
  const contadoPorMetodo = ventasContado.reduce<Record<string, { total: number; count: number }>>((acc, s) => {
    const key = s.payment_method || "otro"
    if (!acc[key]) acc[key] = { total: 0, count: 0 }
    acc[key].total += Number(s.total)
    acc[key].count += 1
    return acc
  }, {})

  // ── (b) Créditos pagados: dinero ya cobrado, va a corriente ──────────────
  const creditosPagados  = all.filter(s => s.is_credit && dStatus(s) === "paid")
  const totalCreditoPago = creditosPagados.reduce((s, v) => s + Number(v.total), 0)

  // ── (c) Abonos sobre créditos aún abiertos ───────────────────────────────
  const creditosAbiertos  = all.filter(s => s.is_credit && (dStatus(s) === "partial" || dStatus(s) === "pending"))
  const totalAbonosActivos = creditosAbiertos.reduce((s, v) => s + sumaAbonos(dDebt(v)), 0)

  // ── Cartera CORRIENTE (total que entró) ──────────────────────────────────
  // = contado + créditos cobrados + abonos de créditos abiertos
  const totalCorriente = totalContado + totalCreditoPago + totalAbonosActivos

  // ── Cartera FINANCIADA (pendiente neto del mes) ──────────────────────────
  // = sum(original_amount - abonos) de créditos aún abiertos
  const totalBrutoFinanciado = creditosAbiertos.reduce((s, v) =>
    s + Number(dDebt(v)?.original_amount ?? v.total), 0
  )
  const totalAbonadoFin = totalAbonosActivos  // ya calculado arriba
  const totalPorCobrar  = Math.max(0, totalBrutoFinanciado - totalAbonadoFin)

  const cuentasPendientes = creditosAbiertos.filter(s => dStatus(s) === "pending").length
  const cuentasAbonadas   = creditosAbiertos.filter(s => dStatus(s) === "partial").length

  const pctRecaudado = totalBrutoFinanciado > 0
    ? Math.min(100, Math.round((totalAbonadoFin / totalBrutoFinanciado) * 100))
    : 0

  // ── Cartera VENCIDA (meses anteriores, aún abierta) ──────────────────────
  const vencidas = (rawVencidas || []).filter(s =>
    s.customer_debts?.[0]?.status === "pending" ||
    s.customer_debts?.[0]?.status === "partial"
  )
  
  
  const totalBrutoVencido    = vencidas.reduce((s, v) => s + Number(dDebt(v)?.original_amount ?? v.total), 0)
  const totalAbonadoVencido  = vencidas.reduce((s, v) => s + sumaAbonos(dDebt(v)), 0)

  console.log(totalBrutoVencido)
  console.log(totalAbonadoVencido)
  
  const totalVencidoNeto     = Math.max(0, totalBrutoVencido - totalAbonadoVencido)
  const cuentasVencPendientes = vencidas.filter(s => s.customer_debts?.[0]?.status === "pending").length
  const cuentasVencAbonadas   = vencidas.filter(s => s.customer_debts?.[0]?.status === "partial").length

  const pctRecaudadoVenc = totalBrutoVencido > 0
    ? Math.min(100, Math.round((totalAbonadoVencido / totalBrutoVencido) * 100))
    : 0

  const fechaMasAntigua = vencidas.length > 0
    ? new Date(Math.min(...vencidas.map(s => new Date(s.sale_date).getTime())))
    : null
  const mesesVencidos = fechaMasAntigua
    ? Math.max(1, Math.floor((Date.now() - fechaMasAntigua.getTime()) / (1000 * 60 * 60 * 24 * 30)))
    : 0

  // ── Total real recaudado en el período ────────────────────────────────────
  // = lo que ya entró + lo que aún falta = totalBruto (para el KPI de total)
  // Pero para "total recaudado" mostramos corriente (lo que entró de verdad)
  const totalRecaudado = totalCorriente

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <div className="sp-root">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="sp-header">
          <div>
            <h1 className="sp-title">
              <span className="sp-title-dot" aria-hidden />
              Historial de Ventas Mes Actual
            </h1>
            <p className="sp-sub">Gestión y seguimiento de transacciones Sobre el mes actual</p>
          </div>
          <ExportSalesButton sales={all} hasFinancialPermission={showFinancials} />
        </div>

        {/* ── KPIs: Transacciones + Total bruto facturado ────────────────── */}
        <div className="sp-kpis">
          <div className="sp-kpi">
            <div className="sp-kpi-ico"><ShoppingCart /></div>
            <div>
              <p className="sp-kpi-lbl">Transacciones Mes Actual</p>
              <p className="sp-kpi-val">{totalVentas}</p>
              <p className="sp-kpi-sub">
                {ventasContado.length} contado · {all.filter(s => s.is_credit).length} crédito
              </p>
            </div>
          </div>

          {showFinancials && (
            <div className="sp-kpi">
              <div className="sp-kpi-ico"><DollarSign /></div>
              <div>
                <p className="sp-kpi-lbl">Total facturado  Mes Actual</p>
                <p className="sp-kpi-val">{fmt(totalBruto)}</p>
                <p className="sp-kpi-sub">
                  Recaudado: {fmt(totalRecaudado)} · Pendiente: {fmt(totalPorCobrar)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Cards de cartera (solo con permiso financiero) ─────────────── */}
        {showFinancials && (
          <div className="sp-carteras">

            {/* ── CORRIENTE: todo lo que ya entró a caja ─────────────────── */}
            <div className="sp-card ok">
              <div className="sp-card-hd">
                <div className="sp-card-hd-left">
                  <div className="sp-card-ico"><Banknote /></div>
                  <p className="sp-card-title">
                    Total Recaudado
                    <span className="sp-card-pill">{pct(totalCorriente, totalBruto)}</span>
                  </p>
                </div>
                <span className="sp-card-total">{fmt(totalCorriente)}</span>
              </div>

              <div>
                {/* Filas por método de contado */}
                {Object.entries(contadoPorMetodo).map(([key, { total, count }]) => (
                  <div key={key} className="sp-row r-ok">
                    <div className="sp-row-left">
                      <span className="sp-row-dot" aria-hidden />
                      <div>
                        <div className="sp-row-lbl">{METHOD_LABELS[key] ?? key}</div>
                        <div className="sp-row-sub">{count} venta{count !== 1 ? "s" : ""}</div>
                      </div>
                    </div>
                    <span className="sp-row-val">{fmt(total)}</span>
                  </div>
                ))}

                {/* Créditos cobrados en su totalidad */}
                {creditosPagados.length > 0 && (
                  <div className="sp-row r-ok">
                    <div className="sp-row-left">
                      <span className="sp-row-dot" aria-hidden />
                      <div>
                        <div className="sp-row-lbl">Crédito saldado</div>
                        <div className="sp-row-sub">
                          {creditosPagados.length} crédito{creditosPagados.length !== 1 ? "s" : ""} cobrado{creditosPagados.length !== 1 ? "s" : ""} completamente
                        </div>
                      </div>
                    </div>
                    <span className="sp-row-val">{fmt(totalCreditoPago)}</span>
                  </div>
                )}

                {/* Abonos recibidos sobre créditos aún abiertos */}
                {totalAbonosActivos > 0 && (
                  <div className="sp-row r-ok">
                    <div className="sp-row-left">
                      <span className="sp-row-dot" aria-hidden />
                      <div>
                        <div className="sp-row-lbl">Abonos recibidos</div>
                        <div className="sp-row-sub">
                          Pagos a cuenta de créditos aún abiertos
                          {cuentasAbonadas > 0 && ` · ${cuentasAbonadas} cuenta${cuentasAbonadas !== 1 ? "s" : ""}`}
                        </div>
                      </div>
                    </div>
                    <span className="sp-row-val">{fmt(totalAbonosActivos)}</span>
                  </div>
                )}

                {/* Empty */}
                {totalCorriente === 0 && (
                  <div className="sp-row r-muted">
                    <div className="sp-row-left">
                      <span className="sp-row-dot" aria-hidden />
                      <div className="sp-row-lbl">Sin ingresos en el período</div>
                    </div>
                    <span className="sp-row-val">{fmt(0)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── FINANCIADA: pendiente neto del mes actual ───────────────── */}
            <div className="sp-card warn">
              <div className="sp-card-hd">
                <div className="sp-card-hd-left">
                  <div className="sp-card-ico"><Clock /></div>
                  <p className="sp-card-title">
                    Cartera financiada Mes Actual
                    <span className="sp-card-pill">{pct(totalPorCobrar, totalBruto)}</span>
                  </p>
                </div>
                {/* Header = saldo NETO pendiente (lo que falta cobrar) */}
                <span className="sp-card-total">{fmt(totalPorCobrar)}</span>
              </div>

              <div>
                {creditosAbiertos.length === 0 ? (
                  <div className="sp-row r-ok">
                    <div className="sp-row-left">
                      <span className="sp-row-dot" aria-hidden />
                      <div>
                        <div className="sp-row-lbl">Sin créditos abiertos este mes</div>
                        <div className="sp-row-sub">Todos los créditos del período están saldados</div>
                      </div>
                    </div>
                    <span className="sp-row-val">{fmt(0)}</span>
                  </div>
                ) : (
                  <>
                    {/* Monto original financiado (referencia) */}
                    <div className="sp-row r-muted">
                      <div className="sp-row-left">
                        <span className="sp-row-dot" aria-hidden />
                        <div>
                          <div className="sp-row-lbl">Monto original financiado</div>
                          <div className="sp-row-sub">
                            {creditosAbiertos.length} crédito{creditosAbiertos.length !== 1 ? "s" : ""} abierto{creditosAbiertos.length !== 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>
                      <span className="sp-row-val">{fmt(totalBrutoFinanciado)}</span>
                    </div>

                    {/* Abonado (positivo, ya entró a caja — también en corriente) */}
                    {totalAbonadoFin > 0 && (
                      <div className="sp-row r-ok">
                        <div className="sp-row-left">
                          <span className="sp-row-dot" aria-hidden />
                          <div>
                            <div className="sp-row-lbl">Abonado / Ya cobrado</div>
                            <div className="sp-row-sub">
                              {cuentasAbonadas} cuenta{cuentasAbonadas !== 1 ? "s" : ""} con pago parcial
                            </div>
                          </div>
                        </div>
                        <span className="sp-row-val">{fmt(totalAbonadoFin)}</span>
                      </div>
                    )}

                    {/* Saldo neto por cobrar */}
                    <div className={`sp-row ${totalPorCobrar > 0 ? "r-danger" : "r-ok"}`}>
                      <div className="sp-row-left">
                        <span className="sp-row-dot" aria-hidden />
                        <div>
                          <div className="sp-row-lbl">Saldo por cobrar</div>
                          <div className="sp-row-sub">
                            {cuentasPendientes} sin abono
                            {cuentasAbonadas > 0 && ` · ${cuentasAbonadas} con abono parcial`}
                          </div>
                        </div>
                      </div>
                      <span className="sp-row-val">{fmt(totalPorCobrar)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Barra de progreso */}
              {totalBrutoFinanciado > 0 && (
                <div className="sp-progress">
                  <div className="sp-progress-hd">
                    <span className="sp-progress-lbl">Progreso de recaudo</span>
                    <span className="sp-progress-pct">{pctRecaudado}% cobrado</span>
                  </div>
                  <div className="sp-progress-track">
                    <div
                      className="sp-progress-fill"
                      style={{ width: `${pctRecaudado}%` }}
                      role="progressbar"
                      aria-valuenow={pctRecaudado}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ── VENCIDA: créditos abiertos de meses anteriores ─────────── */}
            <div className="sp-card danger">
              <div className="sp-card-hd">
                <div className="sp-card-hd-left">
                  <div className="sp-card-ico"><AlertTriangle /></div>
                  <p className="sp-card-title">
                    Cartera vencida
                    {vencidas.length > 0 && (
                      <span className="sp-card-pill">
                        {vencidas.length} cuenta{vencidas.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </p>
                </div>
                <span className="sp-card-total">{fmt(totalVencidoNeto)}</span>
              </div>

              <div>
                {vencidas.length === 0 ? (
                  <div className="sp-row r-ok">
                    <div className="sp-row-left">
                      <span className="sp-row-dot" aria-hidden />
                      <div>
                        <div className="sp-row-lbl">Sin cartera vencida</div>
                        <div className="sp-row-sub">No hay créditos abiertos de meses anteriores</div>
                      </div>
                    </div>
                    <span className="sp-row-val">{fmt(0)}</span>
                  </div>
                ) : (
                  <>
                    {/* Original vencido */}
                    <div className="sp-row r-muted">
                      <div className="sp-row-left">
                        <span className="sp-row-dot" aria-hidden />
                        <div>
                          <div className="sp-row-lbl">Monto original vencido</div>
                          <div className="sp-row-sub">
                            {cuentasVencPendientes} sin abono
                            {cuentasVencAbonadas > 0 && ` · ${cuentasVencAbonadas} con abono`}
                          </div>
                        </div>
                      </div>
                      <span className="sp-row-val">{fmt(totalBrutoVencido)}</span>
                    </div>

                    {/* Abonado sobre vencidas */}
                    {totalAbonadoVencido > 0 && (
                      <div className="sp-row r-ok">
                        <div className="sp-row-left">
                          <span className="sp-row-dot" aria-hidden />
                          <div>
                            <div className="sp-row-lbl">Abonado sobre vencidas</div>
                            <div className="sp-row-sub">
                              {cuentasVencAbonadas} pago{cuentasVencAbonadas !== 1 ? "s" : ""} parcial{cuentasVencAbonadas !== 1 ? "es" : ""} recibido{cuentasVencAbonadas !== 1 ? "s" : ""}
                            </div>
                          </div>
                        </div>
                        <span className="sp-row-val">{fmt(totalAbonadoVencido)}</span>
                      </div>
                    )}

                    {/* Saldo neto vencido */}
                    <div className="sp-row r-danger">
                      <div className="sp-row-left">
                        <span className="sp-row-dot" aria-hidden />
                        <div>
                          <div className="sp-row-lbl">Saldo vencido por cobrar</div>
                          <div className="sp-row-sub">Meses anteriores sin saldar</div>
                        </div>
                      </div>
                      <span className="sp-row-val">{fmt(totalVencidoNeto)}</span>
                    </div>

                    {/* Antigüedad */}
                    {fechaMasAntigua && (
                      <div className="sp-row r-muted">
                        <div className="sp-row-left">
                          <span className="sp-row-dot" aria-hidden />
                          <div>
                            <div className="sp-row-lbl">Deuda más antigua</div>
                            <div className="sp-row-sub">
                              {fechaMasAntigua.toLocaleDateString("es-CO", {
                                day: "2-digit", month: "short", year: "numeric",
                                timeZone: "America/Bogota",
                              })}
                            </div>
                          </div>
                        </div>
                        <span className="sp-age-pill">
                          {mesesVencidos} {mesesVencidos === 1 ? "mes" : "meses"} de atraso
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Barra de progreso de lo ya cobrado sobre vencidas */}
              {totalBrutoVencido > 0 && (
                <div className="sp-progress">
                  <div className="sp-progress-hd">
                    <span className="sp-progress-lbl">Progreso de recaudo</span>
                    <span className="sp-progress-pct">{pctRecaudadoVenc}% cobrado</span>
                  </div>
                  <div className="sp-progress-track">
                    <div
                      className="sp-progress-fill"
                      style={{ width: `${pctRecaudadoVenc}%`, background: "var(--sp-danger)" }}
                      role="progressbar"
                      aria-valuenow={pctRecaudadoVenc}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── Filtros ─────────────────────────────────────────────────────── */}
        <div className="sp-section">
          <SalesFilters companyId={companyId} />
        </div>

        {/* ── Tabla ───────────────────────────────────────────────────────── */}
        <div className="sp-table-wrap">
          <SalesTable sales={all} showFinancialColumns={showFinancials} />
        </div>

      </div>
    </>
  )
}
