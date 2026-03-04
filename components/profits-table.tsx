// ════════════════════════════════════════════════════════════════════════════
// components/profits-table.tsx
// ════════════════════════════════════════════════════════════════════════════
"use client"

import Link from "next/link"
import { Eye, TrendingUp } from "lucide-react"

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');
.pt {
  font-family:'DM Sans',sans-serif;
  --p:    var(--primary,#984ca8);
  --p10:  rgba(var(--primary-rgb,152,76,168),.10);
  --txt:  #1a1a18;
  --muted:rgba(26,26,24,.45);
  --border:rgba(26,26,24,.08);
  --row:  rgba(26,26,24,.02);
  --ok:   #16a34a;
  --warn: #d97706;
  --danger:#dc2626;
}
.pt-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; }
table.pt-tbl { width:100%; border-collapse:collapse; min-width:720px; }
.pt-tbl thead tr { border-bottom:2px solid var(--border); background:var(--row); }
.pt-tbl th {
  padding:9px 13px; font-size:8px; font-weight:700;
  letter-spacing:.2em; text-transform:uppercase; color:var(--muted); text-align:left; white-space:nowrap;
}
.pt-tbl th.r { text-align:right; }
.pt-tbl th.c { text-align:center; }
.pt-tbl tbody tr { border-bottom:1px solid var(--border); transition:background .1s; }
.pt-tbl tbody tr:last-child { border-bottom:none; }
.pt-tbl tbody tr:hover { background:var(--row); }
.pt-tbl tbody tr.hi  { background:rgba(22,163,74,.03); }
.pt-tbl tbody tr.med { background:rgba(217,119,6,.02); }
.pt-tbl td { padding:11px 13px; font-size:12px; color:var(--txt); vertical-align:middle; }
.pt-tbl td.r { text-align:right; }
.pt-tbl td.c { text-align:center; }
.pt-tbl td.mo { font-family:monospace; font-size:11px; color:var(--muted); }
.pt-money { font-family:'Cormorant Garamond',Georgia,serif; font-size:15px; font-weight:500; }
.pt-money.ok   { color:var(--ok); }
.pt-money.warn { color:var(--warn); }
.pt-money.p    { color:var(--p); }

/* Badge margen */
.pt-margin { display:inline-flex; align-items:center; gap:3px; padding:2px 9px; font-size:9px; font-weight:700; letter-spacing:.07em; }
.pt-margin.hi   { background:rgba(22,163,74,.09);  color:var(--ok); }
.pt-margin.med  { background:rgba(217,119,6,.09);  color:var(--warn); }
.pt-margin.low  { background:rgba(220,38,38,.09);  color:var(--danger); }

/* Botón ver */
.pt-btn-eye {
  width:30px; height:30px; border:1px solid var(--border); background:#fff;
  display:inline-flex; align-items:center; justify-content:center;
  color:var(--muted); text-decoration:none;
  transition:border-color .14s, color .14s, background .14s;
}
.pt-btn-eye:hover { border-color:var(--p); color:var(--p); background:var(--p10); }
.pt-btn-eye svg { width:12px; height:12px; }

/* Vacío */
.pt-empty { display:flex; flex-direction:column; align-items:center; gap:10px; padding:52px 20px; text-align:center; }
.pt-empty-ico { width:44px; height:44px; background:var(--p10); display:flex; align-items:center; justify-content:center; }
.pt-empty-ico svg { color:var(--p); opacity:.3; width:18px; height:18px; }
.pt-empty-t { font-size:13px; font-weight:500; color:var(--txt); margin:0; }
`

const COP = (n: number) =>
  Number(n).toLocaleString("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 })

const FMT = (s: string) => {
  try { return new Date(s).toLocaleDateString("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) }
  catch { return s }
}

export function ProfitsTable({ profits }: { profits: any[] }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pt">
        <div className="pt-scroll">
          <table className="pt-tbl">
            <thead>
              <tr>
                <th>ID Venta</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th className="r">Venta</th>
                <th className="r">Costo</th>
                <th className="r">Ganancia</th>
                <th className="c">Margen</th>
                <th className="r">Ver</th>
              </tr>
            </thead>
            <tbody>
              {profits.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="pt-empty">
                    <div className="pt-empty-ico"><TrendingUp /></div>
                    <p className="pt-empty-t">Sin datos de rentabilidad este mes</p>
                  </div>
                </td></tr>
              ) : profits.map(p => {
                const margin = Number(p.profit_margin)
                const mClass = margin >= 40 ? "hi" : margin >= 20 ? "med" : "low"
                const rowClass = margin >= 40 ? "hi" : margin >= 20 ? "med" : ""
                return (
                  <tr key={p.id} className={rowClass}>
                    <td className="mo">#{p.sales?.id?.slice(0, 8)}</td>
                    <td style={{ fontSize: 11, color: "rgba(26,26,24,.45)" }}>
                      {p.sales?.sale_date ? FMT(p.sales.sale_date) : "—"}
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      {(p.sales?.clients as any)?.name || "Cliente general"}
                    </td>
                    <td className="r">
                      <span className="pt-money p">{COP(Number(p.total_sale))}</span>
                    </td>
                    <td className="r">
                      <span style={{ fontSize: 12, color: "rgba(26,26,24,.55)" }}>{COP(Number(p.total_cost))}</span>
                    </td>
                    <td className="r">
                      <span
                        className={`pt-money ${
                          Number(p.profit) < 0 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {COP(Number(p.profit))}
                      </span>
                    </td>
                    <td className="c">
                      <span className={`pt-margin ${mClass}`}>
                        {margin >= 40 ? "📈" : margin >= 20 ? "📊" : "⚠️"} {margin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="r">
                      <Link href={`/dashboard/profits/${p.sale_id}`} className="pt-btn-eye" aria-label="Ver detalle">
                        <Eye aria-hidden />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
