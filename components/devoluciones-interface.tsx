"use client"
import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Undo2, ShieldAlert, ChevronDown, ChevronUp, RefreshCw,
  FileMinus2, ArrowDownCircle, ArrowUpCircle, Package, ArrowLeftRight,
} from "lucide-react"

const DV_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  .dv-root {
    font-family: 'DM Sans', sans-serif;
    --dv-p:      var(--primary, #984ca8);
    --dv-p10:    rgba(var(--primary-rgb,152,76,168), 0.10);
    --dv-txt:    #1a1a18;
    --dv-muted:  rgba(26,26,24,0.45);
    --dv-border: rgba(26,26,24,0.08);
    --dv-warn:   #b45309; --dv-warn10: rgba(180,83,9,0.08);
    --dv-ok:     #15803d; --dv-ok10:   rgba(21,128,61,0.08);
  }

  .dv-stats { display: grid; gap: 12px; grid-template-columns: repeat(2,1fr); }
  @media (min-width: 640px) { .dv-stats { grid-template-columns: repeat(3,1fr); } }
  .dv-stat { background: #fff; border: 1px solid var(--dv-border); padding: 16px 18px; }
  .dv-stat-label { font-size: 9px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--dv-muted); margin: 0 0 8px; }
  .dv-stat-val { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 24px; font-weight: 400; margin: 0; line-height: 1; color: var(--dv-txt); }
  .dv-stat-sub { font-size: 10px; color: var(--dv-muted); margin: 4px 0 0; }

  .dv-card { background: #fff; border: 1px solid var(--dv-border); overflow: hidden; }
  .dv-card-hd { padding: 14px 18px 12px; border-bottom: 1px solid var(--dv-border); display: flex; align-items: center; gap: 8px; }
  .dv-card-hd-icon { width: 26px; height: 26px; background: var(--dv-p10); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .dv-card-hd-icon svg { color: var(--dv-p); width: 13px; height: 13px; }
  .dv-card-title { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--dv-txt); margin: 0; }

  .dv-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .dv-table { width: 100%; border-collapse: collapse; }
  .dv-th { padding: 10px 16px; text-align: left; background: rgba(26,26,24,0.02); font-size: 9px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: var(--dv-muted); border-bottom: 1px solid var(--dv-border); white-space: nowrap; }
  .dv-th:last-child { text-align: right; }
  .dv-tr { border-bottom: 1px solid var(--dv-border); transition: background 0.12s; cursor: pointer; }
  .dv-tr:last-child { border-bottom: none; }
  .dv-tr:hover { background: rgba(26,26,24,0.02); }
  .dv-td { padding: 12px 16px; font-size: 13px; color: var(--dv-txt); vertical-align: middle; }
  .dv-td:last-child { text-align: right; }

  .dv-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; font-size: 9px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; white-space: nowrap; }
  .dv-badge.devolucion { background: var(--dv-p10);   color: var(--dv-p); }
  .dv-badge.garantia   { background: var(--dv-warn10); color: var(--dv-warn); }
  .dv-badge.credito    { background: var(--dv-ok10);   color: var(--dv-ok); }
  .dv-badge.debito     { background: var(--dv-warn10); color: var(--dv-warn); }

  .dv-amt { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 15px; font-weight: 400; }

  .dv-expand-body { padding: 14px 20px; border-top: 1px solid var(--dv-border); background: rgba(26,26,24,0.015); }
  .dv-item-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--dv-border); font-size: 12px; }
  .dv-item-row:last-child { border-bottom: none; }

  .dv-empty { padding: 48px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px; }
  .dv-empty-icon { width: 48px; height: 48px; background: var(--dv-p10); display: flex; align-items: center; justify-content: center; border-radius: 50%; }
  .dv-empty-icon svg { color: var(--dv-p); opacity: 0.5; width: 20px; height: 20px; }
  .dv-empty-title { font-size: 13px; font-weight: 500; color: var(--dv-txt); margin: 0; }
  .dv-empty-sub   { font-size: 11px; color: var(--dv-muted); margin: 0; }

  .dv-spinner-wrap { padding: 36px; display: flex; justify-content: center; }
  .dv-spinner { width: 22px; height: 22px; border: 2px solid var(--dv-border); border-top-color: var(--dv-p); border-radius: 50%; animation: dv-spin 0.7s linear infinite; }
  @keyframes dv-spin { to { transform: rotate(360deg); } }

  @media (max-width: 640px) { .dv-hide-mobile { display: none; } }
`

type ItemDevolucion = {
  id: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  products: { name: string } | null
}

type Devolucion = {
  id: string
  venta_id: string
  tipo: "devolucion" | "garantia"
  estado: string
  motivo: string | null
  monto_total: number
  reintegra_inventario: boolean
  creado_en: string
  clients: { name: string } | null
  devolucion_items?: ItemDevolucion[]
}

type Nota = {
  id: string
  tipo: "credito" | "debito"
  concepto: string
  valor: number
  creado_en: string
}

type Cambio = {
  id: string
  cantidad: number
  diferencia: number
  creado_en: string
  clients: { name: string } | null
  producto_anterior: { name: string } | null
  producto_nuevo: { name: string } | null
}

const fmt = (v: number) =>
  v.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })

export function DevolucionesInterface({ companyId }: { companyId: string }) {
  const [devoluciones, setDevoluciones] = useState<Devolucion[]>([])
  const [notas, setNotas]               = useState<Nota[]>([])
  const [cambios, setCambios]           = useState<Cambio[]>([])
  const [loading, setLoading]           = useState(true)
  const [expandedId, setExpandedId]     = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const [{ data: devs }, { data: nc }, { data: nd }, { data: cambiosData }] = await Promise.all([
        supabase.from("devoluciones")
          .select("id, venta_id, tipo, estado, motivo, monto_total, reintegra_inventario, creado_en, clients(name)")
          .eq("empresa_id", companyId).order("creado_en", { ascending: false }),
        supabase.from("notas_credito")
          .select("id, concepto, valor, creado_en")
          .eq("empresa_id", companyId).order("creado_en", { ascending: false }),
        supabase.from("notas_debito")
          .select("id, concepto, valor, creado_en")
          .eq("empresa_id", companyId).order("creado_en", { ascending: false }),
        supabase.from("cambios_producto")
          .select("id, cantidad, diferencia, creado_en, clients(name), producto_anterior:products!cambios_producto_producto_anterior_id_fkey(name), producto_nuevo:products!cambios_producto_producto_nuevo_id_fkey(name)")
          .eq("empresa_id", companyId).order("creado_en", { ascending: false }),
      ])
      setDevoluciones((devs || []) as unknown as Devolucion[])
      const notasCredito: Nota[] = (nc || []).map((n: any) => ({ ...n, tipo: "credito" as const }))
      const notasDebito:  Nota[] = (nd || []).map((n: any) => ({ ...n, tipo: "debito" as const }))
      setNotas([...notasCredito, ...notasDebito].sort((a, b) => b.creado_en.localeCompare(a.creado_en)))
      setCambios((cambiosData || []) as unknown as Cambio[])
    } finally { setLoading(false) }
  }, [companyId])

  useEffect(() => { load() }, [load])

  const loadItems = async (dev: Devolucion) => {
    if (dev.devolucion_items) return
    const supabase = createClient()
    const { data } = await supabase
      .from("devolucion_items")
      .select("id, cantidad, precio_unitario, subtotal, products(name)")
      .eq("devolucion_id", dev.id)
    setDevoluciones(prev => prev.map(d => d.id === dev.id ? { ...d, devolucion_items: (data || []) as any } : d))
  }

  const handleExpand = async (dev: Devolucion) => {
    if (expandedId === dev.id) { setExpandedId(null); return }
    setExpandedId(dev.id)
    await loadItems(dev)
  }

  const totalDevuelto = devoluciones.reduce((s, d) => s + Number(d.monto_total), 0)
  const totalGarantias = devoluciones.filter(d => d.tipo === "garantia").length
  const totalNotas = notas.reduce((s, n) => s + (n.tipo === "credito" ? Number(n.valor) : -Number(n.valor)), 0)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: DV_CSS }} />
      <div className="dv-root" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        <div className="dv-stats">
          <div className="dv-stat">
            <p className="dv-stat-label">Total devuelto</p>
            <p className="dv-stat-val">{fmt(totalDevuelto)}</p>
            <p className="dv-stat-sub">{devoluciones.length} devolucion{devoluciones.length !== 1 ? "es" : ""} registradas</p>
          </div>
          <div className="dv-stat">
            <p className="dv-stat-label">Garantías</p>
            <p className="dv-stat-val">{totalGarantias}</p>
            <p className="dv-stat-sub">De {devoluciones.length} casos totales</p>
          </div>
          <div className="dv-stat">
            <p className="dv-stat-label">Neto notas crédito/débito</p>
            <p className="dv-stat-val">{fmt(totalNotas)}</p>
            <p className="dv-stat-sub">{notas.length} nota{notas.length !== 1 ? "s" : ""} internas</p>
          </div>
        </div>

        <div className="dv-card">
          <div className="dv-card-hd">
            <div className="dv-card-hd-icon"><Undo2 /></div>
            <p className="dv-card-title">Devoluciones y garantías</p>
            <button onClick={load} title="Actualizar"
              style={{ marginLeft: "auto", background: "none", border: "1px solid var(--dv-border)", width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--dv-muted)" }}>
              <RefreshCw size={12} />
            </button>
          </div>
          {loading ? (
            <div className="dv-spinner-wrap"><div className="dv-spinner" /></div>
          ) : devoluciones.length === 0 ? (
            <div className="dv-empty">
              <div className="dv-empty-icon"><Package /></div>
              <p className="dv-empty-title">No hay devoluciones registradas</p>
              <p className="dv-empty-sub">Se registran desde el detalle de cada venta</p>
            </div>
          ) : (
            <div className="dv-table-wrap">
              <table className="dv-table">
                <thead>
                  <tr>
                    <th className="dv-th">Cliente</th>
                    <th className="dv-th">Tipo</th>
                    <th className="dv-th dv-hide-mobile">Motivo</th>
                    <th className="dv-th">Monto</th>
                    <th className="dv-th" style={{ width: 32 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {devoluciones.map(dev => {
                    const isExpanded = expandedId === dev.id
                    return (
                      <>
                        <tr key={dev.id} className="dv-tr" onClick={() => handleExpand(dev)}>
                          <td className="dv-td">
                            <p style={{ margin: 0, fontWeight: 500 }}>{dev.clients?.name ?? "—"}</p>
                            <p style={{ margin: "2px 0 0", fontSize: 10, color: "var(--dv-muted)" }}>{fmtDate(dev.creado_en)}</p>
                          </td>
                          <td className="dv-td">
                            <span className={`dv-badge ${dev.tipo}`}>
                              {dev.tipo === "garantia" ? <ShieldAlert size={9} /> : <Undo2 size={9} />}
                              {dev.tipo === "garantia" ? "Garantía" : "Devolución"}
                            </span>
                          </td>
                          <td className="dv-td dv-hide-mobile">
                            <span style={{ fontSize: 12, color: "var(--dv-muted)" }}>{dev.motivo || "—"}</span>
                          </td>
                          <td className="dv-td"><span className="dv-amt">{fmt(Number(dev.monto_total))}</span></td>
                          <td className="dv-td">
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${dev.id}-exp`}>
                            <td colSpan={5} style={{ padding: 0 }}>
                              <div className="dv-expand-body">
                                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--dv-muted)", margin: "0 0 8px" }}>
                                  Productos devueltos {dev.reintegra_inventario ? "· reintegrados al inventario" : "· NO reintegrados (dañados/vencidos)"}
                                </p>
                                {(dev.devolucion_items || []).map(it => (
                                  <div key={it.id} className="dv-item-row">
                                    <span>{it.products?.name ?? "Producto"} × {it.cantidad}</span>
                                    <span>{fmt(Number(it.subtotal))}</span>
                                  </div>
                                ))}
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

        <div className="dv-card">
          <div className="dv-card-hd">
            <div className="dv-card-hd-icon"><ArrowLeftRight /></div>
            <p className="dv-card-title">Cambios de producto</p>
          </div>
          {cambios.length === 0 ? (
            <div className="dv-empty">
              <div className="dv-empty-icon"><ArrowLeftRight /></div>
              <p className="dv-empty-title">No hay cambios de producto registrados</p>
              <p className="dv-empty-sub">Se registran desde el detalle de cada venta</p>
            </div>
          ) : (
            <div className="dv-table-wrap">
              <table className="dv-table">
                <thead>
                  <tr>
                    <th className="dv-th">Cliente</th>
                    <th className="dv-th">Producto</th>
                    <th className="dv-th dv-hide-mobile">Cant.</th>
                    <th className="dv-th">Diferencia</th>
                  </tr>
                </thead>
                <tbody>
                  {cambios.map(c => (
                    <tr key={c.id} className="dv-tr" style={{ cursor: "default" }}>
                      <td className="dv-td">
                        <p style={{ margin: 0, fontWeight: 500 }}>{c.clients?.name ?? "—"}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 10, color: "var(--dv-muted)" }}>{fmtDate(c.creado_en)}</p>
                      </td>
                      <td className="dv-td">
                        <span style={{ fontSize: 12 }}>
                          {c.producto_anterior?.name ?? "—"} <span style={{ color: "var(--dv-muted)" }}>→</span> {c.producto_nuevo?.name ?? "—"}
                        </span>
                      </td>
                      <td className="dv-td dv-hide-mobile">{c.cantidad}</td>
                      <td className="dv-td">
                        <span className="dv-amt" style={{ color: c.diferencia > 0 ? "var(--dv-warn)" : c.diferencia < 0 ? "var(--dv-ok)" : "var(--dv-muted)" }}>
                          {c.diferencia === 0 ? "Sin diferencia" : `${c.diferencia > 0 ? "+" : ""}${fmt(Number(c.diferencia))}`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="dv-card">
          <div className="dv-card-hd">
            <div className="dv-card-hd-icon"><FileMinus2 /></div>
            <p className="dv-card-title">Notas crédito / débito (internas)</p>
          </div>
          {notas.length === 0 ? (
            <div className="dv-empty">
              <div className="dv-empty-icon"><FileMinus2 /></div>
              <p className="dv-empty-title">Sin notas registradas</p>
              <p className="dv-empty-sub">Se registran desde el detalle de cada venta</p>
            </div>
          ) : (
            <div className="dv-table-wrap">
              <table className="dv-table">
                <thead>
                  <tr>
                    <th className="dv-th">Fecha</th>
                    <th className="dv-th">Tipo</th>
                    <th className="dv-th">Concepto</th>
                    <th className="dv-th">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {notas.map(n => (
                    <tr key={n.id} className="dv-tr" style={{ cursor: "default" }}>
                      <td className="dv-td">{fmtDate(n.creado_en)}</td>
                      <td className="dv-td">
                        <span className={`dv-badge ${n.tipo}`}>
                          {n.tipo === "credito" ? <ArrowDownCircle size={9} /> : <ArrowUpCircle size={9} />}
                          {n.tipo === "credito" ? "Crédito" : "Débito"}
                        </span>
                      </td>
                      <td className="dv-td">{n.concepto}</td>
                      <td className="dv-td"><span className="dv-amt">{fmt(Number(n.valor))}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </>
  )
}
