"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { showError, showConfirm, showSuccess } from "@/lib/sweetalert"
import { Edit, Trash2, Users, Mail, Phone, MapPin } from "lucide-react"
import Link from "next/link"

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');
.ct {
  font-family:'DM Sans',sans-serif;
  --p:    var(--primary,#984ca8);
  --p10:  rgba(var(--primary-rgb,152,76,168),.10);
  --txt:  #1a1a18;
  --muted:rgba(26,26,24,.45);
  --border:rgba(26,26,24,.08);
  --row:  rgba(26,26,24,.02);
  --danger:#dc2626;
}
.ct-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; }
table.ct-tbl { width:100%; border-collapse:collapse; min-width:560px; }
.ct-tbl thead tr { border-bottom:2px solid var(--border); background:var(--row); }
.ct-tbl th {
  padding:9px 13px; font-size:8px; font-weight:700;
  letter-spacing:.2em; text-transform:uppercase; color:var(--muted); text-align:left; white-space:nowrap;
}
.ct-tbl th.r { text-align:right; }
.ct-tbl tbody tr { border-bottom:1px solid var(--border); transition:background .1s; }
.ct-tbl tbody tr:last-child { border-bottom:none; }
.ct-tbl tbody tr:hover { background:var(--row); }
.ct-tbl td { padding:12px 13px; font-size:12px; color:var(--txt); vertical-align:middle; }
.ct-tbl td.r { text-align:right; }
.ct-name { display:flex; align-items:center; gap:7px; font-weight:500; }
.ct-name-ico { width:28px; height:28px; background:var(--p10); display:flex; align-items:center; justify-content:center; border-radius:50%; flex-shrink:0; }
.ct-name-ico svg { color:var(--p); width:12px; height:12px; }
.ct-contact { display:flex; flex-direction:column; gap:3px; }
.ct-contact-row { display:flex; align-items:center; gap:5px; font-size:11px; color:var(--muted); }
.ct-contact-row svg { width:10px; height:10px; flex-shrink:0; }
.ct-addr { display:flex; align-items:flex-start; gap:5px; font-size:11px; color:var(--muted); max-width:200px; }
.ct-addr svg { width:10px; height:10px; flex-shrink:0; margin-top:1px; }
.ct-actions { display:flex; justify-content:flex-end; gap:5px; }
.ct-btn { width:30px; height:30px; border:1px solid var(--border); background:#fff; display:flex; align-items:center; justify-content:center; color:var(--muted); text-decoration:none; transition:border-color .14s, color .14s, background .14s; }
.ct-btn:hover     { border-color:var(--p); color:var(--p); background:var(--p10); }
.ct-btn.del:hover { border-color:var(--danger); color:var(--danger); background:rgba(220,38,38,.05); }
.ct-btn svg { width:13px; height:13px; }
.ct-empty { display:flex; flex-direction:column; align-items:center; gap:10px; padding:52px 20px; text-align:center; }
.ct-empty-ico { width:44px; height:44px; background:var(--p10); display:flex; align-items:center; justify-content:center; border-radius:50%; }
.ct-empty-ico svg { color:var(--p); opacity:.3; width:18px; height:18px; }
.ct-empty-t { font-size:13px; font-weight:500; color:var(--txt); margin:0; }
`

export function ClientsTable({ clients, companyId }: { clients: any[]; companyId: string }) {
  const router = useRouter()

  const handleDelete = async (id: string, name: string) => {
    const ok = await showConfirm(`¿Eliminar "${name}"?`, "Esta acción es irreversible")
    if (!ok) return
    const { error } = await createClient().from("clients")
      .delete().eq("id", id).eq("company_id", companyId)
    if (error) showError(error.message || "Error al eliminar")
    else { await showSuccess("Cliente eliminado"); router.refresh() }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="ct">
        {clients.length === 0 ? (
          <div className="ct-empty">
            <div className="ct-empty-ico"><Users /></div>
            <p className="ct-empty-t">No hay clientes</p>
          </div>
        ) : (
          <div className="ct-scroll">
            <table className="ct-tbl">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Contacto</th>
                  <th>Dirección</th>
                  <th className="r">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className="ct-name">
                        <div className="ct-name-ico" aria-hidden>
                          <Users />
                        </div>
                        {c.name}
                      </div>
                    </td>
                    <td>
                      <div className="ct-contact">
                        {c.email
                          ? <div className="ct-contact-row"><Mail aria-hidden />{c.email}</div>
                          : <div className="ct-contact-row" style={{ opacity:.4 }}><Mail aria-hidden />—</div>
                        }
                        {c.phone
                          ? <div className="ct-contact-row"><Phone aria-hidden />{c.phone}</div>
                          : <div className="ct-contact-row" style={{ opacity:.4 }}><Phone aria-hidden />—</div>
                        }
                      </div>
                    </td>
                    <td>
                      <div className="ct-addr">
                        <MapPin aria-hidden />
                        <span style={!c.address ? { opacity:.4 } : {}}>
                          {c.address
                            ? (c.address.length > 35 ? c.address.slice(0, 35) + "…" : c.address)
                            : "—"
                          }
                        </span>
                      </div>
                    </td>
                    <td className="r">
                      <div className="ct-actions">
                        <Link href={`/dashboard/clients/${c.id}/edit`} className="ct-btn" aria-label={`Editar ${c.name}`}>
                          <Edit aria-hidden />
                        </Link>
                        <button className="ct-btn del" onClick={() => handleDelete(c.id, c.name)} aria-label={`Eliminar ${c.name}`}>
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
