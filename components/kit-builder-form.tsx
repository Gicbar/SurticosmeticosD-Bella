"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { showError, showSuccess, showWarning } from "@/lib/sweetalert"
import {
  Search, Plus, Trash2, Package, Layers, Hash,
  ArrowLeft, Save, ChevronUp, ChevronDown, Info,
  TrendingDown, TrendingUp, Minus
} from "lucide-react"

// ── CSS — mismos tokens exactos del sistema ──────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

.kb-root {
  font-family:'DM Sans',sans-serif;
  --p:       var(--primary,#984ca8);
  --p10:     rgba(var(--primary-rgb,152,76,168),.10);
  --p20:     rgba(var(--primary-rgb,152,76,168),.20);
  --txt:     #1a1a18;
  --muted:   #1a1a18;
  --border:  rgba(26,26,24,.08);
  --ok:      #16a34a;
  --warn:    #d97706;
  --danger:  #dc2626;
}

/* ── Header ──────────────────────────────────────────────── */
.kb-hd {
  display:flex; align-items:center; justify-content:space-between;
  gap:14px; flex-wrap:wrap;
  padding-bottom:20px; border-bottom:1px solid var(--border); margin-bottom:22px;
}
.kb-hd-left  { display:flex; flex-direction:column; gap:4px; }
.kb-title {
  font-family:'Cormorant Garamond',Georgia,serif;
  font-size:22px; font-weight:400; color:var(--txt); margin:0;
  display:flex; align-items:center; gap:10px;
}
.kb-dot  { width:8px; height:8px; background:var(--p); flex-shrink:0; }
.kb-sub  { font-size:12px; color:var(--muted); }
.kb-back {
  display:inline-flex; align-items:center; gap:6px;
  font-size:11px; color:var(--muted); text-decoration:none; margin-bottom:4px;
  transition:color .14s;
}
.kb-back:hover { color:var(--p); }
.kb-back svg { width:12px; height:12px; }

.kb-hd-actions { display:flex; gap:8px; flex-wrap:wrap; }

.kb-btn-save {
  display:inline-flex; align-items:center; gap:7px;
  height:38px; padding:0 20px; background:var(--p); border:none; cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600;
  letter-spacing:.06em; text-transform:uppercase; color:#fff;
  transition:opacity .15s; white-space:nowrap;
}
.kb-btn-save:hover:not(:disabled) { opacity:.88; }
.kb-btn-save:disabled { opacity:.35; cursor:not-allowed; }
.kb-btn-save svg { width:13px; height:13px; }

.kb-btn-cancel {
  display:inline-flex; align-items:center; gap:7px;
  height:38px; padding:0 16px; border:1px solid var(--border); background:#fff; cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:12px; color:rgba(26,26,24,.6);
  text-decoration:none; transition:border-color .14s, color .14s; white-space:nowrap;
}
.kb-btn-cancel:hover { border-color:var(--txt); color:var(--txt); }

/* ── Layout 2 columnas ───────────────────────────────────── */
.kb-layout {
  display:grid; gap:16px; grid-template-columns:1fr;
  align-items:start;
}
@media(min-width:1024px){
  .kb-layout { grid-template-columns:340px 1fr; }
}

/* ── Cards ───────────────────────────────────────────────── */
.kb-card { background:#fff; border:1px solid var(--border); }
.kb-card-hd {
  padding:13px 16px 11px; border-bottom:1px solid var(--border);
  display:flex; align-items:center; gap:8px;
}
.kb-card-hd-ico {
  width:24px; height:24px; background:var(--p10);
  display:flex; align-items:center; justify-content:center; flex-shrink:0;
}
.kb-card-hd-ico svg { color:var(--p); width:12px; height:12px; }
.kb-card-title {
  font-size:10px; font-weight:700; letter-spacing:.16em;
  text-transform:uppercase; color:var(--txt); margin:0;
}
.kb-card-body { padding:16px; }

/* ── Inputs ──────────────────────────────────────────────── */
.kb-label {
  display:block; font-size:9px; font-weight:700; letter-spacing:.2em;
  text-transform:uppercase; color:var(--muted); margin-bottom:5px;
}
.kb-inp {
  width:100%; height:42px; padding:0 13px;
  border:1px solid var(--border); background:#fff;
  font-family:'DM Sans',sans-serif; font-size:13px; color:var(--txt);
  outline:none; -webkit-appearance:none; transition:border-color .14s;
}
.kb-inp:focus { border-color:var(--p); }
.kb-inp:disabled { opacity:.5; }
.kb-inp[type=number] { -moz-appearance:textfield; }
.kb-inp[type=number]::-webkit-outer-spin-button,
.kb-inp[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
.kb-inp-wrap { position:relative; }
.kb-inp-wrap .kb-inp { padding-left:36px; }
.kb-inp-wrap-ico {
  position:absolute; left:11px; top:50%; transform:translateY(-50%);
  color:var(--muted); pointer-events:none; width:14px; height:14px;
}
.kb-textarea {
  width:100%; min-height:68px; padding:10px 13px; resize:vertical;
  border:1px solid var(--border); background:#fff;
  font-family:'DM Sans',sans-serif; font-size:13px; color:var(--txt);
  outline:none; transition:border-color .14s; line-height:1.5;
}
.kb-textarea:focus { border-color:var(--p); }
.kb-field { margin-bottom:13px; }
.kb-field:last-child { margin-bottom:0; }

/* Código numérico — destacado */
.kb-code-wrap { position:relative; }
.kb-code-inp {
  width:100%; height:50px; padding:0 13px 0 44px;
  border:1.5px solid var(--border); background:#fff;
  font-family:'Cormorant Garamond',serif; font-size:22px; font-weight:500; color:var(--p);
  outline:none; letter-spacing:.06em; transition:border-color .14s;
  -moz-appearance:textfield;
}
.kb-code-inp:focus { border-color:var(--p); }
.kb-code-inp::-webkit-outer-spin-button,
.kb-code-inp::-webkit-inner-spin-button { -webkit-appearance:none; }
.kb-code-ico {
  position:absolute; left:13px; top:50%; transform:translateY(-50%);
  color:var(--p); opacity:.5; pointer-events:none;
}
.kb-code-hint { font-size:9px; color:var(--muted); margin-top:4px; }

/* ── Buscador de productos ───────────────────────────────── */
.kb-search-wrap { position:relative; }
.kb-search-inp {
  width:100%; height:42px; padding:0 13px 0 38px;
  border:1px solid var(--border); background:#fff;
  font-family:'DM Sans',sans-serif; font-size:13px; color:var(--txt);
  outline:none; transition:border-color .14s;
}
.kb-search-inp:focus { border-color:var(--p); }
.kb-search-ico {
  position:absolute; left:11px; top:50%; transform:translateY(-50%);
  color:var(--muted); pointer-events:none; width:14px; height:14px;
}
.kb-search-results {
  position:absolute; top:calc(100% + 3px); left:0; right:0;
  background:#fff; border:1px solid var(--border);
  box-shadow:0 8px 24px rgba(26,26,24,.10); z-index:500;
  max-height:220px; overflow-y:auto;
}
.kb-search-item {
  display:flex; align-items:center; justify-content:space-between;
  padding:10px 13px; border-bottom:1px solid var(--border);
  cursor:pointer; transition:background .1s; gap:10px;
  border-left:none; border-right:none; border-top:none;
  background:#fff; width:100%; text-align:left;
}
.kb-search-item:last-child { border-bottom:none; }
.kb-search-item:hover { background:var(--p10); }
.kb-search-name  { font-size:13px; color:var(--txt); font-weight:500; min-width:0; flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.kb-search-price {
  font-family:'Cormorant Garamond',serif; font-size:14px;
  font-weight:500; color:var(--p); flex-shrink:0;
}
.kb-search-add {
  width:24px; height:24px; background:var(--p); border:none; cursor:pointer;
  display:flex; align-items:center; justify-content:center; flex-shrink:0;
}
.kb-search-add svg { color:#fff; width:11px; height:11px; }
.kb-search-added { font-size:9px; color:var(--ok); font-weight:700; letter-spacing:.1em; flex-shrink:0; }
.kb-search-none { padding:14px 13px; font-size:12px; color:var(--muted); text-align:center; }

/* ── Tabla de ítems del kit ──────────────────────────────── */
.kb-items-empty {
  display:flex; flex-direction:column; align-items:center; gap:12px;
  padding:48px 20px; text-align:center;
}
.kb-items-empty-ico {
  width:48px; height:48px; background:var(--p10);
  display:flex; align-items:center; justify-content:center; border-radius:50%;
}
.kb-items-empty-ico svg { color:var(--p); opacity:.3; width:20px; height:20px; }
.kb-items-empty-t { font-size:13px; font-weight:500; color:var(--txt); margin:0; }
.kb-items-empty-s { font-size:11px; color:var(--muted); margin:0; }

.kb-items-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; }
table.kb-items-tbl { width:100%; border-collapse:collapse; min-width:600px; }
.kb-items-tbl thead tr { border-bottom:2px solid var(--border); background:rgba(26,26,24,.02); }
.kb-items-tbl th {
  padding:9px 13px; font-size:8px; font-weight:700; letter-spacing:.2em;
  text-transform:uppercase; color:var(--muted); text-align:left; white-space:nowrap;
}
.kb-items-tbl th.r { text-align:right; }
.kb-items-tbl th.c { text-align:center; }
.kb-items-tbl tbody tr { border-bottom:1px solid var(--border); transition:background .1s; }
.kb-items-tbl tbody tr:last-child { border-bottom:none; }
.kb-items-tbl td { padding:10px 13px; font-size:12px; color:var(--txt); vertical-align:middle; }
.kb-items-tbl td.r { text-align:right; }
.kb-items-tbl td.c { text-align:center; }

/* Producto en tabla */
.kb-item-name  { font-weight:500; font-size:12px; }
.kb-item-orig  { font-size:10px; color:var(--muted); margin-top:1px; }

/* Qty control */
.kb-qty-row { display:flex; align-items:center; gap:5px; justify-content:center; }
.kb-qty-btn {
  width:26px; height:26px; border:1px solid var(--border); background:#fff;
  display:flex; align-items:center; justify-content:center; cursor:pointer;
  color:var(--muted); transition:all .12s;
}
.kb-qty-btn:hover { border-color:var(--p); color:var(--p); background:var(--p10); }
.kb-qty-num { font-size:13px; font-weight:700; color:var(--txt); width:24px; text-align:center; }

/* Input precio kit */
.kb-price-inp {
  width:110px; height:34px; padding:0 10px;
  border:1px solid var(--border); background:#fff;
  font-family:'Cormorant Garamond',serif; font-size:14px; font-weight:500;
  color:var(--p); text-align:right; outline:none;
  transition:border-color .14s; -moz-appearance:textfield;
}
.kb-price-inp:focus { border-color:var(--p); }
.kb-price-inp::-webkit-outer-spin-button,
.kb-price-inp::-webkit-inner-spin-button { -webkit-appearance:none; }

/* Badge descuento / recargo */
.kb-delta {
  display:inline-flex; align-items:center; gap:3px;
  padding:2px 7px; font-size:9px; font-weight:700; white-space:nowrap;
}
.kb-delta.down { background:rgba(22,163,74,.08); color:var(--ok); }
.kb-delta.up   { background:rgba(220,38,38,.06); color:var(--danger); }
.kb-delta.zero { background:rgba(26,26,24,.05); color:var(--muted); }
.kb-delta svg  { width:9px; height:9px; }

/* Botón eliminar ítem */
.kb-remove-btn {
  width:28px; height:28px; border:none; background:none; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  color:rgba(26,26,24,.25); transition:color .12s;
}
.kb-remove-btn:hover { color:var(--danger); }
.kb-remove-btn svg { width:13px; height:13px; }

/* ── Resumen financiero ───────────────────────────────────── */
.kb-summary {
  background:var(--p10); border-top:1px solid var(--p20);
  padding:14px 16px;
}
.kb-summary-row { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:6px; }
.kb-summary-row:last-child { margin-bottom:0; padding-top:6px; border-top:1px solid var(--p20); }
.kb-summary-lbl { font-size:10px; color:rgba(26,26,24,.55); text-transform:uppercase; letter-spacing:.12em; }
.kb-summary-val { font-size:13px; color:var(--txt); font-weight:500; }
.kb-summary-row.main .kb-summary-lbl { font-weight:700; color:rgba(26,26,24,.75); }
.kb-summary-row.main .kb-summary-val {
  font-family:'Cormorant Garamond',serif; font-size:20px;
  font-weight:500; color:var(--p);
}
.kb-summary-diff {
  display:inline-flex; align-items:center; gap:4px;
  font-size:10px; font-weight:700; padding:2px 8px;
}
.kb-summary-diff.down { background:rgba(22,163,74,.10); color:var(--ok); }
.kb-summary-diff.up   { background:rgba(220,38,38,.08); color:var(--danger); }
.kb-summary-diff.zero { background:rgba(26,26,24,.06); color:var(--muted); }

/* Spinner */
.kb-spin {
  width:13px; height:13px; border:2px solid rgba(255,255,255,.3);
  border-top-color:#fff; border-radius:50%;
  animation:kbSpin .7s linear infinite; flex-shrink:0;
}
@keyframes kbSpin { to{ transform:rotate(360deg); } }
`

// ── Tipos ─────────────────────────────────────────────────────────────────────
type Product = { id:string; name:string; barcode:string|null; sale_price:number }

type KitItem = {
  product_id: string
  name: string
  sale_price: number    // precio original del producto
  quantity: number
  unit_price_in_kit: number  // precio en el kit (editable)
}

type ExistingKit = {
  id: string; code: number; name: string; description: string | null; is_active: boolean
  product_kit_items: {
    product_id: string; quantity: number; unit_price_in_kit: number
    products: { name: string; sale_price: number } | null
  }[]
}

interface KitBuilderFormProps {
  companyId: string
  existingKit?: ExistingKit
}

function COP(n: number) {
  return n.toLocaleString("es-CO", { style:"currency", currency:"COP", minimumFractionDigits:0 })
}

// ── Componente principal ──────────────────────────────────────────────────────
export function KitBuilderForm({ companyId, existingKit }: KitBuilderFormProps) {
  const router = useRouter()
  const searchRef = useRef<HTMLInputElement>(null)

  const isEdit = Boolean(existingKit)

  // Form state
  const [code, setCode]         = useState<string>(existingKit?.code?.toString() ?? "")
  const [name, setName]         = useState(existingKit?.name ?? "")
  const [description, setDesc]  = useState(existingKit?.description ?? "")
  const [isActive, setIsActive] = useState(existingKit?.is_active ?? true)
  const [items, setItems]       = useState<KitItem[]>(() => {
    if (!existingKit) return []
    return existingKit.product_kit_items.map(i => ({
      product_id:       i.product_id,
      name:             i.products?.name ?? "—",
      sale_price:       Number(i.products?.sale_price ?? 0),
      quantity:         i.quantity,
      unit_price_in_kit: Number(i.unit_price_in_kit),
    }))
  })

  // Búsqueda de productos
  const [allProducts, setAllProducts]         = useState<Product[]>([])
  const [search, setSearch]                   = useState("")
  const [filteredProds, setFilteredProds]     = useState<Product[]>([])
  const [searchOpen, setSearchOpen]           = useState(false)
  const [loading, setLoading]                 = useState(false)
  const searchWrap = useRef<HTMLDivElement>(null)

  // Cargar productos
  useEffect(() => {
    createClient()
      .from("products")
      .select("id, name, barcode, sale_price")
      .eq("company_id", companyId)
      .order("name")
      .then(({ data }) => setAllProducts(data || []))
  }, [companyId])

  // Filtrar según búsqueda
  useEffect(() => {
    const q = search.trim().toLowerCase()
    if (!q) { setFilteredProds([]); return }
    setFilteredProds(
      allProducts
        .filter(p => p.name.toLowerCase().includes(q) || p.barcode?.includes(q))
        .slice(0, 12)
    )
  }, [search, allProducts])

  // Cerrar dropdown al hacer clic afuera
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (searchWrap.current && !searchWrap.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener("mousedown", fn)
    return () => document.removeEventListener("mousedown", fn)
  }, [])

  // Añadir producto al kit
  const addProduct = useCallback((prod: Product) => {
    if (items.find(i => i.product_id === prod.id)) return
    setItems(prev => [...prev, {
      product_id:        prod.id,
      name:              prod.name,
      sale_price:        Number(prod.sale_price),
      quantity:          1,
      unit_price_in_kit: Number(prod.sale_price),
    }])
    setSearch("")
    setSearchOpen(false)
  }, [items])

  const removeItem  = (pid: string) => setItems(p => p.filter(i => i.product_id !== pid))
  const updateQty   = (pid: string, delta: number) =>
    setItems(p => p.map(i => i.product_id === pid
      ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i))
  const updatePrice = (pid: string, val: string) =>
    setItems(p => p.map(i => i.product_id === pid
      ? { ...i, unit_price_in_kit: parseFloat(val) || 0 } : i))

  // Totales
  const totalReal = items.reduce((s, i) => s + i.sale_price * i.quantity, 0)
  const totalKit  = items.reduce((s, i) => s + i.unit_price_in_kit * i.quantity, 0)
  const diff      = totalKit - totalReal
  const diffPct   = totalReal > 0 ? (diff / totalReal) * 100 : 0

  // Guardar
  const handleSave = async () => {
    if (!name.trim())   return showError("El nombre del kit es obligatorio")
    if (!code)          return showError("El código numérico es obligatorio")
    const codeNum = parseInt(code)
    if (isNaN(codeNum) || codeNum <= 0) return showError("El código debe ser un número entero positivo")
    if (items.length === 0) return showError("Agrega al menos un producto al kit")
    const hasInvalidPrice = items.some(i => i.unit_price_in_kit < 0)
    if (hasInvalidPrice) return showError("Los precios no pueden ser negativos")

    setLoading(true)
    const supabase = createClient()
    try {
      const { data:{ user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No autenticado")

      if (isEdit && existingKit) {
        // Actualizar kit
        const { error: kitErr } = await supabase
          .from("product_kits")
          .update({ code: codeNum, name: name.trim(), description: description.trim() || null, is_active: isActive })
          .eq("id", existingKit.id)
          .eq("company_id", companyId)
        if (kitErr) throw kitErr

        // Reemplazar ítems: borrar todos y reinsertar
        const { error: delErr } = await supabase
          .from("product_kit_items")
          .delete()
          .eq("kit_id", existingKit.id)
        if (delErr) throw delErr

        const { error: insErr } = await supabase.from("product_kit_items").insert(
          items.map((i, idx) => ({
            kit_id:            existingKit.id,
            company_id:        companyId,
            product_id:        i.product_id,
            quantity:          i.quantity,
            unit_price_in_kit: i.unit_price_in_kit,
            sort_order:        idx,
          }))
        )
        if (insErr) throw insErr

      } else {
        // Crear kit nuevo
        const { data: kit, error: kitErr } = await supabase
          .from("product_kits")
          .insert({
            company_id:  companyId,
            code:        codeNum,
            name:        name.trim(),
            description: description.trim() || null,
            is_active:   true,
            created_by:  user.id,
          })
          .select()
          .single()
        if (kitErr) throw kitErr

        const { error: insErr } = await supabase.from("product_kit_items").insert(
          items.map((i, idx) => ({
            kit_id:            kit.id,
            company_id:        companyId,
            product_id:        i.product_id,
            quantity:          i.quantity,
            unit_price_in_kit: i.unit_price_in_kit,
            sort_order:        idx,
          }))
        )
        if (insErr) throw insErr
      }

      await showSuccess(
        isEdit ? "Kit actualizado" : "Kit creado",
        `"${name}" con ${items.length} producto${items.length !== 1 ? "s" : ""}`
      )
      router.push("/dashboard/kits")
      router.refresh()

    } catch (err: any) {
      // Detectar código duplicado
      if (err.message?.includes("product_kits_code_company_unique")) {
        showError(`El código ${codeNum} ya está en uso por otro kit de esta empresa`)
      } else {
        showError(err.message || "Error al guardar")
      }
    } finally { setLoading(false) }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="kb-root">

        {/* Header */}
        <div className="kb-hd">
          <div className="kb-hd-left">
            <a href="/dashboard/kits" className="kb-back">
              <ArrowLeft aria-hidden />
              Volver a kits
            </a>
            <h1 className="kb-title">
              <span className="kb-dot" aria-hidden />
              {isEdit ? `Editar kit #${existingKit?.code}` : "Nuevo kit"}
            </h1>
            <p className="kb-sub">
              {isEdit
                ? `Modificar productos y precios del kit "${existingKit?.name}"`
                : "Define el kit, agrega productos y ajusta precios"}
            </p>
          </div>
          <div className="kb-hd-actions">
            <a href="/dashboard/kits" className="kb-btn-cancel">Cancelar</a>
            <button className="kb-btn-save" onClick={handleSave} disabled={loading}>
              {loading
                ? <><span className="kb-spin" aria-hidden />Guardando…</>
                : <><Save size={13} aria-hidden />{isEdit ? "Guardar cambios" : "Crear kit"}</>
              }
            </button>
          </div>
        </div>

        {/* Layout principal */}
        <div className="kb-layout">

          {/* ── Columna izquierda: info + buscador ─── */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Info del kit */}
            <div className="kb-card">
              <div className="kb-card-hd">
                <div className="kb-card-hd-ico" aria-hidden><Layers /></div>
                <p className="kb-card-title">Información del kit</p>
              </div>
              <div className="kb-card-body">

                {/* Código numérico — campo más importante */}
                <div className="kb-field">
                  <label className="kb-label" htmlFor="kb-code">
                    Código numérico POS *
                  </label>
                  <div className="kb-code-wrap">
                    <Hash className="kb-code-ico" size={18} aria-hidden />
                    <input
                      id="kb-code"
                      type="number"
                      className="kb-code-inp"
                      placeholder="101"
                      value={code}
                      onChange={e => setCode(e.target.value)}
                      min={1} max={99999}
                    />
                  </div>
                  <p className="kb-code-hint">
                    Ingresa este código en el POS para cargar todos los productos del kit automáticamente.
                  </p>
                </div>

                {/* Nombre */}
                <div className="kb-field">
                  <label className="kb-label" htmlFor="kb-name">Nombre del kit *</label>
                  <input
                    id="kb-name" className="kb-inp"
                    placeholder="Ej: Kit básico de maquillaje, Combo verano…"
                    value={name} onChange={e => setName(e.target.value)}
                    maxLength={80}
                  />
                </div>

                {/* Descripción */}
                <div className="kb-field">
                  <label className="kb-label" htmlFor="kb-desc">Descripción</label>
                  <textarea
                    id="kb-desc" className="kb-textarea"
                    placeholder="Descripción del kit, ocasión recomendada…"
                    value={description}
                    onChange={e => setDesc(e.target.value)}
                    maxLength={300}
                  />
                </div>

                {/* Toggle activo (solo en edición) */}
                {isEdit && (
                  <div className="kb-field">
                    <label className="kb-label">Estado</label>
                    <button
                      type="button"
                      onClick={() => setIsActive(v => !v)}
                      style={{
                        display:"flex", alignItems:"center", gap:8,
                        padding:"10px 13px", border:"1px solid var(--border)",
                        background: isActive ? "rgba(22,163,74,.06)" : "rgba(26,26,24,.03)",
                        cursor:"pointer", width:"100%", textAlign:"left",
                        fontFamily:"'DM Sans',sans-serif", fontSize:12,
                        color: isActive ? "var(--ok)" : "var(--muted)",
                        fontWeight:600, transition:"all .14s",
                      }}
                    >
                      <span style={{
                        width:10, height:10, borderRadius:"50%", flexShrink:0,
                        background: isActive ? "var(--ok)" : "rgba(26,26,24,.25)",
                      }} aria-hidden />
                      {isActive ? "Activo — visible en POS" : "Inactivo — oculto en POS"}
                    </button>
                  </div>
                )}

              </div>
            </div>

            {/* Buscador de productos */}
            <div className="kb-card">
              <div className="kb-card-hd">
                <div className="kb-card-hd-ico" aria-hidden><Search /></div>
                <p className="kb-card-title">Agregar productos</p>
              </div>
              <div className="kb-card-body">
                <div className="kb-search-wrap" ref={searchWrap}>
                  <Search className="kb-search-ico" aria-hidden />
                  <input
                    ref={searchRef}
                    className="kb-search-inp"
                    placeholder="Buscar por nombre o código de barras…"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setSearchOpen(true) }}
                    onFocus={() => setSearchOpen(true)}
                    autoComplete="off"
                  />
                  {searchOpen && filteredProds.length > 0 && (
                    <div className="kb-search-results">
                      {filteredProds.map(p => {
                        const alreadyIn = items.some(i => i.product_id === p.id)
                        return (
                          <button
                            key={p.id}
                            type="button"
                            className="kb-search-item"
                            onClick={() => !alreadyIn && addProduct(p)}
                            disabled={alreadyIn}
                            style={alreadyIn ? { opacity:.5, cursor:"default" } : {}}
                          >
                            <span className="kb-search-name">{p.name}</span>
                            <span className="kb-search-price">{COP(p.sale_price)}</span>
                            {alreadyIn
                              ? <span className="kb-search-added">YA AÑADIDO</span>
                              : <span className="kb-search-add" aria-hidden><Plus /></span>
                            }
                          </button>
                        )
                      })}
                    </div>
                  )}
                  {searchOpen && search.trim() && filteredProds.length === 0 && (
                    <div className="kb-search-results">
                      <div className="kb-search-none">Sin resultados para "{search}"</div>
                    </div>
                  )}
                </div>
                <p style={{ fontSize:10, color:"var(--muted)", marginTop:8 }}>
                  Los precios son editables individualmente en la tabla del kit.
                </p>
              </div>
            </div>

          </div>

          {/* ── Columna derecha: tabla de ítems + resumen ─── */}
          <div className="kb-card" style={{ overflow:"hidden" }}>
            <div className="kb-card-hd">
              <div className="kb-card-hd-ico" aria-hidden><Package /></div>
              <p className="kb-card-title">
                Productos del kit
                {items.length > 0 && (
                  <span style={{
                    marginLeft:8, fontSize:9, background:"var(--p10)",
                    color:"var(--p)", padding:"2px 7px", fontWeight:700,
                  }}>
                    {items.length}
                  </span>
                )}
              </p>
            </div>

            {items.length === 0 ? (
              <div className="kb-items-empty">
                <div className="kb-items-empty-ico"><Package /></div>
                <p className="kb-items-empty-t">El kit está vacío</p>
                <p className="kb-items-empty-s">
                  Busca y agrega productos desde el panel izquierdo
                </p>
              </div>
            ) : (
              <>
                <div className="kb-items-scroll">
                  <table className="kb-items-tbl">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th className="c">Cantidad</th>
                        <th className="r">Precio normal</th>
                        <th className="r">Precio en kit</th>
                        <th className="r">Diferencia</th>
                        <th className="c" style={{ width:40 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(item => {
                        const precioNormal  = item.sale_price * item.quantity
                        const precioEnKit   = item.unit_price_in_kit * item.quantity
                        const delta         = precioEnKit - precioNormal
                        const deltaPct      = precioNormal > 0 ? (delta / precioNormal) * 100 : 0
                        const deltaClass    = delta < 0 ? "down" : delta > 0 ? "up" : "zero"

                        return (
                          <tr key={item.product_id}>

                            {/* Nombre */}
                            <td>
                              <div className="kb-item-name">{item.name}</div>
                              <div className="kb-item-orig">
                                Precio regular: {COP(item.sale_price)} c/u
                              </div>
                            </td>

                            {/* Cantidad */}
                            <td className="c">
                              <div className="kb-qty-row">
                                <button
                                  className="kb-qty-btn"
                                  onClick={() => updateQty(item.product_id, -1)}
                                  aria-label="Reducir cantidad"
                                  disabled={item.quantity <= 1}
                                  style={item.quantity <= 1 ? { opacity:.3 } : {}}
                                >
                                  <Minus size={10} />
                                </button>
                                <span className="kb-qty-num">{item.quantity}</span>
                                <button
                                  className="kb-qty-btn"
                                  onClick={() => updateQty(item.product_id, 1)}
                                  aria-label="Aumentar cantidad"
                                >
                                  <Plus size={10} />
                                </button>
                              </div>
                            </td>

                            {/* Precio normal (referencia) */}
                            <td className="r">
                              <span style={{ fontSize:13, color:"var(--muted)" }}>
                                {COP(precioNormal)}
                              </span>
                            </td>

                            {/* Precio en kit — editable */}
                            <td className="r">
                              <input
                                type="number"
                                className="kb-price-inp"
                                value={item.unit_price_in_kit}
                                onChange={e => updatePrice(item.product_id, e.target.value)}
                                min={0}
                                step={100}
                                aria-label={`Precio en kit de ${item.name}`}
                              />
                            </td>

                            {/* Diferencia */}
                            <td className="r">
                              <span className={`kb-delta ${deltaClass}`}>
                                {deltaClass === "down" && <TrendingDown aria-hidden />}
                                {deltaClass === "up"   && <TrendingUp   aria-hidden />}
                                {delta !== 0
                                  ? `${delta > 0 ? "+" : ""}${deltaPct.toFixed(0)}%`
                                  : "="}
                              </span>
                            </td>

                            {/* Eliminar */}
                            <td className="c">
                              <button
                                className="kb-remove-btn"
                                onClick={() => removeItem(item.product_id)}
                                aria-label={`Quitar ${item.name} del kit`}
                              >
                                <Trash2 aria-hidden />
                              </button>
                            </td>

                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Resumen financiero */}
                <div className="kb-summary">
                  <div className="kb-summary-row">
                    <span className="kb-summary-lbl">Precio regular total</span>
                    <span className="kb-summary-val">{COP(totalReal)}</span>
                  </div>
                  <div className="kb-summary-row main">
                    <span className="kb-summary-lbl">Precio del kit</span>
                    <span className="kb-summary-val">{COP(totalKit)}</span>
                  </div>
                  <div className="kb-summary-row">
                    <span className="kb-summary-lbl">Diferencia vs. precio regular</span>
                    <span className={`kb-summary-diff ${diff < 0 ? "down" : diff > 0 ? "up" : "zero"}`}>
                      {diff < 0 && <TrendingDown size={10} aria-hidden />}
                      {diff > 0 && <TrendingUp   size={10} aria-hidden />}
                      {diff === 0
                        ? "Sin diferencia"
                        : `${diff > 0 ? "+" : ""}${COP(diff)} (${diff > 0 ? "+" : ""}${diffPct.toFixed(1)}%)`
                      }
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </>
  )
}
