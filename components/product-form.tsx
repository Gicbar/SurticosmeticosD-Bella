"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { showError, showSuccess } from "@/lib/sweetalert"
import { Upload, X, Package, ChevronDown, Check } from "lucide-react"
import Image from "next/image"

// ── CSS — mismo sistema de tokens que el dashboard ────────────────────────────
const FORM_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

.pf-root {
  font-family: 'DM Sans', sans-serif;
  --p:       var(--primary, #984ca8);
  --p10:     rgba(var(--primary-rgb, 152,76,168), .10);
  --p20:     rgba(var(--primary-rgb, 152,76,168), .20);
  --txt:     #1a1a18;
  --muted:   rgba(26,26,24, .45);
  --border:  rgba(26,26,24, .08);
  --danger:  #dc2626;
}

/* ── Label ──────────────────────────────────────────────────────────────── */
.pf-label {
  display: block;
  font-size: 9px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase;
  color: var(--muted); margin-bottom: 6px;
}

/* ── Input / Textarea ────────────────────────────────────────────────────── */
.pf-input {
  width: 100%; height: 42px; padding: 0 13px;
  border: 1px solid var(--border); background: #fff;
  font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--txt);
  outline: none; -webkit-appearance: none;
  transition: border-color .14s;
}
.pf-input:focus { border-color: var(--p); }
.pf-input:disabled { opacity: .5; }
.pf-input[type="number"] { -moz-appearance: textfield; }
.pf-input[type="number"]::-webkit-outer-spin-button,
.pf-input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

.pf-textarea {
  width: 100%; min-height: 88px; padding: 10px 13px;
  border: 1px solid var(--border); background: #fff;
  font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--txt);
  outline: none; resize: vertical; line-height: 1.5;
  transition: border-color .14s;
}
.pf-textarea:focus { border-color: var(--p); }

/* ── Select custom ────────────────────────────────────────────────────────── */
.pf-select-wrap { position: relative; }
.pf-select-trigger {
  width: 100%; height: 42px; padding: 0 36px 0 13px;
  border: 1px solid var(--border); background: #fff;
  font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--txt);
  display: flex; align-items: center; justify-content: space-between;
  cursor: pointer; outline: none; text-align: left;
  transition: border-color .14s;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.pf-select-trigger.placeholder { color: var(--muted); }
.pf-select-trigger:focus, .pf-select-trigger[data-open="true"] { border-color: var(--p); }
.pf-select-trigger:disabled { opacity: .5; cursor: not-allowed; }
.pf-select-chevron {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  color: var(--muted); pointer-events: none;
  transition: transform .15s;
}
.pf-select-chevron.open { transform: translateY(-50%) rotate(180deg); }
.pf-select-dropdown {
  position: absolute; top: calc(100% + 3px); left: 0; right: 0;
  background: #fff; border: 1px solid var(--border);
  box-shadow: 0 8px 24px rgba(26,26,24,.10);
  z-index: 500; max-height: 220px; overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.pf-select-option {
  padding: 10px 13px; font-size: 13px; color: var(--txt);
  cursor: pointer; display: flex; align-items: center; justify-content: space-between;
  min-height: 40px; transition: background .1s;
}
.pf-select-option:hover { background: var(--p10); }
.pf-select-option.selected { color: var(--p); font-weight: 500; }
.pf-select-none { padding: 14px 13px; font-size: 12px; color: var(--muted); }

/* ── Grid de campos ──────────────────────────────────────────────────────── */
.pf-grid {
  display: grid; gap: 16px;
  grid-template-columns: 1fr;
}
@media (min-width: 600px) { .pf-grid { grid-template-columns: 1fr 1fr; } }

/* ── Imagen ──────────────────────────────────────────────────────────────── */
.pf-img-section { display: flex; gap: 16px; align-items: flex-start; flex-wrap: wrap; }
.pf-img-preview {
  position: relative; width: 110px; height: 110px;
  border: 1px solid var(--border); overflow: hidden; flex-shrink: 0;
}
.pf-img-remove {
  position: absolute; top: 5px; right: 5px;
  width: 22px; height: 22px; border-radius: 50%;
  background: rgba(220,38,38,.85); border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: #fff; transition: background .14s;
}
.pf-img-remove:hover { background: var(--danger); }
.pf-img-remove svg { width: 10px; height: 10px; }

.pf-img-upload {
  width: 110px; height: 110px;
  border: 1.5px dashed var(--border);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px; cursor: pointer; flex-shrink: 0;
  transition: border-color .14s;
}
.pf-img-upload:hover { border-color: var(--p20); }
.pf-img-upload svg { color: var(--muted); width: 22px; height: 22px; }
.pf-img-upload span { font-size: 10px; color: var(--muted); letter-spacing: .06em; }
.pf-img-note { font-size: 10px; color: var(--muted); line-height: 1.5; max-width: 240px; }

/* ── Botones ─────────────────────────────────────────────────────────────── */
.pf-btn-row { display: flex; gap: 8px; padding-top: 8px; }
.pf-btn-save {
  height: 42px; padding: 0 24px;
  background: var(--p); border: none; cursor: pointer;
  font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600;
  letter-spacing: .08em; text-transform: uppercase; color: #fff;
  display: flex; align-items: center; gap: 6px;
  transition: opacity .14s;
}
.pf-btn-save:hover:not(:disabled) { opacity: .88; }
.pf-btn-save:disabled { opacity: .4; cursor: not-allowed; }
.pf-btn-cancel {
  height: 42px; padding: 0 20px;
  border: 1px solid var(--border); background: #fff; cursor: pointer;
  font-family: 'DM Sans', sans-serif; font-size: 12px; color: var(--muted);
  transition: border-color .14s, color .14s;
}
.pf-btn-cancel:hover { border-color: var(--txt); color: var(--txt); }

/* Spinner */
.pf-spinner {
  width: 13px; height: 13px;
  border: 2px solid rgba(255,255,255,.3); border-top-color: #fff;
  border-radius: 50%; animation: pfSpin .7s linear infinite; flex-shrink: 0;
}
@keyframes pfSpin { to { transform: rotate(360deg); } }

/* Sección encabezado */
.pf-section-ico {
  width: 24px; height: 24px; background: var(--p10);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.pf-section-ico svg { color: var(--p); width: 12px; height: 12px; }
.pf-section-title {
  font-size: 10px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--txt); margin: 0;
}
.pf-sep { height: 1px; background: var(--border); margin: 18px 0; }
`

// ── Tipos ─────────────────────────────────────────────────────────────────────
type Product = {
  id: string; name: string; description: string | null; barcode: string | null
  category_id: string | null; supplier_id: string | null
  sale_price: number; min_stock: number; image_url: string | null
}
interface ProductFormProps {
  product?: Product
  companyId: string
}
type SelectOpt = { id: string; name: string }

// ── CustomSelect — sin Radix, sin IDs dinámicos ───────────────────────────────
function CustomSelect({ value, onChange, options, placeholder, disabled }: {
  value: string; onChange: (v: string) => void
  options: SelectOpt[]; placeholder: string; disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const id = setTimeout(() => document.addEventListener("mousedown", handler), 10)
    return () => { clearTimeout(id); document.removeEventListener("mousedown", handler) }
  }, [open])

  const selected = options.find(o => o.id === value)

  return (
    <div className="pf-select-wrap" ref={ref}>
      <button
        type="button"
        className={`pf-select-trigger${!selected ? " placeholder" : ""}`}
        onClick={() => !disabled && setOpen(o => !o)}
        data-open={open}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected?.name ?? placeholder}
      </button>
      <ChevronDown size={13} className={`pf-select-chevron${open ? " open" : ""}`} aria-hidden />
      {open && (
        <div className="pf-select-dropdown" role="listbox">
          {options.length === 0 ? (
            <div className="pf-select-none">Sin opciones disponibles</div>
          ) : options.map(opt => (
            <div
              key={opt.id}
              className={`pf-select-option${value === opt.id ? " selected" : ""}`}
              role="option"
              aria-selected={value === opt.id}
              onClick={() => { onChange(opt.id); setOpen(false) }}
            >
              {opt.name}
              {value === opt.id && <Check size={11} aria-hidden />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── ProductForm ───────────────────────────────────────────────────────────────
export function ProductForm({ product, companyId }: ProductFormProps) {
  const router = useRouter()
  const [loading, setLoading]           = useState(false)
  const [categories, setCategories]     = useState<SelectOpt[]>([])
  const [suppliers, setSuppliers]       = useState<SelectOpt[]>([])
  const [imageFile, setImageFile]       = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(product?.image_url || null)

  const [form, setForm] = useState({
    name:        product?.name || "",
    description: product?.description || "",
    barcode:     product?.barcode || "",
    category_id: product?.category_id || "",
    supplier_id: product?.supplier_id || "",
    sale_price:  product?.sale_price?.toString() || "",
    min_stock:   product?.min_stock?.toString() || "0",
  })

  useEffect(() => {
    ;(async () => {
      const supabase = createClient()
      const [{ data: cats }, { data: sups }] = await Promise.all([
        supabase.from("categories").select("id, name").eq("company_id", companyId).order("name"),
        supabase.from("suppliers").select("id, name").eq("company_id", companyId).order("name"),
      ])
      setCategories(cats || [])
      setSuppliers(sups || [])
    })()
  }, [companyId])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = createClient()

      // Validar barcode duplicado dentro de la empresa
      if (form.barcode) {
        const { data: dup } = await supabase
          .from("products").select("id")
          .eq("barcode", form.barcode).eq("company_id", companyId)
          .neq("id", product?.id || "").single()
        if (dup) {
          showError("Ya existe un producto con este código de barras", "Código duplicado")
          return
        }
      }

      // Subir imagen
      let imageUrl = product?.image_url || null
      if (imageFile) {
        const ext = imageFile.name.split(".").pop()
        const path = `products/${Math.random().toString(36).slice(2)}-${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from("product-images").upload(path, imageFile)
        if (upErr) throw new Error("Error al subir imagen: " + upErr.message)
        imageUrl = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl
      } else if (!imagePreview && product?.image_url) {
        // el usuario eliminó la imagen
        imageUrl = null
      }

      const data = {
        name:        form.name,
        description: form.description || null,
        barcode:     form.barcode || null,
        category_id: form.category_id || null,
        supplier_id: form.supplier_id || null,
        sale_price:  parseFloat(form.sale_price),
        min_stock:   parseInt(form.min_stock),
        image_url:   imageUrl,
        company_id:  companyId,
      }

      const { error } = product
        ? await supabase.from("products").update(data).eq("id", product.id).eq("company_id", companyId)
        : await supabase.from("products").insert(data)

      if (error) throw new Error(error.message)

      await showSuccess(product ? "Producto actualizado" : "Producto creado")
      router.push("/dashboard/products")
      router.refresh()
    } catch (err) {
      showError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FORM_CSS }} />
      <div className="pf-root">
        <form onSubmit={handleSubmit}>

          {/* ── Imagen ─────────────────────────────────────────────────────── */}
          <div style={{ marginBottom: 20 }}>
            <span className="pf-label">Imagen del producto</span>
            <div className="pf-img-section">
              {imagePreview ? (
                <div className="pf-img-preview">
                  <Image src={imagePreview} alt="Vista previa" fill style={{ objectFit: "cover" }} />
                  <button type="button" className="pf-img-remove" onClick={() => { setImageFile(null); setImagePreview(null) }} aria-label="Eliminar imagen">
                    <X aria-hidden />
                  </button>
                </div>
              ) : (
                <label className="pf-img-upload" aria-label="Subir imagen">
                  <Upload aria-hidden />
                  <span>Subir imagen</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="sr-only" style={{ display:"none" }} />
                </label>
              )}
              <p className="pf-img-note">
                Formatos: JPG, PNG, WEBP<br />
                Recomendado: 600×600px o superior
              </p>
            </div>
          </div>

          <div className="pf-sep" aria-hidden />

          {/* ── Información del producto ────────────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div className="pf-section-ico" aria-hidden><Package /></div>
            <p className="pf-section-title">{product ? "Editar producto" : "Información del producto"}</p>
          </div>

          <div className="pf-grid" style={{ marginBottom: 16 }}>
            <div>
              <label className="pf-label" htmlFor="pf-name">Nombre *</label>
              <input id="pf-name" className="pf-input" required value={form.name} onChange={set("name")} placeholder="Ej: Crema hidratante" disabled={loading} />
            </div>
            <div>
              <label className="pf-label" htmlFor="pf-barcode">Código de barras</label>
              <input id="pf-barcode" className="pf-input" value={form.barcode} onChange={set("barcode")} placeholder="Ej: 7501234567890" disabled={loading} />
            </div>
            <div>
              <label className="pf-label">Categoría</label>
              <CustomSelect
                value={form.category_id}
                onChange={v => setForm(f => ({ ...f, category_id: v }))}
                options={categories}
                placeholder="Selecciona una categoría"
                disabled={loading}
              />
            </div>
            <div>
              <label className="pf-label">Proveedor</label>
              <CustomSelect
                value={form.supplier_id}
                onChange={v => setForm(f => ({ ...f, supplier_id: v }))}
                options={suppliers}
                placeholder="Selecciona un proveedor"
                disabled={loading}
              />
            </div>
            <div>
              <label className="pf-label" htmlFor="pf-price">Precio de venta *</label>
              <input id="pf-price" className="pf-input" type="number" step="0.01" min="0" required value={form.sale_price} onChange={set("sale_price")} placeholder="0" disabled={loading} />
            </div>
            <div>
              <label className="pf-label" htmlFor="pf-min">Stock mínimo *</label>
              <input id="pf-min" className="pf-input" type="number" min="0" required value={form.min_stock} onChange={set("min_stock")} placeholder="0" disabled={loading} />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="pf-label" htmlFor="pf-desc">Descripción</label>
            <textarea id="pf-desc" className="pf-textarea" value={form.description} onChange={set("description")} placeholder="Descripción del producto..." disabled={loading} />
          </div>

          {/* ── Botones ─────────────────────────────────────────────────────── */}
          <div className="pf-btn-row">
            <button type="submit" className="pf-btn-save" disabled={loading}>
              {loading ? (
                <><div className="pf-spinner" />Guardando…</>
              ) : product ? "Actualizar" : "Crear producto"}
            </button>
            <button type="button" className="pf-btn-cancel" onClick={() => router.back()} disabled={loading}>
              Cancelar
            </button>
          </div>

        </form>
      </div>
    </>
  )
}
