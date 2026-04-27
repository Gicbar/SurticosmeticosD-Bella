// app/dashboard/pedidos-catalogo/page.tsx
import { getUserPermissions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { CatalogOrdersTable } from "@/components/catalog-orders-table"
import { Hash, Package, Clock, Check, AlertTriangle } from "lucide-react"
import { redirect } from "next/navigation"

function COP(n: number) {
  return n.toLocaleString("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 })
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

.po-page {
  font-family:'DM Sans',sans-serif;
  --p:      var(--primary,#984ca8);
  --p10:    rgba(var(--primary-rgb,152,76,168),.10);
  --txt:    #1a1a18;
  --muted:  rgba(26,26,24,.55);
  --border: rgba(26,26,24,.08);
  --ok:     #16a34a;
  --warn:   #d97706;
  --danger: #dc2626;
}

.po-hd {
  display:flex; flex-direction:column; gap:14px;
  padding-bottom:20px; border-bottom:1px solid var(--border); margin-bottom:22px;
}
@media(min-width:640px){ .po-hd{ flex-direction:row; align-items:center; justify-content:space-between; } }

.po-title {
  font-family:'Cormorant Garamond',Georgia,serif;
  font-size:22px; font-weight:400; color:var(--txt); margin:0;
  display:flex; align-items:center; gap:10px;
}
.po-dot   { width:8px; height:8px; background:var(--p); flex-shrink:0; }
.po-sub   { font-size:12px; color:var(--muted); margin:3px 0 0; }

.po-kpi-grid {
  display:grid; gap:10px; margin-bottom:20px;
  grid-template-columns:repeat(2,1fr);
}
@media(min-width:768px){ .po-kpi-grid{ grid-template-columns:repeat(4,1fr); } }

.po-kpi {
  background:#fff; border:1px solid var(--border);
  padding:15px 14px; position:relative; overflow:hidden;
  transition:box-shadow .18s,transform .18s;
}
.po-kpi:hover { box-shadow:0 4px 18px var(--p10); transform:translateY(-1px); }
.po-kpi::before {
  content:''; position:absolute; top:0; left:0; right:0; height:2px;
  background:var(--accent-color,var(--p)); opacity:0; transition:opacity .18s;
}
.po-kpi:hover::before { opacity:1; }
.po-kpi-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; }
.po-kpi-lbl { font-size:8px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:var(--muted); }
.po-kpi-ico { width:26px; height:26px; background:var(--p10); display:flex; align-items:center; justify-content:center; }
.po-kpi-ico svg { color:var(--p); width:12px; height:12px; }
.po-kpi-val {
  font-family:'Cormorant Garamond',Georgia,serif;
  font-size:20px; font-weight:500; color:var(--txt); margin:0; line-height:1;
}
.po-kpi-sub { font-size:10px; color:var(--muted); margin:4px 0 0; }

.po-table-wrap { background:#fff; border:1px solid var(--border); overflow:hidden; }

.po-empty {
  display:flex; flex-direction:column; align-items:center; gap:14px;
  padding:64px 20px; text-align:center;
}
.po-empty-ico {
  width:56px; height:56px; background:var(--p10);
  display:flex; align-items:center; justify-content:center; border-radius:50%;
}
.po-empty-ico svg { color:var(--p); opacity:.3; width:24px; height:24px; }
.po-empty-t { font-size:14px; font-weight:500; color:var(--txt); margin:0; }
.po-empty-s { font-size:12px; color:var(--muted); margin:0; }

.po-hint {
  display:flex; align-items:flex-start; gap:10px;
  background:var(--p10); border-left:3px solid var(--p);
  padding:10px 14px; margin-bottom:18px; font-size:11px; color:rgba(26,26,24,.7);
  line-height:1.5;
}
.po-hint svg { color:var(--p); width:14px; height:14px; flex-shrink:0; margin-top:1px; }
.po-hint strong { color:var(--p); }
`

function KpiCard({ title, value, sub, icon: Icon, color }: {
  title: string; value: string | number; sub?: string; icon: any; color?: string
}) {
  return (
    <div className="po-kpi" style={color ? { ["--accent-color" as any]: color } : undefined}>
      <div className="po-kpi-top">
        <span className="po-kpi-lbl">{title}</span>
        <div className="po-kpi-ico" style={color ? { background: `${color}20` } : undefined} aria-hidden>
          <Icon style={color ? { color } : undefined} />
        </div>
      </div>
      <p className="po-kpi-val">{value}</p>
      {sub && <p className="po-kpi-sub">{sub}</p>}
    </div>
  )
}

export default async function PedidosCatalogoPage() {
  const permissions = await getUserPermissions()
  if (!permissions?.permissions?.pedidos_catalogo) redirect("/dashboard")

  const companyId = permissions?.company_id
  if (!companyId) redirect("/auth/sin-empresa")

  const supabase = await createClient()

  // Marcar como EXPIRADO los pendientes vencidos (best-effort, no bloquea)
  try {
    await supabase.rpc("rpc_expirar_pedidos_vencidos")
  } catch {
    // si falla, no bloqueamos la pantalla
  }

  const { data: orders } = await supabase
    .from("product_kits")
    .select(`
      id, code, catalog_status, client_name, client_phone,
      expires_at, reclaimed_at, sale_id, frozen_total, created_at,
      product_kit_items ( id, quantity, unit_price_in_kit )
    `)
    .eq("company_id", companyId)
    .eq("is_catalog_order", true)
    .order("created_at", { ascending: false })

  const all = orders || []

  // KPIs
  const pendientes = all.filter(o => o.catalog_status === "PENDIENTE")
  const expirados  = all.filter(o => o.catalog_status === "EXPIRADO")
  const reclamados = all.filter(o => o.catalog_status === "RECLAMADO")

  // Reclamados HOY (zona Colombia)
  const hoyCol = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }))
  const hoyStr = `${hoyCol.getFullYear()}-${String(hoyCol.getMonth() + 1).padStart(2, "0")}-${String(hoyCol.getDate()).padStart(2, "0")}`
  const reclamadosHoy = reclamados.filter(o => {
    if (!o.reclaimed_at) return false
    const d = new Date(o.reclaimed_at).toLocaleString("en-CA", {
      timeZone: "America/Bogota",
      year: "numeric", month: "2-digit", day: "2-digit",
    })
    return d === hoyStr
  })

  const totalPendiente = pendientes.reduce((s, o) => s + Number(o.frozen_total || 0), 0)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="po-page">

        <div className="po-hd">
          <div>
            <h1 className="po-title">
              <span className="po-dot" aria-hidden />
              Pedidos del catálogo
            </h1>
            <p className="po-sub">
              {all.length} pedido{all.length !== 1 ? "s" : ""} · {pendientes.length} pendiente{pendientes.length !== 1 ? "s" : ""} · {reclamados.length} reclamado{reclamados.length !== 1 ? "s" : ""} · {expirados.length} vencido{expirados.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="po-hint">
          <Hash aria-hidden />
          <span>
            Cuando el cliente llegue al punto físico, ingresa el <strong>código numérico del pedido</strong> en el
            campo de barras del POS para cargar todos los productos con sus precios congelados. Al completar la
            venta, el pedido se marcará automáticamente como <strong>RECLAMADO</strong>.
          </span>
        </div>

        <div className="po-kpi-grid">
          <KpiCard title="Pendientes"      value={pendientes.length}       sub="Por reclamar"                     icon={Clock}        color="#d97706" />
          <KpiCard title="Reclamados hoy"  value={reclamadosHoy.length}    sub="Cobrados en el día"               icon={Check}        color="#16a34a" />
          <KpiCard title="Monto pendiente" value={COP(totalPendiente)}     sub="Total congelado por reclamar"     icon={Package}      color="#984ca8" />
          <KpiCard title="Vencidos"        value={expirados.length}        sub="Sin reclamar a tiempo"             icon={AlertTriangle} color="#dc2626" />
        </div>

        <div className="po-table-wrap">
          {all.length > 0
            ? <CatalogOrdersTable orders={all as any} companyId={companyId} />
            : (
              <div className="po-empty">
                <div className="po-empty-ico"><Package /></div>
                <p className="po-empty-t">No hay pedidos del catálogo</p>
                <p className="po-empty-s">Los pedidos generados desde el catálogo público aparecerán aquí</p>
              </div>
            )
          }
        </div>

      </div>
    </>
  )
}
