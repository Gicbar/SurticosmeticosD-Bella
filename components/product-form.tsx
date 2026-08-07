"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { showError, showSuccess } from "@/lib/sweetalert"
import { Upload, X, Package, ChevronDown, Check, Pill } from "lucide-react"
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

/* ── Galería (fotos adicionales) ────────────────────────────────────────── */
.pf-gallery-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-start; }
.pf-gallery-thumb { position: relative; width: 84px; height: 84px; border: 1px solid var(--border); overflow: hidden; flex-shrink: 0; }
.pf-gallery-add {
  width: 84px; height: 84px;
  border: 1.5px dashed var(--border);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 4px; cursor: pointer; flex-shrink: 0;
  transition: border-color .14s;
}
.pf-gallery-add:hover { border-color: var(--p20); }
.pf-gallery-add svg { color: var(--muted); width: 18px; height: 18px; }
.pf-gallery-add span { font-size: 9px; color: var(--muted); letter-spacing: .04em; text-align: center; }
.pf-gallery-add.disabled { opacity: .4; cursor: not-allowed; pointer-events: none; }

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
.pf-section-sub {
  font-size: 9px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase;
  color: var(--muted); margin: 0 0 12px;
}
.pf-sep { height: 1px; background: var(--border); margin: 18px 0; }

/* ── Checkbox (droguería) ──────────────────────────────────────────────────── */
.pf-check-row {
  display: flex; align-items: center; gap: 9px; padding: 9px 12px;
  border: 1.5px solid var(--border); cursor: pointer; transition: border-color .14s, background .14s;
}
.pf-check-row.on { border-color: var(--p); background: var(--p10); }
.pf-check-box {
  width: 17px; height: 17px; flex-shrink: 0; border: 1.5px solid rgba(26,26,24,.2);
  display: flex; align-items: center; justify-content: center; transition: background .14s, border-color .14s;
}
.pf-check-row.on .pf-check-box { background: var(--p); border-color: var(--p); }
.pf-check-box svg { width: 10px; height: 10px; color: #fff; }
.pf-check-txt { font-size: 12px; color: var(--txt); }
.pf-check-grid { display: grid; gap: 8px; grid-template-columns: 1fr; margin-bottom: 16px; }
@media (min-width: 600px) { .pf-check-grid { grid-template-columns: 1fr 1fr; } }
`

// ── Tipos ─────────────────────────────────────────────────────────────────────
type Product = {
  id: string; name: string; description: string | null; barcode: string | null
  category_id: string | null; supplier_id: string | null
  sale_price: number; min_stock: number; image_url: string | null
  // Campos de droguería (scripts/008 y 009) — opcionales, todo producto viejo
  // sigue funcionando sin ellos.
  requiere_receta?: boolean | null
  es_controlado?: boolean | null
  principio_activo?: string | null
  concentracion?: string | null
  forma_farmaceutica?: string | null
  registro_invima?: string | null
  unidad_medida?: string | null
  codigo_cum?: string | null
  clasificacion_atc?: string | null
  via_administracion?: string | null
  laboratorio_titular?: string | null
  vigencia_registro_sanitario?: string | null
  requiere_cadena_frio?: boolean | null
  permite_venta_fraccionada?: boolean | null
  unidades_por_presentacion?: number | null
  es_generico?: boolean | null
  tipo_tributo_iva?: string | null
  comision_porcentaje?: number | null
}
interface ProductFormProps {
  product?: Product
  companyId: string
}
type SelectOpt = { id: string; name: string }
type GalleryImage = { id: string; image_url: string }
type NewGalleryFile = { file: File; preview: string }

const MAX_GALLERY_IMAGES = 6

const FORMA_FARMACEUTICA_OPTS: SelectOpt[] = [
  "Tableta", "Cápsula", "Jarabe", "Suspensión", "Ampolla", "Crema", "Ungüento",
  "Gel", "Solución", "Óvulo", "Supositorio", "Gotas", "Inhalador", "Otro",
].map(v => ({ id: v, name: v }))

const UNIDAD_MEDIDA_OPTS: SelectOpt[] = [
  "unidad", "caja", "blister", "frasco", "tableta", "ampolla", "ml", "mg",
].map(v => ({ id: v, name: v }))

const TRIBUTO_IVA_OPTS: SelectOpt[] = [
  { id: "excluido",   name: "Excluido de IVA" },
  { id: "exento",     name: "Exento de IVA" },
  { id: "gravado_5",  name: "Gravado 5%" },
  { id: "gravado_19", name: "Gravado 19%" },
]

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

// ── CheckboxRow — checkbox visual consistente con el resto del form ───────────
function CheckboxRow({ checked, onChange, label, disabled }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean
}) {
  return (
    <div
      role="checkbox" aria-checked={checked} tabIndex={0}
      className={`pf-check-row${checked ? " on" : ""}`}
      onClick={() => !disabled && onChange(!checked)}
      onKeyDown={e => { if ((e.key === " " || e.key === "Enter") && !disabled) onChange(!checked) }}
    >
      <div className="pf-check-box">{checked && <Check aria-hidden />}</div>
      <span className="pf-check-txt">{label}</span>
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
  const [existingGallery, setExistingGallery]   = useState<GalleryImage[]>([])
  const [removedGalleryIds, setRemovedGalleryIds] = useState<string[]>([])
  const [newGalleryFiles, setNewGalleryFiles]   = useState<NewGalleryFile[]>([])
  const [tipoNegocio, setTipoNegocio]   = useState<string>("general")
  const isDrogueria = tipoNegocio === "drogueria"

  const [form, setForm] = useState({
    name:        product?.name || "",
    description: product?.description || "",
    barcode:     product?.barcode || "",
    category_id: product?.category_id || "",
    supplier_id: product?.supplier_id || "",
    sale_price:  product?.sale_price?.toString() || "",
    min_stock:   product?.min_stock?.toString() || "0",
    // Droguería — regulatorio
    requiere_receta:              product?.requiere_receta ?? false,
    es_controlado:                product?.es_controlado ?? false,
    principio_activo:             product?.principio_activo || "",
    concentracion:                product?.concentracion || "",
    forma_farmaceutica:           product?.forma_farmaceutica || "",
    registro_invima:              product?.registro_invima || "",
    codigo_cum:                   product?.codigo_cum || "",
    clasificacion_atc:            product?.clasificacion_atc || "",
    via_administracion:           product?.via_administracion || "",
    laboratorio_titular:          product?.laboratorio_titular || "",
    vigencia_registro_sanitario:  product?.vigencia_registro_sanitario || "",
    requiere_cadena_frio:         product?.requiere_cadena_frio ?? false,
    // Droguería — presentación y venta
    permite_venta_fraccionada:    product?.permite_venta_fraccionada ?? false,
    unidades_por_presentacion:    product?.unidades_por_presentacion?.toString() || "1",
    unidad_medida:                product?.unidad_medida || "unidad",
    es_generico:                  product?.es_generico ?? false,
    // Tributación y comisión (aplican a cualquier vertical, no solo droguería)
    tipo_tributo_iva:             product?.tipo_tributo_iva || "excluido",
    comision_porcentaje:          product?.comision_porcentaje?.toString() || "0",
  })

  useEffect(() => {
    ;(async () => {
      const supabase = createClient()
      const [{ data: cats }, { data: sups }, { data: company }] = await Promise.all([
        supabase.from("categories").select("id, name").eq("company_id", companyId).order("name"),
        supabase.from("suppliers").select("id, name").eq("company_id", companyId).order("name"),
        supabase.from("companies").select("tipo_negocio").eq("id", companyId).single(),
      ])
      setCategories(cats || [])
      setSuppliers(sups || [])
      if (company?.tipo_negocio) setTipoNegocio(company.tipo_negocio)

      if (product?.id) {
        const { data: gallery } = await supabase
          .from("product_images").select("id, image_url")
          .eq("product_id", product.id).order("sort_order")
        setExistingGallery(gallery || [])
      }
    })()
  }, [companyId, product?.id])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const galleryCount = existingGallery.length + newGalleryFiles.length

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ""
    if (!files.length) return
    const available = MAX_GALLERY_IMAGES - galleryCount
    if (available <= 0) {
      showError(`Máximo ${MAX_GALLERY_IMAGES} fotos adicionales`)
      return
    }
    const toAdd = files.slice(0, available)
    toAdd.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setNewGalleryFiles(prev => [...prev, { file, preview: reader.result as string }])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeExistingGalleryImage = (id: string) => {
    setExistingGallery(prev => prev.filter(g => g.id !== id))
    setRemovedGalleryIds(prev => [...prev, id])
  }

  const removeNewGalleryFile = (index: number) => {
    setNewGalleryFiles(prev => prev.filter((_, i) => i !== index))
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
        const path = `products/${companyId}/${Math.random().toString(36).slice(2)}-${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from("product-images").upload(path, imageFile)
        if (upErr) throw new Error("Error al subir imagen: " + upErr.message)
        imageUrl = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl
      } else if (!imagePreview && product?.image_url) {
        // el usuario eliminó la imagen
        imageUrl = null
      }

      const data: Record<string, unknown> = {
        name:        form.name,
        description: form.description || null,
        barcode:     form.barcode || null,
        category_id: form.category_id || null,
        supplier_id: form.supplier_id || null,
        sale_price:  parseFloat(form.sale_price),
        min_stock:   parseInt(form.min_stock),
        image_url:   imageUrl,
        company_id:  companyId,
        // Tributación y comisión — aplican siempre, con default seguro
        tipo_tributo_iva:    form.tipo_tributo_iva,
        comision_porcentaje: parseFloat(form.comision_porcentaje) || 0,
      }

      // Campos regulatorios de droguería — solo se envían si el formulario
      // los muestra, para no pisar con "" el dato de otra empresa/vertical.
      if (isDrogueria) {
        Object.assign(data, {
          requiere_receta:             form.requiere_receta,
          es_controlado:               form.es_controlado,
          principio_activo:            form.principio_activo || null,
          concentracion:               form.concentracion || null,
          forma_farmaceutica:          form.forma_farmaceutica || null,
          registro_invima:             form.registro_invima || null,
          codigo_cum:                  form.codigo_cum || null,
          clasificacion_atc:           form.clasificacion_atc || null,
          via_administracion:          form.via_administracion || null,
          laboratorio_titular:         form.laboratorio_titular || null,
          vigencia_registro_sanitario: form.vigencia_registro_sanitario || null,
          requiere_cadena_frio:        form.requiere_cadena_frio,
          permite_venta_fraccionada:   form.permite_venta_fraccionada,
          unidades_por_presentacion:   parseInt(form.unidades_por_presentacion) || 1,
          unidad_medida:               form.unidad_medida || "unidad",
          es_generico:                 form.es_generico,
        })
      }

      const { data: savedProduct, error } = product
        ? await supabase.from("products").update(data).eq("id", product.id).eq("company_id", companyId).select("id").single()
        : await supabase.from("products").insert(data).select("id").single()

      if (error) throw new Error(error.message)
      const productId = savedProduct.id

      // Galería de fotos adicionales
      if (removedGalleryIds.length) {
        const { error: delErr } = await supabase.from("product_images").delete().in("id", removedGalleryIds)
        if (delErr) throw new Error("Error al eliminar fotos de la galería: " + delErr.message)
      }
      if (newGalleryFiles.length) {
        const uploaded: { product_id: string; company_id: string; image_url: string; sort_order: number }[] = []
        let sortOrder = existingGallery.length
        for (const { file } of newGalleryFiles) {
          const ext = file.name.split(".").pop()
          const path = `products/${companyId}/gallery/${Math.random().toString(36).slice(2)}-${Date.now()}.${ext}`
          const { error: upErr } = await supabase.storage.from("product-images").upload(path, file)
          if (upErr) throw new Error("Error al subir foto de galería: " + upErr.message)
          const url = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl
          uploaded.push({ product_id: productId, company_id: companyId, image_url: url, sort_order: sortOrder++ })
        }
        const { error: insErr } = await supabase.from("product_images").insert(uploaded)
        if (insErr) throw new Error("Error al guardar la galería: " + insErr.message)
      }

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

          {/* ── Fotos adicionales (galería) ───────────────────────────────────── */}
          <div style={{ marginBottom: 20 }}>
            <span className="pf-label">Fotos adicionales ({galleryCount}/{MAX_GALLERY_IMAGES})</span>
            <div className="pf-gallery-row">
              {existingGallery.map(g => (
                <div key={g.id} className="pf-gallery-thumb">
                  <Image src={g.image_url} alt="Foto de galería" fill style={{ objectFit: "cover" }} />
                  <button type="button" className="pf-img-remove" onClick={() => removeExistingGalleryImage(g.id)} aria-label="Eliminar foto">
                    <X aria-hidden />
                  </button>
                </div>
              ))}
              {newGalleryFiles.map((g, i) => (
                <div key={i} className="pf-gallery-thumb">
                  <Image src={g.preview} alt="Foto de galería" fill style={{ objectFit: "cover" }} />
                  <button type="button" className="pf-img-remove" onClick={() => removeNewGalleryFile(i)} aria-label="Eliminar foto">
                    <X aria-hidden />
                  </button>
                </div>
              ))}
              <label className={`pf-gallery-add${galleryCount >= MAX_GALLERY_IMAGES ? " disabled" : ""}`} aria-label="Agregar fotos">
                <Upload aria-hidden />
                <span>Agregar</span>
                <input
                  type="file" accept="image/*" multiple
                  onChange={handleGalleryChange}
                  disabled={galleryCount >= MAX_GALLERY_IMAGES}
                  className="sr-only" style={{ display: "none" }}
                />
              </label>
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

          {/* ── Tributación y comisión (toda vertical) ──────────────────────── */}
          <div className="pf-sep" aria-hidden />
          <div className="pf-grid" style={{ marginBottom: 4 }}>
            <div>
              <label className="pf-label">IVA</label>
              <CustomSelect
                value={form.tipo_tributo_iva}
                onChange={v => setForm(f => ({ ...f, tipo_tributo_iva: v }))}
                options={TRIBUTO_IVA_OPTS}
                placeholder="Selecciona tributación"
                disabled={loading}
              />
            </div>
            <div>
              <label className="pf-label" htmlFor="pf-comision">Comisión vendedor (%)</label>
              <input id="pf-comision" className="pf-input" type="number" step="0.01" min="0" max="100"
                value={form.comision_porcentaje} onChange={set("comision_porcentaje")} placeholder="0" disabled={loading} />
            </div>
          </div>

          {/* ── Droguería: clasificación regulatoria y presentación ─────────── */}
          {isDrogueria && (
            <>
              <div className="pf-sep" aria-hidden />
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <div className="pf-section-ico" aria-hidden><Pill /></div>
                <p className="pf-section-title">Información regulatoria (droguería)</p>
              </div>

              <p className="pf-section-sub">Identificación INVIMA</p>
              <div className="pf-grid" style={{ marginBottom: 16 }}>
                <div>
                  <label className="pf-label" htmlFor="pf-cum">Código CUM</label>
                  <input id="pf-cum" className="pf-input" value={form.codigo_cum} onChange={set("codigo_cum")} placeholder="Código único de medicamento" disabled={loading} />
                </div>
                <div>
                  <label className="pf-label" htmlFor="pf-invima">Registro sanitario INVIMA</label>
                  <input id="pf-invima" className="pf-input" value={form.registro_invima} onChange={set("registro_invima")} placeholder="Ej: INVIMA 2024M-0001234" disabled={loading} />
                </div>
                <div>
                  <label className="pf-label" htmlFor="pf-vig-invima">Vigencia registro sanitario</label>
                  <input id="pf-vig-invima" className="pf-input" type="date" value={form.vigencia_registro_sanitario} onChange={set("vigencia_registro_sanitario")} disabled={loading} />
                </div>
                <div>
                  <label className="pf-label" htmlFor="pf-lab">Laboratorio titular</label>
                  <input id="pf-lab" className="pf-input" value={form.laboratorio_titular} onChange={set("laboratorio_titular")} placeholder="Ej: Laboratorios XYZ" disabled={loading} />
                </div>
              </div>

              <p className="pf-section-sub">Composición y vía</p>
              <div className="pf-grid" style={{ marginBottom: 16 }}>
                <div>
                  <label className="pf-label" htmlFor="pf-principio">Principio activo</label>
                  <input id="pf-principio" className="pf-input" value={form.principio_activo} onChange={set("principio_activo")} placeholder="Ej: Acetaminofén" disabled={loading} />
                </div>
                <div>
                  <label className="pf-label" htmlFor="pf-conc">Concentración</label>
                  <input id="pf-conc" className="pf-input" value={form.concentracion} onChange={set("concentracion")} placeholder="Ej: 500mg" disabled={loading} />
                </div>
                <div>
                  <label className="pf-label">Forma farmacéutica</label>
                  <CustomSelect
                    value={form.forma_farmaceutica}
                    onChange={v => setForm(f => ({ ...f, forma_farmaceutica: v }))}
                    options={FORMA_FARMACEUTICA_OPTS}
                    placeholder="Selecciona una forma"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="pf-label" htmlFor="pf-via">Vía de administración</label>
                  <input id="pf-via" className="pf-input" value={form.via_administracion} onChange={set("via_administracion")} placeholder="Ej: Oral, tópica, inyectable" disabled={loading} />
                </div>
                <div>
                  <label className="pf-label" htmlFor="pf-atc">Clasificación ATC</label>
                  <input id="pf-atc" className="pf-input" value={form.clasificacion_atc} onChange={set("clasificacion_atc")} placeholder="Código ATC (OMS)" disabled={loading} />
                </div>
              </div>

              <p className="pf-section-sub">Presentación y venta</p>
              <div className="pf-grid" style={{ marginBottom: 16 }}>
                <div>
                  <label className="pf-label">Unidad de medida</label>
                  <CustomSelect
                    value={form.unidad_medida}
                    onChange={v => setForm(f => ({ ...f, unidad_medida: v }))}
                    options={UNIDAD_MEDIDA_OPTS}
                    placeholder="Selecciona unidad"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="pf-label" htmlFor="pf-unidades-pres">Unidades por presentación</label>
                  <input id="pf-unidades-pres" className="pf-input" type="number" min="1"
                    value={form.unidades_por_presentacion} onChange={set("unidades_por_presentacion")} placeholder="1" disabled={loading} />
                </div>
              </div>

              <div className="pf-check-grid">
                <CheckboxRow checked={form.requiere_receta} onChange={v => setForm(f => ({ ...f, requiere_receta: v }))} label="Requiere fórmula médica" disabled={loading} />
                <CheckboxRow checked={form.es_controlado} onChange={v => setForm(f => ({ ...f, es_controlado: v }))} label="Sustancia de control especial" disabled={loading} />
                <CheckboxRow checked={form.requiere_cadena_frio} onChange={v => setForm(f => ({ ...f, requiere_cadena_frio: v }))} label="Requiere cadena de frío" disabled={loading} />
                <CheckboxRow checked={form.permite_venta_fraccionada} onChange={v => setForm(f => ({ ...f, permite_venta_fraccionada: v }))} label="Permite venta fraccionada (unidad suelta)" disabled={loading} />
                <CheckboxRow checked={form.es_generico} onChange={v => setForm(f => ({ ...f, es_generico: v }))} label="Es un producto genérico" disabled={loading} />
              </div>
            </>
          )}

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
