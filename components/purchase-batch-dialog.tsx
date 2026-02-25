"use client"

import type React from "react"
import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { showError, showSuccess } from "@/lib/sweetalert"
import { Package, Truck, DollarSign, Hash, Search, Barcode, X, ChevronDown, Check, Plus } from "lucide-react"

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

.pb-bdrop {
  position:fixed; inset:0; z-index:1000;
  background:rgba(0,0,0,.35); backdrop-filter:blur(3px);
  display:flex; align-items:center; justify-content:center; padding:16px;
}
@keyframes pbIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
.pb-modal {
  background:#fff; width:100%; max-width:560px;
  max-height:92vh; overflow-y:auto; -webkit-overflow-scrolling:touch;
  font-family:'DM Sans',sans-serif;
  animation:pbIn .2s ease forwards; position:relative;
}
.pb-modal::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:var(--primary,#984ca8); z-index:1; }

.pb-hd {
  position:sticky; top:0; background:#fff; z-index:2;
  padding:16px 18px 13px; border-bottom:1px solid rgba(26,26,24,.08);
  display:flex; align-items:center; justify-content:space-between;
}
.pb-title { font-size:14px; font-weight:600; color:#1a1a18; margin:0; display:flex; align-items:center; gap:8px; }
.pb-title svg { color:var(--primary,#984ca8); width:14px; height:14px; }
.pb-close { width:28px; height:28px; border:none; background:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:rgba(26,26,24,.4); transition:color .14s; }
.pb-close:hover { color:#1a1a18; }

.pb-body { padding:18px; display:flex; flex-direction:column; gap:16px; }

/* Lbl */
.pb-lbl { display:block; font-size:9px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:rgba(26,26,24,.45); margin-bottom:5px; }

/* Input */
.pb-inp {
  width:100%; height:42px; padding:0 13px;
  border:1px solid rgba(26,26,24,.08); background:#fff;
  font-family:'DM Sans',sans-serif; font-size:13px; color:#1a1a18;
  outline:none; -webkit-appearance:none; transition:border-color .14s;
}
.pb-inp:focus { border-color:var(--primary,#984ca8); }
.pb-inp:disabled { opacity:.5; }
.pb-inp[type=number] { -moz-appearance:textfield; }
.pb-inp[type=number]::-webkit-outer-spin-button,
.pb-inp[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
.pb-inp-ico { position:relative; }
.pb-inp-ico .pb-inp { padding-left:36px; }
.pb-inp-ico svg { position:absolute; left:11px; top:50%; transform:translateY(-50%); color:rgba(26,26,24,.35); pointer-events:none; width:14px; height:14px; }

/* Grid 2 cols */
.pb-g2 { display:grid; gap:12px; grid-template-columns:1fr 1fr; }
@media(max-width:480px){ .pb-g2{ grid-template-columns:1fr; } }

/* Búsqueda de producto */
.pb-srch-wrap { position:relative; }
.pb-srch-ico  { position:absolute; left:11px; top:50%; transform:translateY(-50%); color:rgba(26,26,24,.35); pointer-events:none; width:14px; height:14px; }
.pb-srch { width:100%; height:42px; padding:0 13px 0 38px; border:1px solid rgba(26,26,24,.08); background:#fff; font-family:'DM Sans',sans-serif; font-size:13px; color:#1a1a18; outline:none; -webkit-appearance:none; transition:border-color .14s; }
.pb-srch:focus { border-color:var(--primary,#984ca8); }
.pb-srch::placeholder { color:rgba(26,26,24,.4); }

/* Dropdown sugerencias */
.pb-sugg { border:1px solid rgba(26,26,24,.08); background:#fff; box-shadow:0 8px 20px rgba(26,26,24,.08); max-height:210px; overflow-y:auto; margin-top:3px; }
.pb-sugg-item {
  display:flex; align-items:center; justify-content:space-between;
  padding:10px 13px; font-size:13px; color:#1a1a18; cursor:pointer;
  min-height:42px; transition:background .1s;
}
.pb-sugg-item:hover { background:rgba(var(--primary-rgb,152,76,168),.08); }
.pb-sugg-code { font-family:monospace; font-size:11px; color:rgba(26,26,24,.4); }

/* Producto seleccionado */
.pb-prod-sel {
  padding:12px 13px; background:rgba(26,26,24,.02); border:1px solid rgba(26,26,24,.08);
  display:flex; align-items:flex-start; justify-content:space-between; gap:8px;
}
.pb-prod-name { font-size:13px; font-weight:500; color:#1a1a18; margin:0; }
.pb-prod-code { font-size:10px; font-family:monospace; color:rgba(26,26,24,.4); margin:2px 0 0; display:flex; align-items:center; gap:4px; }
.pb-prod-clear { width:22px; height:22px; border:none; background:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:rgba(26,26,24,.35); flex-shrink:0; transition:color .14s; }
.pb-prod-clear:hover { color:#dc2626; }
.pb-prod-clear svg { width:12px; height:12px; }

/* CustomSelect inline */
.pb-sel { position:relative; }
.pb-sel-btn {
  width:100%; height:42px; padding:0 36px 0 13px;
  border:1px solid rgba(26,26,24,.08); background:#fff; cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:13px; color:#1a1a18;
  display:flex; align-items:center; outline:none;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  transition:border-color .14s;
}
.pb-sel-btn.ph { color:rgba(26,26,24,.4); }
.pb-sel-chev { position:absolute; right:11px; top:50%; transform:translateY(-50%); color:rgba(26,26,24,.4); pointer-events:none; width:13px; height:13px; transition:transform .14s; }
.pb-sel-chev.open { transform:translateY(-50%) rotate(180deg); }
.pb-sel-dd {
  position:absolute; top:calc(100% + 3px); left:0; right:0;
  background:#fff; border:1px solid rgba(26,26,24,.08);
  box-shadow:0 8px 24px rgba(26,26,24,.10); z-index:700;
  max-height:200px; overflow-y:auto;
}
.pb-sel-opt {
  padding:10px 13px; font-size:13px; color:#1a1a18; cursor:pointer;
  display:flex; align-items:center; justify-content:space-between; min-height:40px;
  transition:background .1s;
}
.pb-sel-opt:hover { background:rgba(var(--primary-rgb,152,76,168),.08); }
.pb-sel-opt.s  { color:var(--primary,#984ca8); font-weight:500; }
.pb-sel-opt svg { width:11px; height:11px; }
.pb-sel-none { padding:12px 13px; font-size:12px; color:rgba(26,26,24,.4); }

/* Footer */
.pb-foot { padding:13px 18px; border-top:1px solid rgba(26,26,24,.08); display:flex; gap:8px; justify-content:flex-end; position:sticky; bottom:0; background:#fff; z-index:2; }
.pb-btn-cancel {
  height:38px; padding:0 16px; border:1px solid rgba(26,26,24,.08); background:#fff; cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:12px; color:rgba(26,26,24,.5);
  transition:border-color .14s, color .14s;
}
.pb-btn-cancel:hover { border-color:#1a1a18; color:#1a1a18; }
.pb-btn-save {
  height:38px; padding:0 22px; border:none; background:var(--primary,#984ca8); cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600;
  letter-spacing:.06em; text-transform:uppercase; color:#fff;
  display:flex; align-items:center; gap:6px; transition:opacity .14s;
}
.pb-btn-save:hover:not(:disabled) { opacity:.88; }
.pb-btn-save:disabled { opacity:.4; cursor:not-allowed; }
.pb-spin { width:13px; height:13px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:pbSpin .7s linear infinite; flex-shrink:0; }
@keyframes pbSpin { to{ transform:rotate(360deg); } }
`

type Product  = { id: string; name: string; barcode: string | null }
type Supplier = { id: string; name: string }

// ── CustomSelect genérico ────────────────────────────────────────────────────
function CustomSelect({ value, onChange, options, placeholder, disabled }: {
  value: string; onChange: (v: string) => void
  options: Supplier[]; placeholder: string; disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const id = setTimeout(() => document.addEventListener("mousedown", h), 10)
    return () => { clearTimeout(id); document.removeEventListener("mousedown", h) }
  }, [open])

  const sel = options.find(o => o.id === value)
  return (
    <div className="pb-sel" ref={ref}>
      <button type="button"
        className={`pb-sel-btn${!sel ? " ph" : ""}`}
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled} aria-haspopup="listbox" aria-expanded={open}>
        {sel?.name ?? placeholder}
      </button>
      <ChevronDown className={`pb-sel-chev${open ? " open" : ""}`} aria-hidden />
      {open && (
        <div className="pb-sel-dd" role="listbox">
          {options.length === 0
            ? <div className="pb-sel-none">Sin proveedores registrados</div>
            : options.map(o => (
              <div key={o.id}
                className={`pb-sel-opt${value === o.id ? " s" : ""}`}
                role="option" aria-selected={value === o.id}
                onClick={() => { onChange(o.id); setOpen(false) }}>
                {o.name}{value === o.id && <Check aria-hidden />}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

// ── PurchaseBatchDialog ───────────────────────────────────────────────────────
export function PurchaseBatchDialog({
  children,
  companyId,
}: {
  children: React.ReactNode
  companyId: string
}) {
  const router = useRouter()
  const [open, setOpen]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [products, setProducts]   = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [search, setSearch]       = useState("")
  const [form, setForm]           = useState({
    product_id: "", quantity: "", purchase_price: "", supplier_id: "",
  })

  // Cargar datos filtrados por empresa
  useEffect(() => {
    if (!open) return
    ;(async () => {
      const supabase = createClient()
      const [{ data: prods }, { data: sups }] = await Promise.all([
        supabase.from("products").select("id, name, barcode").eq("company_id", companyId).order("name"),
        supabase.from("suppliers").select("id, name").eq("company_id", companyId).order("name"),
      ])
      setProducts(prods || [])
      setSuppliers(sups || [])
    })()
  }, [open, companyId])

  const suggestions = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.toLowerCase().includes(q))
    ).slice(0, 10)
  }, [search, products])

  const selectedProduct = products.find(p => p.id === form.product_id)

  const resetForm = () => {
    setForm({ product_id: "", quantity: "", purchase_price: "", supplier_id: "" })
    setSearch("")
  }

  const closeModal = () => { setOpen(false); resetForm() }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.product_id || !form.quantity || !form.purchase_price) {
      showError("Completa todos los campos requeridos")
      return
    }
    setLoading(true)
    try {
      const { error } = await createClient().from("purchase_batches").insert({
        product_id:         form.product_id,
        quantity:           parseInt(form.quantity),
        purchase_price:     parseFloat(form.purchase_price),
        remaining_quantity: parseInt(form.quantity),
        supplier_id:        form.supplier_id || null,
        company_id:         companyId,
      })
      if (error) throw error
      closeModal()
      await new Promise(r => setTimeout(r, 150))
      await showSuccess("Compra registrada correctamente")
      router.refresh()
    } catch (err: any) {
      showError(err.message || "Error al registrar la compra")
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = !!form.product_id && !!form.quantity && !!form.purchase_price

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Trigger */}
      <span onClick={() => setOpen(true)} style={{ cursor: "pointer", display: "contents" }}>
        {children}
      </span>

      {/* Modal */}
      {open && (
        <div className="pb-bdrop"
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}
          role="dialog" aria-modal="true" aria-label="Nueva compra de inventario">
          <div className="pb-modal">
            <div className="pb-hd">
              <p className="pb-title">
                <Package aria-hidden />
                {selectedProduct ? `Nueva compra · ${selectedProduct.name}` : "Nueva compra de inventario"}
              </p>
              <button className="pb-close" onClick={closeModal} aria-label="Cerrar" disabled={loading}>
                <X size={13} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="pb-body">

                {/* Búsqueda de producto */}
                <div>
                  <span className="pb-lbl">Buscar producto *</span>
                  <div className="pb-srch-wrap">
                    <Search className="pb-srch-ico" aria-hidden />
                    <input
                      className="pb-srch"
                      placeholder="Nombre o código de barras…"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      disabled={loading || !!selectedProduct}
                    />
                  </div>
                  {suggestions.length > 0 && !selectedProduct && (
                    <div className="pb-sugg">
                      {suggestions.map(p => (
                        <div key={p.id} className="pb-sugg-item"
                          onClick={() => { setForm(f => ({ ...f, product_id: p.id })); setSearch("") }}>
                          <span>{p.name}</span>
                          {p.barcode && <span className="pb-sugg-code">{p.barcode}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Producto seleccionado */}
                <div>
                  <span className="pb-lbl">Producto seleccionado *</span>
                  {selectedProduct ? (
                    <div className="pb-prod-sel">
                      <div>
                        <p className="pb-prod-name">{selectedProduct.name}</p>
                        {selectedProduct.barcode && (
                          <p className="pb-prod-code"><Barcode size={10} aria-hidden />{selectedProduct.barcode}</p>
                        )}
                      </div>
                      <button type="button" className="pb-prod-clear"
                        onClick={() => setForm(f => ({ ...f, product_id: "" }))}
                        aria-label="Quitar selección" disabled={loading}>
                        <X aria-hidden />
                      </button>
                    </div>
                  ) : (
                    <p style={{ fontSize: 12, color: "rgba(26,26,24,.4)", margin: 0, padding: "10px 0" }}>
                      Busca y selecciona un producto arriba
                    </p>
                  )}
                </div>

                {/* Proveedor */}
                <div>
                  <span className="pb-lbl">Proveedor</span>
                  <CustomSelect
                    value={form.supplier_id}
                    onChange={v => setForm(f => ({ ...f, supplier_id: v }))}
                    options={suppliers}
                    placeholder="Selecciona un proveedor"
                    disabled={loading}
                  />
                </div>

                {/* Cantidad y precio */}
                <div className="pb-g2">
                  <div>
                    <label className="pb-lbl" htmlFor="pb-qty">Cantidad *</label>
                    <div className="pb-inp-ico">
                      <Hash aria-hidden />
                      <input id="pb-qty" className="pb-inp" type="number" min="1" required
                        placeholder="0" value={form.quantity} disabled={loading}
                        onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="pb-lbl" htmlFor="pb-price">Precio unitario *</label>
                    <div className="pb-inp-ico">
                      <DollarSign aria-hidden />
                      <input id="pb-price" className="pb-inp" type="number" step="0.01" min="0" required
                        placeholder="0.00" value={form.purchase_price} disabled={loading}
                        onChange={e => setForm(f => ({ ...f, purchase_price: e.target.value }))} />
                    </div>
                  </div>
                </div>

              </div>

              <div className="pb-foot">
                <button type="button" className="pb-btn-cancel" onClick={closeModal} disabled={loading}>
                  Cancelar
                </button>
                <button type="submit" className="pb-btn-save" disabled={loading || !canSubmit}>
                  {loading ? <><div className="pb-spin" />Guardando…</> : "Registrar compra"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
