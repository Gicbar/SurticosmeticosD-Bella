"use client"

import { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { showConfirm, showSuccess, showError } from "@/lib/sweetalert"
import {
  Package, Zap, CheckCircle, Send, Ban,
  AlertTriangle, Info, TrendingDown, ChevronDown, ChevronUp,
  Search, X
} from "lucide-react"

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

.cdt {
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
}

/* ── Toolbar de acciones (aparece en la página de detalle) ───── */
.cdt-toolbar {
  display:flex; flex-wrap:wrap; gap:8px; align-items:center;
}

.cdt-btn-main {
  display:inline-flex; align-items:center; gap:7px;
  height:38px; padding:0 18px; background:var(--p); border:none; cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600;
  letter-spacing:.06em; text-transform:uppercase; color:#fff;
  transition:opacity .15s; white-space:nowrap;
}
.cdt-btn-main:hover:not(:disabled) { opacity:.88; }
.cdt-btn-main:disabled { opacity:.35; cursor:not-allowed; }
.cdt-btn-main svg { width:13px; height:13px; }

.cdt-btn-outline {
  display:inline-flex; align-items:center; gap:7px;
  height:38px; padding:0 16px; background:#fff;
  border:1px solid rgba(26,26,24,.12); cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:12px;
  color:rgba(26,26,24,.7); transition:border-color .14s, color .14s; white-space:nowrap;
}
.cdt-btn-outline:hover { border-color:var(--p); color:var(--p); }

.cdt-btn-danger {
  display:inline-flex; align-items:center; gap:7px;
  height:38px; padding:0 16px; background:#fff;
  border:1px solid rgba(220,38,38,.20); cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:12px;
  color:var(--danger); transition:all .14s; white-space:nowrap;
}
.cdt-btn-danger:hover { background:rgba(220,38,38,.05); border-color:var(--danger); }

.cdt-spin {
  width:13px; height:13px; border:2px solid rgba(255,255,255,.3);
  border-top-color:#fff; border-radius:50%;
  animation:cdtSpin .7s linear infinite; flex-shrink:0;
}
@keyframes cdtSpin { to{ transform:rotate(360deg); } }

/* ── Tabla de lotes ──────────────────────────────────────────── */
.cdt-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; }

table.cdt-tbl { width:100%; border-collapse:collapse; min-width:860px; }
.cdt-tbl thead tr { border-bottom:2px solid var(--border); background:rgba(26,26,24,.02); }
.cdt-tbl th {
  padding:9px 13px; font-size:8px; font-weight:700;
  letter-spacing:.2em; text-transform:uppercase; color:var(--muted);
  text-align:left; white-space:nowrap;
}
.cdt-tbl th.r { text-align:right; }
.cdt-tbl th.c { text-align:center; }
.cdt-tbl tbody tr { border-bottom:1px solid var(--border); transition:background .1s; }
.cdt-tbl tbody tr:last-child { border-bottom:none; }
.cdt-tbl tbody tr:hover { background:rgba(26,26,24,.015); }
.cdt-tbl td { padding:11px 13px; font-size:12px; color:var(--txt); vertical-align:middle; }
.cdt-tbl td.r { text-align:right; }
.cdt-tbl td.c { text-align:center; }

/* Fila inelegible — opaca */
.cdt-tbl tbody tr.inactivo { opacity:.45; }
.cdt-tbl tbody tr.inactivo:hover { opacity:.55; background:rgba(220,38,38,.02); }

/* Nombre producto */
.cdt-prod { display:flex; align-items:center; gap:9px; }
.cdt-prod-img {
  width:36px; height:36px; flex-shrink:0; overflow:hidden;
  background:var(--p10); display:flex; align-items:center; justify-content:center;
}
.cdt-prod-img img { width:100%; height:100%; object-fit:cover; }
.cdt-prod-img svg { color:var(--p); width:14px; height:14px; opacity:.4; }
.cdt-prod-name { font-weight:500; font-size:12px; line-height:1.3; max-width:180px; }
.cdt-prod-sku  { font-size:9px; color:var(--muted); margin-top:2px; font-family:monospace; }

/* Precio */
.cdt-price {
  font-family:'Cormorant Garamond',Georgia,serif;
  font-size:14px; font-weight:500; color:var(--txt);
}
.cdt-price.oferta { color:var(--p); }

/* Margen badge */
.cdt-margen {
  display:inline-flex; align-items:center; gap:4px;
  padding:3px 8px; font-size:10px; font-weight:700;
  white-space:nowrap;
}
.cdt-margen.ok   { background:rgba(22,163,74,.08); color:var(--ok); }
.cdt-margen.warn { background:rgba(217,119,6,.10); color:var(--warn); }
.cdt-margen.bad  { background:rgba(220,38,38,.08); color:var(--danger); }

/* ── Slider de descuento ─────────────────────────────────────── */
.cdt-slider-wrap { display:flex; flex-direction:column; gap:4px; min-width:160px; }
.cdt-slider-row  { display:flex; align-items:center; gap:8px; }

.cdt-slider {
  -webkit-appearance:none; appearance:none;
  flex:1; height:4px; border-radius:2px; outline:none; cursor:pointer;
  background: linear-gradient(to right,
    var(--primary,#984ca8) 0%,
    var(--primary,#984ca8) var(--val,0%),
    rgba(26,26,24,.12) var(--val,0%),
    rgba(26,26,24,.12) 100%
  );
  transition:opacity .14s;
}
.cdt-slider::-webkit-slider-thumb {
  -webkit-appearance:none; appearance:none;
  width:14px; height:14px; border-radius:50%;
  background:var(--primary,#984ca8);
  box-shadow:0 1px 4px rgba(0,0,0,.25);
  cursor:pointer; transition:transform .1s;
}
.cdt-slider::-webkit-slider-thumb:hover { transform:scale(1.15); }
.cdt-slider::-moz-range-thumb {
  width:14px; height:14px; border-radius:50%; border:none;
  background:var(--primary,#984ca8);
  box-shadow:0 1px 4px rgba(0,0,0,.25); cursor:pointer;
}
.cdt-slider:disabled { opacity:.3; cursor:not-allowed; }

.cdt-pct-input {
  width:52px; height:28px; padding:0 6px;
  border:1px solid var(--border); background:#fff;
  font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600;
  color:var(--p); text-align:center; outline:none;
  -webkit-appearance:none; -moz-appearance:textfield;
  transition:border-color .14s;
}
.cdt-pct-input:focus { border-color:var(--p); }
.cdt-pct-input::-webkit-outer-spin-button,
.cdt-pct-input::-webkit-inner-spin-button { -webkit-appearance:none; }
.cdt-pct-input:disabled { opacity:.3; cursor:not-allowed; }

.cdt-slider-max {
  font-size:9px; color:var(--muted); text-align:right;
  letter-spacing:.04em;
}
.cdt-slider-saving {
  font-size:9px; letter-spacing:.04em; text-align:right;
  font-weight:600;
}
.cdt-slider-saving.ok { color:var(--ok); }

/* Motivo inactivo */
.cdt-inactivo-msg {
  display:flex; align-items:flex-start; gap:5px;
  font-size:10px; color:var(--muted); font-style:italic;
}
.cdt-inactivo-msg svg { width:10px; height:10px; flex-shrink:0; margin-top:1px; }

/* Sección inelegibles colapsable */
.cdt-toggle-btn {
  display:flex; align-items:center; gap:7px;
  padding:9px 13px; background:rgba(26,26,24,.02);
  border:none; border-top:1px solid var(--border);
  cursor:pointer; font-family:'DM Sans',sans-serif;
  font-size:10px; color:var(--muted); width:100%;
  transition:background .14s;
}
.cdt-toggle-btn:hover { background:rgba(26,26,24,.04); }
.cdt-toggle-btn svg { width:12px; height:12px; }

/* ── Filtros de productos ───────────────────────────────────── */
.cdt-filters {
  display:flex; flex-wrap:wrap; gap:8px; align-items:center;
  padding:10px 13px; border-bottom:1px solid var(--border);
  background:rgba(26,26,24,.015);
}
.cdt-search {
  position:relative; flex:1 1 220px; min-width:180px;
}
.cdt-search input {
  width:100%; height:32px; padding:0 30px 0 30px;
  border:1px solid var(--border); background:#fff;
  font-family:'DM Sans',sans-serif; font-size:12px; color:var(--txt);
  outline:none; transition:border-color .14s;
}
.cdt-search input:focus { border-color:var(--p); }
.cdt-search-ico {
  position:absolute; top:50%; left:9px; transform:translateY(-50%);
  width:13px; height:13px; color:var(--muted); pointer-events:none;
}
.cdt-search-clear {
  position:absolute; top:50%; right:7px; transform:translateY(-50%);
  width:18px; height:18px; border:none; background:transparent;
  display:flex; align-items:center; justify-content:center;
  cursor:pointer; color:var(--muted);
}
.cdt-search-clear:hover { color:var(--danger); }
.cdt-search-clear svg { width:11px; height:11px; }

.cdt-select {
  height:32px; padding:0 26px 0 10px;
  border:1px solid var(--border); background:#fff;
  font-family:'DM Sans',sans-serif; font-size:11px; color:var(--txt);
  outline:none; transition:border-color .14s;
  cursor:pointer; min-width:140px;
  -webkit-appearance:none; appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat:no-repeat; background-position:right 9px center;
}
.cdt-select:focus { border-color:var(--p); }

.cdt-filters-info {
  font-size:10px; color:var(--muted); letter-spacing:.04em;
  margin-left:auto;
}
.cdt-filters-info strong { color:var(--txt); font-weight:600; }

@media(max-width:560px){
  .cdt-filters-info { width:100%; text-align:right; margin-left:0; }
}

/* Empty filtrado */
.cdt-no-match {
  padding:30px 20px; text-align:center;
  font-size:12px; color:var(--muted);
}

/* Empty state */
.cdt-empty {
  display:flex; flex-direction:column; align-items:center; gap:12px;
  padding:52px 20px; text-align:center;
}
.cdt-empty-ico {
  width:50px; height:50px; background:var(--p10);
  display:flex; align-items:center; justify-content:center; border-radius:50%;
}
.cdt-empty-ico svg { color:var(--p); opacity:.35; width:20px; height:20px; }
.cdt-empty-t { font-size:13px; font-weight:500; color:var(--txt); margin:0; }
.cdt-empty-s { font-size:11px; color:var(--muted); margin:0; max-width:300px; }
`

type Campania = {
  id: string; nombre: string; estado: string
  margen_minimo: number; fecha_inicio: string; fecha_fin: string
}

type Detalle = {
  id: string; product_id: string; lote_id: string; activo: boolean
  motivo_inactivo: string | null; cantidad_disponible: number
  precio_compra: number; precio_venta_actual: number
  porcentaje_maximo_permitido: number; precio_minimo_permitido: number
  porcentaje_descuento_aprobado: number; precio_oferta: number | null
  margen_resultante: number | null; ganancia_por_unidad: number | null
  ganancia_total_estimada: number | null
  products: {
    name: string; image_url: string | null; barcode: string | null
    categories: { name: string } | null
  } | null
}

function COP(n: number) {
  return n.toLocaleString("es-CO", { style:"currency", currency:"COP", minimumFractionDigits:0 })
}

function margenClass(m: number | null, min: number) {
  if (m === null) return "warn"
  if (m < min) return "bad"
  if (m < min + 5) return "warn"
  return "ok"
}

// Componente fila individual con slider controlado
function DetalleRow({
  detalle, editable, onGuardado
}: {
  detalle: Detalle
  editable: boolean
  onGuardado: (id: string, pct: number, resultado: any) => void
}) {
  const [pct, setPct]           = useState(detalle.porcentaje_descuento_aprobado)
  const [saving, setSaving]     = useState(false)
  const maxPct = Number(detalle.porcentaje_maximo_permitido)
  const prod   = detalle.products

  const precioConDescuento = detalle.precio_venta_actual * (1 - pct / 100)
  const margenLocal        = ((precioConDescuento - detalle.precio_compra) / precioConDescuento) * 100

  const handleChange = (val: number) => {
    const clamped = Math.min(Math.max(0, val), maxPct)
    setPct(clamped)
  }

  const handleBlur = async () => {
    // Auto-guardar al soltar el slider o al perder foco del input
    if (pct === detalle.porcentaje_descuento_aprobado) return
    setSaving(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.rpc("rpc_actualizar_descuento_detalle", {
        p_detalle_id:           detalle.id,
        p_porcentaje_descuento: pct,
      })
      if (error) {
        showError(error.message || "Error al guardar descuento")
        setPct(detalle.porcentaje_descuento_aprobado)  // revertir
      } else {
        onGuardado(detalle.id, pct, data)
      }
    } catch (e: any) {
      showError(e.message); setPct(detalle.porcentaje_descuento_aprobado)
    } finally {
      setSaving(false)
    }
  }

  const sliderPct = maxPct > 0 ? `${(pct / maxPct) * 100}%` : "0%"
  const isMcls    = margenClass(margenLocal, 0)  // visual en tiempo real

  return (
    <tr className={!detalle.activo ? "inactivo" : ""}>

      {/* Producto */}
      <td>
        <div className="cdt-prod">
          <div className="cdt-prod-img" aria-hidden>
            {prod?.image_url
              ? <img src={prod.image_url} alt={prod?.name || ""} />
              : <Package />
            }
          </div>
          <div>
            <div className="cdt-prod-name">{prod?.name || "—"}</div>
            {prod?.barcode && <div className="cdt-prod-sku">{prod.barcode}</div>}
            {prod?.categories?.name && (
              <div style={{ fontSize:9, color:"var(--p)", opacity:.7, marginTop:2, letterSpacing:".1em", textTransform:"uppercase", fontWeight:600 }}>
                {prod.categories.name}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Stock */}
      <td className="c">
        <span style={{ fontSize:12, fontWeight:600 }}>{detalle.cantidad_disponible}</span>
        <div style={{ fontSize:9, color:"var(--muted)", marginTop:1 }}>uds.</div>
      </td>

      {/* Precio compra */}
      <td className="r">
        <span className="cdt-price" style={{ fontSize:13 }}>
          {COP(detalle.precio_compra)}
        </span>
      </td>

      {/* Precio venta */}
      <td className="r">
        <span className="cdt-price">{COP(detalle.precio_venta_actual)}</span>
      </td>

      {/* Descuento: slider editable o valor fijo */}
      <td style={{ minWidth:180 }}>
        {!detalle.activo ? (
          <div className="cdt-inactivo-msg">
            <AlertTriangle aria-hidden />
            {detalle.motivo_inactivo || "Sin margen disponible"}
          </div>
        ) : (
          <div className="cdt-slider-wrap">
            <div className="cdt-slider-row">
              <input
                type="range"
                className="cdt-slider"
                min={0} max={maxPct} step={0.5}
                value={pct}
                style={{ "--val": sliderPct } as any}
                onChange={e => handleChange(parseFloat(e.target.value))}
                onMouseUp={handleBlur}
                onTouchEnd={handleBlur}
                disabled={!editable || saving}
                aria-label="Porcentaje de descuento"
                aria-valuemin={0} aria-valuemax={maxPct} aria-valuenow={pct}
              />
              <input
                type="number"
                className="cdt-pct-input"
                min={0} max={maxPct} step={0.5}
                value={pct}
                onChange={e => handleChange(parseFloat(e.target.value) || 0)}
                onBlur={handleBlur}
                disabled={!editable || saving}
                aria-label="Valor de descuento"
              />
              <span style={{ fontSize:12, color:"var(--muted)" }}>%</span>
              {saving && (
                <span style={{
                  width:10, height:10, border:"1.5px solid var(--p)",
                  borderTopColor:"transparent", borderRadius:"50%",
                  animation:"cdtSpin .7s linear infinite", flexShrink:0,
                  display:"inline-block"
                }} aria-hidden />
              )}
            </div>
            <div className="cdt-slider-max">Máx: {maxPct.toFixed(1)}%</div>
            {pct > 0 && (
              <div className={`cdt-slider-saving ${isMcls}`}>
                Precio oferta: {COP(precioConDescuento)}
              </div>
            )}
          </div>
        )}
      </td>

      {/* Margen resultante */}
      <td className="c">
        {detalle.activo ? (
          <span className={`cdt-margen ${margenClass(margenLocal, 0)}`}>
            {margenLocal.toFixed(1)}%
          </span>
        ) : (
          <span className="cdt-margen bad">—</span>
        )}
      </td>

      {/* Ganancia estimada */}
      <td className="r">
        {detalle.activo && pct > 0 ? (
          <span style={{
            fontFamily:"'Cormorant Garamond',serif",
            fontSize:14, fontWeight:500,
            color:"var(--ok)"
          }}>
            {COP((precioConDescuento - detalle.precio_compra) * detalle.cantidad_disponible)}
          </span>
        ) : (
          <span style={{ color:"var(--muted)", fontSize:11 }}>—</span>
        )}
      </td>

    </tr>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
// Nota multi-company: `companyId` se recibe por convención del sistema, aunque
// las RPCs que este componente llama ya validan pertenencia server-side vía
// RLS + user_companies. Se conserva para que futuras queries directas puedan
// filtrar explícitamente por empresa.
export function CampaniaDetallTabla({
  campania, detalles, inelegibles, companyId, accionPendiente
}: {
  campania: Campania
  detalles: Detalle[]
  inelegibles: Detalle[]
  companyId: string
  accionPendiente: "calcular" | "aprobar" | "publicar" | "cancelar" | "tabla"
}) {
  void companyId
  const router                    = useRouter()
  const [loadingAction, setLA]    = useState(false)
  const [showInelegibles, setShowI] = useState(false)

  // ── Filtros de productos ──────────────────────────────────────
  const [search, setSearch]         = useState("")
  const [filtroCategoria, setFCat]  = useState<string>("")
  const [filtroDescuento, setFDes]  = useState<string>("") // "", "con", "sin"

  // Categorías únicas (de elegibles + inelegibles)
  const categorias = useMemo(() => {
    const set = new Set<string>()
    for (const d of [...detalles, ...inelegibles]) {
      const c = d.products?.categories?.name
      if (c) set.add(c)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"))
  }, [detalles, inelegibles])

  const matchProducto = useCallback((d: Detalle) => {
    const q = search.trim().toLowerCase()
    if (q) {
      const name    = d.products?.name?.toLowerCase() || ""
      const barcode = d.products?.barcode?.toLowerCase() || ""
      if (!name.includes(q) && !barcode.includes(q)) return false
    }
    if (filtroCategoria && d.products?.categories?.name !== filtroCategoria) return false
    if (filtroDescuento === "con" && !(d.porcentaje_descuento_aprobado > 0)) return false
    if (filtroDescuento === "sin" && d.porcentaje_descuento_aprobado > 0) return false
    return true
  }, [search, filtroCategoria, filtroDescuento])

  const detallesFiltrados   = useMemo(() => detalles.filter(matchProducto), [detalles, matchProducto])
  const inelegiblesFiltrados= useMemo(() => inelegibles.filter(matchProducto), [inelegibles, matchProducto])
  const hayFiltros          = search.trim() !== "" || filtroCategoria !== "" || filtroDescuento !== ""
  const limpiarFiltros      = () => { setSearch(""); setFCat(""); setFDes("") }

  // Tabla editable solo en estado CALCULADA
  const editable = campania.estado === "CALCULADA"

  const handleCalcular = async () => {
    const ok = await showConfirm(
      "¿Generar análisis?",
      "Se analizarán los lotes según el alcance definido y se calcularán los descuentos máximos"
    )
    if (!ok) return
    setLA(true)
    try {
      const { data, error } = await createClient().rpc("rpc_generar_analisis_campania", {
        p_campania_id: campania.id,
      })
      if (error) throw new Error(error.message)
      const elegibles   = data?.lotes_elegibles ?? 0
      const excluidos   = data?.excluidos_alcance ?? 0
      const detalle = excluidos > 0
        ? `${elegibles} lotes elegibles · ${excluidos} excluidos por alcance`
        : `${elegibles} lotes elegibles encontrados`
      await showSuccess("Análisis completado", detalle)
      router.refresh()
    } catch (e: any) {
      showError(e.message || "Error al generar análisis")
    } finally { setLA(false) }
  }

  const handleAprobar = async () => {
    const ok = await showConfirm(
      "¿Aprobar campaña?",
      "Se validarán todos los márgenes. La campaña quedará lista para publicar."
    )
    if (!ok) return
    setLA(true)
    try {
      const { data, error } = await createClient().rpc("rpc_aprobar_campania", {
        p_campania_id: campania.id,
      })
      if (error) throw new Error(error.message)
      await showSuccess("Campaña aprobada", `${data?.productos_aprobados} productos aprobados`)
      router.refresh()
    } catch (e: any) {
      showError(e.message || "Error al aprobar")
    } finally { setLA(false) }
  }

  const handlePublicar = async () => {
    const ok = await showConfirm(
      "¿Publicar en catálogo?",
      "Los descuentos serán visibles para los clientes inmediatamente."
    )
    if (!ok) return
    setLA(true)
    try {
      const { data, error } = await createClient().rpc("rpc_publicar_campania", {
        p_campania_id: campania.id,
      })
      if (error) throw new Error(error.message)
      await showSuccess("¡Campaña publicada!", `${data?.ofertas_publicadas} ofertas activas en el catálogo`)
      router.refresh()
    } catch (e: any) {
      showError(e.message || "Error al publicar")
    } finally { setLA(false) }
  }

  const handleCancelar = async () => {
    const ok = await showConfirm(
      `¿Cancelar "${campania.nombre}"?`,
      campania.estado === "PUBLICADA"
        ? "Las ofertas activas en el catálogo serán desactivadas inmediatamente."
        : "La campaña no podrá ser reactivada."
    )
    if (!ok) return
    setLA(true)
    try {
      const { error } = await createClient().rpc("rpc_cancelar_campania", {
        p_campania_id: campania.id,
        p_motivo: "Cancelada manualmente desde detalle",
      })
      if (error) throw new Error(error.message)
      await showSuccess("Campaña cancelada")
      router.refresh()
    } catch (e: any) {
      showError(e.message || "Error al cancelar")
    } finally { setLA(false) }
  }

  // No hacemos refresh tras cada edición de slider: el propio componente fila
  // muestra el nuevo estado y evita un re-render completo de la página.
  const handleGuardado = useCallback(() => {}, [])

  // ── MODO TOOLBAR (botones de acción) ─────────────────────────────────────
  if (accionPendiente !== "tabla") {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="cdt-toolbar">

          {accionPendiente === "calcular" && (
            <button className="cdt-btn-main" onClick={handleCalcular} disabled={loadingAction}>
              {loadingAction
                ? <><span className="cdt-spin" />Analizando…</>
                : <><Zap size={13} />Generar análisis</>
              }
            </button>
          )}

          {accionPendiente === "aprobar" && (
            <>
              <button className="cdt-btn-main" onClick={handleAprobar} disabled={loadingAction}>
                {loadingAction
                  ? <><span className="cdt-spin" />Aprobando…</>
                  : <><CheckCircle size={13} />Aprobar campaña</>
                }
              </button>
              <button className="cdt-btn-outline" onClick={handleCalcular} disabled={loadingAction}>
                <Zap size={13} />
                Recalcular
              </button>
              <button className="cdt-btn-danger" onClick={handleCancelar} disabled={loadingAction}>
                <Ban size={13} />
                Cancelar
              </button>
            </>
          )}

          {accionPendiente === "publicar" && (
            <>
              <button className="cdt-btn-main" onClick={handlePublicar} disabled={loadingAction}>
                {loadingAction
                  ? <><span className="cdt-spin" />Publicando…</>
                  : <><Send size={13} />Publicar en catálogo</>
                }
              </button>
              <button className="cdt-btn-danger" onClick={handleCancelar} disabled={loadingAction}>
                <Ban size={13} />
                Cancelar
              </button>
            </>
          )}

          {accionPendiente === "cancelar" && (
            <button className="cdt-btn-danger" onClick={handleCancelar} disabled={loadingAction}>
              {loadingAction
                ? <><span className="cdt-spin" style={{ borderTopColor:"var(--danger)" }} />Cancelando…</>
                : <><Ban size={13} />Cancelar campaña</>
              }
            </button>
          )}

        </div>
      </>
    )
  }

  // ── MODO TABLA ────────────────────────────────────────────────────────────
  if (detalles.length === 0 && inelegibles.length === 0) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="cdt-empty">
          <div className="cdt-empty-ico"><Package /></div>
          <p className="cdt-empty-t">Sin detalles</p>
          <p className="cdt-empty-s">Genera el análisis para ver los lotes disponibles</p>
        </div>
      </>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="cdt">

        {/* Barra de filtros */}
        <div className="cdt-filters">
          <div className="cdt-search">
            <Search className="cdt-search-ico" aria-hidden />
            <input
              type="text"
              placeholder="Buscar por nombre o código de barras…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Buscar producto"
            />
            {search && (
              <button
                className="cdt-search-clear"
                onClick={() => setSearch("")}
                aria-label="Limpiar búsqueda"
                type="button"
              >
                <X aria-hidden />
              </button>
            )}
          </div>

          {categorias.length > 0 && (
            <select
              className="cdt-select"
              value={filtroCategoria}
              onChange={e => setFCat(e.target.value)}
              aria-label="Filtrar por categoría"
            >
              <option value="">Todas las categorías</option>
              {categorias.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

          <select
            className="cdt-select"
            value={filtroDescuento}
            onChange={e => setFDes(e.target.value)}
            aria-label="Filtrar por descuento"
          >
            <option value="">Todos los descuentos</option>
            <option value="con">Con descuento aplicado</option>
            <option value="sin">Sin descuento</option>
          </select>

          {hayFiltros && (
            <button className="cdt-btn-outline" onClick={limpiarFiltros} type="button" style={{ height:32, padding:"0 12px", fontSize:11 }}>
              <X size={12} />
              Limpiar
            </button>
          )}

          <div className="cdt-filters-info">
            <strong>{detallesFiltrados.length}</strong> de {detalles.length} elegibles
            {inelegibles.length > 0 && (
              <> · <strong>{inelegiblesFiltrados.length}</strong> de {inelegibles.length} inelegibles</>
            )}
          </div>
        </div>

        <div className="cdt-scroll">
          <table className="cdt-tbl">
            <thead>
              <tr>
                <th>Producto</th>
                <th className="c">Stock</th>
                <th className="r">Costo lote</th>
                <th className="r">Precio venta</th>
                <th>
                  Descuento {editable
                    ? <span style={{ fontSize:8, color:"var(--p)", fontWeight:700 }}>· EDITABLE</span>
                    : null
                  }
                </th>
                <th className="c">Margen</th>
                <th className="r">Ganancia est.</th>
              </tr>
            </thead>
            <tbody>
              {/* Lotes elegibles filtrados */}
              {detallesFiltrados.map(d => (
                <DetalleRow
                  key={d.id}
                  detalle={d}
                  editable={editable}
                  onGuardado={handleGuardado}
                />
              ))}
            </tbody>
          </table>
          {detallesFiltrados.length === 0 && detalles.length > 0 && (
            <div className="cdt-no-match">
              Ningún producto elegible coincide con los filtros aplicados.
            </div>
          )}
        </div>

        {/* Sección inelegibles colapsable */}
        {inelegibles.length > 0 && (
          <>
            <button
              className="cdt-toggle-btn"
              onClick={() => setShowI(s => !s)}
              aria-expanded={showInelegibles}
            >
              {showInelegibles ? <ChevronUp aria-hidden /> : <ChevronDown aria-hidden />}
              <AlertTriangle size={11} aria-hidden />
              {inelegiblesFiltrados.length} de {inelegibles.length} lote{inelegibles.length !== 1 ? "s" : ""} sin margen suficiente
              <span style={{ marginLeft:"auto", fontSize:9, opacity:.6 }}>
                {showInelegibles ? "Ocultar" : "Ver detalle"}
              </span>
            </button>

            {showInelegibles && (
              <div className="cdt-scroll" style={{ borderTop:"1px solid var(--border)" }}>
                <table className="cdt-tbl">
                  <tbody>
                    {inelegiblesFiltrados.map(d => (
                      <DetalleRow
                        key={d.id}
                        detalle={d}
                        editable={false}
                        onGuardado={() => {}}
                      />
                    ))}
                  </tbody>
                </table>
                {inelegiblesFiltrados.length === 0 && (
                  <div className="cdt-no-match">
                    Ningún inelegible coincide con los filtros.
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Hint educativo cuando es editable */}
        {editable && (
          <div style={{
            padding:"10px 13px", borderTop:"1px solid var(--border)",
            background:"rgba(var(--primary-rgb,152,76,168),.03)",
            display:"flex", alignItems:"center", gap:8,
          }}>
            <Info size={12} style={{ color:"var(--primary,#984ca8)", flexShrink:0 }} />
            <span style={{ fontSize:10, color:"rgba(26,26,24,.55)", lineHeight:1.4 }}>
              Ajusta el descuento de cada lote con el slider. El sistema valida automáticamente que el
              margen nunca baje del <strong>{campania.margen_minimo}%</strong>.
              Los cambios se guardan al soltar el slider.
            </span>
          </div>
        )}

      </div>
    </>
  )
}
