"use client"

/**
 * Propuesta de factura sobre una orden de compra.
 * Un agente lee la factura electrónica del proveedor y deja, por cada línea,
 * qué hacer con ella (poner el costo a un ítem de la orden, agregar un producto
 * existente que falta, crear un producto nuevo o ignorar la línea). Aquí el
 * gerente revisa y aprueba; esta pantalla aplica los cambios con su sesión.
 * Nada llega al inventario hasta que se registra la compra (botón "Comprar").
 */
import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { showError, showSuccess, showConfirm } from "@/lib/sweetalert"
import { FileText, Check, X, Search } from "lucide-react"

type PropItem = {
  id: string
  orden: number
  descripcion: string
  cantidad: number
  costo_unitario: number
  accion: "costo_item" | "agregar_existente" | "crear_producto" | "ignorar"
  orden_item_id: string | null
  producto_id: string | null
  nuevo_nombre: string | null
  nuevo_precio_venta: number | null
  nuevo_categoria_id: string | null
  nota: string | null
  estado: "pendiente" | "aplicado" | "descartado"
  products: { name: string } | null
}

type Propuesta = {
  id: string
  numero_factura: string
  proveedor_nombre: string | null
  fecha_factura: string | null
  total: number | null
  estado: string
  factura_propuesta_items: PropItem[]
}

type OrdenItemMin = { id: string; producto_id: string; cantidad_recibida: number; cantidad_contada: number; rechazado: boolean }

const fmt = (v: number) =>
  Number(v).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })

const ACCION_LABEL: Record<PropItem["accion"], string> = {
  costo_item: "Poner costo",
  agregar_existente: "Agregar a la orden",
  crear_producto: "Producto nuevo",
  ignorar: "No es mercancía",
}

const CSS = `
  .fp-box { border: 1px solid rgba(152,76,168,.35); background: rgba(152,76,168,.04); padding: 12px; margin-bottom: 12px; }
  .fp-hd { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
  .fp-title { margin: 0; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
  .fp-sub { margin: 2px 0 0; font-size: 11px; color: var(--oc-muted); }
  .fp-row { display: grid; grid-template-columns: 1fr auto; gap: 8px; padding: 8px 0; border-top: 1px solid rgba(0,0,0,.06); }
  .fp-row.done { opacity: .5; }
  .fp-desc { margin: 0; font-size: 12px; font-weight: 500; }
  .fp-line { margin: 2px 0 0; font-size: 11px; color: var(--oc-muted); }
  .fp-tag { display: inline-block; font-size: 9px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; padding: 2px 6px; margin-right: 6px; }
  .fp-tag.costo_item { background: rgba(22,163,74,.12); color: #15803d; }
  .fp-tag.agregar_existente { background: rgba(37,99,235,.12); color: #1d4ed8; }
  .fp-tag.crear_producto { background: rgba(217,119,6,.14); color: #b45309; }
  .fp-tag.ignorar { background: rgba(0,0,0,.06); color: #555; }
  .fp-edit { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
  .fp-inp { height: 30px; border: 1px solid rgba(0,0,0,.15); padding: 0 8px; font-size: 12px; background: #fff; }
  .fp-actions { display: flex; gap: 6px; align-items: flex-start; }
  .fp-btn { height: 30px; padding: 0 10px; border: none; cursor: pointer; font-size: 10px; font-weight: 600; letter-spacing: .05em; text-transform: uppercase; display: flex; align-items: center; gap: 4px; background: var(--oc-p); color: #fff; }
  .fp-btn.ghost { background: rgba(0,0,0,.06); color: #333; }
  .fp-btn.danger { background: rgba(220,38,38,.1); color: #dc2626; }
  .fp-btn:disabled { opacity: .4; cursor: not-allowed; }
  .fp-dd { border: 1px solid rgba(0,0,0,.12); background: #fff; max-height: 180px; overflow-y: auto; margin-top: 4px; }
  .fp-dd-item { padding: 6px 8px; font-size: 12px; cursor: pointer; }
  .fp-dd-item:hover { background: rgba(152,76,168,.08); }
`

export function FacturaPropuestaPanel({ ordenId, proveedorId, companyId, items, onApplied }: {
  ordenId: string
  proveedorId: string
  companyId: string
  items: OrdenItemMin[]
  onApplied: () => void
}) {
  const [props, setProps] = useState<Propuesta[]>([])
  const [busy, setBusy] = useState(false)
  const [edits, setEdits] = useState<Record<string, { nombre?: string; precio?: string }>>({})
  const [buscando, setBuscando] = useState<string | null>(null) // propItem id con el buscador abierto
  const [q, setQ] = useState("")
  const [resultados, setResultados] = useState<{ id: string; name: string }[]>([])

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("factura_propuestas")
      .select("id, numero_factura, proveedor_nombre, fecha_factura, total, estado, factura_propuesta_items(id, orden, descripcion, cantidad, costo_unitario, accion, orden_item_id, producto_id, nuevo_nombre, nuevo_precio_venta, nuevo_categoria_id, nota, estado, products(name))")
      .eq("orden_compra_id", ordenId)
      .eq("estado", "pendiente")
      .order("creado_en")
    setProps(((data || []) as unknown as Propuesta[]).map(p => ({
      ...p, factura_propuesta_items: [...(p.factura_propuesta_items || [])].sort((a, b) => a.orden - b.orden),
    })))
  }, [ordenId])

  useEffect(() => { load() }, [load])

  // Buscador para "este producto ya existe, es este"
  useEffect(() => {
    if (!buscando || q.trim().length < 2) { setResultados([]); return }
    const t = setTimeout(async () => {
      const supabase = createClient()
      const { data } = await supabase.from("products").select("id, name")
        .eq("company_id", companyId).is("deleted_at", null).ilike("name", `%${q.trim()}%`).order("name").limit(10)
      setResultados(data || [])
    }, 300)
    return () => clearTimeout(t)
  }, [q, buscando, companyId])

  if (props.length === 0) return null

  const elegirExistente = async (it: PropItem, prod: { id: string; name: string }) => {
    const enOrden = items.find(i => i.producto_id === prod.id && i.cantidad_recibida === 0 && !i.rechazado)
    const supabase = createClient()
    const { error } = await supabase.from("factura_propuesta_items").update({
      accion: enOrden ? "costo_item" : "agregar_existente",
      orden_item_id: enOrden?.id ?? null,
      producto_id: prod.id,
      nota: "Producto elegido por el gerente",
    }).eq("id", it.id)
    if (error) return showError(error.message)
    setBuscando(null); setQ("")
    load()
  }

  const descartar = async (it: PropItem) => {
    const supabase = createClient()
    const { error } = await supabase.from("factura_propuesta_items").update({ estado: "descartado" }).eq("id", it.id)
    if (error) return showError(error.message)
    load()
  }

  /** Aplica una línea. Devuelve null si salió bien o el mensaje de error. */
  const aplicarLinea = async (it: PropItem): Promise<string | null> => {
    const supabase = createClient()
    if (it.accion === "ignorar") {
      await supabase.from("factura_propuesta_items").update({ estado: "aplicado" }).eq("id", it.id)
      return null
    }
    if (it.accion === "costo_item") {
      const oi = items.find(i => i.id === it.orden_item_id)
      if (!oi || oi.cantidad_recibida > 0) return `${it.descripcion}: ese producto ya se compró en esta orden`
      const { error } = await supabase.from("orden_compra_items").update({
        costo_unitario_estimado: it.costo_unitario,
        cantidad_contada: oi.cantidad_contada > 0 ? oi.cantidad_contada : it.cantidad,
      }).eq("id", oi.id).eq("cantidad_recibida", 0)
      if (error) return `${it.descripcion}: ${error.message}`
    } else {
      let productoId = it.producto_id
      if (it.accion === "crear_producto") {
        const e = edits[it.id] || {}
        const nombre = (e.nombre ?? it.nuevo_nombre ?? it.descripcion).trim()
        const precio = parseFloat(e.precio ?? String(it.nuevo_precio_venta ?? ""))
        if (!nombre) return `${it.descripcion}: falta el nombre del producto`
        if (!precio || precio <= 0) return `${it.descripcion}: falta el precio de venta`
        const { data: prod, error } = await supabase.from("products").insert({
          name: nombre, sale_price: precio, category_id: it.nuevo_categoria_id, supplier_id: proveedorId,
          company_id: companyId, min_stock: 1,
        }).select("id").single()
        if (error) return `${it.descripcion}: ${error.message}`
        productoId = prod.id
      }
      const { data: oi, error } = await supabase.from("orden_compra_items").insert({
        orden_compra_id: ordenId, empresa_id: companyId, producto_id: productoId,
        cantidad_solicitada: it.cantidad, cantidad_contada: it.cantidad, costo_unitario_estimado: it.costo_unitario,
      }).select("id").single()
      if (error) return `${it.descripcion}: ${error.message}`
      await supabase.from("factura_propuesta_items").update({ producto_id: productoId, orden_item_id: oi.id }).eq("id", it.id)
    }
    await supabase.from("factura_propuesta_items").update({ estado: "aplicado" }).eq("id", it.id)
    return null
  }

  const aprobarTodo = async (p: Propuesta) => {
    const pendientes = p.factura_propuesta_items.filter(i => i.estado === "pendiente")
    const ok = await showConfirm(
      `Se aplican ${pendientes.length} líneas de la factura ${p.numero_factura}: costos en la orden, productos que faltaban y productos nuevos. ` +
      `El inventario no cambia hasta que registres la compra.`, "¿Aprobar la factura?")
    if (!ok) return
    setBusy(true)
    const errores: string[] = []
    for (const it of pendientes) {
      const e = await aplicarLinea(it)
      if (e) errores.push(e)
    }
    const supabase = createClient()
    if (errores.length === 0) {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from("factura_propuestas").update({ estado: "aplicada", resuelto_por: user?.id ?? null, resuelto_en: new Date().toISOString() }).eq("id", p.id)
      await showSuccess("Factura aprobada", "Revisa las cantidades y pulsa \"Comprar todo lo contado\" para pasarlo al inventario.")
    } else {
      showError(`Quedaron ${errores.length} líneas sin aplicar:\n${errores.join("\n")}`)
    }
    setBusy(false)
    load()
    onApplied()
  }

  const descartarFactura = async (p: Propuesta) => {
    const ok = await showConfirm(`La propuesta de la factura ${p.numero_factura} se descarta y no se aplica nada.`, "¿Descartar?")
    if (!ok) return
    const supabase = createClient()
    await supabase.from("factura_propuestas").update({ estado: "descartada", resuelto_en: new Date().toISOString() }).eq("id", p.id)
    load()
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {props.map(p => {
        const pend = p.factura_propuesta_items.filter(i => i.estado === "pendiente")
        const cuenta = (a: PropItem["accion"]) => pend.filter(i => i.accion === a).length
        return (
          <div key={p.id} className="fp-box">
            <div className="fp-hd">
              <div>
                <p className="fp-title"><FileText size={13} aria-hidden />Factura {p.numero_factura} · {p.proveedor_nombre ?? "Proveedor"}</p>
                <p className="fp-sub">
                  {p.fecha_factura ?? ""} · Total {p.total != null ? fmt(p.total) : "—"} ·{" "}
                  {cuenta("costo_item")} con costo · {cuenta("agregar_existente")} por agregar · {cuenta("crear_producto")} nuevos · {cuenta("ignorar")} no mercancía
                </p>
              </div>
              <div className="fp-actions">
                <button className="fp-btn" disabled={busy || pend.length === 0} onClick={() => aprobarTodo(p)}>
                  <Check size={11} />{busy ? "Aplicando…" : "Aprobar factura"}
                </button>
                <button className="fp-btn danger" disabled={busy} onClick={() => descartarFactura(p)}><X size={11} />Descartar</button>
              </div>
            </div>
            {p.factura_propuesta_items.map(it => {
              const e = edits[it.id] || {}
              return (
                <div key={it.id} className={`fp-row ${it.estado !== "pendiente" ? "done" : ""}`}>
                  <div>
                    <p className="fp-desc"><span className={`fp-tag ${it.accion}`}>{ACCION_LABEL[it.accion]}</span>{it.descripcion}</p>
                    <p className="fp-line">
                      {it.cantidad} × {fmt(it.costo_unitario)} = {fmt(it.cantidad * it.costo_unitario)}
                      {it.products?.name && it.accion !== "crear_producto" && <> · → <b>{it.products.name}</b></>}
                      {it.nota && <> · {it.nota}</>}
                      {it.estado === "aplicado" && " · ✓ aplicado"}
                      {it.estado === "descartado" && " · descartado"}
                    </p>
                    {it.estado === "pendiente" && it.accion === "crear_producto" && (
                      <div className="fp-edit">
                        <input className="fp-inp" style={{ minWidth: 220 }} value={e.nombre ?? it.nuevo_nombre ?? it.descripcion}
                          onChange={ev => setEdits(s => ({ ...s, [it.id]: { ...e, nombre: ev.target.value } }))} aria-label="Nombre del producto nuevo" />
                        <input className="fp-inp" style={{ width: 110 }} type="number" min={0} placeholder="Precio venta"
                          value={e.precio ?? (it.nuevo_precio_venta != null ? String(it.nuevo_precio_venta) : "")}
                          onChange={ev => setEdits(s => ({ ...s, [it.id]: { ...e, precio: ev.target.value } }))} aria-label="Precio de venta" />
                      </div>
                    )}
                    {buscando === it.id && (
                      <div style={{ marginTop: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Search size={12} aria-hidden />
                          <input className="fp-inp" autoFocus placeholder="Buscar el producto en el sistema…" value={q} onChange={ev => setQ(ev.target.value)} />
                          <button className="fp-btn ghost" onClick={() => { setBuscando(null); setQ("") }}>Cerrar</button>
                        </div>
                        {resultados.length > 0 && (
                          <div className="fp-dd">
                            {resultados.map(r => <div key={r.id} className="fp-dd-item" onClick={() => elegirExistente(it, r)}>{r.name}</div>)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {it.estado === "pendiente" && (
                    <div className="fp-actions">
                      {it.accion !== "ignorar" && (
                        <button className="fp-btn ghost" title="Este producto ya existe en el sistema: elegir cuál es"
                          onClick={() => { setBuscando(it.id); setQ("") }}>Es otro</button>
                      )}
                      <button className="fp-btn danger" title="No aplicar esta línea" onClick={() => descartar(it)}><X size={11} /></button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}
    </>
  )
}
