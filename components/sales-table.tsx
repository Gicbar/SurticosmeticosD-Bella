"use client"
// ════════════════════════════════════════════════════════════════
// components/sales-table.tsx
// ════════════════════════════════════════════════════════════════
import { Eye, Receipt } from "lucide-react"
import Link from "next/link"

// ── Hora Colombia (UTC-5) ─────────────────────────────────────────────────────
// Convertimos la fecha ISO del servidor (UTC) a hora local Colombia
// usando Intl.DateTimeFormat con timeZone: "America/Bogota".
// Esto funciona tanto en servidor como en cliente sin librerías externas.
function formatFechaColombia(isoString: string): string {
  const d = new Date(isoString)
  return new Intl.DateTimeFormat("es-CO", {
    timeZone:  "America/Bogota",
    day:       "2-digit",
    month:     "short",
    year:      "numeric",
    hour:      "2-digit",
    minute:    "2-digit",
    hour12:    true,
  }).format(d)
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

  .st {
    font-family: 'DM Sans', sans-serif;
    --p:     var(--primary, #984ca8);
    --p10:   rgba(var(--primary-rgb,152,76,168),.10);
    --txt:   #1a1a18;
    --muted: rgba(26,26,24,.45);
    --bdr:   rgba(26,26,24,.08);
    --hov:   rgba(26,26,24,.02);
    --ok:    #16a34a; --ok10: rgba(22,163,74,.07);
    --am:    #d97706; --am10: rgba(217,119,6,.07);
    --cr:    #b45309; --cr10: rgba(180,83,9,.07);
  }
  .st { background:#fff; overflow:hidden; }
  .st-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; }

  table.st-t { width:100%; border-collapse:collapse; min-width:580px; }
  .st-t thead tr { border-bottom:2px solid var(--bdr); background:rgba(26,26,24,.02); }
  .st-t th {
    padding:10px 16px; font-size:8px; font-weight:700;
    letter-spacing:.22em; text-transform:uppercase;
    color:var(--muted); white-space:nowrap; text-align:left;
  }
  .st-t th.r { text-align:right; }
  .st-t tbody tr { border-bottom:1px solid var(--bdr); transition:background .12s; }
  .st-t tbody tr:last-child { border-bottom:none; }
  .st-t tbody tr:hover { background:var(--hov); }
  .st-t td { padding:12px 16px; font-size:12px; color:var(--txt); vertical-align:middle; }
  .st-t td.r { text-align:right; }

  /* Fecha */
  .st-date { font-size:11px; color:var(--muted); white-space:nowrap; }
  .st-time { font-size:10px; color:var(--muted); opacity:.7; margin-top:2px; }

  /* Montos */
  .st-money { font-family:'Cormorant Garamond',Georgia,serif; font-size:15px; font-weight:500; color:var(--p); }
  .st-profit { color:var(--ok); }
  .st-margin { font-size:11px; font-weight:600; color:var(--ok); }

  /* Badge método */
  .st-badge {
    display:inline-flex; align-items:center; gap:4px;
    padding:3px 9px; font-size:9px; font-weight:700;
    letter-spacing:.10em; text-transform:uppercase; white-space:nowrap;
    background:var(--p10); color:var(--p);
  }

  /* Celda método+estado */
  .st-mc { display:flex; flex-direction:column; gap:5px; align-items:flex-start; }

  /* Badge crédito */
  .st-cw { display:inline-flex; align-items:stretch; overflow:hidden; }
  .st-cs { width:3px; flex-shrink:0; }
  .st-cs.pending { background:var(--cr); }
  .st-cs.paid    { background:var(--ok); }
  .st-cs.partial { background:var(--am); }
  .st-ci {
    display:inline-flex; align-items:center; gap:5px;
    padding:3px 9px; font-size:9px; font-weight:700;
    letter-spacing:.10em; text-transform:uppercase;
  }
  .st-ci.pending { background:var(--cr10); color:var(--cr); }
  .st-ci.paid    { background:var(--ok10); color:var(--ok); }
  .st-ci.partial { background:var(--am10); color:var(--am); }
  .st-cdot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
  .st-cdot.pending { background:var(--cr); }
  .st-cdot.paid    { background:var(--ok); }
  .st-cdot.partial { background:var(--am); }
  .st-cdetail { opacity:.7; font-weight:400; margin-left:4px; }

  /* Botón ver */
  .st-btn {
    width:30px; height:30px; border:1px solid var(--bdr); background:#fff;
    display:inline-flex; align-items:center; justify-content:center;
    color:var(--muted); text-decoration:none;
    transition:border-color .12s,color .12s,background .12s;
  }
  .st-btn:hover { border-color:var(--p); color:var(--p); background:var(--p10); }

  /* Vacío */
  .st-empty { padding:48px 24px; text-align:center; display:flex; flex-direction:column; align-items:center; gap:12px; }
  .st-empty-ico { width:48px; height:48px; background:var(--p10); display:flex; align-items:center; justify-content:center; }
  .st-empty-ico svg { color:var(--p); opacity:.4; width:20px; height:20px; }
  .st-empty-t { font-size:13px; font-weight:500; color:var(--txt); margin:0; }
  .st-empty-s { font-size:11px; color:var(--muted); margin:0; }
`

// ── Helpers ───────────────────────────────────────────────────────────────────
const PAYMENT_LABELS: Record<string, string> = {
  efectivo:      "Efectivo",
  tarjeta:       "Tarjeta",
  transferencia: "Transferencia",
  credito:       "Crédito",
}

const DEBT_META: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pendiente", cls: "pending" },
  paid:    { label: "Cancelado", cls: "paid"    },
  partial: { label: "Abonado",   cls: "partial"  },
}

const fmtCOP = (v: number) =>
  v.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })

function CreditBadge({
  status,
  debt,
}: {
  status: string | null
  debt?: { original_amount?: number; debt_payments?: { amount: number }[] } | null
}) {
  if (!status) return null
  const m        = DEBT_META[status] ?? { label: status, cls: "pending" }
  const abonado  = ((debt?.debt_payments ?? []) as any[]).reduce((s, p) => s + Number(p.amount ?? 0), 0)
  const original = Number(debt?.original_amount ?? 0)
  const saldo    = Math.max(0, original - abonado)

  return (
    <span className="st-cw" title={`Crédito ${m.label.toLowerCase()}`}>
      <span className={`st-cs ${m.cls}`} aria-hidden />
      <span className={`st-ci ${m.cls}`}>
        <span className={`st-cdot ${m.cls}`} aria-hidden />
        {m.label}
        {status === "partial" && abonado > 0 && (
          <span className="st-cdetail">· {fmtCOP(abonado)} abonado</span>
        )}
        {status === "pending" && original > 0 && (
          <span className="st-cdetail">· {fmtCOP(original)} por cobrar</span>
        )}
        {status === "partial" && saldo > 0 && (
          <span className="st-cdetail" style={{ marginLeft: 0 }}> · {fmtCOP(saldo)} pendiente</span>
        )}
      </span>
    </span>
  )
}

// ── Tipos ─────────────────────────────────────────────────────────────────────
type Sale = {
  id: string
  total: number
  payment_method: string
  sale_date: string
  is_credit: boolean
  clients: { name: string } | null
  customer_debts?: {
    status: string
    original_amount?: number
    debt_payments?: { amount: number }[]
  }[] | null
  sales_profit?: { profit: number; profit_margin: number }[] | null
}

export function SalesTable({
  sales,
  showFinancialColumns,
}: {
  sales: Sale[]
  showFinancialColumns: boolean
}) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="st">
        {sales.length === 0 ? (
          <div className="st-empty">
            <div className="st-empty-ico"><Receipt /></div>
            <p className="st-empty-t">No hay ventas registradas</p>
            <p className="st-empty-s">Las ventas del período aparecerán aquí</p>
          </div>
        ) : (
          <div className="st-scroll">
            <table className="st-t">
              <thead>
                <tr>
                  <th>Fecha · hora</th>
                  <th>Cliente</th>
                  <th>Método / Estado</th>
                  {showFinancialColumns && <>
                    <th className="r">Total</th>
                    <th className="r">Ganancia</th>
                    <th className="r">Margen</th>
                  </>}
                  <th className="r">Ver</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(sale => {
                  const profit      = sale.sales_profit?.[0]
                  const status      = (sale.customer_debts?.[0]?.status ?? null)
                  const methodLabel = PAYMENT_LABELS[sale.payment_method] ?? sale.payment_method

                  // Fecha y hora en Colombia
                  const fechaHora = formatFechaColombia(sale.sale_date)
                  // Separamos la hora del resto para mostrarla en línea aparte
                  // Intl devuelve algo como "10 mar. 2026, 10:41 p. m."
                  // Partimos por la coma para separar fecha y hora
                  const partes  = fechaHora.split(",")
                  const fecha   = partes[0]?.trim() ?? fechaHora
                  const hora    = partes.slice(1).join(",").trim()

                  return (
                    <tr key={sale.id}>

                      {/* Fecha + hora Colombia */}
                      <td>
                        <div className="st-date">{fecha}</div>
                        {hora && <div className="st-time">{hora}</div>}
                      </td>

                      <td style={{ fontWeight: 500 }}>
                        {sale.clients?.name || "Cliente General"}
                      </td>

                      <td>
                        <div className="st-mc">
                          <span className="st-badge">{methodLabel}</span>
                          {sale.is_credit && (
                            <CreditBadge
                              status={status}
                              debt={sale.customer_debts?.[0]}
                            />
                          )}
                        </div>
                      </td>

                      {showFinancialColumns && <>
                        <td className="r">
                          <span className="st-money">{fmtCOP(Number(sale.total))}</span>
                        </td>
                        <td className="r">
                          <span className="st-money st-profit">
                            {profit ? fmtCOP(Number(profit.profit)) : "—"}
                          </span>
                        </td>
                        <td className="r">
                          <span className="st-margin">
                            {profit ? `${Number(profit.profit_margin).toFixed(1)}%` : "—"}
                          </span>
                        </td>
                      </>}

                      <td className="r">
                        <Link href={`/dashboard/sales/${sale.id}`} className="st-btn" aria-label="Ver detalle">
                          <Eye size={13} />
                        </Link>
                      </td>

                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
