"use client"

import { useState, useMemo } from "react"
import { Hash, Clock, Check, AlertTriangle, Phone, User, Eye, X, Package } from "lucide-react"

type OrderItem = {
  id: string
  quantity: number
  unit_price_in_kit: number
}

type CatalogOrder = {
  id: string
  code: number
  catalog_status: "PENDIENTE" | "RECLAMADO" | "EXPIRADO"
  client_name: string | null
  client_phone: string | null
  expires_at: string | null
  reclaimed_at: string | null
  sale_id: string | null
  frozen_total: number | null
  created_at: string
  product_kit_items: OrderItem[]
}

interface Props {
  orders: CatalogOrder[]
  companyId: string  // multi-company: presente para futuras queries del cliente
}

const CSS = `
.cot {
  font-family:'DM Sans',sans-serif;
  --p:      var(--primary,#984ca8);
  --p10:    rgba(var(--primary-rgb,152,76,168),.10);
  --txt:    #1a1a18;
  --muted:  rgba(26,26,24,.45);
  --border: rgba(26,26,24,.08);
  --row:    rgba(26,26,24,.02);
  --ok:     #16a34a;
  --warn:   #d97706;
  --danger: #dc2626;
}

.cot-filters {
  display:flex; gap:8px; padding:10px 14px;
  border-bottom:1px solid var(--border); background:var(--row);
  flex-wrap:wrap;
}
.cot-chip {
  padding:5px 11px; border:1px solid var(--border); background:#fff;
  font-size:10px; font-weight:600; letter-spacing:.06em; text-transform:uppercase;
  color:var(--muted); cursor:pointer; transition:all .12s;
}
.cot-chip:hover { border-color:var(--p); color:var(--p); }
.cot-chip.active { background:var(--p); color:#fff; border-color:var(--p); }

.cot-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; }
table.cot-tbl { width:100%; border-collapse:collapse; min-width:780px; }
.cot-tbl thead tr { border-bottom:2px solid var(--border); background:var(--row); }
.cot-tbl th {
  padding:9px 13px; font-size:8px; font-weight:700;
  letter-spacing:.2em; text-transform:uppercase; color:var(--muted); text-align:left; white-space:nowrap;
}
.cot-tbl th.c { text-align:center; }
.cot-tbl th.r { text-align:right; }
.cot-tbl tbody tr { border-bottom:1px solid var(--border); transition:background .1s; }
.cot-tbl tbody tr:last-child { border-bottom:none; }
.cot-tbl tbody tr:hover { background:var(--row); }
.cot-tbl td { padding:11px 13px; font-size:12px; color:var(--txt); vertical-align:middle; }
.cot-tbl td.c { text-align:center; }
.cot-tbl td.r { text-align:right; }

.cot-code {
  display:inline-flex; align-items:center; justify-content:center;
  height:34px; padding:0 12px; background:var(--p10);
  font-family:'Cormorant Garamond',serif; font-size:15px; font-weight:500; color:var(--p);
}

.cot-status {
  display:inline-flex; align-items:center; gap:5px;
  padding:3px 10px; font-size:10px; font-weight:700;
  letter-spacing:.06em; text-transform:uppercase;
}
.cot-status svg { width:10px; height:10px; }
.cot-status.pendiente { background:rgba(217,119,6,.10); color:var(--warn); }
.cot-status.reclamado { background:rgba(22,163,74,.10); color:var(--ok); }
.cot-status.expirado  { background:rgba(220,38,38,.08); color:var(--danger); }

.cot-client { font-size:11px; color:var(--txt); line-height:1.4; }
.cot-client-row { display:flex; align-items:center; gap:5px; color:var(--muted); }
.cot-client-row svg { width:10px; height:10px; }

.cot-amount {
  font-family:'Cormorant Garamond',serif;
  font-size:14px; font-weight:500; color:var(--p);
}

.cot-btn-view {
  width:30px; height:30px; border:1px solid var(--border); background:#fff;
  display:flex; align-items:center; justify-content:center; cursor:pointer;
  color:var(--muted); transition:all .12s;
}
.cot-btn-view:hover { border-color:var(--p); color:var(--p); background:var(--p10); }
.cot-btn-view svg { width:13px; height:13px; }

/* Modal detalle */
.cot-overlay {
  position:fixed; inset:0; z-index:200;
  background:rgba(26,26,24,.45);
  display:flex; align-items:center; justify-content:center; padding:16px;
}
.cot-modal {
  background:#fff; max-width:560px; width:100%; max-height:90vh; overflow-y:auto;
  border-top:3px solid var(--p);
}
.cot-modal-hd {
  padding:18px 20px; border-bottom:1px solid var(--border);
  display:flex; align-items:center; justify-content:space-between; gap:12px;
}
.cot-modal-title {
  font-family:'Cormorant Garamond',serif; font-size:20px; font-weight:500;
  color:var(--p); margin:0;
}
.cot-modal-body { padding:18px 20px; }
.cot-modal-row { display:flex; gap:12px; margin-bottom:11px; font-size:12px; }
.cot-modal-row .lbl { color:var(--muted); flex:0 0 130px; }
.cot-modal-row .val { color:var(--txt); font-weight:500; flex:1; }
.cot-modal-items {
  margin-top:14px; border-top:1px solid var(--border); padding-top:12px;
}
.cot-item-row {
  display:flex; justify-content:space-between; padding:7px 0; font-size:12px;
  border-bottom:1px dashed var(--border);
}
.cot-item-row:last-child { border-bottom:none; }
`

const STATUS_TABS = [
  { key: "TODOS",      label: "Todos" },
  { key: "PENDIENTE",  label: "Pendientes" },
  { key: "RECLAMADO",  label: "Reclamados" },
  { key: "EXPIRADO",   label: "Vencidos" },
]

function COP(n: number) {
  return n.toLocaleString("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 })
}

function fmtDateTime(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function fmtDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
    day: "2-digit", month: "2-digit", year: "numeric",
  })
}

export function CatalogOrdersTable({ orders }: Props) {
  const [filter, setFilter] = useState<"TODOS" | "PENDIENTE" | "RECLAMADO" | "EXPIRADO">("TODOS")
  const [detail, setDetail] = useState<CatalogOrder | null>(null)

  const filtered = useMemo(() => {
    if (filter === "TODOS") return orders
    return orders.filter(o => o.catalog_status === filter)
  }, [orders, filter])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="cot">

        <div className="cot-filters">
          {STATUS_TABS.map(t => {
            const count = t.key === "TODOS"
              ? orders.length
              : orders.filter(o => o.catalog_status === t.key).length
            return (
              <button
                key={t.key}
                className={`cot-chip${filter === t.key ? " active" : ""}`}
                onClick={() => setFilter(t.key as any)}
              >
                {t.label} · {count}
              </button>
            )
          })}
        </div>

        <div className="cot-scroll">
          <table className="cot-tbl">
            <thead>
              <tr>
                <th>Código</th>
                <th>Estado</th>
                <th>Cliente</th>
                <th>Productos</th>
                <th className="r">Total</th>
                <th>Generado</th>
                <th>Vence / Reclamado</th>
                <th className="c">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => {
                const itemsCount = o.product_kit_items?.length || 0
                return (
                  <tr key={o.id}>
                    <td>
                      <span className="cot-code">#{o.code}</span>
                    </td>
                    <td>
                      <span className={`cot-status ${o.catalog_status.toLowerCase()}`}>
                        {o.catalog_status === "PENDIENTE" && <Clock />}
                        {o.catalog_status === "RECLAMADO" && <Check />}
                        {o.catalog_status === "EXPIRADO"  && <AlertTriangle />}
                        {o.catalog_status}
                      </span>
                    </td>
                    <td>
                      <div className="cot-client">
                        {o.client_name && (
                          <div className="cot-client-row" style={{ color: "var(--txt)", fontWeight: 500 }}>
                            <User /> {o.client_name}
                          </div>
                        )}
                        {o.client_phone && (
                          <div className="cot-client-row">
                            <Phone /> {o.client_phone}
                          </div>
                        )}
                        {!o.client_name && !o.client_phone && (
                          <span style={{ color: "var(--muted)", fontStyle: "italic" }}>
                            Sin datos del cliente
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "3px 9px", fontSize: 10, fontWeight: 600,
                        background: "var(--p10)", color: "var(--p)",
                      }}>
                        <Package size={9} />
                        {itemsCount} {itemsCount === 1 ? "producto" : "productos"}
                      </span>
                    </td>
                    <td className="r">
                      <span className="cot-amount">{COP(Number(o.frozen_total || 0))}</span>
                    </td>
                    <td style={{ fontSize: 11, color: "var(--muted)" }}>
                      {fmtDateTime(o.created_at)}
                    </td>
                    <td style={{ fontSize: 11, color: "var(--muted)" }}>
                      {o.catalog_status === "RECLAMADO"
                        ? `Cobrado: ${fmtDateTime(o.reclaimed_at)}`
                        : `Vence: ${fmtDate(o.expires_at)}`}
                    </td>
                    <td className="c">
                      <button className="cot-btn-view" onClick={() => setDetail(o)} aria-label="Ver detalle">
                        <Eye />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {detail && (
          <div className="cot-overlay" onClick={() => setDetail(null)}>
            <div className="cot-modal" onClick={e => e.stopPropagation()}>
              <div className="cot-modal-hd">
                <h2 className="cot-modal-title">
                  <Hash size={16} style={{ verticalAlign: "middle", marginRight: 5 }} />
                  Pedido #{detail.code}
                </h2>
                <button onClick={() => setDetail(null)} style={{
                  border: "none", background: "rgba(26,26,24,.05)", cursor: "pointer",
                  padding: 8, display: "flex", alignItems: "center", justifyContent: "center",
                }} aria-label="Cerrar">
                  <X size={14} />
                </button>
              </div>
              <div className="cot-modal-body">
                <div className="cot-modal-row">
                  <span className="lbl">Estado</span>
                  <span className="val">
                    <span className={`cot-status ${detail.catalog_status.toLowerCase()}`}>
                      {detail.catalog_status}
                    </span>
                  </span>
                </div>
                <div className="cot-modal-row">
                  <span className="lbl">Cliente</span>
                  <span className="val">{detail.client_name || "—"}</span>
                </div>
                <div className="cot-modal-row">
                  <span className="lbl">Teléfono</span>
                  <span className="val">{detail.client_phone || "—"}</span>
                </div>
                <div className="cot-modal-row">
                  <span className="lbl">Generado</span>
                  <span className="val">{fmtDateTime(detail.created_at)}</span>
                </div>
                <div className="cot-modal-row">
                  <span className="lbl">Disponible hasta</span>
                  <span className="val">{fmtDateTime(detail.expires_at)}</span>
                </div>
                {detail.reclaimed_at && (
                  <div className="cot-modal-row">
                    <span className="lbl">Reclamado el</span>
                    <span className="val">{fmtDateTime(detail.reclaimed_at)}</span>
                  </div>
                )}
                <div className="cot-modal-row">
                  <span className="lbl">Total congelado</span>
                  <span className="val" style={{ color: "var(--p)", fontWeight: 600 }}>
                    {COP(Number(detail.frozen_total || 0))}
                  </span>
                </div>

                <div className="cot-modal-items">
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>
                    Productos
                  </p>
                  {detail.product_kit_items.map((it, idx) => (
                    <div key={it.id || idx} className="cot-item-row">
                      <span>× {it.quantity}</span>
                      <span style={{ fontWeight: 500 }}>{COP(Number(it.unit_price_in_kit) * it.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}
