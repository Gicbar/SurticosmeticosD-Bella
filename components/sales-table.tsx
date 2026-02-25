"use client"

import { Eye, Receipt, TrendingUp, DollarSign } from "lucide-react"
import Link from "next/link"

// ── CSS mismo sistema de diseño que el dashboard ──────────────────────────────
const TABLE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

  .st-root {
    font-family: 'DM Sans', sans-serif;
    --st-p:      var(--primary, #984ca8);
    --st-p10:    rgba(var(--primary-rgb, 152,76,168), 0.10);
    --st-txt:    #1a1a18;
    --st-muted:  rgba(26,26,24,0.45);
    --st-border: rgba(26,26,24,0.08);
    --st-hover:  rgba(26,26,24,0.02);
  }
  .st-root { background: #fff; overflow: hidden; }

  /* Wrapper scroll horizontal para móvil */
  .st-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }

  table.st-table {
    width: 100%; border-collapse: collapse;
    min-width: 480px; /* scroll en móvil si no cabe */
  }

  /* Header */
  .st-table thead tr {
    border-bottom: 2px solid var(--st-border);
    background: rgba(26,26,24,0.02);
  }
  .st-table th {
    padding: 10px 16px;
    font-size: 8px; font-weight: 700; letter-spacing: 0.22em;
    text-transform: uppercase; color: var(--st-muted);
    white-space: nowrap; text-align: left;
  }
  .st-table th.right { text-align: right; }

  /* Filas */
  .st-table tbody tr {
    border-bottom: 1px solid var(--st-border);
    transition: background 0.12s;
  }
  .st-table tbody tr:last-child { border-bottom: none; }
  .st-table tbody tr:hover { background: var(--st-hover); }

  .st-table td {
    padding: 12px 16px;
    font-size: 12px; color: var(--st-txt);
    vertical-align: middle;
  }
  .st-table td.right { text-align: right; }
  .st-table td.muted { color: var(--st-muted); font-size: 11px; }

  /* Valor monetario — usa serif para elegancia */
  .st-money {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 15px; font-weight: 500; color: var(--st-p);
  }
  .st-profit { color: #16a34a; }

  /* Badge método de pago */
  .st-badge {
    display: inline-flex; align-items: center;
    padding: 2px 8px;
    background: var(--st-p10);
    font-size: 9px; font-weight: 600; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--st-p);
  }

  /* Botón ver detalle */
  .st-view-btn {
    width: 30px; height: 30px;
    border: 1px solid var(--st-border);
    background: #fff; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
    color: var(--st-muted);
    transition: border-color 0.12s, color 0.12s, background 0.12s;
    text-decoration: none;
  }
  .st-view-btn:hover { border-color: var(--st-p); color: var(--st-p); background: var(--st-p10); }

  /* Estado vacío */
  .st-empty {
    padding: 48px 24px; text-align: center;
    display: flex; flex-direction: column; align-items: center; gap: 12px;
  }
  .st-empty-icon {
    width: 48px; height: 48px;
    background: var(--st-p10);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto;
  }
  .st-empty-icon svg { color: var(--st-p); opacity: 0.4; width: 20px; height: 20px; }
  .st-empty-title { font-size: 13px; font-weight: 500; color: var(--st-txt); margin: 0; }
  .st-empty-sub { font-size: 11px; color: var(--st-muted); margin: 0; }

  /* Margen % */
  .st-margin { font-size: 11px; font-weight: 600; color: #16a34a; }
`

type Sale = {
  id: string; total: number; payment_method: string; sale_date: string
  clients: { name: string } | null
  sales_profit?: { profit: number; profit_margin: number }[] | null
}

interface SalesTableProps {
  sales: Sale[]
  showFinancialColumns: boolean
}

export function SalesTable({ sales, showFinancialColumns }: SalesTableProps) {
  const fmt = (v: number) => v.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: TABLE_CSS }} />
      <div className="st-root">
        {sales.length === 0 ? (
          <div className="st-empty">
            <div className="st-empty-icon"><Receipt /></div>
            <p className="st-empty-title">No hay ventas registradas</p>
            <p className="st-empty-sub">Las ventas del período aparecerán aquí</p>
          </div>
        ) : (
          <div className="st-scroll">
            <table className="st-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Método</th>
                  {showFinancialColumns && <>
                    <th className="right">Total</th>
                    <th className="right">Ganancia</th>
                    <th className="right">Margen</th>
                  </>}
                  <th className="right">Ver</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(sale => {
                  const profit = sale.sales_profit?.[0]
                  return (
                    <tr key={sale.id}>
                      <td className="muted">
                        {new Date(sale.sale_date).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td style={{ fontWeight: 500 }}>{sale.clients?.name || "Cliente General"}</td>
                      <td>
                        <span className="st-badge">{sale.payment_method}</span>
                      </td>
                      {showFinancialColumns && <>
                        <td className="right">
                          <span className="st-money">{fmt(Number(sale.total))}</span>
                        </td>
                        <td className="right">
                          <span className="st-money st-profit">{profit ? fmt(Number(profit.profit)) : "—"}</span>
                        </td>
                        <td className="right">
                          <span className="st-margin">{profit ? `${Number(profit.profit_margin).toFixed(1)}%` : "—"}</span>
                        </td>
                      </>}
                      <td className="right">
                        <Link href={`/dashboard/sales/${sale.id}`} className="st-view-btn" aria-label="Ver detalle">
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
