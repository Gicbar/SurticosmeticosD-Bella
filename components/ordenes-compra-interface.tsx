"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { showError, showSuccess, showConfirm } from "@/lib/sweetalert"
import {
  FileText, Plus, X, Search, ChevronDown, ChevronUp, Check,
  Package, Truck, RefreshCw, PackageCheck, Ban,
} from "lucide-react"

const OC_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  .oc-root {
    font-family: 'DM Sans', sans-serif;
    --oc-p:      var(--primary, #984ca8);
    --oc-p10:    rgba(var(--primary-rgb,152,76,168), 0.10);
    --oc-txt:    #1a1a18;
    --oc-muted:  rgba(26,26,24,0.45);
    --oc-border: rgba(26,26,24,0.08);
    --oc-draft:  rgba(26,26,24,0.4);  --oc-draft-bg:  rgba(26,26,24,0.06);
    --oc-sent:   #0369a1;             --oc-sent-bg:   rgba(3,105,161,0.08);
    --oc-partial:#b45309;             --oc-partial-bg:rgba(180,83,9,0.08);
    --oc-full:   #15803d;             --oc-full-bg:   rgba(21,128,61,0.08);
    --oc-cancel: #dc2626;             --oc-cancel-bg: rgba(220,38,38,0.08);
  }

  .oc-hd-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
  .oc-btn-new { display: flex; align-items: center; gap: 7px; height: 40px; padding: 0 18px; border: none; background: var(--oc-p); color: #fff; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; }
  .oc-btn-new:hover { opacity: .9; }

  .oc-card { background: #fff; border: 1px solid var(--oc-border); overflow: hidden; }
  .oc-table-wrap { overflow-x: auto; }
  .oc-table { width: 100%; border-collapse: collapse; }
  .oc-th { padding: 10px 16px; text-align: left; background: rgba(26,26,24,0.02); font-size: 9px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: var(--oc-muted); border-bottom: 1px solid var(--oc-border); white-space: nowrap; }
  .oc-tr { border-bottom: 1px solid var(--oc-border); cursor: pointer; transition: background .12s; }
  .oc-tr:hover { background: rgba(26,26,24,0.02); }
  .oc-td { padding: 12px 16px; font-size: 13px; color: var(--oc-txt); vertical-align: middle; }

  .oc-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; font-size: 9px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; white-space: nowrap; }
  .oc-badge.borrador          { background: var(--oc-draft-bg);   color: var(--oc-draft); }
  .oc-badge.enviada           { background: var(--oc-sent-bg);   color: var(--oc-sent); }
  .oc-badge.recibida_parcial  { background: var(--oc-partial-bg);color: var(--oc-partial); }
  .oc-badge.recibida_total    { background: var(--oc-full-bg);   color: var(--oc-full); }
  .oc-badge.cancelada         { background: var(--oc-cancel-bg); color: var(--oc-cancel); }

  .oc-expand-body { padding: 14px 20px; border-top: 1px solid var(--oc-border); background: rgba(26,26,24,0.015); }
  .oc-item-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--oc-border); flex-wrap: wrap; }
  .oc-item-row:last-child { border-bottom: none; }
  .oc-item-info { flex: 1; min-width: 160px; }
  .oc-item-name { font-size: 13px; font-weight: 500; margin: 0; }
  .oc-item-sub { font-size: 11px; color: var(--oc-muted); margin: 2px 0 0; }
  .oc-item-recv { display: flex; align-items: center; gap: 6px; }
  .oc-mini-inp { width: 90px; height: 32px; padding: 0 8px; border: 1px solid var(--oc-border); font-size: 12px; font-family: 'DM Sans', sans-serif; }
  .oc-mini-btn { height: 32px; padding: 0 12px; border: none; background: var(--oc-p); color: #fff; cursor: pointer; font-size: 10px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; display: flex; align-items: center; gap: 4px; }
  .oc-mini-btn:disabled { opacity: .4; cursor: not-allowed; }
  .oc-mini-btn.cancel { background: rgba(220,38,38,0.1); color: #dc2626; }

  .oc-empty { padding: 48px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px; }
  .oc-empty-icon { width: 48px; height: 48px; background: var(--oc-p10); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
  .oc-empty-icon svg { color: var(--oc-p); opacity: .5; width: 20px; height: 20px; }
  .oc-spinner-wrap { padding: 36px; display: flex; justify-content: center; }
  .oc-spinner { width: 22px; height: 22px; border: 2px solid var(--oc-border); border-top-color: var(--oc-p); border-radius: 50%; animation: oc-spin .7s linear infinite; }
  @keyframes oc-spin { to { transform: rotate(360deg); } }

  /* Modal nueva orden */
  .oc-bdrop { position:fixed; inset:0; z-index:1000; background:rgba(0,0,0,.35); backdrop-filter:blur(3px); display:flex; align-items:center; justify-content:center; padding:16px; }
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
  .oc-spin { width:13px; height:13px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:oc-spin .7s linear infinite; }
`

type Supplier = { id: string; name: string }
type Product  = { id: string; name: string }

type OrdenItem = {
  id: string
  producto_id: string
  cantidad_solicitada: number
  cantidad_recibida: number
  costo_unitario_estimado: number | null
  products: { name: string } | null
}

type Orden = {
  id: string
  proveedor_id: string
  estado: string
  fecha_esperada: string | null
  notas: string | null
  creado_en: string
  suppliers: { name: string } | null
  orden_compra_items?: OrdenItem[]
}

const fmt = (v: number) =>
  Number(v).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })

const ESTADO_LABEL: Record<string, string> = {
  borrador: "Borrador", enviada: "Enviada",
  recibida_parcial: "Recibida parcial", recibida_total: "Recibida total", cancelada: "Cancelada",
}

export function OrdenesCompraInterface({ companyId }: { companyId: string }) {
  const [ordenes, setOrdenes]       = useState<Orden[]>([])
  const [loading, setLoading]       = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showNew, setShowNew]       = useState(false)
  const [recibiendo, setRecibiendo] = useState<Record<string, string>>({}) // itemId -> cantidad
  const [processing, setProcessing] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from("ordenes_compra")
        .select("id, proveedor_id, estado, fecha_esperada, notas, creado_en, suppliers(name)")
        .eq("empresa_id", companyId).order("creado_en", { ascending: false })
      setOrdenes((data || []) as unknown as Orden[])
    } finally { setLoading(false) }
  }, [companyId])

  useEffect(() => { load() }, [load])

  const loadItems = async (orden: Orden) => {
    if (orden.orden_compra_items) return
    const supabase = createClient()
    const { data } = await supabase
      .from("orden_compra_items")
      .select("id, producto_id, cantidad_solicitada, cantidad_recibida, costo_unitario_estimado, products(name)")
      .eq("orden_compra_id", orden.id)
    setOrdenes(prev => prev.map(o => o.id === orden.id ? { ...o, orden_compra_items: (data || []) as any } : o))
  }

  const handleExpand = async (orden: Orden) => {
    if (expandedId === orden.id) { setExpandedId(null); return }
    setExpandedId(orden.id)
    await loadItems(orden)
  }

  const handleRecibirItem = async (orden: Orden, item: OrdenItem) => {
    const pendiente = item.cantidad_solicitada - item.cantidad_recibida
    const cantidad = parseInt(recibiendo[item.id] || String(pendiente)) || 0
    if (cantidad <= 0 || cantidad > pendiente) {
      showError(`La cantidad debe estar entre 1 y ${pendiente}`)
      return
    }
    const costo = item.costo_unitario_estimado ?? 0
    setProcessing(item.id)
    try {
      const supabase = createClient()
      const { data: batch, error: batchErr } = await supabase.from("purchase_batches").insert({
        product_id: item.producto_id,
        quantity: cantidad,
        purchase_price: costo,
        remaining_quantity: cantidad,
        supplier_id: orden.proveedor_id,
        company_id: companyId,
      }).select("id").single()
      if (batchErr) throw batchErr

      const nuevaRecibida = item.cantidad_recibida + cantidad
      const { error: itemErr } = await supabase.from("orden_compra_items")
        .update({ cantidad_recibida: nuevaRecibida, batch_id: batch.id })
        .eq("id", item.id)
      if (itemErr) throw itemErr

      // Recalcular estado de la orden completa
      const { data: allItems } = await supabase
        .from("orden_compra_items")
        .select("id, cantidad_solicitada, cantidad_recibida")
        .eq("orden_compra_id", orden.id)
      const items = allItems || []
      const totalRecibida = items.reduce((s, i) => s + (i.id === item.id ? nuevaRecibida : i.cantidad_recibida), 0)
      const totalSolicitada = items.reduce((s, i) => s + i.cantidad_solicitada, 0)
      const nuevoEstado = totalRecibida >= totalSolicitada ? "recibida_total" : "recibida_parcial"
      await supabase.from("ordenes_compra").update({ estado: nuevoEstado, actualizado_en: new Date().toISOString() }).eq("id", orden.id)

      await showSuccess(`${cantidad} unidades recibidas — nuevo lote creado en inventario`)
      setOrdenes(prev => prev.map(o => o.id === orden.id ? { ...o, orden_compra_items: undefined, estado: nuevoEstado } : o))
      await loadItems({ ...orden, orden_compra_items: undefined })
      setRecibiendo(r => ({ ...r, [item.id]: "" }))
    } catch (err: any) {
      showError(err.message || "Error al recibir la mercancía")
    } finally {
      setProcessing(null)
    }
  }

  const handleCancelar = async (orden: Orden) => {
    const ok = await showConfirm("Esta orden de compra se marcará como cancelada.", "¿Cancelar orden?")
    if (!ok) return
    setProcessing(orden.id)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("ordenes_compra").update({ estado: "cancelada" }).eq("id", orden.id)
      if (error) throw error
      await showSuccess("Orden cancelada")
      await load()
    } catch (err: any) {
      showError(err.message || "Error al cancelar")
    } finally {
      setProcessing(null)
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: OC_CSS }} />
      <div className="oc-root">
        <div className="oc-hd-row">
          <div />
          <button className="oc-btn-new" onClick={() => setShowNew(true)}>
            <Plus size={14} aria-hidden />Nueva orden
          </button>
        </div>

        <div className="oc-card">
          {loading ? (
            <div className="oc-spinner-wrap"><div className="oc-spinner" /></div>
          ) : ordenes.length === 0 ? (
            <div className="oc-empty">
              <div className="oc-empty-icon"><FileText /></div>
              <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>No hay órdenes de compra</p>
              <p style={{ fontSize: 11, color: "var(--oc-muted)", margin: 0 }}>Crea una para pedir mercancía a un proveedor</p>
            </div>
          ) : (
            <div className="oc-table-wrap">
              <table className="oc-table">
                <thead>
                  <tr>
                    <th className="oc-th">Proveedor</th>
                    <th className="oc-th">Fecha esperada</th>
                    <th className="oc-th">Estado</th>
                    <th className="oc-th" style={{ width: 32 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {ordenes.map(orden => {
                    const isExpanded = expandedId === orden.id
                    const isFinal = orden.estado === "recibida_total" || orden.estado === "cancelada"
                    return (
                      <>
                        <tr key={orden.id} className="oc-tr" onClick={() => handleExpand(orden)}>
                          <td className="oc-td">
                            <p style={{ margin: 0, fontWeight: 500 }}>{orden.suppliers?.name ?? "—"}</p>
                            <p style={{ margin: "2px 0 0", fontSize: 10, color: "var(--oc-muted)" }}>{fmtDate(orden.creado_en)}</p>
                          </td>
                          <td className="oc-td">{orden.fecha_esperada ? fmtDate(orden.fecha_esperada) : "—"}</td>
                          <td className="oc-td"><span className={`oc-badge ${orden.estado}`}>{ESTADO_LABEL[orden.estado]}</span></td>
                          <td className="oc-td">{isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${orden.id}-exp`}>
                            <td colSpan={4} style={{ padding: 0 }}>
                              <div className="oc-expand-body">
                                {(orden.orden_compra_items || []).map(item => {
                                  const pendiente = item.cantidad_solicitada - item.cantidad_recibida
                                  return (
                                    <div key={item.id} className="oc-item-row">
                                      <div className="oc-item-info">
                                        <p className="oc-item-name">{item.products?.name ?? "Producto"}</p>
                                        <p className="oc-item-sub">
                                          Solicitado: {item.cantidad_solicitada} · Recibido: {item.cantidad_recibida}
                                          {item.costo_unitario_estimado != null && ` · Costo est.: ${fmt(item.costo_unitario_estimado)}`}
                                        </p>
                                      </div>
                                      {pendiente > 0 && !isFinal && (
                                        <div className="oc-item-recv">
                                          <input
                                            className="oc-mini-inp" type="number" min={1} max={pendiente}
                                            placeholder={String(pendiente)}
                                            value={recibiendo[item.id] || ""}
                                            onChange={e => setRecibiendo(r => ({ ...r, [item.id]: e.target.value }))}
                                          />
                                          <button className="oc-mini-btn" disabled={processing === item.id}
                                            onClick={() => handleRecibirItem(orden, item)}>
                                            <PackageCheck size={11} />Recibir
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                                {!isFinal && (
                                  <div style={{ marginTop: 10 }}>
                                    <button className="oc-mini-btn cancel" disabled={processing === orden.id}
                                      onClick={() => handleCancelar(orden)}>
                                      <Ban size={11} />Cancelar orden
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showNew && (
        <NuevaOrdenModal companyId={companyId} onClose={() => setShowNew(false)}
          onSaved={() => { setShowNew(false); load() }} />
      )}
    </>
  )
}

// ── Modal: nueva orden de compra ───────────────────────────────────────────────
function NuevaOrdenModal({ companyId, onClose, onSaved }: {
  companyId: string; onClose: () => void; onSaved: () => void
}) {
  const [loading, setLoading]     = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts]   = useState<Product[]>([])
  const [supplierId, setSupplierId] = useState("")
  const [supplierOpen, setSupplierOpen] = useState(false)
  const [fechaEsperada, setFechaEsperada] = useState("")
  const [notas, setNotas] = useState("")
  const [search, setSearch] = useState("")
  const [lines, setLines] = useState<{ product_id: string; name: string; cantidad: string; costo: string }[]>([])

  useEffect(() => {
    ;(async () => {
      const supabase = createClient()
      const [{ data: sups }, { data: prods }] = await Promise.all([
        supabase.from("suppliers").select("id, name").eq("company_id", companyId).order("name"),
        supabase.from("products").select("id, name").eq("company_id", companyId).order("name"),
      ])
      setSuppliers(sups || [])
      setProducts(prods || [])
    })()
  }, [companyId])

  const suggestions = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    return products.filter(p => p.name.toLowerCase().includes(q) && !lines.some(l => l.product_id === p.id)).slice(0, 8)
  }, [search, products, lines])

  const addLine = (p: Product) => {
    setLines(ls => [...ls, { product_id: p.id, name: p.name, cantidad: "1", costo: "" }])
    setSearch("")
  }
  const removeLine = (productId: string) => setLines(ls => ls.filter(l => l.product_id !== productId))
  const updateLine = (productId: string, field: "cantidad" | "costo", value: string) =>
    setLines(ls => ls.map(l => l.product_id === productId ? { ...l, [field]: value } : l))

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
        estado: "enviada",
        fecha_esperada: fechaEsperada || null,
        notas: notas.trim() || null,
      }).select("id").single()
      if (error) throw error

      const itemsPayload = lines.map(l => ({
        orden_compra_id: orden.id,
        empresa_id: companyId,
        producto_id: l.product_id,
        cantidad_solicitada: parseInt(l.cantidad),
        costo_unitario_estimado: l.costo ? parseFloat(l.costo) : null,
      }))
      const { error: itemsErr } = await supabase.from("orden_compra_items").insert(itemsPayload)
      if (itemsErr) throw itemsErr

      await showSuccess("Orden de compra creada")
      onSaved()
    } catch (err: any) {
      showError(err.message || "Error al crear la orden")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="oc-bdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }} role="dialog" aria-modal="true">
      <div className="oc-modal">
        <div className="oc-modal-hd">
          <p className="oc-modal-title"><FileText aria-hidden />Nueva orden de compra</p>
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
                        <div key={s.id} className="oc-sel-opt" onClick={() => { setSupplierId(s.id); setSupplierOpen(false) }}>
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
              <input className="oc-inp" placeholder="Nombre del producto…" value={search} disabled={loading}
                onChange={e => setSearch(e.target.value)} />
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
                    onChange={e => updateLine(l.product_id, "cantidad", e.target.value)} />
                  <input className="oc-line-inp" type="number" min={0} step="0.01" placeholder="Costo" value={l.costo} disabled={loading}
                    onChange={e => updateLine(l.product_id, "costo", e.target.value)} />
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
            {loading ? <><div className="oc-spin" />Guardando…</> : "Crear orden"}
          </button>
        </div>
      </div>
    </div>
  )
}
