// app/dashboard/sales/[id]/page.tsx
import { getUserPermissions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Calendar, DollarSign, User, CreditCard,
  Package, TrendingUp, ShoppingCart,
} from "lucide-react"

// ── Helpers ───────────────────────────────────────────────────────────────────
const COP = (n: number) =>
  Number(n).toLocaleString("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 })

const FMT_DATE = (s: string) =>
  new Date(s).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })

const FMT_LONG = (s: string) =>
  new Date(s).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })

const FMT_SHORT = (s: string) =>
  new Date(s).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

.sd {
  font-family: 'DM Sans', sans-serif;
  --p:      var(--primary, #984ca8);
  --p10:    rgba(var(--primary-rgb,152,76,168), .10);
  --p20:    rgba(var(--primary-rgb,152,76,168), .20);
  --txt:    #1a1a18;
  --muted:  rgba(26,26,24,.45);
  --border: rgba(26,26,24,.08);
  --row:    rgba(26,26,24,.02);
  --ok:     #16a34a;
  --ok10:   rgba(22,163,74,.10);
  --danger: #dc2626;
  --danger10:rgba(220,38,38,.08);
}

/* ── Header ─────────────────────────────────────────── */
.sd-hd {
  display: flex; align-items: flex-start; gap: 12px;
  padding-bottom: 20px; border-bottom: 1px solid var(--border); margin-bottom: 22px;
}
.sd-back {
  width: 34px; height: 34px; border: 1px solid var(--border); background: #fff;
  display: flex; align-items: center; justify-content: center;
  text-decoration: none; color: var(--muted); flex-shrink: 0; margin-top: 3px;
  transition: border-color .14s, color .14s;
}
.sd-back:hover { border-color: var(--p); color: var(--p); }
.sd-back svg   { width: 14px; height: 14px; }
.sd-title {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 22px; font-weight: 400; color: var(--txt); margin: 0;
  display: flex; align-items: center; gap: 10px;
}
.sd-dot  { width: 8px; height: 8px; background: var(--p); flex-shrink: 0; }
.sd-sub  { font-size: 12px; color: var(--muted); margin: 3px 0 0; }

/* ── KPI cards ──────────────────────────────────────── */
.sd-kpi-grid {
  display: grid; gap: 10px; margin-bottom: 20px;
  grid-template-columns: repeat(3, 1fr);
}
@media(max-width: 480px) { .sd-kpi-grid { grid-template-columns: 1fr 1fr; } }
.sd-kpi {
  background: #fff; border: 1px solid var(--border);
  padding: 15px 14px; position: relative; overflow: hidden;
  transition: box-shadow .18s, transform .18s;
}
.sd-kpi:hover { box-shadow: 0 4px 18px var(--p10); transform: translateY(-1px); }
.sd-kpi::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: var(--p); opacity: 0; transition: opacity .18s;
}
.sd-kpi:hover::before { opacity: 1; }
.sd-kpi-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
.sd-kpi-lbl { font-size: 8px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; color: var(--muted); }
.sd-kpi-ico { width: 26px; height: 26px; background: var(--p10); display: flex; align-items: center; justify-content: center; }
.sd-kpi-ico svg  { color: var(--p); width: 12px; height: 12px; }
.sd-kpi-ico.ok   { background: var(--ok10); }
.sd-kpi-ico.ok svg { color: var(--ok); }
.sd-kpi-val {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 20px; font-weight: 500; color: var(--txt); margin: 0; line-height: 1;
}
.sd-kpi-val.ok  { color: var(--ok); }
.sd-kpi-val.pct { color: var(--p); }
.sd-kpi-sub { font-size: 10px; color: var(--muted); margin: 4px 0 0; }

/* ── Grid 2 columnas (info + financiero) ─────────────── */
.sd-info-grid { display: grid; gap: 16px; margin-bottom: 20px; grid-template-columns: 1fr 1fr; }
@media(max-width: 640px) { .sd-info-grid { grid-template-columns: 1fr; } }

/* ── Card genérica ──────────────────────────────────── */
.sd-card { background: #fff; border: 1px solid var(--border); overflow: hidden; }
.sd-card-hd {
  padding: 13px 16px; border-bottom: 1px solid var(--border);
  display: flex; align-items: center; gap: 8px;
}
.sd-card-ico { width: 26px; height: 26px; background: var(--p10); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.sd-card-ico svg { color: var(--p); width: 12px; height: 12px; }
.sd-card-title { font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--txt); margin: 0; }
.sd-card-body  { padding: 14px 16px; }

/* ── Filas de detalle ─────────────────────────────── */
.sd-detail-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 9px 10px; margin-bottom: 5px;
  background: var(--row); transition: background .1s;
}
.sd-detail-row:last-child { margin-bottom: 0; }
.sd-detail-row:hover { background: var(--p10); }
.sd-detail-row.total-row { background: rgba(var(--primary-rgb,152,76,168),.06); }
.sd-detail-row.cost-row  { background: var(--danger10); }
.sd-detail-row.profit-row { background: var(--ok10); }
.sd-detail-lbl { font-size: 10px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); display: flex; align-items: center; gap: 5px; }
.sd-detail-lbl svg { width: 11px; height: 11px; flex-shrink: 0; }
.sd-detail-val { font-size: 12px; font-weight: 600; color: var(--txt); }
.sd-detail-val.big {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 17px; font-weight: 500;
}
.sd-detail-val.ok  { color: var(--ok); }
.sd-detail-val.pri { color: var(--p); }
.sd-detail-val.danger { color: var(--danger); }

/* Badge pago */
.sd-pay-badge {
  padding: 2px 10px; font-size: 9px; font-weight: 700;
  letter-spacing: .1em; text-transform: uppercase;
  background: var(--p10); color: var(--p); border: 1px solid var(--p20);
}

/* Separador */
.sd-sep { height: 1px; background: var(--border); margin: 10px 0; }

/* ── Tabla productos ─────────────────────────────── */
.sd-tbl-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
table.sd-tbl { width: 100%; border-collapse: collapse; min-width: 520px; }
.sd-tbl thead tr { border-bottom: 2px solid var(--border); background: var(--row); }
.sd-tbl th {
  padding: 9px 14px; font-size: 8px; font-weight: 700;
  letter-spacing: .2em; text-transform: uppercase; color: var(--muted); text-align: left; white-space: nowrap;
}
.sd-tbl th.c { text-align: center; }
.sd-tbl th.r { text-align: right; }
.sd-tbl tbody tr { border-bottom: 1px solid var(--border); transition: background .1s; }
.sd-tbl tbody tr:last-child { border-bottom: none; }
.sd-tbl tbody tr:hover { background: var(--row); }
.sd-tbl td { padding: 11px 14px; font-size: 12px; color: var(--txt); vertical-align: middle; }
.sd-tbl td.c { text-align: center; }
.sd-tbl td.r { text-align: right; }

/* Nombre producto */
.sd-prod-name { display: flex; align-items: center; gap: 7px; font-weight: 500; }
.sd-prod-ico  { width: 24px; height: 24px; background: var(--p10); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.sd-prod-ico svg { color: var(--p); width: 10px; height: 10px; }

/* Badge cantidad */
.sd-qty {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 26px; height: 20px; padding: 0 7px;
  font-size: 10px; font-weight: 700;
  background: var(--p10); color: var(--p); border: 1px solid var(--p20);
}

/* Montos en tabla */
.sd-unit { font-size: 12px; color: var(--muted); }
.sd-subtotal {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 15px; font-weight: 500; color: var(--p);
}
`

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const permissionsData = await getUserPermissions()
  if (!permissionsData?.permissions?.ventas) redirect("/dashboard")
  const companyId = permissionsData.company_id
  if (!companyId) redirect("/auth/sin-empresa")

  const supabase = await createClient()

  const { data: sale } = await supabase
    .from("sales")
    .select("*, clients(name, email, phone), sales_profit(*)")
    .eq("id", id)
    .eq("company_id", companyId)
    .single()

  if (!sale) notFound()

  const { data: saleItems } = await supabase
    .from("sale_items")
    .select("*, products(name, barcode), purchase_batches(created_at)")
    .eq("sale_id", id)
    .eq("company_id", companyId)

  const profit = sale.sales_profit?.[0]
  const payMethod = sale.payment_method
    ? sale.payment_method.charAt(0).toUpperCase() + sale.payment_method.slice(1)
    : "—"

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="sd">

        {/* ── Header ── */}
        <div className="sd-hd">
          <Link href="/dashboard/sales" className="sd-back" aria-label="Volver a ventas">
            <ArrowLeft aria-hidden />
          </Link>
          <div>
            <h1 className="sd-title">
              <span className="sd-dot" aria-hidden />
              Detalle de Venta
            </h1>
            <p className="sd-sub">
              Transacción #{id.slice(0, 8)} · {FMT_DATE(sale.sale_date)}
            </p>
          </div>
        </div>

        {/* ── KPIs de rentabilidad ── */}
        {profit && (
          <div className="sd-kpi-grid">
            <div className="sd-kpi">
              <div className="sd-kpi-top">
                <span className="sd-kpi-lbl">Ganancia neta</span>
                <div className="sd-kpi-ico ok" aria-hidden><TrendingUp /></div>
              </div>
              <p className="sd-kpi-val ok">{COP(profit.profit)}</p>
              <p className="sd-kpi-sub">Utilidad de la venta</p>
            </div>
            <div className="sd-kpi">
              <div className="sd-kpi-top">
                <span className="sd-kpi-lbl">Costo total</span>
                <div className="sd-kpi-ico" aria-hidden><Package /></div>
              </div>
              <p className="sd-kpi-val">{COP(profit.total_cost)}</p>
              <p className="sd-kpi-sub">Inversión en productos</p>
            </div>
            <div className="sd-kpi">
              <div className="sd-kpi-top">
                <span className="sd-kpi-lbl">Margen</span>
                <div className="sd-kpi-ico" aria-hidden><TrendingUp /></div>
              </div>
              <p className="sd-kpi-val pct">{Number(profit.profit_margin).toFixed(1)}%</p>
              <p className="sd-kpi-sub">Rentabilidad</p>
            </div>
          </div>
        )}

        {/* ── Info general + Resumen financiero ── */}
        <div className="sd-info-grid">

          {/* Info general */}
          <div className="sd-card">
            <div className="sd-card-hd">
              <div className="sd-card-ico" aria-hidden><User /></div>
              <span className="sd-card-title">Información General</span>
            </div>
            <div className="sd-card-body">
              <div className="sd-detail-row">
                <span className="sd-detail-lbl"><Calendar aria-hidden />Fecha</span>
                <span className="sd-detail-val">{FMT_LONG(sale.sale_date)}</span>
              </div>
              <div className="sd-detail-row">
                <span className="sd-detail-lbl"><User aria-hidden />Cliente</span>
                <span className="sd-detail-val">{sale.clients?.name || "Cliente General"}</span>
              </div>
              {sale.clients?.email && (
                <div className="sd-detail-row">
                  <span className="sd-detail-lbl">Email</span>
                  <span className="sd-detail-val" style={{ fontSize: 11, wordBreak: "break-all" }}>
                    {sale.clients.email}
                  </span>
                </div>
              )}
              {sale.clients?.phone && (
                <div className="sd-detail-row">
                  <span className="sd-detail-lbl">Teléfono</span>
                  <span className="sd-detail-val">{sale.clients.phone}</span>
                </div>
              )}
              <div className="sd-detail-row">
                <span className="sd-detail-lbl"><CreditCard aria-hidden />Pago</span>
                <span className="sd-pay-badge">{payMethod}</span>
              </div>
            </div>
          </div>

          {/* Resumen financiero */}
          <div className="sd-card">
            <div className="sd-card-hd">
              <div className="sd-card-ico" aria-hidden><DollarSign /></div>
              <span className="sd-card-title">Resumen Financiero</span>
            </div>
            <div className="sd-card-body">
              <div className="sd-detail-row total-row">
                <span className="sd-detail-lbl">Total venta</span>
                <span className="sd-detail-val big pri">{COP(sale.total)}</span>
              </div>

              {profit && (
                <>
                  <div className="sd-detail-row cost-row">
                    <span className="sd-detail-lbl">Costo productos</span>
                    <span className="sd-detail-val danger">{COP(profit.total_cost)}</span>
                  </div>

                  <div className="sd-sep" aria-hidden />

                  <div className="sd-detail-row profit-row">
                    <span className="sd-detail-lbl">Ganancia neta</span>
                    <span className="sd-detail-val big ok">{COP(profit.profit)}</span>
                  </div>
                  <div className="sd-detail-row">
                    <span className="sd-detail-lbl">Margen</span>
                    <span className="sd-detail-val pri">{Number(profit.profit_margin).toFixed(1)}%</span>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>

        {/* ── Tabla de productos ── */}
        <div className="sd-card">
          <div className="sd-card-hd">
            <div className="sd-card-ico" aria-hidden><Package /></div>
            <span className="sd-card-title">
              Productos Vendidos
              {saleItems && saleItems.length > 0 && (
                <span style={{ marginLeft: 8, fontWeight: 400, opacity: .5 }}>
                  ({saleItems.length} {saleItems.length === 1 ? "producto" : "productos"})
                </span>
              )}
            </span>
          </div>
          <div className="sd-tbl-wrap">
            <table className="sd-tbl">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th className="c">Cant.</th>
                  <th>Fecha lote</th>
                  <th className="r">P. Unit.</th>
                  <th className="r">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {saleItems && saleItems.length > 0 ? (
                  saleItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="sd-prod-name">
                          <div className="sd-prod-ico" aria-hidden><Package /></div>
                          {item.products?.name || "N/A"}
                        </div>
                      </td>
                      <td className="c">
                        <span className="sd-qty">{item.quantity}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>
                          {item.purchase_batches?.created_at
                            ? FMT_SHORT(item.purchase_batches.created_at)
                            : "—"}
                        </span>
                      </td>
                      <td className="r">
                        <span className="sd-unit">{COP(item.unit_price)}</span>
                      </td>
                      <td className="r">
                        <span className="sd-subtotal">{COP(item.subtotal)}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ padding: "32px 14px", textAlign: "center", color: "var(--muted)", fontSize: 12 }}>
                      Sin productos registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  )
}
