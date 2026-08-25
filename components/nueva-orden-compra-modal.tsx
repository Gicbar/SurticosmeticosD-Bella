"use client"
import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { showError, showSuccess } from "@/lib/sweetalert"
import { FileText, X, ChevronDown, Check } from "lucide-react"

// Estilos propios del modal (extraído de ordenes-compra-interface.tsx) para que
// funcione de forma autónoma sin importar desde qué pantalla se monte — las
// variables --oc-* quedan declaradas en .oc-bdrop (raíz del propio modal) en
// vez de heredarlas de .oc-root, que puede no estar presente (ej. Reposición).
const MODAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  .oc-bdrop {
    position:fixed; inset:0; z-index:1000; background:rgba(0,0,0,.35); backdrop-filter:blur(3px);
    display:flex; align-items:center; justify-content:center; padding:16px;
    font-family: 'DM Sans', sans-serif;
    --oc-p:      var(--primary, #984ca8);
    --oc-p10:    rgba(var(--primary-rgb,152,76,168), 0.10);
    --oc-txt:    #1a1a18;
    --oc-muted:  rgba(26,26,24,0.45);
    --oc-border: rgba(26,26,24,0.08);
  }
  .oc-modal { background:#fff; width:100%; max-width:640px; max-height:92vh; overflow-y:auto; font-family:'DM Sans',sans-serif; position:relative; }
  .oc-modal::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:var(--oc-p); }
  .oc-modal-hd { position:sticky; top:0; background:#fff; z-index:2; padding:16px 18px 13px; border-bottom:1px solid var(--oc-border); display:flex; align-items:center; justify-content:space-between; }
  .oc-modal-title { font-size:14px; font-weight:600; color:var(--oc-txt); margin:0; display:flex; align-items:center; gap:8px; }
  .oc-modal-title svg { color: var(--oc-p); width: 14px; height: 14px; }
  .oc-close { width:28px; height:28px; border:none; background:none; cursor:pointer; color:rgba(26,26,24,.4); }
  .oc-modal-body { padding:18px; display:flex; flex-direction:column; gap:14px; }
  .oc-lbl { display:block; font-size:9px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:var(--oc-muted); margin-bottom:5px; }
  .oc-inp, .oc-textarea { width:100%; height:42px; padding:0 13px; border:1px solid var(--oc-border); font-family:'DM Sans',sans-serif; font-size:13px; outline:none; }
  .oc-textarea { height: auto; min-height: 70px; padding: 11px 13px; resize: vertical; }
  .oc-g2 { display:grid; gap:12px; grid-template-columns:1fr 1fr; }
  @media(max-width:480px) { .oc-g2 { grid-template-columns:1fr; } }
  .oc-sel-wrap { position:relative; }
  .oc-sel-btn { width:100%; height:42px; padding:0 36px 0 13px; border:1px solid var(--oc-border); background:#fff; cursor:pointer; font-size:13px; display:flex; align-items:center; }
  .oc-sel-dd { position:absolute; top:calc(100% + 3px); left:0; right:0; background:#fff; border:1px solid var(--oc-border); box-shadow:0 8px 24px rgba(26,26,24,.10); z-index:700; max-height:200px; overflow-y:auto; }
  .oc-sel-opt { padding:10px 13px; font-size:13px; cursor:pointer; display:flex; align-items:center; justify-content:space-between; }
  .oc-sel-opt:hover { background: var(--oc-p10); }
  .oc-srch-wrap { position: relative; }
  .oc-sugg { border:1px solid var(--oc-border); background:#fff; box-shadow:0 8px 20px rgba(26,26,24,.08); max-height:180px; overflow-y:auto; margin-top:3px; }
  .oc-sugg-item { padding:9px 13px; font-size:13px; cursor:pointer; }
  .oc-sugg-item:hover { background: var(--oc-p10); }
  .oc-line-item { display:flex; align-items:center; gap:8px; padding:9px 0; border-bottom:1px solid var(--oc-border); }
  .oc-line-item:last-child { border-bottom:none; }
  .oc-line-name { flex:1; font-size:12px; }
  .oc-line-inp { width:76px; height:34px; padding:0 8px; border:1px solid var(--oc-border); font-size:12px; }
  .oc-line-remove { width:26px; height:26px; border:none; background:none; cursor:pointer; color:rgba(26,26,24,.35); }
  .oc-line-remove:hover { color:#dc2626; }
  .oc-modal-foot { padding:13px 18px; border-top:1px solid var(--oc-border); display:flex; gap:8px; justify-content:flex-end; position:sticky; bottom:0; background:#fff; }
  .oc-btn-cancel { height:38px; padding:0 16px; border:1px solid var(--oc-border); background:#fff; cursor:pointer; font-size:12px; color:var(--oc-muted); }
  .oc-btn-save { height:38px; padding:0 22px; border:none; background:var(--oc-p); color:#fff; cursor:pointer; font-size:12px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; display:flex; align-items:center; gap:6px; }
  .oc-btn-save:disabled { opacity:.4; cursor:not-allowed; }
  .oc-spin { width:13px; height:13px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:oc-modal-spin .7s linear infinite; }
  @keyframes oc-modal-spin { to { transform: rotate(360deg); } }
`

type Supplier = { id: string; name: string }
type Product  = { id: string; name: string; supplier_id: string | null }
type Line     = { product_id: string; name: string; cantidad: string }

/** Fecha de hoy en hora Colombia (UTC-5), como "YYYY-MM-DD" para el input date. */
const hoyColombia = () => new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10)

// ── Modal: nueva solicitud de compra ───────────────────────────────────────────
// Extraído de ordenes-compra-interface.tsx para poder reutilizarlo desde la
// pestaña Reposición (botón "Crear solicitud" precargado con lo que sugiere
// el análisis de ventas — ver ReportsDashboard.tsx).
export function NuevaOrdenCompraModal({ companyId, initialSupplierId, initialLines, onClose, onSaved }: {
  companyId: string
  initialSupplierId?: string
  initialLines?: Line[]
  onClose: () => void
  onSaved: () => void
}) {
  const [loading, setLoading]     = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts]   = useState<Product[]>([])
  const [supplierId, setSupplierId] = useState(initialSupplierId ?? "")
  const [supplierOpen, setSupplierOpen] = useState(false)
  const [fechaEsperada, setFechaEsperada] = useState(hoyColombia())
  const [notas, setNotas] = useState("")
  const [search, setSearch] = useState("")
  const [lines, setLines] = useState<Line[]>(initialLines ?? [])

  useEffect(() => {
    ;(async () => {
      const supabase = createClient()
      const [{ data: sups }, { data: prods }] = await Promise.all([
        supabase.from("suppliers").select("id, name").eq("company_id", companyId).order("name"),
        supabase.from("products").select("id, name, supplier_id").eq("company_id", companyId).is("deleted_at", null).order("name"),
      ])
      setSuppliers(sups || [])
      setProducts(prods || [])
    })()
  }, [companyId])

  // Solo productos que ese proveedor efectivamente vende — evita pedirle a un
  // proveedor algo que no maneja.
  const productsForSupplier = useMemo(() => products.filter(p => p.supplier_id === supplierId), [products, supplierId])

  const suggestions = useMemo(() => {
    if (!supplierId || !search.trim()) return []
    const q = search.toLowerCase()
    return productsForSupplier.filter(p => p.name.toLowerCase().includes(q) && !lines.some(l => l.product_id === p.id)).slice(0, 8)
  }, [search, productsForSupplier, lines, supplierId])

  const addLine = (p: Product) => {
    setLines(ls => [...ls, { product_id: p.id, name: p.name, cantidad: "1" }])
    setSearch("")
  }
  const removeLine = (productId: string) => setLines(ls => ls.filter(l => l.product_id !== productId))
  const updateLine = (productId: string, value: string) =>
    setLines(ls => ls.map(l => l.product_id === productId ? { ...l, cantidad: value } : l))

  const selectSupplier = (id: string) => {
    if (id !== supplierId) setLines([])
    setSupplierId(id)
    setSupplierOpen(false)
  }

  const selectedSupplier = suppliers.find(s => s.id === supplierId)

  const handleSubmit = async () => {
    if (!supplierId) { showError("Selecciona un proveedor"); return }
    if (lines.length === 0) { showError("Agrega al menos un producto"); return }
    for (const l of lines) {
      if (!l.cantidad || parseInt(l.cantidad) <= 0) { showError(`Cantidad inválida para ${l.name}`); return }
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: orden, error } = await supabase.from("ordenes_compra").insert({
        empresa_id: companyId,
        proveedor_id: supplierId,
        estado: "pendiente_aprobacion",
        fecha_esperada: fechaEsperada || null,
        notas: notas.trim() || null,
      }).select("id").single()
      if (error) throw error

      const itemsPayload = lines.map(l => ({
        orden_compra_id: orden.id,
        empresa_id: companyId,
        producto_id: l.product_id,
        cantidad_solicitada: parseInt(l.cantidad),
      }))
      const { error: itemsErr } = await supabase.from("orden_compra_items").insert(itemsPayload)
      if (itemsErr) throw itemsErr

      await showSuccess("Solicitud de compra creada — queda pendiente de aprobación")
      onSaved()
    } catch (err: any) {
      showError(err.message || "Error al crear la solicitud")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <style dangerouslySetInnerHTML={{ __html: MODAL_CSS }} />
    <div className="oc-bdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }} role="dialog" aria-modal="true">
      <div className="oc-modal">
        <div className="oc-modal-hd">
          <p className="oc-modal-title"><FileText aria-hidden />Nueva solicitud de compra</p>
          <button className="oc-close" onClick={onClose} disabled={loading}><X size={13} /></button>
        </div>
        <div className="oc-modal-body">
          <div className="oc-g2">
            <div>
              <label className="oc-lbl">Proveedor *</label>
              <div className="oc-sel-wrap">
                <button type="button" className="oc-sel-btn" onClick={() => setSupplierOpen(o => !o)} disabled={loading}>
                  {selectedSupplier?.name ?? "Selecciona un proveedor"}
                </button>
                <ChevronDown size={13} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "rgba(26,26,24,.4)" }} aria-hidden />
                {supplierOpen && (
                  <div className="oc-sel-dd" role="listbox">
                    {suppliers.length === 0
                      ? <div style={{ padding: 12, fontSize: 12, color: "var(--oc-muted)" }}>Sin proveedores registrados</div>
                      : suppliers.map(s => (
                        <div key={s.id} className="oc-sel-opt" onClick={() => selectSupplier(s.id)}>
                          {s.name}{supplierId === s.id && <Check size={11} aria-hidden />}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="oc-lbl" htmlFor="oc-fecha">Fecha esperada</label>
              <input id="oc-fecha" className="oc-inp" type="date" value={fechaEsperada} disabled={loading}
                onChange={e => setFechaEsperada(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="oc-lbl">Buscar producto para agregar</label>
            <div className="oc-srch-wrap">
              <input className="oc-inp" placeholder={supplierId ? "Nombre del producto…" : "Selecciona un proveedor primero"} value={search}
                disabled={loading || !supplierId}
                onChange={e => setSearch(e.target.value)} />
              {supplierId && productsForSupplier.length === 0 && (
                <p style={{ fontSize: 11, color: "var(--oc-muted)", margin: "6px 0 0" }}>Este proveedor no tiene productos asignados — asígnalos en Productos.</p>
              )}
              {suggestions.length > 0 && (
                <div className="oc-sugg">
                  {suggestions.map(p => (
                    <div key={p.id} className="oc-sugg-item" onClick={() => addLine(p)}>{p.name}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {lines.length > 0 && (
            <div>
              <label className="oc-lbl">Productos a pedir</label>
              {lines.map(l => (
                <div key={l.product_id} className="oc-line-item">
                  <span className="oc-line-name">{l.name}</span>
                  <input className="oc-line-inp" type="number" min={1} placeholder="Cant." value={l.cantidad} disabled={loading}
                    onChange={e => updateLine(l.product_id, e.target.value)} />
                  <button className="oc-line-remove" onClick={() => removeLine(l.product_id)} disabled={loading} aria-label="Quitar">
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="oc-lbl" htmlFor="oc-notas">Notas</label>
            <textarea id="oc-notas" className="oc-textarea" value={notas} disabled={loading}
              onChange={e => setNotas(e.target.value)} placeholder="Observaciones sobre el pedido..." />
          </div>
        </div>
        <div className="oc-modal-foot">
          <button className="oc-btn-cancel" onClick={onClose} disabled={loading}>Cancelar</button>
          <button className="oc-btn-save" onClick={handleSubmit} disabled={loading}>
            {loading ? <><div className="oc-spin" />Guardando…</> : "Crear solicitud"}
          </button>
        </div>
      </div>
    </div>
    </>
  )
}
