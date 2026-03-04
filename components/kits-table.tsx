"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { showConfirm, showSuccess, showError } from "@/lib/sweetalert"
import { Edit2, Trash2, Layers, Hash, Package, ToggleLeft, ToggleRight } from "lucide-react"
import Link from "next/link"

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');

.kt {
  font-family:'DM Sans',sans-serif;
  --p:      var(--primary,#984ca8);
  --p10:    rgba(var(--primary-rgb,152,76,168),.10);
  --txt:    #1a1a18;
  --muted:  rgba(26,26,24,.45);
  --border: rgba(26,26,24,.08);
  --row:    rgba(26,26,24,.02);
  --ok:     #16a34a;
  --danger: #dc2626;
}

.kt-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; }
table.kt-tbl { width:100%; border-collapse:collapse; min-width:620px; }
.kt-tbl thead tr { border-bottom:2px solid var(--border); background:var(--row); }
.kt-tbl th {
  padding:9px 13px; font-size:8px; font-weight:700;
  letter-spacing:.2em; text-transform:uppercase; color:var(--muted); text-align:left; white-space:nowrap;
}
.kt-tbl th.c { text-align:center; }
.kt-tbl th.r { text-align:right; }
.kt-tbl tbody tr { border-bottom:1px solid var(--border); transition:background .1s; }
.kt-tbl tbody tr:last-child { border-bottom:none; }
.kt-tbl tbody tr:hover { background:var(--row); }
.kt-tbl td { padding:12px 13px; font-size:12px; color:var(--txt); vertical-align:middle; }
.kt-tbl td.c { text-align:center; }
.kt-tbl td.r { text-align:right; }

/* Código numérico */
.kt-code {
  display:inline-flex; align-items:center; justify-content:center;
  width:40px; height:40px; background:var(--p10);
  font-family:'Cormorant Garamond',serif; font-size:17px; font-weight:500; color:var(--p);
  flex-shrink:0;
}

/* Kit nombre */
.kt-name-cell { display:flex; align-items:center; gap:10px; }
.kt-name-ico  { width:30px; height:30px; background:var(--p10); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.kt-name-ico svg { color:var(--p); width:13px; height:13px; }
.kt-name-text { font-weight:500; }
.kt-name-desc { font-size:10px; color:var(--muted); margin-top:1px; }

/* Badge items */
.kt-items-badge {
  display:inline-flex; align-items:center; gap:4px;
  padding:3px 9px; font-size:10px; font-weight:600;
  background:var(--p10); color:var(--p);
}
.kt-items-badge svg { width:9px; height:9px; }

/* Toggle activo */
.kt-toggle {
  display:inline-flex; align-items:center; gap:6px;
  padding:4px 10px; border:none; cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:10px; font-weight:600;
  letter-spacing:.08em; text-transform:uppercase; transition:all .14s;
  background:none;
}
.kt-toggle.on  { color:var(--ok); }
.kt-toggle.off { color:var(--muted); }
.kt-toggle svg { width:16px; height:16px; }

/* Acciones */
.kt-actions { display:flex; justify-content:flex-end; gap:5px; }
.kt-btn {
  width:30px; height:30px; border:1px solid var(--border); background:#fff;
  display:flex; align-items:center; justify-content:center;
  color:var(--muted); text-decoration:none;
  transition:border-color .14s, color .14s, background .14s; cursor:pointer;
}
.kt-btn:hover     { border-color:var(--p); color:var(--p); background:var(--p10); }
.kt-btn.del:hover { border-color:var(--danger); color:var(--danger); background:rgba(220,38,38,.05); }
.kt-btn svg { width:13px; height:13px; }
`

type KitRow = {
  id: string; code: number; name: string; description: string | null
  is_active: boolean; created_at: string
  product_kit_items: { id: string; quantity: number; unit_price_in_kit: number }[]
}

export function KitsTable({ kits, companyId }: { kits: KitRow[]; companyId: string }) {
  const router = useRouter()
  const [toggling, setToggling] = useState<string | null>(null)

  const handleToggle = async (kit: KitRow) => {
    setToggling(kit.id)
    const { error } = await createClient()
      .from("product_kits")
      .update({ is_active: !kit.is_active })
      .eq("id", kit.id)
      .eq("company_id", companyId)
    if (error) showError(error.message)
    else router.refresh()
    setToggling(null)
  }

  const handleDelete = async (kit: KitRow) => {
    const ok = await showConfirm(
      `¿Eliminar kit "${kit.name}"?`,
      "Se eliminarán todos los productos del kit. Esta acción es irreversible."
    )
    if (!ok) return
    const { error } = await createClient()
      .from("product_kits")
      .delete()
      .eq("id", kit.id)
      .eq("company_id", companyId)
    if (error) showError(error.message)
    else { await showSuccess("Kit eliminado"); router.refresh() }
  }

  function COP(n: number) {
    return n.toLocaleString("es-CO", { style:"currency", currency:"COP", minimumFractionDigits:0 })
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="kt">
        <div className="kt-scroll">
          <table className="kt-tbl">
            <thead>
              <tr>
                <th>Código</th>
                <th>Kit</th>
                <th className="c">Productos</th>
                <th className="r">Precio total kit</th>
                <th className="c">Estado</th>
                <th className="r">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {kits.map(kit => {
                const totalKit = kit.product_kit_items.reduce(
                  (s, i) => s + i.unit_price_in_kit * i.quantity, 0
                )
                const totalItems = kit.product_kit_items.reduce((s, i) => s + i.quantity, 0)

                return (
                  <tr key={kit.id}>
                    {/* Código */}
                    <td>
                      <span className="kt-code">{kit.code}</span>
                    </td>

                    {/* Nombre */}
                    <td>
                      <div className="kt-name-cell">
                        <div className="kt-name-ico" aria-hidden><Layers /></div>
                        <div>
                          <div className="kt-name-text">{kit.name}</div>
                          {kit.description && (
                            <div className="kt-name-desc">
                              {kit.description.length > 50
                                ? kit.description.slice(0, 50) + "…"
                                : kit.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Items */}
                    <td className="c">
                      <span className="kt-items-badge">
                        <Package aria-hidden />
                        {totalItems} ud{totalItems !== 1 ? "s" : ""}
                        <span style={{ opacity:.5 }}>·</span>
                        {kit.product_kit_items.length} ref
                      </span>
                    </td>

                    {/* Precio */}
                    <td className="r">
                      <span style={{
                        fontFamily:"'Cormorant Garamond',serif",
                        fontSize:15, fontWeight:500, color:"var(--p)"
                      }}>
                        {COP(totalKit)}
                      </span>
                    </td>

                    {/* Toggle */}
                    <td className="c">
                      <button
                        className={`kt-toggle ${kit.is_active ? "on" : "off"}`}
                        onClick={() => !toggling && handleToggle(kit)}
                        disabled={toggling === kit.id}
                        aria-label={kit.is_active ? "Desactivar kit" : "Activar kit"}
                        title={kit.is_active ? "Activo — clic para desactivar" : "Inactivo — clic para activar"}
                      >
                        {kit.is_active
                          ? <><ToggleRight aria-hidden />Activo</>
                          : <><ToggleLeft aria-hidden />Inactivo</>
                        }
                      </button>
                    </td>

                    {/* Acciones */}
                    <td className="r">
                      <div className="kt-actions">
                        <Link
                          href={`/dashboard/kits/${kit.id}/edit`}
                          className="kt-btn"
                          aria-label={`Editar kit ${kit.name}`}
                        >
                          <Edit2 aria-hidden />
                        </Link>
                        <button
                          className="kt-btn del"
                          onClick={() => handleDelete(kit)}
                          aria-label={`Eliminar kit ${kit.name}`}
                        >
                          <Trash2 aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
