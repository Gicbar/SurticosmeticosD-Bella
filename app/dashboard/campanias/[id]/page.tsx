// app/dashboard/campanias/[id]/page.tsx
import { getUserPermissions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { CampaniaDetallTabla } from "@/components/campania-detalle-tabla"
import {
  ArrowLeft, Megaphone, Zap, CheckCircle, Send, Ban,
  TrendingDown, Package, Percent, DollarSign,
  Globe, Clock, Archive, Layers, Truck, Hand
} from "lucide-react"
import Link from "next/link"
import { redirect, notFound } from "next/navigation"

function COP(n: number) {
  return n.toLocaleString("es-CO", { style:"currency", currency:"COP", minimumFractionDigits:0 })
}
// Formato estable en SSR (servidor en UTC) o navegador: parseamos los
// componentes de la fecha DATE ("YYYY-MM-DD") explícitamente para que el motor
// de Date no corra el día al elegir una zona horaria.
function fmtFecha(iso: string) {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString("es-CO", {
    day: "2-digit", month: "long", year: "numeric",
  })
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

.cd2-page {
  font-family:'DM Sans',sans-serif;
  --p:      var(--primary,#984ca8);
  --p10:    rgba(var(--primary-rgb,152,76,168),.10);
  --p20:    rgba(var(--primary-rgb,152,76,168),.20);
  --txt:    #1a1a18;
  --muted:  rgba(26,26,24,.45);
  --border: rgba(26,26,24,.08);
  --ok:     #16a34a;
  --warn:   #d97706;
  --danger: #dc2626;
  --info:   #2563eb;
}

/* ── Breadcrumb ──────────────────────────────────────────────── */
.cd2-back {
  display:inline-flex; align-items:center; gap:7px;
  font-size:11px; color:var(--muted); text-decoration:none; margin-bottom:16px;
  transition:color .14s;
}
.cd2-back:hover { color:var(--p); }
.cd2-back svg { width:13px; height:13px; }

/* ── Header principal ────────────────────────────────────────── */
.cd2-hd {
  display:flex; flex-direction:column; gap:14px;
  padding-bottom:20px; border-bottom:1px solid var(--border); margin-bottom:22px;
}
@media(min-width:768px){ .cd2-hd{ flex-direction:row; align-items:flex-start; justify-content:space-between; } }

.cd2-title-row { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.cd2-title {
  font-family:'Cormorant Garamond',Georgia,serif;
  font-size:22px; font-weight:400; color:var(--txt); margin:0;
  display:flex; align-items:center; gap:10px;
}
.cd2-dot { width:8px; height:8px; background:var(--p); flex-shrink:0; }
.cd2-sub { font-size:12px; color:var(--muted); margin:5px 0 0; }

/* Badge estado — igual que la tabla */
.cd2-badge {
  display:inline-flex; align-items:center; gap:5px;
  padding:4px 11px; font-size:9px; font-weight:700;
  letter-spacing:.14em; text-transform:uppercase; white-space:nowrap;
}
.cd2-badge svg { width:10px; height:10px; flex-shrink:0; }
.cd2-badge.borrador  { background:rgba(26,26,24,.06); color:rgba(26,26,24,.55); }
.cd2-badge.calculada { background:rgba(37,99,235,.08); color:var(--info); }
.cd2-badge.aprobada  { background:rgba(22,163,74,.08); color:var(--ok); }
.cd2-badge.publicada { background:var(--p10); color:var(--p); }
.cd2-badge.cancelada { background:rgba(220,38,38,.06); color:var(--danger); }

/* ── Botones de acción según estado ─────────────────────────── */
.cd2-actions { display:flex; flex-wrap:wrap; gap:8px; }

.cd2-btn-primary {
  display:inline-flex; align-items:center; gap:7px;
  height:38px; padding:0 18px; background:var(--p); border:none; cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600;
  letter-spacing:.06em; text-transform:uppercase; color:#fff;
  transition:opacity .15s; white-space:nowrap;
}
.cd2-btn-primary:hover { opacity:.88; }
.cd2-btn-primary:disabled { opacity:.35; cursor:not-allowed; }
.cd2-btn-primary svg { width:13px; height:13px; }

.cd2-btn-secondary {
  display:inline-flex; align-items:center; gap:7px;
  height:38px; padding:0 16px; background:#fff;
  border:1px solid rgba(26,26,24,.12); cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:12px; font-weight:500;
  letter-spacing:.04em; color:rgba(26,26,24,.7);
  transition:border-color .14s, color .14s; white-space:nowrap;
}
.cd2-btn-secondary:hover { border-color:var(--p); color:var(--p); }
.cd2-btn-secondary svg { width:13px; height:13px; }

.cd2-btn-danger {
  display:inline-flex; align-items:center; gap:7px;
  height:38px; padding:0 16px; background:#fff;
  border:1px solid rgba(220,38,38,.20); cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:12px; font-weight:500;
  color:var(--danger); transition:all .14s; white-space:nowrap;
}
.cd2-btn-danger:hover { background:rgba(220,38,38,.05); border-color:var(--danger); }
.cd2-btn-danger svg { width:13px; height:13px; }

/* ── Stepper de estado ───────────────────────────────────────── */
.cd2-stepper {
  display:flex; align-items:center; margin-bottom:22px;
  background:#fff; border:1px solid var(--border); overflow-x:auto;
  -webkit-overflow-scrolling:touch;
}
.cd2-step {
  flex:1; min-width:100px;
  display:flex; flex-direction:column; align-items:center; gap:5px;
  padding:12px 8px; text-align:center; position:relative;
  border-right:1px solid var(--border); transition:background .18s;
}
.cd2-step:last-child { border-right:none; }
.cd2-step-ico {
  width:28px; height:28px;
  display:flex; align-items:center; justify-content:center;
  border-radius:50%; border:2px solid var(--border);
  background:#fff; transition:all .18s;
}
.cd2-step-ico svg { width:13px; height:13px; color:var(--muted); }
.cd2-step-lbl { font-size:8px; font-weight:700; letter-spacing:.18em; text-transform:uppercase; color:var(--muted); }

/* Paso completado */
.cd2-step.done .cd2-step-ico { background:rgba(22,163,74,.08); border-color:rgba(22,163,74,.30); }
.cd2-step.done .cd2-step-ico svg { color:var(--ok); }
.cd2-step.done .cd2-step-lbl { color:var(--ok); }
/* Paso activo */
.cd2-step.current { background:var(--p10); }
.cd2-step.current .cd2-step-ico { background:var(--p); border-color:var(--p); }
.cd2-step.current .cd2-step-ico svg { color:#fff; }
.cd2-step.current .cd2-step-lbl { color:var(--p); font-weight:700; }
/* Cancelada */
.cd2-step.cancelled { background:rgba(220,38,38,.04); }
.cd2-step.cancelled .cd2-step-ico { background:rgba(220,38,38,.06); border-color:rgba(220,38,38,.20); }
.cd2-step.cancelled .cd2-step-ico svg { color:var(--danger); }
.cd2-step.cancelled .cd2-step-lbl { color:rgba(220,38,38,.6); }

/* ── KPIs ────────────────────────────────────────────────────── */
.cd2-kpi-grid {
  display:grid; gap:10px; margin-bottom:20px;
  grid-template-columns:repeat(2,1fr);
}
@media(min-width:640px){ .cd2-kpi-grid{ grid-template-columns:repeat(4,1fr); } }

.cd2-kpi {
  background:#fff; border:1px solid var(--border);
  padding:15px 14px; position:relative; overflow:hidden;
  transition:box-shadow .18s, transform .18s;
}
.cd2-kpi:hover { box-shadow:0 4px 18px var(--p10); transform:translateY(-1px); }
.cd2-kpi::before {
  content:''; position:absolute; top:0; left:0; right:0; height:2px;
  background:var(--p); opacity:0; transition:opacity .18s;
}
.cd2-kpi:hover::before { opacity:1; }
.cd2-kpi-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; }
.cd2-kpi-lbl { font-size:8px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:var(--muted); }
.cd2-kpi-ico { width:26px; height:26px; background:var(--p10); display:flex; align-items:center; justify-content:center; }
.cd2-kpi-ico svg { color:var(--p); width:12px; height:12px; }
.cd2-kpi-val {
  font-family:'Cormorant Garamond',Georgia,serif;
  font-size:20px; font-weight:500; color:var(--txt); margin:0; line-height:1;
}
.cd2-kpi-sub { font-size:10px; color:var(--muted); margin:4px 0 0; }

/* ── Sección detalle tabla ───────────────────────────────────── */
.cd2-section-hd {
  display:flex; align-items:center; justify-content:space-between;
  margin-bottom:12px; flex-wrap:wrap; gap:10px;
}
.cd2-section-title {
  font-family:'Cormorant Garamond',Georgia,serif;
  font-size:16px; font-weight:400; color:var(--txt); margin:0;
  display:flex; align-items:center; gap:8px;
}
.cd2-section-title::before {
  content:''; width:4px; height:16px; background:var(--p); flex-shrink:0;
}
.cd2-section-sub { font-size:11px; color:var(--muted); }

.cd2-table-wrap { background:#fff; border:1px solid var(--border); overflow:hidden; }

/* ── Info box publicada ──────────────────────────────────────── */
.cd2-pub-banner {
  background:var(--p10); border:1px solid var(--p20);
  border-left:4px solid var(--p);
  padding:12px 16px; margin-bottom:20px;
  display:flex; align-items:center; gap:10px; flex-wrap:wrap;
}
.cd2-pub-banner svg { color:var(--p); width:16px; height:16px; flex-shrink:0; }
.cd2-pub-banner-text { font-size:12px; color:var(--txt); }
.cd2-pub-banner-text strong { color:var(--p); }

/* ── Info box cancelada ──────────────────────────────────────── */
.cd2-cancel-banner {
  background:rgba(220,38,38,.05); border:1px solid rgba(220,38,38,.15);
  border-left:4px solid var(--danger);
  padding:12px 16px; margin-bottom:20px;
  display:flex; align-items:center; gap:10px;
}
.cd2-cancel-banner svg { color:var(--danger); width:16px; height:16px; flex-shrink:0; }
.cd2-cancel-banner-text { font-size:12px; color:rgba(26,26,24,.7); }

/* ── Chip de alcance ─────────────────────────────────────────── */
.cd2-alcance {
  display:inline-flex; align-items:center; gap:7px;
  padding:5px 11px; font-size:10px; font-weight:600;
  letter-spacing:.06em; color:var(--p);
  background:var(--p10); border:1px solid var(--p20);
  margin-top:8px;
}
.cd2-alcance svg { width:11px; height:11px; flex-shrink:0; }
.cd2-alcance strong { font-weight:700; }
`

function KpiCard({ title, value, sub, icon: Icon }: {
  title:string; value:string|number; sub?:string; icon:any
}) {
  return (
    <div className="cd2-kpi">
      <div className="cd2-kpi-top">
        <span className="cd2-kpi-lbl">{title}</span>
        <div className="cd2-kpi-ico" aria-hidden><Icon /></div>
      </div>
      <p className="cd2-kpi-val">{value}</p>
      {sub && <p className="cd2-kpi-sub">{sub}</p>}
    </div>
  )
}

const PASOS = [
  { key:"BORRADOR",  label:"Borrador",  icon:Megaphone   },
  { key:"CALCULADA", label:"Calculada", icon:Zap         },
  { key:"APROBADA",  label:"Aprobada",  icon:CheckCircle },
  { key:"PUBLICADA", label:"Publicada", icon:Send        },
]

const ALCANCE_ICO: Record<string, any> = {
  TODOS: Globe, SIN_ROTACION: Clock, SOBRESTOCK: Archive,
  CATEGORIA: Layers, PROVEEDOR: Truck, MANUAL: Hand,
}

// Mapa estado → acción disponible en la toolbar del header.
// CANCELADA no aparece (no hay acción posible).
const accionPorEstado: Record<string, "calcular" | "aprobar" | "publicar" | "cancelar" | undefined> = {
  BORRADOR:  "calcular",
  CALCULADA: "aprobar",
  APROBADA:  "publicar",
  PUBLICADA: "cancelar",
}

function describirAlcance(criterio: any): { label: string; Icon: any } {
  const modo = criterio?.modo || "TODOS"
  const Icon = ALCANCE_ICO[modo] || Globe
  switch (modo) {
    case "TODOS":
      return { Icon, label: "Todo el inventario" }
    case "SIN_ROTACION":
      return { Icon, label: `Sin rotación · ${criterio?.dias_sin_venta ?? 60} días sin venta` }
    case "SOBRESTOCK":
      return { Icon, label: `Sobrestock · cobertura ≥ ${criterio?.dias_cobertura_min ?? 90} d (ventana ${criterio?.ventana_venta_dias ?? 30} d)` }
    case "CATEGORIA": {
      const n = (criterio?.category_ids || []).length
      return { Icon, label: `${n} categoría${n !== 1 ? "s" : ""} seleccionada${n !== 1 ? "s" : ""}` }
    }
    case "PROVEEDOR": {
      const n = (criterio?.supplier_ids || []).length
      return { Icon, label: `${n} proveedor${n !== 1 ? "es" : ""} seleccionado${n !== 1 ? "s" : ""}` }
    }
    case "MANUAL": {
      const n = (criterio?.product_ids || []).length
      return { Icon, label: `Selección manual · ${n} producto${n !== 1 ? "s" : ""}` }
    }
    default:
      return { Icon, label: modo }
  }
}
const ORDER: Record<string,number> = {
  BORRADOR:0, CALCULADA:1, APROBADA:2, PUBLICADA:3, CANCELADA:4
}

function Stepper({ estado }: { estado:string }) {
  if (estado === "CANCELADA") {
    return (
      <div className="cd2-stepper">
        {PASOS.map(p => (
          <div key={p.key} className="cd2-step cancelled">
            <div className="cd2-step-ico" aria-hidden><p.icon /></div>
            <span className="cd2-step-lbl">{p.label}</span>
          </div>
        ))}
        <div className="cd2-step cancelled" style={{ background:"rgba(220,38,38,.08)" }}>
          <div className="cd2-step-ico" aria-hidden><Ban /></div>
          <span className="cd2-step-lbl">Cancelada</span>
        </div>
      </div>
    )
  }

  const currentIdx = ORDER[estado] ?? 0
  return (
    <div className="cd2-stepper" role="list" aria-label="Flujo de la campaña">
      {PASOS.map((p, idx) => {
        const cls = idx < currentIdx ? "done" : idx === currentIdx ? "current" : ""
        return (
          <div key={p.key} className={`cd2-step ${cls}`} role="listitem">
            <div className="cd2-step-ico" aria-hidden><p.icon /></div>
            <span className="cd2-step-lbl">{p.label}</span>
          </div>
        )
      })}
    </div>
  )
}

export default async function CampaniaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>  // Next.js 15: params es una Promise
}) {
  // Next.js 15 requiere await en params
  const { id } = await params
  const permissions = await getUserPermissions()
  if (!permissions?.permissions?.campanias) redirect("/dashboard")
  const companyId = permissions.company_id
  if (!companyId) redirect("/auth/sin-empresa")

  const supabase = await createClient()

  const [{ data: campania }, { data: detalles }] = await Promise.all([
    supabase
      .from("campanias_descuento")
      .select("*, criterio_seleccion")
      .eq("id", id)
      .eq("company_id", companyId)
      .single(),
    supabase
      .from("campania_descuento_detalle")
      .select(`
        id, product_id, lote_id, activo, motivo_inactivo,
        cantidad_disponible, precio_compra, precio_venta_actual,
        porcentaje_maximo_permitido, precio_minimo_permitido,
        porcentaje_descuento_aprobado, precio_oferta,
        margen_resultante, ganancia_por_unidad, ganancia_total_estimada,
        products ( name, image_url, barcode, categories(name) )
      `)
      .eq("campania_id", id)
      .order("activo", { ascending: false })
      .order("porcentaje_maximo_permitido", { ascending: false }),
  ])

  if (!campania) notFound()

  const all        = detalles || []
  const elegibles  = all.filter(d => d.activo)
  const conDescto  = elegibles.filter(d => d.porcentaje_descuento_aprobado > 0)
  const inelegibles = all.filter(d => !d.activo)

  const gananciaTotal = conDescto.reduce(
    (s, d) => s + Number(d.ganancia_total_estimada || 0), 0
  )
  const desctoPromedio = conDescto.length > 0
    ? conDescto.reduce((s, d) => s + Number(d.porcentaje_descuento_aprobado), 0) / conDescto.length
    : 0

  const isManager = ["admin","gerente"].includes(permissions.role || "")

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="cd2-page">

        {/* Breadcrumb */}
        <Link href="/dashboard/campanias" className="cd2-back">
          <ArrowLeft aria-hidden />
          Volver a campañas
        </Link>

        {/* Header */}
        <div className="cd2-hd">
          <div>
            <div className="cd2-title-row">
              <h1 className="cd2-title">
                <span className="cd2-dot" aria-hidden />
                {campania.nombre}
              </h1>
              {/* Badge estado inline */}
              {campania.estado === "BORRADOR"  && <span className="cd2-badge borrador"><Megaphone size={10} />Borrador</span>}
              {campania.estado === "CALCULADA" && <span className="cd2-badge calculada"><Zap size={10} />Calculada</span>}
              {campania.estado === "APROBADA"  && <span className="cd2-badge aprobada"><CheckCircle size={10} />Aprobada</span>}
              {campania.estado === "PUBLICADA" && <span className="cd2-badge publicada"><Send size={10} />Publicada</span>}
              {campania.estado === "CANCELADA" && <span className="cd2-badge cancelada"><Ban size={10} />Cancelada</span>}
            </div>
            <p className="cd2-sub">
              Vigencia: {fmtFecha(campania.fecha_inicio)} — {fmtFecha(campania.fecha_fin)} &nbsp;·&nbsp;
              Margen mínimo: {campania.margen_minimo}%
              {campania.descripcion && <> &nbsp;·&nbsp; {campania.descripcion}</>}
            </p>
            {(() => {
              const { label, Icon } = describirAlcance(campania.criterio_seleccion)
              return (
                <span className="cd2-alcance" title="Alcance de la campaña">
                  <Icon aria-hidden />
                  Alcance: <strong>{label}</strong>
                </span>
              )
            })()}
          </div>

          {/* Botones de transición de estado — un único render según estado */}
          {isManager && accionPorEstado[campania.estado] && (
            <div className="cd2-actions">
              <CampaniaDetallTabla
                campania={campania}
                detalles={elegibles as any}
                inelegibles={inelegibles as any}
                companyId={companyId}
                accionPendiente={accionPorEstado[campania.estado]!}
              />
            </div>
          )}
        </div>

        {/* Stepper visual */}
        <Stepper estado={campania.estado} />

        {/* Banners informativos */}
        {campania.estado === "PUBLICADA" && (
          <div className="cd2-pub-banner">
            <Send aria-hidden />
            <span className="cd2-pub-banner-text">
              Esta campaña está <strong>activa en el catálogo público</strong>.
              Los descuentos son visibles para los clientes.
              Para retirarla usa <strong>Cancelar campaña</strong>.
            </span>
          </div>
        )}
        {campania.estado === "CANCELADA" && (
          <div className="cd2-cancel-banner">
            <Ban aria-hidden />
            <span className="cd2-cancel-banner-text">
              Campaña cancelada. Todas las ofertas asociadas han sido desactivadas del catálogo.
            </span>
          </div>
        )}

        {/* KPIs */}
        <div className="cd2-kpi-grid">
          <KpiCard
            title="Lotes elegibles"
            value={elegibles.length}
            sub={`${inelegibles.length} inelegibles`}
            icon={Package}
          />
          <KpiCard
            title="Con descuento"
            value={conDescto.length}
            sub={`de ${elegibles.length} disponibles`}
            icon={TrendingDown}
          />
          <KpiCard
            title="Descuento promedio"
            value={`${desctoPromedio.toFixed(1)}%`}
            sub="Sobre lotes con descuento"
            icon={Percent}
          />
          <KpiCard
            title="Ganancia estimada"
            value={COP(gananciaTotal)}
            sub="Con descuentos aplicados"
            icon={DollarSign}
          />
        </div>

        {/* Tabla de detalles — solo cuando hay datos */}
        {(campania.estado !== "BORRADOR" && all.length > 0) && (
          <>
            <div className="cd2-section-hd">
              <h2 className="cd2-section-title">Lotes analizados</h2>
              <span className="cd2-section-sub">
                {elegibles.length} elegibles · {inelegibles.length} sin margen suficiente
              </span>
            </div>
            <div className="cd2-table-wrap">
              <CampaniaDetallTabla
                campania={campania}
                detalles={elegibles as any}
                inelegibles={inelegibles as any}
                companyId={companyId}
                accionPendiente="tabla"
              />
            </div>
          </>
        )}

        {/* Estado BORRADOR sin análisis */}
        {campania.estado === "BORRADOR" && (
          <div style={{
            background:"#fff", border:"1px solid var(--border)",
            padding:"48px 24px", textAlign:"center",
          }}>
            <div style={{
              width:56, height:56, margin:"0 auto 16px",
              background:"var(--p10)", borderRadius:"50%",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <Zap size={22} style={{ color:"var(--primary, #984ca8)", opacity:.5 }} />
            </div>
            <p style={{
              fontFamily:"'Cormorant Garamond',serif", fontSize:18,
              fontWeight:400, color:"var(--txt,#1a1a18)", marginBottom:8,
            }}>
              Listo para analizar
            </p>
            <p style={{ fontSize:12, color:"var(--muted,rgba(26,26,24,.45))", maxWidth:360, margin:"0 auto" }}>
              Haz clic en <strong>Generar análisis</strong> para que el sistema calcule los descuentos
              máximos permitidos por lote, respetando el margen mínimo del {campania.margen_minimo}%.
            </p>
          </div>
        )}

      </div>
    </>
  )
}
