"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Percent, RefreshCw, ChevronDown, ChevronUp, Users } from "lucide-react"

const CM_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  .cm-root {
    font-family: 'DM Sans', sans-serif;
    --cm-p: var(--primary, #984ca8); --cm-p10: rgba(var(--primary-rgb,152,76,168), 0.10);
    --cm-txt: #1a1a18; --cm-muted: rgba(26,26,24,0.45); --cm-border: rgba(26,26,24,0.08);
  }
  .cm-filters { display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 16px; }
  .cm-fld { display: flex; flex-direction: column; gap: 5px; }
  .cm-lbl { font-size: 9px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: var(--cm-muted); }
  .cm-inp { height: 38px; padding: 0 12px; border: 1px solid var(--cm-border); font-family: 'DM Sans', sans-serif; font-size: 13px; }
  .cm-btn-refresh { height: 38px; width: 38px; border: 1px solid var(--cm-border); background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--cm-muted); }

  .cm-stats { display: grid; gap: 12px; grid-template-columns: repeat(2,1fr); margin-bottom: 16px; }
  @media (min-width: 640px) { .cm-stats { grid-template-columns: repeat(3,1fr); } }
  .cm-stat { background: #fff; border: 1px solid var(--cm-border); padding: 16px 18px; }
  .cm-stat-label { font-size: 9px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--cm-muted); margin: 0 0 8px; }
  .cm-stat-val { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 24px; font-weight: 400; margin: 0; line-height: 1; color: var(--cm-txt); }
  .cm-stat-sub { font-size: 10px; color: var(--cm-muted); margin: 4px 0 0; }

  .cm-card { background: #fff; border: 1px solid var(--cm-border); overflow: hidden; }
  .cm-card-hd { padding: 14px 18px 12px; border-bottom: 1px solid var(--cm-border); display: flex; align-items: center; gap: 8px; }
  .cm-card-hd-icon { width: 26px; height: 26px; background: var(--cm-p10); display: flex; align-items: center; justify-content: center; }
  .cm-card-hd-icon svg { color: var(--cm-p); width: 13px; height: 13px; }
  .cm-card-title { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--cm-txt); margin: 0; }

  .cm-table { width: 100%; border-collapse: collapse; }
  .cm-th { padding: 10px 16px; text-align: left; background: rgba(26,26,24,0.02); font-size: 9px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: var(--cm-muted); border-bottom: 1px solid var(--cm-border); }
  .cm-th:last-child { text-align: right; }
  .cm-tr { border-bottom: 1px solid var(--cm-border); cursor: pointer; }
  .cm-tr:hover { background: rgba(26,26,24,0.02); }
  .cm-td { padding: 12px 16px; font-size: 13px; color: var(--cm-txt); }
  .cm-td:last-child { text-align: right; }
  .cm-amt { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 15px; color: var(--cm-p); }

  .cm-expand-body { padding: 12px 20px; border-top: 1px solid var(--cm-border); background: rgba(26,26,24,0.015); }
  .cm-item-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 12px; border-bottom: 1px solid var(--cm-border); }
  .cm-item-row:last-child { border-bottom: none; }

  .cm-empty { padding: 48px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px; }
  .cm-empty-icon { width: 48px; height: 48px; background: var(--cm-p10); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
  .cm-empty-icon svg { color: var(--cm-p); opacity: .5; width: 20px; height: 20px; }
  .cm-spinner-wrap { padding: 36px; display: flex; justify-content: center; }
  .cm-spinner { width: 22px; height: 22px; border: 2px solid var(--cm-border); border-top-color: var(--cm-p); border-radius: 50%; animation: cm-spin .7s linear infinite; }
  @keyframes cm-spin { to { transform: rotate(360deg); } }
`

type RawItem = {
  id: string
  quantity: number
  subtotal: number
  products: { name: string; comision_porcentaje: number } | null
  sales: { sale_date: string; created_by: string | null } | null
}

type VendedorGroup = {
  vendedorId: string
  email: string
  totalComision: number
  items: { producto: string; subtotal: number; porcentaje: number; comision: number }[]
}

const fmt = (v: number) =>
  v.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })

const todayISO = () => new Date().toISOString().slice(0, 10)
const daysAgoISO = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10) }

export function ComisionesInterface({ companyId }: { companyId: string }) {
  const [desde, setDesde] = useState(daysAgoISO(30))
  const [hasta, setHasta] = useState(todayISO())
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState<VendedorGroup[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("sale_items")
        .select("id, quantity, subtotal, products(name, comision_porcentaje), sales!inner(sale_date, created_by)")
        .eq("company_id", companyId)
        .gte("sales.sale_date", desde)
        .lte("sales.sale_date", `${hasta}T23:59:59`)

      if (error) throw error
      const rows = (data || []) as unknown as RawItem[]
      const commissionable = rows.filter(r => Number(r.products?.comision_porcentaje || 0) > 0 && r.sales?.created_by)

      const byVendedor = new Map<string, VendedorGroup>()
      for (const r of commissionable) {
        const vid = r.sales!.created_by as string
        const pct = Number(r.products!.comision_porcentaje)
        const comision = Number(r.subtotal) * pct / 100
        if (!byVendedor.has(vid)) byVendedor.set(vid, { vendedorId: vid, email: vid, totalComision: 0, items: [] })
        const g = byVendedor.get(vid)!
        g.totalComision += comision
        g.items.push({ producto: r.products!.name, subtotal: Number(r.subtotal), porcentaje: pct, comision })
      }

      const ids = Array.from(byVendedor.keys())
      if (ids.length > 0) {
        const { data: userRows } = await supabase
          .from("user_permissions_with_email")
          .select("user_id, email")
          .in("user_id", ids)
        for (const u of userRows || []) {
          const g = byVendedor.get(u.user_id)
          if (g) g.email = u.email
        }
      }

      setGroups(Array.from(byVendedor.values()).sort((a, b) => b.totalComision - a.totalComision))
    } catch (err) {
      console.error(err)
    } finally { setLoading(false) }
  }, [companyId, desde, hasta])

  useEffect(() => { load() }, [load])

  const totalComisiones = groups.reduce((s, g) => s + g.totalComision, 0)
  const totalItems = groups.reduce((s, g) => s + g.items.length, 0)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CM_CSS }} />
      <div className="cm-root">

        <div className="cm-filters">
          <div className="cm-fld">
            <span className="cm-lbl">Desde</span>
            <input className="cm-inp" type="date" value={desde} onChange={e => setDesde(e.target.value)} />
          </div>
          <div className="cm-fld">
            <span className="cm-lbl">Hasta</span>
            <input className="cm-inp" type="date" value={hasta} onChange={e => setHasta(e.target.value)} />
          </div>
          <button className="cm-btn-refresh" onClick={load} title="Actualizar"><RefreshCw size={13} /></button>
        </div>

        <div className="cm-stats">
          <div className="cm-stat">
            <p className="cm-stat-label">Total comisiones</p>
            <p className="cm-stat-val">{fmt(totalComisiones)}</p>
            <p className="cm-stat-sub">En el rango seleccionado</p>
          </div>
          <div className="cm-stat">
            <p className="cm-stat-label">Vendedores con comisión</p>
            <p className="cm-stat-val">{groups.length}</p>
            <p className="cm-stat-sub">Con ventas de productos comisionables</p>
          </div>
          <div className="cm-stat">
            <p className="cm-stat-label">Ítems comisionados</p>
            <p className="cm-stat-val">{totalItems}</p>
            <p className="cm-stat-sub">Líneas de venta con % &gt; 0</p>
          </div>
        </div>

        <div className="cm-card">
          <div className="cm-card-hd">
            <div className="cm-card-hd-icon"><Percent /></div>
            <p className="cm-card-title">Comisiones por vendedor</p>
          </div>
          {loading ? (
            <div className="cm-spinner-wrap"><div className="cm-spinner" /></div>
          ) : groups.length === 0 ? (
            <div className="cm-empty">
              <div className="cm-empty-icon"><Users /></div>
              <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>Sin comisiones en este rango</p>
              <p style={{ fontSize: 11, color: "var(--cm-muted)", margin: 0 }}>
                Asigna un % de comisión a un producto en su ficha para que aparezca aquí
              </p>
            </div>
          ) : (
            <table className="cm-table">
              <thead>
                <tr>
                  <th className="cm-th">Vendedor</th>
                  <th className="cm-th">Ítems</th>
                  <th className="cm-th">Comisión total</th>
                  <th className="cm-th" style={{ width: 32 }}></th>
                </tr>
              </thead>
              <tbody>
                {groups.map(g => {
                  const isExpanded = expandedId === g.vendedorId
                  return (
                    <>
                      <tr key={g.vendedorId} className="cm-tr" onClick={() => setExpandedId(isExpanded ? null : g.vendedorId)}>
                        <td className="cm-td">{g.email}</td>
                        <td className="cm-td">{g.items.length}</td>
                        <td className="cm-td"><span className="cm-amt">{fmt(g.totalComision)}</span></td>
                        <td className="cm-td">{isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${g.vendedorId}-exp`}>
                          <td colSpan={4} style={{ padding: 0 }}>
                            <div className="cm-expand-body">
                              {g.items.map((it, i) => (
                                <div key={i} className="cm-item-row">
                                  <span>{it.producto} ({it.porcentaje}%)</span>
                                  <span>{fmt(it.comision)}</span>
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
          )}
        </div>
      </div>
    </>
  )
}
