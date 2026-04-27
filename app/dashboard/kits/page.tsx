// app/dashboard/kits/page.tsx
import { getUserPermissions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { KitsTable } from "@/components/kits-table"
import { Plus, Package, Layers, ToggleLeft, Hash } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

function COP(n: number) {
  return n.toLocaleString("es-CO", { style:"currency", currency:"COP", minimumFractionDigits:0 })
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

.kp-page {
  font-family:'DM Sans',sans-serif;
  --p:      var(--primary,#984ca8);
  --p10:    rgba(var(--primary-rgb,152,76,168),.10);
  --txt:    #1a1a18;
  --muted:  #1a1a18;
  --border: rgba(26,26,24,.08);
}

.kp-hd {
  display:flex; flex-direction:column; gap:14px;
  padding-bottom:20px; border-bottom:1px solid var(--border); margin-bottom:22px;
}
@media(min-width:640px){ .kp-hd{ flex-direction:row; align-items:center; justify-content:space-between; } }

.kp-title {
  font-family:'Cormorant Garamond',Georgia,serif;
  font-size:22px; font-weight:400; color:var(--txt); margin:0;
  display:flex; align-items:center; gap:10px;
}
.kp-dot   { width:8px; height:8px; background:var(--p); flex-shrink:0; }
.kp-sub   { font-size:12px; color:var(--muted); margin:3px 0 0; }

.kp-btn-new {
  display:inline-flex; align-items:center; gap:7px;
  height:38px; padding:0 18px; background:var(--p); border:none; cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600;
  letter-spacing:.06em; text-transform:uppercase; color:#fff;
  text-decoration:none; transition:opacity .15s; white-space:nowrap; flex-shrink:0;
}
.kp-btn-new:hover { opacity:.88; }
.kp-btn-new svg { width:13px; height:13px; }

.kp-kpi-grid {
  display:grid; gap:10px; margin-bottom:20px;
  grid-template-columns:repeat(2,1fr);
}
@media(min-width:640px){ .kp-kpi-grid{ grid-template-columns:repeat(4,1fr); } }

.kp-kpi {
  background:#fff; border:1px solid var(--border);
  padding:15px 14px; position:relative; overflow:hidden;
  transition:box-shadow .18s,transform .18s;
}
.kp-kpi:hover { box-shadow:0 4px 18px var(--p10); transform:translateY(-1px); }
.kp-kpi::before {
  content:''; position:absolute; top:0; left:0; right:0; height:2px;
  background:var(--p); opacity:0; transition:opacity .18s;
}
.kp-kpi:hover::before { opacity:1; }
.kp-kpi-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; }
.kp-kpi-lbl { font-size:8px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:var(--muted); }
.kp-kpi-ico { width:26px; height:26px; background:var(--p10); display:flex; align-items:center; justify-content:center; }
.kp-kpi-ico svg { color:var(--p); width:12px; height:12px; }
.kp-kpi-val {
  font-family:'Cormorant Garamond',Georgia,serif;
  font-size:20px; font-weight:500; color:var(--txt); margin:0; line-height:1;
}
.kp-kpi-sub { font-size:10px; color:var(--muted); margin:4px 0 0; }

.kp-table-wrap { background:#fff; border:1px solid var(--border); overflow:hidden; }

.kp-empty {
  display:flex; flex-direction:column; align-items:center; gap:14px;
  padding:64px 20px; text-align:center;
}
.kp-empty-ico {
  width:56px; height:56px; background:var(--p10);
  display:flex; align-items:center; justify-content:center; border-radius:50%;
}
.kp-empty-ico svg { color:var(--p); opacity:.3; width:24px; height:24px; }
.kp-empty-t { font-size:14px; font-weight:500; color:var(--txt); margin:0; }
.kp-empty-s { font-size:12px; color:var(--muted); margin:0; }

/* Hint informativo */
.kp-hint {
  display:flex; align-items:flex-start; gap:10px;
  background:var(--p10); border-left:3px solid var(--p);
  padding:10px 14px; margin-bottom:18px; font-size:11px; color:rgba(26,26,24,.7);
  line-height:1.5;
}
.kp-hint svg { color:var(--p); width:14px; height:14px; flex-shrink:0; margin-top:1px; }
.kp-hint strong { color:var(--p); }
`

function KpiCard({ title, value, sub, icon:Icon }: {
  title:string; value:string|number; sub?:string; icon:any
}) {
  return (
    <div className="kp-kpi">
      <div className="kp-kpi-top">
        <span className="kp-kpi-lbl">{title}</span>
        <div className="kp-kpi-ico" aria-hidden><Icon /></div>
      </div>
      <p className="kp-kpi-val">{value}</p>
      {sub && <p className="kp-kpi-sub">{sub}</p>}
    </div>
  )
}

export default async function KitsPage() {

  const permissions = await getUserPermissions()
  
    if (!permissions?.permissions?.kits) redirect("/dashboard")
  
  const companyId   = permissions?.company_id
  if (!companyId) redirect("/auth/sin-empresa")

  const supabase = await createClient()

  const { data: kits } = await supabase
    .from("product_kits")
    .select(`
      id, code, name, description, is_active, created_at,
      product_kit_items ( id, quantity, unit_price_in_kit )
    `)
    .eq("company_id", companyId)
    .eq("is_catalog_order", false)
    .order("code", { ascending: true })

  const all      = kits || []
  const activos  = all.filter(k => k.is_active).length
  const inactivos = all.length - activos
  const totalItems = all.reduce((s, k) => s + (k.product_kit_items?.length || 0), 0)
  const avgItems   = all.length > 0 ? Math.round(totalItems / all.length) : 0

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="kp-page">

        <div className="kp-hd">
          <div>
            <h1 className="kp-title">
              <span className="kp-dot" aria-hidden />
              Kits de productos
            </h1>
            <p className="kp-sub">
              {all.length} kit{all.length !== 1 ? "s" : ""} · {activos} activo{activos !== 1 ? "s" : ""} · {inactivos} inactivo{inactivos !== 1 ? "s" : ""}
            </p>
          </div>
          <Link href="/dashboard/kits/new" className="kp-btn-new">
            <Plus size={13} aria-hidden />
            Nuevo kit
          </Link>
        </div>

        {/* Hint de uso */}
        <div className="kp-hint">
          <Hash aria-hidden />
          <span>
            Ingresa el <strong>código numérico del kit</strong> en el campo de barras del POS para agregar
            todos sus productos de una vez. Cada producto aparece con su precio de kit individual.
          </span>
        </div>

        <div className="kp-kpi-grid">
          <KpiCard title="Total kits"      value={all.length}   sub="Todos los kits"         icon={Layers}      />
          <KpiCard title="Activos"         value={activos}      sub="Disponibles en POS"      icon={Package}     />
          <KpiCard title="Inactivos"       value={inactivos}    sub="No aparecen en POS"      icon={ToggleLeft}  />
          <KpiCard title="Promedio ítems"  value={avgItems}     sub="Productos por kit"        icon={Hash}        />
        </div>

        <div className="kp-table-wrap">
          {all.length > 0
            ? <KitsTable kits={all} companyId={companyId} />
            : (
              <div className="kp-empty">
                <div className="kp-empty-ico"><Layers /></div>
                <p className="kp-empty-t">No hay kits creados</p>
                <p className="kp-empty-s">Crea tu primer kit para vender combos de productos</p>
              </div>
            )
          }
        </div>

      </div>
    </>
  )
}
