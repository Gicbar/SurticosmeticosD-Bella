"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { CategoryDialog } from "@/components/category-dialog"
import { showError, showConfirm, showSuccess } from "@/lib/sweetalert"
import { Edit, Trash2, FolderTree } from "lucide-react"

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');

.ct-root {
  font-family:'DM Sans',sans-serif;
  --p:      var(--primary,#984ca8);
  --p10:    rgba(var(--primary-rgb,152,76,168),.10);
  --p30:    rgba(var(--primary-rgb,152,76,168),.30);
  --txt:    #1a1a18;
  --muted:  rgba(26,26,24,.45);
  --border: rgba(26,26,24,.08);
  --hover:  rgba(26,26,24,.02);
  --danger: #dc2626;
}

/* Scroll horizontal para móvil */
.ct-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; }

table.ct-table { width:100%; border-collapse:collapse; min-width:360px; }

/* Header */
.ct-table thead tr { border-bottom:2px solid var(--border); background:var(--hover); }
.ct-table th {
  padding:10px 16px; font-size:8px; font-weight:700;
  letter-spacing:.2em; text-transform:uppercase; color:var(--muted); text-align:left; white-space:nowrap;
}
.ct-table th.right { text-align:right; }

/* Filas */
.ct-table tbody tr { border-bottom:1px solid var(--border); transition:background .1s; }
.ct-table tbody tr:last-child { border-bottom:none; }
.ct-table tbody tr:hover { background:var(--hover); }
.ct-table td { padding:13px 16px; font-size:13px; color:var(--txt); vertical-align:middle; }
.ct-table td.muted { color:var(--muted); font-size:12px; }
.ct-table td.right { text-align:right; }

/* Nombre con ícono */
.ct-name { display:flex; align-items:center; gap:8px; font-weight:500; }
.ct-name-ico { width:24px; height:24px; background:var(--p10); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.ct-name-ico svg { color:var(--p); width:12px; height:12px; }

/* Acciones */
.ct-actions { display:flex; justify-content:flex-end; gap:6px; }
.ct-btn-edit {
  width:30px; height:30px; border:1px solid var(--border); background:#fff;
  display:flex; align-items:center; justify-content:center;
  cursor:pointer; color:var(--muted);
  transition:border-color .14s, color .14s, background .14s;
}
.ct-btn-edit:hover { border-color:var(--p); color:var(--p); background:var(--p10); }
.ct-btn-edit svg { width:13px; height:13px; }
.ct-btn-del {
  width:30px; height:30px; border:1px solid var(--border); background:#fff;
  display:flex; align-items:center; justify-content:center;
  cursor:pointer; color:var(--muted);
  transition:border-color .14s, color .14s, background .14s;
}
.ct-btn-del:hover { border-color:var(--danger); color:var(--danger); background:rgba(220,38,38,.05); }
.ct-btn-del svg { width:13px; height:13px; }

/* Estado vacío */
.ct-empty { display:flex; flex-direction:column; align-items:center; gap:10px; padding:52px 20px; text-align:center; }
.ct-empty-ico { width:44px; height:44px; background:var(--p10); display:flex; align-items:center; justify-content:center; }
.ct-empty-ico svg { color:var(--p); opacity:.35; width:18px; height:18px; }
.ct-empty-t { font-size:13px; font-weight:500; color:var(--txt); margin:0; }
.ct-empty-s { font-size:11px; color:var(--muted); margin:0; }
`

interface CategoriesTableProps {
  categories: { id: string; name: string; description: string | null }[]
  companyId: string
}

export function CategoriesTable({ categories, companyId }: CategoriesTableProps) {
  const router = useRouter()

  const handleDelete = async (id: string, name: string) => {
    const ok = await showConfirm(`¿Eliminar "${name}"?`, "Esta acción es irreversible")
    if (!ok) return
    const { error } = await createClient().from("categories")
      .delete().eq("id", id).eq("company_id", companyId)
    if (error) showError(error.message || "Error al eliminar")
    else { await showSuccess("Categoría eliminada"); router.refresh() }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="ct-root">
        {categories.length === 0 ? (
          <div className="ct-empty">
            <div className="ct-empty-ico"><FolderTree/></div>
            <p className="ct-empty-t">Sin categorías</p>
            <p className="ct-empty-s">Crea la primera categoría para organizar tus productos</p>
          </div>
        ) : (
          <div className="ct-scroll">
            <table className="ct-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th className="right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => (
                  <tr key={cat.id}>
                    <td>
                      <div className="ct-name">
                        <div className="ct-name-ico" aria-hidden><FolderTree/></div>
                        {cat.name}
                      </div>
                    </td>
                    <td className="muted">{cat.description || "—"}</td>
                    <td className="right">
                      <div className="ct-actions">
                        <CategoryDialog category={cat} companyId={companyId}>
                          <button className="ct-btn-edit" aria-label={`Editar ${cat.name}`}>
                            <Edit/>
                          </button>
                        </CategoryDialog>
                        <button
                          className="ct-btn-del"
                          onClick={() => handleDelete(cat.id, cat.name)}
                          aria-label={`Eliminar ${cat.name}`}
                        >
                          <Trash2/>
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
