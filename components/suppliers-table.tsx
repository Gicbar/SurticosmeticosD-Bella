"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { showError, showConfirm, showSuccess } from "@/lib/sweetalert"
import { Edit, Trash2, Truck, Calendar, User, Phone, Mail, MapPin } from "lucide-react"
import Link from "next/link"

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');
.st {
  font-family:'DM Sans',sans-serif;
  --p:    var(--primary,#984ca8);
  --p10:  rgba(var(--primary-rgb,152,76,168),.10);
  --txt:  #1a1a18;
  --muted:rgba(26,26,24,.45);
  --border:rgba(26,26,24,.08);
  --row:  rgba(26,26,24,.02);
  --danger:#dc2626;
}
.st-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; }
table.st-tbl { width:100%; border-collapse:collapse; min-width:680px; }
.st-tbl thead tr { border-bottom:2px solid var(--border); background:var(--row); }
.st-tbl th {
  padding:9px 13px; font-size:8px; font-weight:700;
  letter-spacing:.2em; text-transform:uppercase; color:var(--muted); text-align:left; white-space:nowrap;
}
.st-tbl th.r { text-align:right; }
.st-tbl tbody tr { border-bottom:1px solid var(--border); transition:background .1s; }
.st-tbl tbody tr:last-child { border-bottom:none; }
.st-tbl tbody tr:hover { background:var(--row); }
.st-tbl td { padding:12px 13px; font-size:12px; color:var(--txt); vertical-align:middle; }
.st-tbl td.r { text-align:right; }
.st-name { display:flex; align-items:center; gap:7px; font-weight:500; }
.st-name-ico { width:24px; height:24px; background:var(--p10); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.st-name-ico svg { color:var(--p); width:12px; height:12px; }
.st-cell { display:flex; align-items:center; gap:5px; }
.st-cell svg { width:11px; height:11px; color:var(--muted); flex-shrink:0; }
.st-cell.muted { color:var(--muted); }
.st-phone { display:inline-block; padding:1px 8px; background:rgba(26,26,24,.05); border:1px solid var(--border); font-family:monospace; font-size:10px; color:var(--txt); }
.st-actions { display:flex; justify-content:flex-end; gap:5px; }
.st-btn { width:30px; height:30px; border:1px solid var(--border); background:#fff; display:flex; align-items:center; justify-content:center; color:var(--muted); text-decoration:none; transition:border-color .14s, color .14s, background .14s; }
.st-btn:hover     { border-color:var(--p); color:var(--p); background:var(--p10); }
.st-btn.del:hover { border-color:var(--danger); color:var(--danger); background:rgba(220,38,38,.05); }
.st-btn svg { width:13px; height:13px; }
`

type Supplier = {
  id: string; name: string; contact: string | null; phone: string | null
  email: string | null; address: string | null; created_at: string
}

const FMT = (s: string) => {
  try { return new Date(s).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) }
  catch { return s }
}

export function SuppliersTable({ suppliers, companyId }: { suppliers: Supplier[]; companyId: string }) {
  const router = useRouter()

  const handleDelete = async (id: string, name: string) => {
    const ok = await showConfirm(`¿Eliminar "${name}"?`, "Esta acción es irreversible")
    if (!ok) return
    const { error } = await createClient().from("suppliers")
      .delete().eq("id", id).eq("company_id", companyId)
    if (error) showError(error.message, "Error al eliminar")
    else { await showSuccess("Proveedor eliminado"); router.refresh() }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="st">
        <div className="st-scroll">
          <table className="st-tbl">
            <thead>
              <tr>
                <th>Proveedor</th>
                <th>Contacto</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Dirección</th>
                <th>Registro</th>
                <th className="r">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(s => (
                <tr key={s.id}>
                  <td>
                    <div className="st-name">
                      <div className="st-name-ico" aria-hidden><Truck /></div>
                      {s.name}
                    </div>
                  </td>
                  <td>
                    <div className={`st-cell${!s.contact ? " muted" : ""}`}>
                      <User aria-hidden />{s.contact || "—"}
                    </div>
                  </td>
                  <td>
                    <div className="st-cell">
                      <Phone aria-hidden />
                      {s.phone ? <span className="st-phone">{s.phone}</span> : <span className="muted" style={{ color:"rgba(26,26,24,.4)" }}>—</span>}
                    </div>
                  </td>
                  <td>
                    <div className={`st-cell${!s.email ? " muted" : ""}`}>
                      <Mail aria-hidden />
                      <span style={!s.email ? { color:"rgba(26,26,24,.4)" } : {}}>
                        {s.email || "—"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className={`st-cell${!s.address ? " muted" : ""}`}>
                      <MapPin aria-hidden />
                      <span style={!s.address ? { color:"rgba(26,26,24,.4)" } : {}} title={s.address || ""}>
                        {s.address ? (s.address.length > 26 ? s.address.slice(0, 26) + "…" : s.address) : "—"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="st-cell" style={{ color:"rgba(26,26,24,.4)", fontSize:11 }}>
                      <Calendar aria-hidden />{FMT(s.created_at)}
                    </div>
                  </td>
                  <td className="r">
                    <div className="st-actions">
                      <Link href={`/dashboard/suppliers/${s.id}/edit`} className="st-btn" aria-label={`Editar ${s.name}`}>
                        <Edit aria-hidden />
                      </Link>
                      <button className="st-btn del" onClick={() => handleDelete(s.id, s.name)} aria-label={`Eliminar ${s.name}`}>
                        <Trash2 aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
