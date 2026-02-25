"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import {
  Edit, Search, Package, Eye, EyeOff,
  AlertTriangle, CheckCircle, ChevronDown, Check, X,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { showSuccess, showError } from "@/lib/sweetalert"

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');

.it {
  font-family:'DM Sans',sans-serif;
  --p:      var(--primary,#984ca8);
  --p10:    rgba(var(--primary-rgb,152,76,168),.10);
  --p20:    rgba(var(--primary-rgb,152,76,168),.20);
  --txt:    #1a1a18;
  --muted:  rgba(26,26,24,.45);
  --border: rgba(26,26,24,.08);
  --row:    rgba(26,26,24,.02);
  --ok:     #16a34a;
  --warn:   #d97706;
  --danger: #dc2626;
}

/* ── Toolbar ── */
.it-bar {
  display:flex; flex-direction:column; gap:10px;
  padding:14px 16px; border-bottom:1px solid var(--border);
}
@media(min-width:600px){ .it-bar{ flex-direction:row; align-items:center; justify-content:space-between; } }

/* Búsqueda */
.it-srch-wrap { position:relative; flex:1; max-width:360px; }
.it-srch-ico  { position:absolute; left:11px; top:50%; transform:translateY(-50%); color:var(--muted); pointer-events:none; width:13px; height:13px; }
.it-srch {
  width:100%; height:38px; padding:0 12px 0 36px;
  border:1px solid var(--border); background:#fff;
  font-family:'DM Sans',sans-serif; font-size:13px; color:var(--txt);
  outline:none; -webkit-appearance:none; transition:border-color .14s;
}
.it-srch:focus { border-color:var(--p); }
.it-srch::placeholder { color:var(--muted); }

/* Toggle */
.it-tog {
  display:inline-flex; align-items:center; gap:6px;
  height:38px; padding:0 14px; border:1px solid var(--border); background:#fff;
  cursor:pointer; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:500;
  color:var(--muted); white-space:nowrap; flex-shrink:0;
  transition:border-color .14s, color .14s, background .14s;
}
.it-tog:hover { border-color:var(--p); color:var(--p); }
.it-tog.on    { border-color:var(--p); color:var(--p); background:var(--p10); }
.it-tog svg   { width:13px; height:13px; }

/* ── Tabla ── */
.it-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; }
table.it-tbl { width:100%; border-collapse:collapse; min-width:820px; }
.it-tbl thead tr { border-bottom:2px solid var(--border); background:var(--row); }
.it-tbl th {
  padding:9px 13px; font-size:8px; font-weight:700;
  letter-spacing:.2em; text-transform:uppercase; color:var(--muted);
  text-align:left; white-space:nowrap;
}
.it-tbl th.r { text-align:right; }
.it-tbl th.c { text-align:center; }
.it-tbl tbody tr { border-bottom:1px solid var(--border); transition:background .1s; }
.it-tbl tbody tr:last-child { border-bottom:none; }
.it-tbl tbody tr:hover { background:var(--row); }
.it-tbl tbody tr.dim { opacity:.5; }
.it-tbl td { padding:11px 13px; font-size:12px; color:var(--txt); vertical-align:middle; }
.it-tbl td.r { text-align:right; }
.it-tbl td.c { text-align:center; }
.it-tbl td.mo { font-family:monospace; font-size:11px; color:var(--muted); }
.it-money { font-family:'Cormorant Garamond',Georgia,serif; font-size:14px; font-weight:500; color:var(--p); }

/* Badge estado */
.it-badge { display:inline-flex; align-items:center; gap:4px; padding:2px 9px; font-size:9px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; }
.it-badge svg { width:9px; height:9px; }
.it-badge.ok   { background:rgba(22,163,74,.08);  color:var(--ok); }
.it-badge.low  { background:rgba(217,119,6,.08);  color:var(--warn); }
.it-badge.out  { background:rgba(220,38,38,.08);  color:var(--danger); }

/* Botón editar fila */
.it-btn-edit {
  width:30px; height:30px; border:1px solid var(--border); background:#fff;
  display:flex; align-items:center; justify-content:center; cursor:pointer;
  color:var(--muted); transition:border-color .14s, color .14s, background .14s;
}
.it-btn-edit:hover:not(:disabled) { border-color:var(--p); color:var(--p); background:var(--p10); }
.it-btn-edit:disabled { opacity:.3; cursor:not-allowed; }
.it-btn-edit svg { width:12px; height:12px; }

/* Vacío */
.it-empty { display:flex; flex-direction:column; align-items:center; gap:10px; padding:52px 20px; text-align:center; }
.it-empty-ico { width:44px; height:44px; background:var(--p10); display:flex; align-items:center; justify-content:center; }
.it-empty-ico svg { color:var(--p); opacity:.3; width:18px; height:18px; }
.it-empty-t { font-size:13px; font-weight:500; color:var(--txt); margin:0; }
.it-empty-s { font-size:11px; color:var(--muted); margin:0; }

/* ── Modal edición (sin Radix) ── */
.it-bdrop {
  position:fixed; inset:0; z-index:1000;
  background:rgba(0,0,0,.35); backdrop-filter:blur(3px);
  display:flex; align-items:center; justify-content:center; padding:16px;
}
@keyframes itIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
.it-modal {
  background:#fff; width:100%; max-width:460px;
  animation:itIn .18s ease forwards; position:relative; overflow:hidden;
}
.it-modal::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:var(--p); }
.it-modal-hd {
  padding:16px 18px 13px; border-bottom:1px solid var(--border);
  display:flex; align-items:center; justify-content:space-between;
}
.it-modal-title { font-size:14px; font-weight:600; color:var(--txt); margin:0; display:flex; align-items:center; gap:8px; }
.it-modal-title svg { color:var(--p); width:14px; height:14px; }
.it-modal-close { width:28px; height:28px; border:none; background:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--muted); transition:color .14s; }
.it-modal-close:hover { color:var(--txt); }
.it-modal-body  { padding:18px; display:flex; flex-direction:column; gap:14px; }
.it-modal-product { padding:11px 13px; background:var(--row); border:1px solid var(--border); font-size:13px; font-weight:500; color:var(--txt); }
.it-modal-grid  { display:grid; gap:12px; grid-template-columns:1fr 1fr; }
.it-lbl { display:block; font-size:9px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:var(--muted); margin-bottom:5px; }
.it-inp {
  width:100%; height:40px; padding:0 12px;
  border:1px solid var(--border); background:#fff;
  font-family:'DM Sans',sans-serif; font-size:13px; color:var(--txt);
  outline:none; -webkit-appearance:none; transition:border-color .14s;
}
.it-inp:focus { border-color:var(--p); }
.it-inp:disabled { opacity:.5; }
.it-inp[type=number] { -moz-appearance:textfield; }
.it-inp[type=number]::-webkit-outer-spin-button,
.it-inp[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }

/* CustomSelect */
.it-sel { position:relative; }
.it-sel-btn {
  width:100%; height:40px; padding:0 34px 0 12px;
  border:1px solid var(--border); background:#fff; cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:13px; color:var(--txt);
  display:flex; align-items:center; outline:none;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  transition:border-color .14s;
}
.it-sel-btn.ph { color:var(--muted); }
.it-sel-btn:focus { border-color:var(--p); }
.it-sel-chev { position:absolute; right:11px; top:50%; transform:translateY(-50%); color:var(--muted); pointer-events:none; width:13px; height:13px; transition:transform .14s; }
.it-sel-chev.open { transform:translateY(-50%) rotate(180deg); }
.it-sel-dd {
  position:absolute; top:calc(100% + 3px); left:0; right:0;
  background:#fff; border:1px solid var(--border);
  box-shadow:0 8px 24px rgba(26,26,24,.10); z-index:600;
  max-height:200px; overflow-y:auto;
}
.it-sel-opt {
  padding:9px 12px; font-size:13px; color:var(--txt); cursor:pointer;
  display:flex; align-items:center; justify-content:space-between;
  min-height:38px; transition:background .1s;
}
.it-sel-opt:hover { background:var(--p10); }
.it-sel-opt.sel   { color:var(--p); font-weight:500; }
.it-sel-opt svg   { width:11px; height:11px; }
.it-sel-none { padding:12px; font-size:12px; color:var(--muted); }

.it-modal-foot { padding:13px 18px; border-top:1px solid var(--border); display:flex; gap:8px; justify-content:flex-end; }
.it-btn-cancel {
  height:36px; padding:0 16px; border:1px solid var(--border); background:#fff; cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:12px; color:var(--muted);
  transition:border-color .14s, color .14s;
}
.it-btn-cancel:hover { border-color:var(--txt); color:var(--txt); }
.it-btn-save {
  height:36px; padding:0 20px; border:none; background:var(--p); cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600;
  letter-spacing:.06em; text-transform:uppercase; color:#fff;
  display:flex; align-items:center; gap:6px; transition:opacity .14s;
}
.it-btn-save:hover:not(:disabled) { opacity:.88; }
.it-btn-save:disabled { opacity:.4; cursor:not-allowed; }
.it-spin { width:13px; height:13px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:itSpin .7s linear infinite; flex-shrink:0; }
@keyframes itSpin { to{ transform:rotate(360deg); } }
`

// ── Tipos ─────────────────────────────────────────────────────────────────────
type Batch = {
  id: string; quantity: number; purchase_price: number; purchase_date: string
  remaining_quantity: number
  products: { name: string; barcode: string | null; min_stock: number } | null
  suppliers: { name: string } | null
}
type Sup = { id: string; name: string }

// ── Helpers ───────────────────────────────────────────────────────────────────
const COP = (n: number) =>
  Number(n).toLocaleString("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 })

const FMT = (s: string) => {
  try { return new Date(s).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) }
  catch { return s }
}

// ── CustomSelect — sin Radix, sin IDs dinámicos ───────────────────────────────
function CustomSelect({ value, onChange, options, placeholder, disabled }: {
  value: string; onChange: (v: string) => void
  options: Sup[]; placeholder: string; disabled?: boolean
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
    <div className="it-sel" ref={ref}>
      <button type="button"
        className={`it-sel-btn${!sel ? " ph" : ""}`}
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled} aria-haspopup="listbox" aria-expanded={open}>
        {sel?.name ?? placeholder}
      </button>
      <ChevronDown className={`it-sel-chev${open ? " open" : ""}`} aria-hidden />
      {open && (
        <div className="it-sel-dd" role="listbox">
          {options.length === 0
            ? <div className="it-sel-none">Sin proveedores</div>
            : options.map(o => (
              <div key={o.id}
                className={`it-sel-opt${value === o.id ? " sel" : ""}`}
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

// ── Modal de edición de lote ──────────────────────────────────────────────────
function EditModal({ batch, suppliers, companyId, onClose }: {
  batch: Batch; suppliers: Sup[]; companyId: string; onClose: () => void
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    quantity:       batch.quantity.toString(),
    purchase_price: batch.purchase_price.toString(),
    supplier_id:    (batch.suppliers as any)?.id || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: cur } = await supabase
        .from("purchase_batches").select("remaining_quantity, quantity")
        .eq("id", batch.id).eq("company_id", companyId).single()

      if (!cur || cur.remaining_quantity !== cur.quantity) {
        onClose()
        await new Promise(r => setTimeout(r, 200))
        showError("No se puede editar: ya se vendieron unidades de este lote")
        return
      }
      const qty = parseInt(form.quantity)
      const { error } = await supabase.from("purchase_batches").update({
        quantity: qty,
        purchase_price: parseFloat(form.purchase_price),
        remaining_quantity: qty,
        supplier_id: form.supplier_id || null,
        company_id: companyId,
      }).eq("id", batch.id).eq("company_id", companyId)

      if (error) throw error
      onClose()
      await new Promise(r => setTimeout(r, 200))
      await showSuccess("Lote actualizado")
      router.refresh()
    } catch (err: any) {
      showError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="it-bdrop"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      role="dialog" aria-modal="true">
      <div className="it-modal">
        <div className="it-modal-hd">
          <p className="it-modal-title"><Package aria-hidden />Editar Lote</p>
          <button className="it-modal-close" onClick={onClose} aria-label="Cerrar" disabled={loading}>
            <X size={13} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="it-modal-body">
            <div>
              <span className="it-lbl">Producto</span>
              <div className="it-modal-product">{batch.products?.name}</div>
            </div>
            <div className="it-modal-grid">
              <div>
                <label className="it-lbl" htmlFor="it-qty">Cantidad *</label>
                <input id="it-qty" className="it-inp" type="number" min="1" required
                  value={form.quantity} disabled={loading}
                  onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
              </div>
              <div>
                <label className="it-lbl" htmlFor="it-price">Precio unitario *</label>
                <input id="it-price" className="it-inp" type="number" step="0.01" min="0" required
                  value={form.purchase_price} disabled={loading}
                  onChange={e => setForm(f => ({ ...f, purchase_price: e.target.value }))} />
              </div>
            </div>
            <div>
              <span className="it-lbl">Proveedor</span>
              <CustomSelect
                value={form.supplier_id}
                onChange={v => setForm(f => ({ ...f, supplier_id: v }))}
                options={suppliers} placeholder="Selecciona un proveedor" disabled={loading}
              />
            </div>
          </div>
          <div className="it-modal-foot">
            <button type="button" className="it-btn-cancel" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="it-btn-save" disabled={loading}>
              {loading ? <><div className="it-spin" />Guardando…</> : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Badge de stock ────────────────────────────────────────────────────────────
function StockBadge({ status }: { status: "ok" | "low" | "out" }) {
  const map = {
    ok:  { label: "Disponible", Icon: CheckCircle  },
    low: { label: "Bajo stock", Icon: AlertTriangle },
    out: { label: "Agotado",    Icon: Package       },
  }
  const { label, Icon } = map[status]
  return (
    <span className={`it-badge ${status}`}>
      <Icon aria-hidden />{label}
    </span>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
// companyId viene por PROP desde el Server Component — NO usa useCompany()
export function InventoryTable({ batches, companyId }: { batches: Batch[]; companyId: string }) {
  const [search, setSearch]       = useState("")
  const [showZero, setShowZero]   = useState(false)
  const [suppliers, setSuppliers] = useState<Sup[]>([])
  const [editing, setEditing]     = useState<Batch | null>(null)

  useEffect(() => {
    if (!companyId) return
    createClient().from("suppliers").select("id, name")
      .eq("company_id", companyId).order("name")
      .then(({ data }) => setSuppliers(data || []))
  }, [companyId])

  const filtered = useMemo(() => {
    let r = batches
    if (search.trim()) {
      const q = search.toLowerCase()
      r = r.filter(b =>
        b.products?.name.toLowerCase().includes(q) ||
        b.suppliers?.name.toLowerCase().includes(q)
      )
    }
    if (!showZero) r = r.filter(b => b.remaining_quantity > 0)
    return r
  }, [batches, search, showZero])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="it">

        {/* Toolbar */}
        <div className="it-bar">
          <div className="it-srch-wrap">
            <Search className="it-srch-ico" aria-hidden />
            <input className="it-srch" placeholder="Buscar producto o proveedor…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className={`it-tog${showZero ? " on" : ""}`} onClick={() => setShowZero(v => !v)}>
            {showZero ? <Eye aria-hidden /> : <EyeOff aria-hidden />}
            {showZero ? "Mostrar todos" : "Ocultar agotados"}
          </button>
        </div>

        {/* Tabla */}
        <div className="it-scroll">
          <table className="it-tbl">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Código</th>
                <th>Proveedor</th>
                <th className="r">Cantidad</th>
                <th className="r">Disponible</th>
                <th className="r">Costo unit.</th>
                <th>Fecha compra</th>
                <th className="c">Estado</th>
                <th className="r">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="it-empty">
                      <div className="it-empty-ico"><Package /></div>
                      <p className="it-empty-t">No hay lotes</p>
                      <p className="it-empty-s">Ajusta los filtros o registra una compra</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.map(b => {
                const status = b.remaining_quantity === 0 ? "out"
                  : b.remaining_quantity <= (b.products?.min_stock || 0) ? "low" : "ok"
                const canEdit = b.remaining_quantity === b.quantity
                return (
                  <tr key={b.id} className={b.remaining_quantity === 0 ? "dim" : ""}>
                    <td style={{ fontWeight: 500 }}>{b.products?.name}</td>
                    <td className="mo">{b.products?.barcode || "—"}</td>
                    <td>{b.suppliers?.name || "—"}</td>
                    <td className="r" style={{ fontVariantNumeric: "tabular-nums" }}>{b.quantity}</td>
                    <td className="r" style={{ fontWeight: 700 }}>{b.remaining_quantity}</td>
                    <td className="r"><span className="it-money">{COP(b.purchase_price)}</span></td>
                    <td style={{ fontSize: 11, color: "rgba(26,26,24,.45)" }}>{FMT(b.purchase_date)}</td>
                    <td className="c"><StockBadge status={status} /></td>
                    <td className="r">
                      <button className="it-btn-edit" disabled={!canEdit}
                        onClick={() => setEditing(b)}
                        aria-label={`Editar lote de ${b.products?.name}`}
                        title={!canEdit ? "Ya se vendieron unidades — no editable" : "Editar lote"}>
                        <Edit aria-hidden />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Modal de edición */}
        {editing && (
          <EditModal
            batch={editing}
            suppliers={suppliers}
            companyId={companyId}
            onClose={() => setEditing(null)}
          />
        )}
      </div>
    </>
  )
}
