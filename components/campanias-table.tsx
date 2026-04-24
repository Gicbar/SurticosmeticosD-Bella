"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { showConfirm, showSuccess, showError } from "@/lib/sweetalert"
import {
  Eye, XCircle, Megaphone, CalendarRange,
  CheckCircle, Zap, Send, Ban
} from "lucide-react"
import Link from "next/link"

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');

.ct2 {
  font-family:'DM Sans',sans-serif;
  --p:      var(--primary,#984ca8);
  --p10:    rgba(var(--primary-rgb,152,76,168),.10);
  --txt:    #1a1a18;
  --muted:  rgba(26,26,24,.45);
  --border: rgba(26,26,24,.08);
  --row:    rgba(26,26,24,.02);
  --ok:     #16a34a;
  --warn:   #d97706;
  --danger: #dc2626;
  --info:   #2563eb;
}

.ct2-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; }

table.ct2-tbl { width:100%; border-collapse:collapse; min-width:700px; }
.ct2-tbl thead tr { border-bottom:2px solid var(--border); background:var(--row); }
.ct2-tbl th {
  padding:9px 13px; font-size:8px; font-weight:700;
  letter-spacing:.2em; text-transform:uppercase; color:var(--muted); text-align:left; white-space:nowrap;
}
.ct2-tbl th.r { text-align:right; }
.ct2-tbl tbody tr { border-bottom:1px solid var(--border); transition:background .1s; }
.ct2-tbl tbody tr:last-child { border-bottom:none; }
.ct2-tbl tbody tr:hover { background:var(--row); }
.ct2-tbl td { padding:12px 13px; font-size:12px; color:var(--txt); vertical-align:middle; }
.ct2-tbl td.r { text-align:right; }

/* Nombre con icono */
.ct2-name { display:flex; align-items:center; gap:8px; }
.ct2-name-ico {
  width:30px; height:30px; background:var(--p10); flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
}
.ct2-name-ico svg { color:var(--p); width:13px; height:13px; }
.ct2-name-text { font-weight:500; font-size:12px; }
.ct2-name-desc { font-size:10px; color:var(--muted); margin-top:1px; }

/* Badge de estado */
.ct2-badge {
  display:inline-flex; align-items:center; gap:5px;
  padding:3px 9px; font-size:9px; font-weight:700;
  letter-spacing:.12em; text-transform:uppercase;
  white-space:nowrap;
}
.ct2-badge svg { width:9px; height:9px; flex-shrink:0; }
.ct2-badge.borrador  { background:rgba(26,26,24,.06); color:rgba(26,26,24,.55); }
.ct2-badge.calculada { background:rgba(37,99,235,.08); color:var(--info); }
.ct2-badge.aprobada  { background:rgba(22,163,74,.08); color:var(--ok); }
.ct2-badge.publicada { background:var(--p10); color:var(--p); }
.ct2-badge.cancelada { background:rgba(220,38,38,.06); color:var(--danger); }

/* Fechas */
.ct2-dates { display:flex; align-items:center; gap:5px; font-size:11px; color:var(--muted); }
.ct2-dates svg { width:11px; height:11px; flex-shrink:0; }
.ct2-dates-range { font-size:11px; }

/* Margen */
.ct2-margen {
  display:inline-flex; align-items:center; gap:4px;
  font-size:11px; font-weight:600; color:var(--ok);
  background:rgba(22,163,74,.07); padding:3px 8px;
}

/* Acciones */
.ct2-actions { display:flex; justify-content:flex-end; align-items:center; gap:5px; }
.ct2-btn {
  width:30px; height:30px; border:1px solid var(--border); background:#fff;
  display:flex; align-items:center; justify-content:center;
  color:var(--muted); text-decoration:none;
  transition:border-color .14s, color .14s, background .14s;
  cursor:pointer;
}
.ct2-btn:hover       { border-color:var(--p); color:var(--p); background:var(--p10); }
.ct2-btn.del:hover   { border-color:var(--danger); color:var(--danger); background:rgba(220,38,38,.05); }
.ct2-btn svg { width:13px; height:13px; }

/* Quick-action button: calcular */
.ct2-qa {
  display:inline-flex; align-items:center; gap:5px;
  height:28px; padding:0 10px;
  border:1px solid rgba(37,99,235,.25);
  background:rgba(37,99,235,.06);
  font-family:'DM Sans',sans-serif; font-size:10px; font-weight:600;
  letter-spacing:.06em; text-transform:uppercase;
  color:var(--info); cursor:pointer; transition:all .14s; white-space:nowrap;
}
.ct2-qa:hover { background:rgba(37,99,235,.12); border-color:var(--info); }
.ct2-qa.pub {
  border-color:var(--p10); background:var(--p10); color:var(--p);
}
.ct2-qa.pub:hover { background:rgba(var(--primary-rgb,152,76,168),.18); }
.ct2-qa svg { width:11px; height:11px; }

.ct2-empty { display:flex; flex-direction:column; align-items:center; gap:10px; padding:52px 20px; text-align:center; }
.ct2-empty-ico { width:44px; height:44px; background:var(--p10); display:flex; align-items:center; justify-content:center; border-radius:50%; }
.ct2-empty-ico svg { color:var(--p); opacity:.3; width:18px; height:18px; }
.ct2-empty-t { font-size:13px; font-weight:500; color:var(--txt); margin:0; }
`

type Campania = {
  id: string
  nombre: string
  estado: string
  fecha_inicio: string
  fecha_fin: string
  margen_minimo: number
  created_at: string
}

const ESTADO_META: Record<string, { label:string; cls:string; icon:any }> = {
  BORRADOR:  { label:"Borrador",  cls:"borrador",  icon:Megaphone   },
  CALCULADA: { label:"Calculada", cls:"calculada",  icon:Zap         },
  APROBADA:  { label:"Aprobada",  cls:"aprobada",   icon:CheckCircle },
  PUBLICADA: { label:"Publicada", cls:"publicada",  icon:Send        },
  CANCELADA: { label:"Cancelada", cls:"cancelada",  icon:Ban         },
}

// Formato estable en cualquier entorno (SSR en UTC o navegador en Colombia):
// parseamos los componentes de la fecha "YYYY-MM-DD" explícitamente en vez de
// dejar que el motor de Date decida una zona horaria que puede correr el día.
function fmtFecha(iso: string) {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

function EstadoBadge({ estado }: { estado:string }) {
  const meta = ESTADO_META[estado] || ESTADO_META.BORRADOR
  const Icon = meta.icon
  return (
    <span className={`ct2-badge ${meta.cls}`} aria-label={`Estado: ${meta.label}`}>
      <Icon aria-hidden />
      {meta.label}
    </span>
  )
}

// Nota multi-company: `companyId` se recibe aunque el cancelar lo valida el
// backend vía RLS + JOIN user_companies. Se mantiene en el contrato para que
// cualquier query que se añada aquí en el futuro pueda filtrar por empresa.
export function CampaniasTable({ campanias, companyId }: {
  campanias: Campania[]
  companyId: string
}) {
  void companyId
  const router = useRouter()

  const handleCancelar = async (id: string, nombre: string) => {
    const ok = await showConfirm(
      `¿Cancelar "${nombre}"?`,
      "Las ofertas activas serán desactivadas del catálogo"
    )
    if (!ok) return
    const supabase = createClient()
    const { error } = await supabase.rpc("rpc_cancelar_campania", {
      p_campania_id: id,
      p_motivo: "Cancelada manualmente desde lista"
    })
    if (error) showError(error.message || "Error al cancelar")
    else { await showSuccess("Campaña cancelada"); router.refresh() }
  }

  if (campanias.length === 0) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="ct2">
          <div className="ct2-empty">
            <div className="ct2-empty-ico"><Megaphone /></div>
            <p className="ct2-empty-t">No hay campañas</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="ct2">
        <div className="ct2-scroll">
          <table className="ct2-tbl">
            <thead>
              <tr>
                <th>Campaña</th>
                <th>Estado</th>
                <th>Vigencia</th>
                <th>Margen mín.</th>
                <th className="r">Acción rápida / Ver</th>
              </tr>
            </thead>
            <tbody>
              {campanias.map(c => (
                <tr key={c.id}>

                  {/* Nombre */}
                  <td>
                    <div className="ct2-name">
                      <div className="ct2-name-ico" aria-hidden>
                        <Megaphone />
                      </div>
                      <div>
                        <div className="ct2-name-text">{c.nombre}</div>
                        <div className="ct2-name-desc">
                          Creada {new Date(c.created_at).toLocaleDateString("es-CO", { day:"2-digit", month:"short", timeZone:"America/Bogota" })}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Estado */}
                  <td><EstadoBadge estado={c.estado} /></td>

                  {/* Fechas */}
                  <td>
                    <div className="ct2-dates">
                      <CalendarRange aria-hidden />
                      <span className="ct2-dates-range">
                        {fmtFecha(c.fecha_inicio)} — {fmtFecha(c.fecha_fin)}
                      </span>
                    </div>
                  </td>

                  {/* Margen mínimo */}
                  <td>
                    <span className="ct2-margen">
                      {c.margen_minimo}%
                    </span>
                  </td>

                  {/* Acciones */}
                  <td className="r">
                    <div className="ct2-actions">

                      {/* Acción rápida según estado */}
                      {c.estado === "BORRADOR" && (
                        <Link
                          href={`/dashboard/campanias/${c.id}`}
                          className="ct2-qa"
                          title="Generar análisis de lotes"
                        >
                          <Zap aria-hidden />
                          Analizar
                        </Link>
                      )}
                      {c.estado === "CALCULADA" && (
                        <Link
                          href={`/dashboard/campanias/${c.id}`}
                          className="ct2-qa"
                          title="Revisar y aprobar descuentos"
                        >
                          <CheckCircle aria-hidden />
                          Aprobar
                        </Link>
                      )}
                      {c.estado === "APROBADA" && (
                        <Link
                          href={`/dashboard/campanias/${c.id}`}
                          className="ct2-qa pub"
                          title="Publicar en catálogo"
                        >
                          <Send aria-hidden />
                          Publicar
                        </Link>
                      )}

                      {/* Ver detalle */}
                      <Link
                        href={`/dashboard/campanias/${c.id}`}
                        className="ct2-btn"
                        aria-label={`Ver detalle de ${c.nombre}`}
                      >
                        <Eye aria-hidden />
                      </Link>

                      {/* Cancelar (si no está ya cancelada o publicada) */}
                      {!["CANCELADA", "PUBLICADA"].includes(c.estado) && (
                        <button
                          className="ct2-btn del"
                          onClick={() => handleCancelar(c.id, c.nombre)}
                          aria-label={`Cancelar ${c.nombre}`}
                          title="Cancelar campaña"
                        >
                          <XCircle aria-hidden />
                        </button>
                      )}
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
