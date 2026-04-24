"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { showError, showSuccess } from "@/lib/sweetalert"
import {
  Megaphone, Calendar, Percent, X, FileText,
  Package, Layers, Truck, Search, Hand, Globe, Clock, Archive,
  ChevronLeft, ChevronRight, Check
} from "lucide-react"

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

.cd-bdrop {
  position:fixed; inset:0; z-index:1000;
  background:rgba(0,0,0,.35); backdrop-filter:blur(3px);
  display:flex; align-items:center; justify-content:center; padding:16px;
}
@keyframes cdIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }

.cd-modal {
  background:#fff; width:100%; max-width:580px;
  max-height:92vh; overflow-y:auto; -webkit-overflow-scrolling:touch;
  font-family:'DM Sans',sans-serif;
  animation:cdIn .2s ease forwards; position:relative;
}
.cd-modal::before {
  content:''; position:absolute; top:0; left:0; right:0; height:3px;
  background:var(--primary,#984ca8); z-index:1;
}

.cd-hd {
  position:sticky; top:0; background:#fff; z-index:2;
  padding:16px 18px 13px; border-bottom:1px solid rgba(26,26,24,.08);
  display:flex; align-items:center; justify-content:space-between;
}
.cd-title { font-size:14px; font-weight:600; color:#1a1a18; margin:0; display:flex; align-items:center; gap:8px; }
.cd-title svg { color:var(--primary,#984ca8); width:14px; height:14px; }
.cd-close {
  width:28px; height:28px; border:none; background:none; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  color:rgba(26,26,24,.4); transition:color .14s;
}
.cd-close:hover { color:#1a1a18; }

/* Stepper */
.cd-steps {
  display:flex; align-items:center; padding:12px 18px;
  border-bottom:1px solid rgba(26,26,24,.05); gap:8px;
}
.cd-step {
  display:flex; align-items:center; gap:7px;
  font-size:10px; font-weight:600; letter-spacing:.1em;
  text-transform:uppercase; color:rgba(26,26,24,.35);
}
.cd-step.active { color:var(--primary,#984ca8); }
.cd-step.done { color:var(--primary,#984ca8); }
.cd-step-num {
  width:20px; height:20px; border-radius:50%;
  background:rgba(26,26,24,.06); color:rgba(26,26,24,.45);
  display:flex; align-items:center; justify-content:center;
  font-size:10px; font-weight:700;
}
.cd-step.active .cd-step-num { background:var(--primary,#984ca8); color:#fff; }
.cd-step.done .cd-step-num { background:rgba(22,163,74,.12); color:#16a34a; }
.cd-step-sep { flex:1; height:1px; background:rgba(26,26,24,.08); }

.cd-body { padding:18px; display:flex; flex-direction:column; gap:14px; }

.cd-lbl {
  display:block; font-size:9px; font-weight:700;
  letter-spacing:.2em; text-transform:uppercase;
  color:rgba(26,26,24,.45); margin-bottom:5px;
}
.cd-lbl-row { display:flex; align-items:center; gap:5px; }
.cd-lbl-row svg { width:11px; height:11px; }

.cd-inp {
  width:100%; height:42px; padding:0 13px;
  border:1px solid rgba(26,26,24,.08); background:#fff;
  font-family:'DM Sans',sans-serif; font-size:13px; color:#1a1a18;
  outline:none; -webkit-appearance:none; transition:border-color .14s;
}
.cd-inp:focus { border-color:var(--primary,#984ca8); }
.cd-inp:disabled { opacity:.5; }
.cd-inp[type=date] { cursor:pointer; }
.cd-inp[type=number] { -moz-appearance:textfield; }
.cd-inp[type=number]::-webkit-outer-spin-button,
.cd-inp[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
.cd-inp-ico { position:relative; }
.cd-inp-ico .cd-inp { padding-left:36px; }
.cd-inp-ico svg { position:absolute; left:11px; top:50%; transform:translateY(-50%); color:rgba(26,26,24,.35); pointer-events:none; width:14px; height:14px; }

.cd-textarea {
  width:100%; min-height:72px; padding:11px 13px; resize:vertical;
  border:1px solid rgba(26,26,24,.08); background:#fff;
  font-family:'DM Sans',sans-serif; font-size:13px; color:#1a1a18;
  outline:none; transition:border-color .14s;
}
.cd-textarea:focus { border-color:var(--primary,#984ca8); }

.cd-g2 { display:grid; gap:12px; grid-template-columns:1fr 1fr; }
@media(max-width:440px){ .cd-g2{ grid-template-columns:1fr; } }

.cd-hint { font-size:10px; color:rgba(26,26,24,.4); margin-top:4px; display:flex; align-items:center; gap:5px; }

.cd-section-sep {
  font-size:8px; font-weight:700; letter-spacing:.22em; text-transform:uppercase;
  color:rgba(26,26,24,.3); display:flex; align-items:center; gap:10px; margin:2px 0;
}
.cd-section-sep::after { content:''; flex:1; height:1px; background:rgba(26,26,24,.08); }

/* Tarjetas de modo */
.cd-modos { display:grid; gap:8px; grid-template-columns:1fr 1fr; }
@media(max-width:480px){ .cd-modos{ grid-template-columns:1fr; } }
.cd-modo {
  display:flex; flex-direction:column; gap:5px;
  padding:11px 12px; background:#fff; cursor:pointer;
  border:1.5px solid rgba(26,26,24,.08);
  transition:border-color .14s, background .14s;
  text-align:left;
}
.cd-modo:hover { border-color:var(--primary,#984ca8); }
.cd-modo.sel {
  border-color:var(--primary,#984ca8);
  background:rgba(var(--primary-rgb,152,76,168),.05);
}
.cd-modo-top { display:flex; align-items:center; gap:7px; }
.cd-modo-top svg { width:13px; height:13px; color:var(--primary,#984ca8); flex-shrink:0; }
.cd-modo-name { font-size:12px; font-weight:600; color:#1a1a18; }
.cd-modo-desc { font-size:10px; color:rgba(26,26,24,.5); line-height:1.35; }
.cd-modo.sel .cd-modo-check {
  position:absolute; top:8px; right:8px; color:var(--primary,#984ca8);
}

/* Sub-parámetros del modo */
.cd-sub {
  border:1px solid rgba(var(--primary-rgb,152,76,168),.15);
  background:rgba(var(--primary-rgb,152,76,168),.035);
  padding:12px; display:flex; flex-direction:column; gap:11px;
}

/* Listado con checkboxes */
.cd-list {
  max-height:180px; overflow-y:auto;
  border:1px solid rgba(26,26,24,.08); background:#fff;
}
.cd-list-item {
  display:flex; align-items:center; gap:9px;
  padding:8px 12px; font-size:12px; cursor:pointer;
  border-bottom:1px solid rgba(26,26,24,.04);
  transition:background .1s;
}
.cd-list-item:last-child { border-bottom:none; }
.cd-list-item:hover { background:rgba(26,26,24,.02); }
.cd-list-item.sel { background:rgba(var(--primary-rgb,152,76,168),.06); }
.cd-list-item input[type=checkbox] {
  width:14px; height:14px; accent-color:var(--primary,#984ca8); cursor:pointer;
}
.cd-list-empty { padding:20px; text-align:center; color:rgba(26,26,24,.4); font-size:11px; }

.cd-list-count {
  font-size:10px; color:rgba(26,26,24,.5); text-align:right; margin-top:4px;
}
.cd-list-count strong { color:var(--primary,#984ca8); }

/* Footer */
.cd-foot {
  padding:13px 18px; border-top:1px solid rgba(26,26,24,.08);
  display:flex; gap:8px; justify-content:space-between; align-items:center;
  position:sticky; bottom:0; background:#fff; z-index:2;
}
.cd-foot-right { display:flex; gap:8px; }
.cd-btn-cancel, .cd-btn-back {
  height:38px; padding:0 16px; border:1px solid rgba(26,26,24,.08); background:#fff; cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:12px; color:rgba(26,26,24,.5);
  transition:border-color .14s, color .14s;
  display:inline-flex; align-items:center; gap:6px;
}
.cd-btn-cancel:hover, .cd-btn-back:hover { border-color:#1a1a18; color:#1a1a18; }
.cd-btn-back svg { width:12px; height:12px; }

.cd-btn-save, .cd-btn-next {
  height:38px; padding:0 22px; border:none; background:var(--primary,#984ca8); cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600;
  letter-spacing:.06em; text-transform:uppercase; color:#fff;
  display:inline-flex; align-items:center; gap:6px; transition:opacity .14s;
}
.cd-btn-save:hover:not(:disabled), .cd-btn-next:hover:not(:disabled) { opacity:.88; }
.cd-btn-save:disabled, .cd-btn-next:disabled { opacity:.4; cursor:not-allowed; }
.cd-btn-save svg, .cd-btn-next svg { width:13px; height:13px; }
.cd-spin {
  width:13px; height:13px; border:2px solid rgba(255,255,255,.3);
  border-top-color:#fff; border-radius:50%;
  animation:cdSpin .7s linear infinite; flex-shrink:0;
}
@keyframes cdSpin { to{ transform:rotate(360deg); } }

.cd-info-box {
  background:rgba(var(--primary-rgb,152,76,168),.06);
  border-left:3px solid var(--primary,#984ca8);
  padding:10px 12px; font-size:11px; color:rgba(26,26,24,.65); line-height:1.5;
}
.cd-info-box strong { color:var(--primary,#984ca8); }
`

// La BD está en UTC y Colombia es UTC-5 (sin DST). `toISOString()` devuelve UTC,
// así que después de las 19:00 en Colombia (00:00 UTC del día siguiente) daría
// la fecha de mañana. Restamos 5h antes de extraer el YYYY-MM-DD.
const COL_OFFSET_MS = 5 * 60 * 60 * 1000
function today() {
  return new Date(Date.now() - COL_OFFSET_MS).toISOString().slice(0, 10)
}
function inDays(n: number) {
  return new Date(Date.now() - COL_OFFSET_MS + n * 86_400_000).toISOString().slice(0, 10)
}

type Modo = "TODOS" | "SIN_ROTACION" | "SOBRESTOCK" | "CATEGORIA" | "PROVEEDOR" | "MANUAL"

const MODOS: { key: Modo; name: string; desc: string; icon: any }[] = [
  { key: "TODOS",        name: "Todo el inventario", desc: "Analiza todos los lotes con stock disponible",              icon: Globe   },
  { key: "SIN_ROTACION", name: "Sin rotación",       desc: "Productos que no se venden hace N días (dormidos)",        icon: Clock   },
  { key: "SOBRESTOCK",   name: "Sobrestock",         desc: "Productos con cobertura mayor a N días",                   icon: Archive },
  { key: "CATEGORIA",    name: "Por categoría",      desc: "Solo productos de categorías específicas",                 icon: Layers  },
  { key: "PROVEEDOR",    name: "Por proveedor",      desc: "Solo productos de proveedores específicos",                icon: Truck   },
  { key: "MANUAL",       name: "Selección manual",   desc: "Elige productos uno por uno",                              icon: Hand    },
]

type Cat = { id: string; name: string }
type Sup = { id: string; name: string }
type Prod = { id: string; name: string; barcode: string | null }

export function CampaniaDialog({
  children,
  companyId,
}: {
  children: React.ReactNode
  companyId: string
}) {
  const router = useRouter()
  const [open, setOpen]       = useState(false)
  const [step, setStep]       = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    nombre:        "",
    descripcion:   "",
    fecha_inicio:  today(),
    fecha_fin:     inDays(30),
    margen_minimo: "15",
  })

  // Alcance
  const [modo, setModo] = useState<Modo>("TODOS")
  const [diasSinVenta, setDiasSinVenta] = useState("60")
  const [diasCobertura, setDiasCobertura] = useState("90")
  const [ventanaVenta, setVentanaVenta] = useState("30")
  const [catIds, setCatIds] = useState<Set<string>>(new Set())
  const [supIds, setSupIds] = useState<Set<string>>(new Set())
  const [prodIds, setProdIds] = useState<Set<string>>(new Set())

  // Datos remotos
  const [cats, setCats] = useState<Cat[]>([])
  const [sups, setSups] = useState<Sup[]>([])
  const [prodQuery, setProdQuery] = useState("")
  const [prodResults, setProdResults] = useState<Prod[]>([])
  const [prodSelected, setProdSelected] = useState<Prod[]>([])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  // Reset al cerrar
  useEffect(() => {
    if (!open) {
      setStep(1)
      setModo("TODOS")
      setCatIds(new Set()); setSupIds(new Set()); setProdIds(new Set())
      setProdSelected([]); setProdQuery(""); setProdResults([])
    }
  }, [open])

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("keydown", h)
    return () => document.removeEventListener("keydown", h)
  }, [open])

  // Bloquear scroll del body
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  // Cargar categorías/proveedores al entrar al paso 2
  useEffect(() => {
    if (step !== 2) return
    if ((modo === "CATEGORIA" && cats.length === 0) ||
        (modo === "PROVEEDOR" && sups.length === 0)) {
      const supabase = createClient()
      if (modo === "CATEGORIA") {
        supabase.from("categories").select("id, name").eq("company_id", companyId).order("name")
          .then(({ data }) => setCats(data || []))
      }
      if (modo === "PROVEEDOR") {
        supabase.from("suppliers").select("id, name").eq("company_id", companyId).order("name")
          .then(({ data }) => setSups(data || []))
      }
    }
  }, [step, modo, cats.length, sups.length, companyId])

  // Buscador de productos (debounce)
  useEffect(() => {
    if (modo !== "MANUAL" || step !== 2) return
    const q = prodQuery.trim()
    if (q.length < 2) { setProdResults([]); return }
    const t = setTimeout(async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("products")
        .select("id, name, barcode")
        .eq("company_id", companyId)
        .or(`name.ilike.%${q}%,barcode.ilike.%${q}%`)
        .order("name")
        .limit(30)
      setProdResults(data || [])
    }, 250)
    return () => clearTimeout(t)
  }, [prodQuery, modo, step, companyId])

  // Validaciones por paso
  const step1Valid = useMemo(() => {
    if (!form.nombre.trim()) return false
    if (form.fecha_fin <= form.fecha_inicio) return false
    const m = parseFloat(form.margen_minimo)
    if (isNaN(m) || m < 0 || m >= 100) return false
    return true
  }, [form])

  const step2Valid = useMemo(() => {
    if (modo === "TODOS") return true
    if (modo === "SIN_ROTACION") return parseInt(diasSinVenta) > 0
    if (modo === "SOBRESTOCK") return parseInt(diasCobertura) > 0 && parseInt(ventanaVenta) > 0
    if (modo === "CATEGORIA") return catIds.size > 0
    if (modo === "PROVEEDOR") return supIds.size > 0
    if (modo === "MANUAL") return prodSelected.length > 0
    return false
  }, [modo, diasSinVenta, diasCobertura, ventanaVenta, catIds, supIds, prodSelected])

  // Construir criterio
  const buildCriterio = (): any => {
    switch (modo) {
      case "TODOS":        return { modo: "TODOS" }
      case "SIN_ROTACION": return { modo, dias_sin_venta: parseInt(diasSinVenta) }
      case "SOBRESTOCK":   return { modo, dias_cobertura_min: parseInt(diasCobertura), ventana_venta_dias: parseInt(ventanaVenta) }
      case "CATEGORIA":    return { modo, category_ids: Array.from(catIds) }
      case "PROVEEDOR":    return { modo, supplier_ids: Array.from(supIds) }
      case "MANUAL":       return { modo, product_ids: prodSelected.map(p => p.id) }
    }
  }

  const handleCrear = async () => {
    if (!step1Valid) return showError("Revisa los datos de la campaña")
    if (!step2Valid) return showError("Completa los parámetros del alcance")

    const margen = parseFloat(form.margen_minimo)
    setLoading(true)
    try {
      const supabase = createClient()

      // 1. Crear campaña en la empresa activa (multi-company: se pasa explícito).
      const { data, error } = await supabase.rpc("rpc_crear_campania", {
        p_company_id:    companyId,
        p_nombre:        form.nombre.trim(),
        p_descripcion:   form.descripcion.trim() || null,
        p_fecha_inicio:  form.fecha_inicio,
        p_fecha_fin:     form.fecha_fin,
        p_margen_minimo: margen,
      })
      if (error) throw new Error(error.message)
      const campaniaId = data?.campania_id
      if (!campaniaId) throw new Error("No se recibió campania_id")

      // 2. Persistir criterio de alcance (RPC nueva)
      if (modo !== "TODOS") {
        const { error: errC } = await supabase.rpc("rpc_set_criterio_alcance", {
          p_campania_id: campaniaId,
          p_criterio:    buildCriterio(),
        })
        if (errC) throw new Error(errC.message)
      }

      await showSuccess("Campaña creada", "Ahora genera el análisis de lotes para continuar")
      setOpen(false)
      setForm({ nombre:"", descripcion:"", fecha_inicio:today(), fecha_fin:inDays(30), margen_minimo:"15" })
      router.push(`/dashboard/campanias/${campaniaId}`)
    } catch (err: any) {
      showError(err.message || "Error al crear campaña")
    } finally {
      setLoading(false)
    }
  }

  // Toggle helpers
  const toggleSet = <T,>(s: Set<T>, v: T): Set<T> => {
    const n = new Set(s); if (n.has(v)) n.delete(v); else n.add(v); return n
  }
  const addProd = (p: Prod) => {
    if (prodSelected.some(x => x.id === p.id)) return
    setProdSelected([...prodSelected, p])
    setProdIds(new Set([...prodIds, p.id]))
    setProdQuery("")
  }
  const removeProd = (id: string) => {
    setProdSelected(prodSelected.filter(p => p.id !== id))
    const n = new Set(prodIds); n.delete(id); setProdIds(n)
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <span onClick={() => setOpen(true)} style={{ display:"contents" }}>
        {children}
      </span>

      {open && (
        <div className="cd-bdrop" onClick={() => !loading && setOpen(false)}>
          <div className="cd-modal" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="cd-hd">
              <p className="cd-title">
                <Megaphone aria-hidden />
                Nueva campaña de descuento
              </p>
              <button className="cd-close" onClick={() => !loading && setOpen(false)} aria-label="Cerrar">
                <X size={15} />
              </button>
            </div>

            {/* Stepper */}
            <div className="cd-steps">
              <div className={`cd-step ${step === 1 ? "active" : "done"}`}>
                <span className="cd-step-num">{step > 1 ? <Check size={11} /> : "1"}</span>
                Datos
              </div>
              <div className="cd-step-sep" />
              <div className={`cd-step ${step === 2 ? "active" : ""}`}>
                <span className="cd-step-num">2</span>
                Alcance
              </div>
            </div>

            {/* ───────── STEP 1: datos básicos ───────── */}
            {step === 1 && (
              <div className="cd-body">
                <div>
                  <label className="cd-lbl cd-lbl-row">
                    <FileText size={11} aria-hidden />
                    Nombre de la campaña *
                  </label>
                  <input
                    className="cd-inp"
                    placeholder="Ej: Liquidación de verano, Black Friday…"
                    value={form.nombre}
                    onChange={set("nombre")}
                    disabled={loading}
                    maxLength={80}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="cd-lbl">Descripción (opcional)</label>
                  <textarea
                    className="cd-textarea"
                    placeholder="Objetivo de la campaña, productos objetivo…"
                    value={form.descripcion}
                    onChange={set("descripcion")}
                    disabled={loading}
                    maxLength={300}
                  />
                </div>

                <div className="cd-section-sep">Vigencia</div>
                <div className="cd-g2">
                  <div>
                    <label className="cd-lbl cd-lbl-row"><Calendar size={11} aria-hidden />Fecha inicio *</label>
                    <div className="cd-inp-ico">
                      <Calendar size={14} aria-hidden />
                      <input type="date" className="cd-inp" value={form.fecha_inicio} onChange={set("fecha_inicio")} disabled={loading} />
                    </div>
                  </div>
                  <div>
                    <label className="cd-lbl cd-lbl-row"><Calendar size={11} aria-hidden />Fecha fin *</label>
                    <div className="cd-inp-ico">
                      <Calendar size={14} aria-hidden />
                      <input type="date" className="cd-inp" value={form.fecha_fin} min={form.fecha_inicio} onChange={set("fecha_fin")} disabled={loading} />
                    </div>
                  </div>
                </div>

                <div className="cd-section-sep">Regla financiera</div>
                <div>
                  <label className="cd-lbl cd-lbl-row"><Percent size={11} aria-hidden />Margen mínimo permitido (%) *</label>
                  <div className="cd-inp-ico">
                    <Percent size={14} aria-hidden />
                    <input type="number" className="cd-inp" min="0" max="99" step="0.5" value={form.margen_minimo} onChange={set("margen_minimo")} disabled={loading} />
                  </div>
                  <p className="cd-hint">
                    Ningún descuento podrá reducir el margen por debajo de este valor.
                  </p>
                </div>
              </div>
            )}

            {/* ───────── STEP 2: alcance ───────── */}
            {step === 2 && (
              <div className="cd-body">
                <div>
                  <label className="cd-lbl">¿Sobre qué productos aplicar la campaña?</label>
                  <div className="cd-modos">
                    {MODOS.map(m => {
                      const Icon = m.icon
                      return (
                        <button
                          key={m.key}
                          type="button"
                          className={`cd-modo ${modo === m.key ? "sel" : ""}`}
                          onClick={() => setModo(m.key)}
                          style={{ position:"relative" }}
                        >
                          {modo === m.key && <Check size={12} className="cd-modo-check" />}
                          <div className="cd-modo-top">
                            <Icon aria-hidden />
                            <span className="cd-modo-name">{m.name}</span>
                          </div>
                          <p className="cd-modo-desc">{m.desc}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Sub-configuración por modo */}
                {modo === "SIN_ROTACION" && (
                  <div className="cd-sub">
                    <div>
                      <label className="cd-lbl cd-lbl-row"><Clock size={11} aria-hidden />Días sin venta *</label>
                      <input type="number" className="cd-inp" min="1" max="365" value={diasSinVenta}
                        onChange={e => setDiasSinVenta(e.target.value)} disabled={loading} />
                      <p className="cd-hint">
                        Se incluirán productos cuya última venta sea hace <strong>{diasSinVenta || 0} días</strong> o más
                        (incluye productos nunca vendidos).
                      </p>
                    </div>
                  </div>
                )}

                {modo === "SOBRESTOCK" && (
                  <div className="cd-sub">
                    <div className="cd-g2">
                      <div>
                        <label className="cd-lbl cd-lbl-row"><Archive size={11} aria-hidden />Cobertura mínima (días) *</label>
                        <input type="number" className="cd-inp" min="1" max="999" value={diasCobertura}
                          onChange={e => setDiasCobertura(e.target.value)} disabled={loading} />
                      </div>
                      <div>
                        <label className="cd-lbl cd-lbl-row"><Clock size={11} aria-hidden />Ventana de ventas (días) *</label>
                        <input type="number" className="cd-inp" min="7" max="180" value={ventanaVenta}
                          onChange={e => setVentanaVenta(e.target.value)} disabled={loading} />
                      </div>
                    </div>
                    <p className="cd-hint">
                      Incluye productos con stock que, a la velocidad de venta promedio de los últimos
                      <strong> {ventanaVenta || 0} días</strong>, durarían <strong>{diasCobertura || 0} días</strong> o más.
                    </p>
                  </div>
                )}

                {modo === "CATEGORIA" && (
                  <div className="cd-sub">
                    <label className="cd-lbl cd-lbl-row"><Layers size={11} aria-hidden />Categorías *</label>
                    <div className="cd-list">
                      {cats.length === 0
                        ? <div className="cd-list-empty">Cargando…</div>
                        : cats.map(c => (
                          <label key={c.id} className={`cd-list-item ${catIds.has(c.id) ? "sel" : ""}`}>
                            <input type="checkbox" checked={catIds.has(c.id)}
                              onChange={() => setCatIds(toggleSet(catIds, c.id))} disabled={loading} />
                            {c.name}
                          </label>
                        ))}
                    </div>
                    <div className="cd-list-count"><strong>{catIds.size}</strong> categoría{catIds.size !== 1 ? "s" : ""} seleccionada{catIds.size !== 1 ? "s" : ""}</div>
                  </div>
                )}

                {modo === "PROVEEDOR" && (
                  <div className="cd-sub">
                    <label className="cd-lbl cd-lbl-row"><Truck size={11} aria-hidden />Proveedores *</label>
                    <div className="cd-list">
                      {sups.length === 0
                        ? <div className="cd-list-empty">Cargando…</div>
                        : sups.map(s => (
                          <label key={s.id} className={`cd-list-item ${supIds.has(s.id) ? "sel" : ""}`}>
                            <input type="checkbox" checked={supIds.has(s.id)}
                              onChange={() => setSupIds(toggleSet(supIds, s.id))} disabled={loading} />
                            {s.name}
                          </label>
                        ))}
                    </div>
                    <div className="cd-list-count"><strong>{supIds.size}</strong> proveedor{supIds.size !== 1 ? "es" : ""} seleccionado{supIds.size !== 1 ? "s" : ""}</div>
                  </div>
                )}

                {modo === "MANUAL" && (
                  <div className="cd-sub">
                    <div>
                      <label className="cd-lbl cd-lbl-row"><Search size={11} aria-hidden />Buscar producto</label>
                      <div className="cd-inp-ico">
                        <Search size={14} aria-hidden />
                        <input
                          type="text" className="cd-inp"
                          placeholder="Nombre o código de barras…"
                          value={prodQuery}
                          onChange={e => setProdQuery(e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {prodResults.length > 0 && (
                      <div className="cd-list" style={{ maxHeight: 140 }}>
                        {prodResults.map(p => {
                          const sel = prodIds.has(p.id)
                          return (
                            <div key={p.id} className={`cd-list-item ${sel ? "sel" : ""}`}
                              onClick={() => !sel && addProd(p)}
                              style={{ cursor: sel ? "default" : "pointer" }}>
                              <Package size={13} style={{ color:"var(--primary,#984ca8)", opacity:.6 }} />
                              <span style={{ flex:1 }}>
                                {p.name}
                                {p.barcode && <span style={{ fontSize:9, color:"rgba(26,26,24,.4)", marginLeft:6, fontFamily:"monospace" }}>{p.barcode}</span>}
                              </span>
                              {sel
                                ? <span style={{ fontSize:9, color:"var(--primary,#984ca8)", fontWeight:700 }}>AÑADIDO</span>
                                : <span style={{ fontSize:9, color:"rgba(26,26,24,.4)" }}>+ añadir</span>
                              }
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {prodSelected.length > 0 && (
                      <div>
                        <div className="cd-list-count" style={{ textAlign:"left", marginBottom:6 }}>
                          <strong>{prodSelected.length}</strong> producto{prodSelected.length !== 1 ? "s" : ""} seleccionado{prodSelected.length !== 1 ? "s" : ""}
                        </div>
                        <div className="cd-list" style={{ maxHeight: 160 }}>
                          {prodSelected.map(p => (
                            <div key={p.id} className="cd-list-item sel">
                              <Package size={13} style={{ color:"var(--primary,#984ca8)" }} />
                              <span style={{ flex:1 }}>{p.name}</span>
                              <button type="button"
                                onClick={() => removeProd(p.id)}
                                style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(220,38,38,.7)", padding:"2px 6px", fontSize:11 }}>
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="cd-info-box">
                  Al crear la campaña quedará en estado <strong>BORRADOR</strong>. Luego, al generar el
                  análisis, solo se ofertarán productos que encajen en este alcance y tengan margen suficiente.
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="cd-foot">
              {step === 2
                ? <button className="cd-btn-back" onClick={() => !loading && setStep(1)} disabled={loading}>
                    <ChevronLeft />Atrás
                  </button>
                : <span />}

              <div className="cd-foot-right">
                <button className="cd-btn-cancel" onClick={() => !loading && setOpen(false)} disabled={loading}>
                  Cancelar
                </button>
                {step === 1 ? (
                  <button className="cd-btn-next" onClick={() => setStep(2)} disabled={!step1Valid || loading}>
                    Siguiente<ChevronRight />
                  </button>
                ) : (
                  <button className="cd-btn-save" onClick={handleCrear} disabled={!step2Valid || loading}>
                    {loading
                      ? <><span className="cd-spin" aria-hidden />Creando…</>
                      : <><Megaphone size={13} aria-hidden />Crear campaña</>
                    }
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
