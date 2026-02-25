// app/dashboard/profits/[id]/page.tsx
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, DollarSign, Package, Calendar, TrendingUp, ShoppingCart } from "lucide-react"

const COP = (v: number | string | null | undefined): string => {
  const n = typeof v === "string" ? parseFloat(v) : v
  if (n === null || n === undefined || isNaN(n as number)) return "$0"
  return (n as number).toLocaleString("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 })
}

const FMT = (s: string) => {
  try { return new Date(s).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" }) }
  catch { return s }
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');
.pd {
  font-family:'DM Sans',sans-serif;
  --p:    var(--primary,#984ca8);
  --p10:  rgba(var(--primary-rgb,152,76,168),.10);
  --txt:  #1a1a18;
  --muted:rgba(26,26,24,.45);
  --border:rgba(26,26,24,.08);
  --row:  rgba(26,26,24,.02);
  --ok:   #16a34a;
  --danger:#dc2626;
}
/* Header */
.pd-hd { display:flex; flex-direction:column; gap:14px; padding-bottom:20px; border-bottom:1px solid var(--border); margin-bottom:22px; }
@media(min-width:640px){ .pd-hd{ flex-direction:row; align-items:center; justify-content:space-between; } }
.pd-hd-left { display:flex; align-items:center; gap:12px; }
.pd-back { width:34px; height:34px; border:1px solid var(--border); background:#fff; display:flex; align-items:center; justify-content:center; text-decoration:none; color:rgba(26,26,24,.4); transition:border-color .14s,color .14s; flex-shrink:0; }
.pd-back:hover { border-color:var(--p); color:var(--p); }
.pd-back svg { width:14px; height:14px; }
.pd-title { font-family:'Cormorant Garamond',Georgia,serif; font-size:22px; font-weight:400; color:var(--txt); margin:0; display:flex; align-items:center; gap:10px; }
.pd-dot   { width:8px; height:8px; background:var(--p); flex-shrink:0; }
.pd-sub   { font-size:12px; color:var(--muted); margin:3px 0 0; }
.pd-sub strong { color:var(--p); }
/* KPI grid */
.pd-kpi-grid { display:grid; gap:10px; margin-bottom:20px; grid-template-columns:repeat(2,1fr); }
@media(min-width:640px){ .pd-kpi-grid{ grid-template-columns:repeat(4,1fr); } }
.pd-kpi { background:#fff; border:1px solid var(--border); padding:15px 14px; position:relative; overflow:hidden; transition:box-shadow .18s,transform .18s; }
.pd-kpi:hover { box-shadow:0 4px 18px var(--p10); transform:translateY(-1px); }
.pd-kpi::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:var(--p); opacity:0; transition:opacity .18s; }
.pd-kpi:hover::before { opacity:1; }
.pd-kpi-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; }
.pd-kpi-lbl { font-size:8px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:var(--muted); }
.pd-kpi-ico { width:26px; height:26px; background:var(--p10); display:flex; align-items:center; justify-content:center; }
.pd-kpi-ico svg { color:var(--p); width:12px; height:12px; }
.pd-kpi-val { font-family:'Cormorant Garamond',Georgia,serif; font-size:20px; font-weight:500; color:var(--txt); margin:0; line-height:1; }
.pd-kpi-sub { font-size:10px; color:var(--muted); margin:4px 0 0; }
/* Card tabla */
.pd-card { background:#fff; border:1px solid var(--border); overflow:hidden; }
.pd-card-hd { padding:13px 16px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:8px; }
.pd-card-ico { width:24px; height:24px; background:var(--p10); display:flex; align-items:center; justify-content:center; }
.pd-card-ico svg { color:var(--p); width:12px; height:12px; }
.pd-card-title { font-size:10px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:var(--txt); margin:0; }
/* Tabla */
.pd-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; max-height:420px; overflow-y:auto; }
table.pd-tbl { width:100%; border-collapse:collapse; min-width:680px; }
.pd-tbl thead tr { border-bottom:2px solid var(--border); background:var(--row); position:sticky; top:0; z-index:2; }
.pd-tbl th { padding:9px 13px; font-size:8px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:var(--muted); text-align:left; white-space:nowrap; background:#fff; }
.pd-tbl th.r { text-align:right; }
.pd-tbl th.c { text-align:center; }
.pd-tbl tbody tr { border-bottom:1px solid var(--border); transition:background .1s; }
.pd-tbl tbody tr:last-child { border-bottom:none; }
.pd-tbl tbody tr:hover { background:var(--row); }
.pd-tbl td { padding:11px 13px; font-size:12px; color:var(--txt); }
.pd-tbl td.r { text-align:right; }
.pd-tbl td.c { text-align:center; }
.pd-money { font-family:'Cormorant Garamond',Georgia,serif; font-size:14px; font-weight:500; }
.pd-money.p   { color:var(--p); }
.pd-money.ok  { color:var(--ok); }
.pd-money.neg { color:var(--danger); }
.pd-badge { display:inline-flex; align-items:center; padding:2px 8px; font-family:monospace; font-size:11px; background:var(--p10); color:var(--p); }
.pd-date-cell { display:flex; align-items:center; gap:4px; font-size:11px; color:var(--muted); }
.pd-date-cell svg { width:11px; height:11px; }
.pd-prod-cell { display:flex; align-items:center; gap:6px; font-weight:500; }
.pd-prod-cell svg { width:12px; height:12px; color:var(--muted); flex-shrink:0; }
`

function KpiCard({ title, value, sub, icon: Icon }: { title:string; value:string|number; sub?:string; icon:any }) {
  return (
    <div className="pd-kpi">
      <div className="pd-kpi-top">
        <span className="pd-kpi-lbl">{title}</span>
        <div className="pd-kpi-ico" aria-hidden><Icon /></div>
      </div>
      <p className="pd-kpi-val">{value}</p>
      {sub && <p className="pd-kpi-sub">{sub}</p>}
    </div>
  )
}

export default async function ProfitsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: detail, error } = await supabase
    .from("sales_profit_view").select("*").eq("id_venta", id)

  if (error || !detail || detail.length === 0) notFound()

  const safe = (v: any): number => {
    const n = typeof v === "string" ? parseFloat(v) : v
    return isNaN(n) || n == null ? 0 : n
  }

  const totalVenta    = detail.reduce((s, i) => s + safe(i.precio_unitario) * safe(i.cantidad), 0)
  const totalCosto    = detail.reduce((s, i) => s + safe(i.precio_compra)   * safe(i.cantidad), 0)
  const totalGanancia = detail.reduce((s, i) => s + safe(i.ganancia_total), 0)
  const margen        = totalVenta > 0 ? (totalGanancia / totalVenta) * 100 : 0
  const uniqueProds   = new Set(detail.map(i => i.nombre)).size

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pd">

        <div className="pd-hd">
          <div className="pd-hd-left">
            <Link href="/dashboard/profits" className="pd-back" aria-label="Volver">
              <ArrowLeft aria-hidden />
            </Link>
            <div>
              <h1 className="pd-title"><span className="pd-dot" aria-hidden />Detalle de Rentabilidad</h1>
              <p className="pd-sub">
                Venta <strong>#{id.slice(0, 8)}</strong> · {uniqueProds} productos · Ganancia <strong>{COP(totalGanancia)}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="pd-kpi-grid">
          <KpiCard title="Total venta"   value={COP(totalVenta)}    sub={`${detail.length} líneas`}     icon={ShoppingCart} />
          <KpiCard title="Costo total"   value={COP(totalCosto)}    sub="Inversión"                      icon={DollarSign}  />
          <KpiCard title="Ganancia neta" value={COP(totalGanancia)} sub={`Margen ${margen.toFixed(1)}%`} icon={TrendingUp}  />
          <KpiCard title="Productos"     value={uniqueProds}        sub="Únicos vendidos"                icon={Package}     />
        </div>

        <div className="pd-card">
          <div className="pd-card-hd">
            <div className="pd-card-ico" aria-hidden><Package /></div>
            <p className="pd-card-title">Rentabilidad por Producto</p>
          </div>
          <div className="pd-scroll">
            <table className="pd-tbl">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th className="c">Cant.</th>
                  <th>Fecha lote</th>
                  <th className="r">Precio compra</th>
                  <th className="r">Precio venta</th>
                  <th className="r">Ganancia unit.</th>
                  <th className="r">Ganancia total</th>
                </tr>
              </thead>
              <tbody>
                {detail.map((item, i) => {
                  const precioCompra    = safe(item.precio_compra)
                  const precioVenta     = safe(item.precio_unitario)
                  const cantidad        = safe(item.cantidad)
                  const gananciaUnit    = safe(item.ganancia_unitaria ?? (precioVenta - precioCompra))
                  const gananciaTotal   = safe(item.ganancia_total ?? gananciaUnit * cantidad)
                  const pos = gananciaUnit >= 0

                  return (
                    <tr key={item.id ?? i}>
                      <td>
                        <div className="pd-prod-cell">
                          <Package aria-hidden />{item.nombre || "—"}
                        </div>
                      </td>
                      <td className="c">
                        <span className="pd-badge">{cantidad}</span>
                      </td>
                      <td>
                        <div className="pd-date-cell">
                          <Calendar aria-hidden />
                          {item.fecha_lote ? FMT(item.fecha_lote) : "—"}
                        </div>
                      </td>
                      <td className="r">
                        <span style={{ fontSize: 12, color: "rgba(26,26,24,.45)" }}>{COP(precioCompra)}</span>
                      </td>
                      <td className="r">
                        <span className="pd-money p">{COP(precioVenta)}</span>
                      </td>
                      <td className="r">
                        <span className={`pd-money ${pos ? "ok" : "neg"}`}>{COP(gananciaUnit)}</span>
                      </td>
                      <td className="r">
                        <span className={`pd-money ${pos ? "ok" : "neg"}`} style={{ fontSize: 16 }}>{COP(gananciaTotal)}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  )
}
