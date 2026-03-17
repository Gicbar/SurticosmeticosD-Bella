"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { ExpenseDialog } from "@/components/expense-dialog"
import { showError, showConfirm, showSuccess } from "@/lib/sweetalert"
import { Edit, Trash2, Calendar, DollarSign, Tag, Receipt } from "lucide-react"

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');
.et {
  font-family:'DM Sans',sans-serif;
  --p:    var(--primary,#984ca8);
  --p10:  rgba(var(--primary-rgb,152,76,168),.10);
  --txt:  #1a1a18;
  --muted:rgba(26,26,24,.45);
  --border:rgba(26,26,24,.08);
  --row:  rgba(26,26,24,.02);
  --danger:#dc2626;
}
.et-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; }
table.et-tbl { width:100%; border-collapse:collapse; min-width:640px; }
.et-tbl thead tr { border-bottom:2px solid var(--border); background:var(--row); }
.et-tbl th {
  padding:9px 13px; font-size:8px; font-weight:700;
  letter-spacing:.2em; text-transform:uppercase; color:var(--muted); text-align:left; white-space:nowrap;
}
.et-tbl th.r { text-align:right; }
.et-tbl tbody tr { border-bottom:1px solid var(--border); transition:background .1s; }
.et-tbl tbody tr:last-child { border-bottom:none; }
.et-tbl tbody tr:hover { background:var(--row); }
.et-tbl td { padding:12px 13px; font-size:12px; color:var(--txt); vertical-align:middle; }
.et-tbl td.r { text-align:right; }

/* Fecha */
.et-date { display:flex; align-items:flex-start; gap:5px; font-size:11px; color:var(--muted); }
.et-date svg { width:11px; height:11px; margin-top:2px; flex-shrink:0; }

/* Descripción */
.et-desc { display:flex; align-items:center; gap:7px; font-weight:500; }
.et-desc svg { width:13px; height:13px; color:var(--muted); flex-shrink:0; }

/* Badge categoría */
.et-cat { display:inline-flex; align-items:center; gap:4px; padding:2px 9px; font-size:9px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; }
.et-cat svg { width:9px; height:9px; }
.et-cat.operativos { background:var(--p10); color:var(--p); }
.et-cat.generales  { background:rgba(26,26,24,.06); color:var(--muted); }
.et-cat.default    { background:rgba(26,26,24,.04); color:var(--muted); border:1px solid var(--border); }

/* Monto */
.et-amount { display:flex; align-items:center; justify-content:flex-end; gap:4px; }
.et-amount svg { width:11px; height:11px; color:var(--danger); }
.et-money { font-family:'Cormorant Garamond',Georgia,serif; font-size:15px; font-weight:500; color:var(--danger); }

/* Acciones */
.et-actions { display:flex; justify-content:flex-end; gap:5px; }
.et-btn { width:30px; height:30px; border:1px solid var(--border); background:#fff; display:flex; align-items:center; justify-content:center; color:var(--muted); cursor:pointer; text-decoration:none; transition:border-color .14s, color .14s, background .14s; }
.et-btn:hover     { border-color:var(--p); color:var(--p); background:var(--p10); }
.et-btn.del:hover { border-color:var(--danger); color:var(--danger); background:rgba(220,38,38,.05); }
.et-btn svg { width:12px; height:12px; }

/* Vacío */
.et-empty { display:flex; flex-direction:column; align-items:center; gap:10px; padding:52px 20px; text-align:center; }
.et-empty-ico { width:44px; height:44px; background:rgba(220,38,38,.07); display:flex; align-items:center; justify-content:center; border-radius:50%; }
.et-empty-ico svg { color:var(--danger); opacity:.3; width:18px; height:18px; }
.et-empty-t { font-size:13px; font-weight:500; color:var(--txt); margin:0; }
`

type Expense = { id:string; description:string; amount:number; category:string|null; date:string }

// Muestra fecha y hora en zona Colombia usando Intl (sin librerías externas)
const FMT = (iso: string): { fecha: string; hora: string } => {
  try {
    const d = new Date(iso)
    const fecha = new Intl.DateTimeFormat("es-CO", {
      timeZone: "America/Bogota",
      day: "2-digit", month: "short", year: "numeric",
    }).format(d)
    const hora = new Intl.DateTimeFormat("es-CO", {
      timeZone: "America/Bogota",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: true,
    }).format(d)
    return { fecha, hora }
  } catch {
    return { fecha: iso, hora: "" }
  }
}

const COP = (n: number|string|null|undefined): string => {
  const v = typeof n === "string" ? parseFloat(n) : n
  if (v == null || isNaN(v as number)) return "$0"
  return (v as number).toLocaleString("es-CO", { style:"currency", currency:"COP", minimumFractionDigits:0 })
}

export function ExpensesTable({ expenses, companyId }: { expenses: Expense[]; companyId: string }) {
  const router = useRouter()
  const [catMap, setCatMap] = useState<Record<number, string>>({})

  useEffect(() => {
    createClient().from("categories_expense").select("id, name")
      .then(({ data }) => {
        if (data) {
          const m: Record<number, string> = {}
          data.forEach(c => { m[c.id] = c.name })
          setCatMap(m)
        }
      })
  }, [])

  const handleDelete = async (id: string) => {
    const ok = await showConfirm("¿Eliminar este gasto?", "Esta acción es irreversible")
    if (!ok) return
    const { error } = await createClient().from("expenses")
      .delete().eq("id", id).eq("company_id", companyId)
    if (error) showError(error.message, "Error al eliminar")
    else { await showSuccess("Gasto eliminado"); router.refresh() }
  }

  const getCatClass = (cat: string|null) => {
    if (!cat) return "default"
    if (cat === "operativos" || catMap[Number(cat)]?.toLowerCase().includes("operat")) return "operativos"
    if (cat === "generales"  || catMap[Number(cat)]?.toLowerCase().includes("general")) return "generales"
    return "default"
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="et">
        {expenses.length === 0 ? (
          <div className="et-empty">
            <div className="et-empty-ico"><Receipt /></div>
            <p className="et-empty-t">No hay gastos registrados</p>
          </div>
        ) : (
          <div className="et-scroll">
            <table className="et-tbl">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Descripción</th>
                  <th>Categoría</th>
                  <th className="r">Monto</th>
                  <th className="r">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e.id}>
                    <td>
                      {(() => {
                        const { fecha, hora } = FMT(e.date)
                        return (
                          <div className="et-date">
                            <Calendar aria-hidden />
                            <div>
                              <div>{fecha}</div>
                              {hora && (
                                <div style={{ fontSize: 10, opacity: 0.65, marginTop: 2 }}>{hora}</div>
                              )}
                            </div>
                          </div>
                        )
                      })()}
                    </td>
                    <td>
                      <div className="et-desc">
                        <Receipt aria-hidden />{e.description}
                      </div>
                    </td>
                    <td>
                      <span className={`et-cat ${getCatClass(e.category)}`}>
                        <Tag aria-hidden />
                        {e.category ? (catMap[Number(e.category)] || e.category) : "Sin categoría"}
                      </span>
                    </td>
                    <td className="r">
                      <div className="et-amount">
                        <DollarSign aria-hidden />
                        <span className="et-money">{COP(e.amount)}</span>
                      </div>
                    </td>
                    <td className="r">
                      <div className="et-actions">
                        <ExpenseDialog expense={e} companyId={companyId}>
                          <button className="et-btn" aria-label="Editar gasto">
                            <Edit aria-hidden />
                          </button>
                        </ExpenseDialog>
                        <button className="et-btn del" onClick={() => handleDelete(e.id)} aria-label="Eliminar gasto">
                          <Trash2 aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
