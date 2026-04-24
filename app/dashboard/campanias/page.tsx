// app/dashboard/campanias/page.tsx
import { getUserPermissions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { CampaniasTable } from "@/components/campanias-table"
import { CampaniaDialog } from "@/components/campania-dialog"
import { Plus, Megaphone, CheckCircle, Tag, TrendingDown } from "lucide-react"
import { redirect } from "next/navigation"

function COP(n: number) {
  return n.toLocaleString("es-CO", { style:"currency", currency:"COP", minimumFractionDigits:0 })
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

.cp-page {
  font-family:'DM Sans',sans-serif;
  --p:      var(--primary,#984ca8);
  --p10:    rgba(var(--primary-rgb,152,76,168),.10);
  --p20:    rgba(var(--primary-rgb,152,76,168),.20);
  --txt:    #1a1a18;
  --muted:  #1a1a18;
  --border: rgba(26,26,24,.08);
  --ok:     #16a34a;
  --warn:   #d97706;
}

/* ── Header ─────────────────────────────────────────────────── */
.cp-hd {
  display:flex; flex-direction:column; gap:14px;
  padding-bottom:20px; border-bottom:1px solid var(--border); margin-bottom:22px;
}
@media(min-width:640px){ .cp-hd{ flex-direction:row; align-items:center; justify-content:space-between; } }

.cp-title {
  font-family:'Cormorant Garamond',Georgia,serif;
  font-size:22px; font-weight:400; color:var(--txt); margin:0;
  display:flex; align-items:center; gap:10px;
}
.cp-dot { width:8px; height:8px; background:var(--p); flex-shrink:0; }
.cp-sub { font-size:12px; color:var(--muted); margin:3px 0 0; }

.cp-btn-new {
  display:inline-flex; align-items:center; gap:7px;
  height:38px; padding:0 18px; background:var(--p); border:none; cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600;
  letter-spacing:.06em; text-transform:uppercase; color:#fff;
  transition:opacity .15s; white-space:nowrap; flex-shrink:0;
}
.cp-btn-new:hover { opacity:.88; }
.cp-btn-new svg { width:13px; height:13px; }

/* ── KPIs ────────────────────────────────────────────────────── */
.cp-kpi-grid {
  display:grid; gap:10px; margin-bottom:20px;
  grid-template-columns:repeat(2,1fr);
}
@media(min-width:640px){ .cp-kpi-grid{ grid-template-columns:repeat(4,1fr); } }

.cp-kpi {
  background:#fff; border:1px solid var(--border);
  padding:15px 14px; position:relative; overflow:hidden;
  transition:box-shadow .18s, transform .18s;
}
.cp-kpi:hover { box-shadow:0 4px 18px var(--p10); transform:translateY(-1px); }
.cp-kpi::before {
  content:''; position:absolute; top:0; left:0; right:0; height:2px;
  background:var(--p); opacity:0; transition:opacity .18s;
}
.cp-kpi:hover::before { opacity:1; }
.cp-kpi-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; }
.cp-kpi-lbl { font-size:8px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:var(--muted); }
.cp-kpi-ico { width:26px; height:26px; background:var(--p10); display:flex; align-items:center; justify-content:center; }
.cp-kpi-ico svg { color:var(--p); width:12px; height:12px; }
.cp-kpi-val {
  font-family:'Cormorant Garamond',Georgia,serif;
  font-size:20px; font-weight:500; color:var(--txt); margin:0; line-height:1;
}
.cp-kpi-sub { font-size:10px; color:var(--muted); margin:4px 0 0; }

/* ── Pipeline de estados ─────────────────────────────────────── */
.cp-pipeline {
  display:flex; align-items:center; gap:0; margin-bottom:20px;
  background:#fff; border:1px solid var(--border); overflow:hidden;
}
.cp-pipe-step {
  flex:1; padding:10px 8px; text-align:center; position:relative;
  border-right:1px solid var(--border); cursor:default;
}
.cp-pipe-step:last-child { border-right:none; }
.cp-pipe-label {
  font-size:7px; font-weight:700; letter-spacing:.2em;
  text-transform:uppercase; color:var(--muted); display:block; margin-bottom:4px;
}
.cp-pipe-count {
  font-family:'Cormorant Garamond',Georgia,serif;
  font-size:18px; font-weight:500; color:var(--txt); line-height:1;
}
.cp-pipe-step.active { background:var(--p10); }
.cp-pipe-step.active .cp-pipe-label { color:var(--p); }
.cp-pipe-step.active .cp-pipe-count { color:var(--p); }
.cp-pipe-step.pub { background:rgba(22,163,74,.07); }
.cp-pipe-step.pub .cp-pipe-label { color:var(--ok); }
.cp-pipe-step.pub .cp-pipe-count { color:var(--ok); }
.cp-pipe-step.can { background:rgba(220,38,38,.04); }
.cp-pipe-step.can .cp-pipe-label { color:rgba(220,38,38,.6); }
.cp-pipe-step.can .cp-pipe-count { color:rgba(220,38,38,.6); }

/* ── Tabla wrap ──────────────────────────────────────────────── */
.cp-table-wrap { background:#fff; border:1px solid var(--border); overflow:hidden; }

/* ── Vacío ───────────────────────────────────────────────────── */
.cp-empty { display:flex; flex-direction:column; align-items:center; gap:14px; padding:64px 20px; text-align:center; }
.cp-empty-ico { width:56px; height:56px; background:var(--p10); display:flex; align-items:center; justify-content:center; border-radius:50%; }
.cp-empty-ico svg { color:var(--p); opacity:.3; width:24px; height:24px; }
.cp-empty-t { font-size:14px; font-weight:500; color:var(--txt); margin:0; }
.cp-empty-s { font-size:12px; color:var(--muted); margin:0; }
`

function KpiCard({ title, value, sub, icon: Icon }: {
  title:string; value:string|number; sub?:string; icon:any
}) {
  return (
    <div className="cp-kpi">
      <div className="cp-kpi-top">
        <span className="cp-kpi-lbl">{title}</span>
        <div className="cp-kpi-ico" aria-hidden><Icon /></div>
      </div>
      <p className="cp-kpi-val">{value}</p>
      {sub && <p className="cp-kpi-sub">{sub}</p>}
    </div>
  )
}

export default async function CampaniasPage() {
  const permissions = await getUserPermissions()
  if (!permissions?.permissions?.campanias) redirect("/dashboard")
  const companyId = permissions.company_id
  if (!companyId) redirect("/auth/sin-empresa")

  const supabase = await createClient()

  const { data: campanias } = await supabase
    .from("campanias_descuento")
    .select(`
      id, nombre, estado, fecha_inicio, fecha_fin,
      margen_minimo, created_at, aprobado_at, publicado_at
    `)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })

  const all           = campanias || []
  const total         = all.length
  const publicadas    = all.filter(c => c.estado === "PUBLICADA").length
  const calculadas    = all.filter(c => c.estado === "CALCULADA").length
  const aprobadas     = all.filter(c => c.estado === "APROBADA").length
  const borradores    = all.filter(c => c.estado === "BORRADOR").length
  const canceladas    = all.filter(c => c.estado === "CANCELADA").length

  // Descuentos activos desde ofertas_virtuales
  const { data: ofertasActivas } = await supabase
    .from("ofertas_virtuales")
    .select("product_id")
    .eq("company_id", companyId)
    .eq("activo", true)

  const productosEnOferta = new Set(ofertasActivas?.map(o => o.product_id) || []).size

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="cp-page">

        {/* Header */}
        <div className="cp-hd">
          <div>
            <h1 className="cp-title">
              <span className="cp-dot" aria-hidden />
              Campañas de descuento
            </h1>
            <p className="cp-sub">
              {total} campaña{total !== 1 ? "s" : ""} · {publicadas} publicada{publicadas !== 1 ? "s" : ""} · {productosEnOferta} productos en oferta activa
            </p>
          </div>
          <CampaniaDialog companyId={companyId}>
            <button className="cp-btn-new">
              <Plus size={13} aria-hidden />
              Nueva campaña
            </button>
          </CampaniaDialog>
        </div>

        {/* KPIs */}
        <div className="cp-kpi-grid">
          <KpiCard title="Total campañas"     value={total}            sub="Todas las campañas"       icon={Megaphone}    />
          <KpiCard title="Publicadas"         value={publicadas}       sub="Activas en catálogo"      icon={Tag}          />
          <KpiCard title="Pendientes revisar" value={calculadas}       sub="Esperan aprobación"       icon={CheckCircle}  />
          <KpiCard title="En oferta ahora"    value={productosEnOferta} sub="Productos con descuento" icon={TrendingDown}  />
        </div>

        {/* Pipeline visual de estados */}
        <div className="cp-pipeline" role="list" aria-label="Estado de campañas">
          {[
            { label: "Borrador",   count: borradores, cls: "" },
            { label: "Calculada",  count: calculadas, cls: "active" },
            { label: "Aprobada",   count: aprobadas,  cls: "active" },
            { label: "Publicada",  count: publicadas, cls: "pub" },
            { label: "Cancelada",  count: canceladas, cls: "can" },
          ].map(s => (
            <div key={s.label} className={`cp-pipe-step ${s.cls}`} role="listitem">
              <span className="cp-pipe-label">{s.label}</span>
              <span className="cp-pipe-count">{s.count}</span>
            </div>
          ))}
        </div>

        {/* Tabla */}
        <div className="cp-table-wrap">
          {all.length > 0
            ? <CampaniasTable campanias={all} companyId={companyId} />
            : (
              <div className="cp-empty">
                <div className="cp-empty-ico"><Megaphone /></div>
                <p className="cp-empty-t">No hay campañas creadas</p>
                <p className="cp-empty-s">Crea tu primera campaña para aplicar descuentos estratégicos</p>
              </div>
            )
          }
        </div>

      </div>
    </>
  )
}
