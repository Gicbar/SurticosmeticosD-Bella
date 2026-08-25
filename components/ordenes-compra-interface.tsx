"use client"
import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { showError, showSuccess, showConfirm } from "@/lib/sweetalert"
import {
  FileText, Plus, ChevronDown, ChevronUp,
  PackageCheck, Ban, XCircle,
} from "lucide-react"
import { NuevaOrdenCompraModal } from "@/components/nueva-orden-compra-modal"

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
    --oc-pending:#b45309;             --oc-pending-bg:rgba(180,83,9,0.08);
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
  .oc-badge.borrador             { background: var(--oc-draft-bg);   color: var(--oc-draft); }
  .oc-badge.pendiente_aprobacion { background: var(--oc-pending-bg); color: var(--oc-pending); }
  .oc-badge.enviada              { background: var(--oc-sent-bg);   color: var(--oc-sent); }
  .oc-badge.recibida_parcial     { background: var(--oc-partial-bg);color: var(--oc-partial); }
  .oc-badge.recibida_total       { background: var(--oc-full-bg);   color: var(--oc-full); }
  .oc-badge.rechazada            { background: var(--oc-cancel-bg); color: var(--oc-cancel); }
  .oc-badge.cancelada            { background: var(--oc-cancel-bg); color: var(--oc-cancel); }

  .oc-expand-body { padding: 14px 20px; border-top: 1px solid var(--oc-border); background: rgba(26,26,24,0.015); }
  .oc-item-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--oc-border); flex-wrap: wrap; }
  .oc-item-row:last-child { border-bottom: none; }
  .oc-item-info { flex: 1; min-width: 160px; }
  .oc-item-name { font-size: 13px; font-weight: 500; margin: 0; }
  .oc-item-sub { font-size: 11px; color: var(--oc-muted); margin: 2px 0 0; }
  .oc-item-recv { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .oc-mini-inp { width: 90px; height: 32px; padding: 0 8px; border: 1px solid var(--oc-border); font-size: 12px; font-family: 'DM Sans', sans-serif; }
  .oc-mini-btn { height: 32px; padding: 0 12px; border: none; background: var(--oc-p); color: #fff; cursor: pointer; font-size: 10px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; display: flex; align-items: center; gap: 4px; }
  .oc-mini-btn:disabled { opacity: .4; cursor: not-allowed; }
  .oc-mini-btn.cancel { background: rgba(220,38,38,0.1); color: #dc2626; }
  .oc-mini-btn.reject { background: rgba(220,38,38,0.1); color: #dc2626; }
  .oc-mini-motivo { width: 140px; height: 32px; padding: 0 8px; border: 1px solid var(--oc-border); font-size: 12px; font-family: 'DM Sans', sans-serif; }
  .oc-review-note { font-size: 11px; color: var(--oc-muted); font-style: italic; }
  .oc-reject-note { font-size: 11px; color: #dc2626; }

  .oc-empty { padding: 48px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px; }
  .oc-empty-icon { width: 48px; height: 48px; background: var(--oc-p10); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
  .oc-empty-icon svg { color: var(--oc-p); opacity: .5; width: 20px; height: 20px; }
  .oc-spinner-wrap { padding: 36px; display: flex; justify-content: center; }
  .oc-spinner { width: 22px; height: 22px; border: 2px solid var(--oc-border); border-top-color: var(--oc-p); border-radius: 50%; animation: oc-spin .7s linear infinite; }
  @keyframes oc-spin { to { transform: rotate(360deg); } }
`

type OrdenItem = {
  id: string
  producto_id: string
  cantidad_solicitada: number
  cantidad_recibida: number
  costo_unitario_estimado: number | null
  rechazado: boolean
  motivo_rechazo: string | null
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
  borrador: "Borrador", pendiente_aprobacion: "Pendiente de aprobación", enviada: "Enviada",
  recibida_parcial: "Recibida parcial", recibida_total: "Recibida total",
  rechazada: "Rechazada", cancelada: "Cancelada",
}

/** Recalcula el estado de la orden a partir de sus ítems.
 *  Las órdenes que nacieron como "pendiente_aprobacion" pueden resolver en
 *  "rechazada" (todo rechazado) — las del flujo clásico (enviada) nunca. */
function computeEstado(estadoActual: string, items: { cantidad_solicitada: number; cantidad_recibida: number; rechazado: boolean }[]): string {
  if (estadoActual === "pendiente_aprobacion") {
    const pendientes = items.filter(i => !i.rechazado && i.cantidad_recibida < i.cantidad_solicitada)
    if (pendientes.length > 0) return "pendiente_aprobacion"
    return items.every(i => i.rechazado) ? "rechazada" : "recibida_total"
  }
  const totalRecibida = items.reduce((s, i) => s + i.cantidad_recibida, 0)
  const totalSolicitada = items.reduce((s, i) => s + i.cantidad_solicitada, 0)
  return totalRecibida >= totalSolicitada ? "recibida_total" : "recibida_parcial"
}

export function OrdenesCompraInterface({ companyId, canApprove }: { companyId: string; canApprove: boolean }) {
  const [ordenes, setOrdenes]       = useState<Orden[]>([])
  const [loading, setLoading]       = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showNew, setShowNew]       = useState(false)
  const [recibiendo, setRecibiendo] = useState<Record<string, string>>({}) // itemId -> cantidad real
  const [motivos, setMotivos]       = useState<Record<string, string>>({}) // itemId -> motivo de rechazo
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
      .select("id, producto_id, cantidad_solicitada, cantidad_recibida, costo_unitario_estimado, rechazado, motivo_rechazo, products(name)")
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
      const { data: { user } } = await supabase.auth.getUser()
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
        .update({ cantidad_recibida: nuevaRecibida, batch_id: batch.id, revisado_por: user?.id ?? null, revisado_en: new Date().toISOString() })
        .eq("id", item.id)
      if (itemErr) throw itemErr

      // Recalcular estado de la orden completa
      const { data: allItems } = await supabase
        .from("orden_compra_items")
        .select("id, cantidad_solicitada, cantidad_recibida, rechazado")
        .eq("orden_compra_id", orden.id)
      const items = (allItems || []).map(i => i.id === item.id ? { ...i, cantidad_recibida: nuevaRecibida } : i)
      const nuevoEstado = computeEstado(orden.estado, items)
      await supabase.from("ordenes_compra").update({ estado: nuevoEstado, actualizado_en: new Date().toISOString() }).eq("id", orden.id)

      await showSuccess(`${cantidad} unidades compradas — nuevo lote creado en inventario`)
      setOrdenes(prev => prev.map(o => o.id === orden.id ? { ...o, orden_compra_items: undefined, estado: nuevoEstado } : o))
      await loadItems({ ...orden, orden_compra_items: undefined })
      setRecibiendo(r => ({ ...r, [item.id]: "" }))
    } catch (err: any) {
      showError(err.message || "Error al registrar la compra")
    } finally {
      setProcessing(null)
    }
  }

  const handleNoComprar = async (orden: Orden, item: OrdenItem) => {
    const motivo = motivos[item.id]?.trim() || null
    const ok = await showConfirm(`"${item.products?.name ?? "Este producto"}" no se comprará.`, "¿Confirmar?")
    if (!ok) return
    setProcessing(item.id)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { error: itemErr } = await supabase.from("orden_compra_items")
        .update({ rechazado: true, motivo_rechazo: motivo, revisado_por: user?.id ?? null, revisado_en: new Date().toISOString() })
        .eq("id", item.id)
      if (itemErr) throw itemErr

      const { data: allItems } = await supabase
        .from("orden_compra_items")
        .select("id, cantidad_solicitada, cantidad_recibida, rechazado")
        .eq("orden_compra_id", orden.id)
      const items = (allItems || []).map(i => i.id === item.id ? { ...i, rechazado: true } : i)
      const nuevoEstado = computeEstado(orden.estado, items)
      await supabase.from("ordenes_compra").update({ estado: nuevoEstado, actualizado_en: new Date().toISOString() }).eq("id", orden.id)

      await showSuccess("Producto marcado como no comprado")
      setOrdenes(prev => prev.map(o => o.id === orden.id ? { ...o, orden_compra_items: undefined, estado: nuevoEstado } : o))
      await loadItems({ ...orden, orden_compra_items: undefined })
      setMotivos(m => ({ ...m, [item.id]: "" }))
    } catch (err: any) {
      showError(err.message || "Error al rechazar el producto")
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
            <Plus size={14} aria-hidden />Nueva solicitud
          </button>
        </div>

        <div className="oc-card">
          {loading ? (
            <div className="oc-spinner-wrap"><div className="oc-spinner" /></div>
          ) : ordenes.length === 0 ? (
            <div className="oc-empty">
              <div className="oc-empty-icon"><FileText /></div>
              <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>No hay órdenes de compra</p>
              <p style={{ fontSize: 11, color: "var(--oc-muted)", margin: 0 }}>Crea una solicitud para pedir mercancía a un proveedor</p>
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
                    const isFinal = orden.estado === "recibida_total" || orden.estado === "cancelada" || orden.estado === "rechazada"
                    const enRevision = orden.estado === "pendiente_aprobacion"
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
                                {enRevision && !canApprove && (
                                  <p className="oc-review-note" style={{ marginBottom: 8 }}>Esperando revisión de un gerente.</p>
                                )}
                                {(orden.orden_compra_items || []).map(item => {
                                  const pendiente = item.cantidad_solicitada - item.cantidad_recibida
                                  return (
                                    <div key={item.id} className="oc-item-row">
                                      <div className="oc-item-info">
                                        <p className="oc-item-name">{item.products?.name ?? "Producto"}</p>
                                        <p className="oc-item-sub">
                                          Solicitado: {item.cantidad_solicitada} · Comprado: {item.cantidad_recibida}
                                          {item.costo_unitario_estimado != null && ` · Costo est.: ${fmt(item.costo_unitario_estimado)}`}
                                        </p>
                                        {item.rechazado && (
                                          <p className="oc-reject-note">No comprado{item.motivo_rechazo ? ` — ${item.motivo_rechazo}` : ""}</p>
                                        )}
                                      </div>
                                      {!item.rechazado && pendiente > 0 && !isFinal && enRevision && canApprove && (
                                        <div className="oc-item-recv">
                                          <input
                                            className="oc-mini-inp" type="number" min={1} max={pendiente}
                                            placeholder={String(pendiente)}
                                            value={recibiendo[item.id] || ""}
                                            onChange={e => setRecibiendo(r => ({ ...r, [item.id]: e.target.value }))}
                                          />
                                          <button className="oc-mini-btn" disabled={processing === item.id}
                                            onClick={() => handleRecibirItem(orden, item)}>
                                            <PackageCheck size={11} />Comprar
                                          </button>
                                          <input
                                            className="oc-mini-motivo" type="text" placeholder="Motivo (opcional)"
                                            value={motivos[item.id] || ""}
                                            onChange={e => setMotivos(m => ({ ...m, [item.id]: e.target.value }))}
                                          />
                                          <button className="oc-mini-btn reject" disabled={processing === item.id}
                                            onClick={() => handleNoComprar(orden, item)}>
                                            <XCircle size={11} />No comprar
                                          </button>
                                        </div>
                                      )}
                                      {!item.rechazado && pendiente > 0 && !isFinal && !enRevision && (
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
        <NuevaOrdenCompraModal companyId={companyId} onClose={() => setShowNew(false)}
          onSaved={() => { setShowNew(false); load() }} />
      )}
    </>
  )
}
