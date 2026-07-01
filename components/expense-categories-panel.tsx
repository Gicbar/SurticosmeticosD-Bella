"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { showError, showConfirm, showSuccess } from "@/lib/sweetalert"
import { Plus, Edit, Trash2, Check, X, Receipt } from "lucide-react"

interface ExpenseCat { id: number; name: string }

const CSS = `
.ec-root { font-family:'DM Sans',sans-serif;
  --p:var(--primary,#984ca8); --p10:rgba(var(--primary-rgb,152,76,168),.10);
  --p30:rgba(var(--primary-rgb,152,76,168),.30); --txt:#1a1a18;
  --muted:rgba(26,26,24,.45); --border:rgba(26,26,24,.08); --hover:rgba(26,26,24,.02); --danger:#dc2626; }

/* Form de alta */
.ec-add { display:flex; gap:8px; padding:14px 16px; border-bottom:1px solid var(--border); background:var(--p10); }
.ec-input { flex:1; height:38px; border:1px solid var(--border); background:#fff; padding:0 12px;
  font-family:'DM Sans',sans-serif; font-size:13px; color:var(--txt); }
.ec-input:focus { outline:none; border-color:var(--p); }
.ec-add-btn { display:inline-flex; align-items:center; gap:6px; height:38px; padding:0 16px; border:none;
  background:var(--p); color:#fff; cursor:pointer; font-size:12px; font-weight:600; letter-spacing:.04em;
  text-transform:uppercase; transition:opacity .15s; white-space:nowrap; }
.ec-add-btn:hover:not(:disabled) { opacity:.88; }
.ec-add-btn:disabled { opacity:.4; cursor:not-allowed; }
.ec-add-btn svg { width:13px; height:13px; }

/* Lista */
.ec-list { list-style:none; margin:0; padding:0; }
.ec-item { display:flex; align-items:center; gap:10px; padding:12px 16px; border-bottom:1px solid var(--border); transition:background .1s; }
.ec-item:last-child { border-bottom:none; }
.ec-item:hover { background:var(--hover); }
.ec-ico { width:24px; height:24px; background:var(--p10); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.ec-ico svg { color:var(--p); width:12px; height:12px; }
.ec-name { flex:1; font-size:13px; font-weight:500; color:var(--txt); min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ec-edit-input { flex:1; height:32px; border:1px solid var(--p); background:#fff; padding:0 10px; font-family:'DM Sans',sans-serif; font-size:13px; color:var(--txt); }
.ec-edit-input:focus { outline:2px solid var(--p10); }
.ec-actions { display:flex; gap:6px; flex-shrink:0; }
.ec-btn { width:30px; height:30px; border:1px solid var(--border); background:#fff; display:flex; align-items:center;
  justify-content:center; cursor:pointer; color:var(--muted); transition:border-color .14s,color .14s,background .14s; }
.ec-btn svg { width:13px; height:13px; }
.ec-btn.edit:hover { border-color:var(--p); color:var(--p); background:var(--p10); }
.ec-btn.del:hover { border-color:var(--danger); color:var(--danger); background:rgba(220,38,38,.05); }
.ec-btn.ok:hover { border-color:#16a34a; color:#16a34a; background:rgba(22,163,74,.06); }

/* Vacío */
.ec-empty { display:flex; flex-direction:column; align-items:center; gap:10px; padding:44px 20px; text-align:center; }
.ec-empty-ico { width:44px; height:44px; background:var(--p10); display:flex; align-items:center; justify-content:center; }
.ec-empty-ico svg { color:var(--p); opacity:.35; width:18px; height:18px; }
.ec-empty-t { font-size:13px; font-weight:500; color:var(--txt); margin:0; }
.ec-empty-s { font-size:11px; color:var(--muted); margin:0; }
`

export function ExpenseCategoriesPanel({
  initialCategories, companyId,
}: { initialCategories: ExpenseCat[]; companyId: string }) {
  const supabase = createClient()
  const [cats, setCats] = useState<ExpenseCat[]>(initialCategories)
  const [newName, setNewName] = useState("")
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")

  const sortCats = (list: ExpenseCat[]) =>
    [...list].sort((a, b) => a.name.localeCompare(b.name, "es"))

  const add = async () => {
    const name = newName.trim()
    if (!name) { showError("Escribe el nombre de la categoría"); return }
    if (cats.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      showError("Ya existe una categoría con ese nombre"); return
    }
    setSaving(true)
    const { data, error } = await supabase.from("categories_expense")
      .insert({ name, company_id: companyId }).select("id, name").single()
    setSaving(false)
    if (error) { showError("No se pudo crear: " + error.message); return }
    setCats(prev => sortCats([...prev, data as ExpenseCat]))
    setNewName("")
  }

  const startEdit = (c: ExpenseCat) => { setEditId(c.id); setEditName(c.name) }
  const cancelEdit = () => { setEditId(null); setEditName("") }

  const saveEdit = async (id: number) => {
    const name = editName.trim()
    if (!name) { showError("El nombre no puede estar vacío"); return }
    if (cats.some(c => c.id !== id && c.name.toLowerCase() === name.toLowerCase())) {
      showError("Ya existe una categoría con ese nombre"); return
    }
    const { error } = await supabase.from("categories_expense")
      .update({ name }).eq("id", id).eq("company_id", companyId)
    if (error) { showError("No se pudo actualizar: " + error.message); return }
    setCats(prev => sortCats(prev.map(c => (c.id === id ? { ...c, name } : c))))
    cancelEdit()
  }

  const remove = async (c: ExpenseCat) => {
    const ok = await showConfirm(`¿Eliminar la categoría "${c.name}"?`, "Esta acción es irreversible")
    if (!ok) return
    const { error } = await supabase.from("categories_expense")
      .delete().eq("id", c.id).eq("company_id", companyId)
    if (error) {
      showError(
        error.code === "23503"
          ? "No se puede eliminar: hay gastos registrados con esta categoría."
          : "No se pudo eliminar: " + error.message,
      )
      return
    }
    setCats(prev => prev.filter(x => x.id !== c.id))
    showSuccess("Categoría eliminada")
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="ec-root">
        <div className="ec-add">
          <input
            className="ec-input" placeholder="Nueva categoría de gasto…"
            value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") add() }}
          />
          <button className="ec-add-btn" onClick={add} disabled={saving}>
            <Plus /> Agregar
          </button>
        </div>

        {cats.length === 0 ? (
          <div className="ec-empty">
            <div className="ec-empty-ico"><Receipt /></div>
            <p className="ec-empty-t">Sin categorías de gasto</p>
            <p className="ec-empty-s">Crea categorías para clasificar tus gastos</p>
          </div>
        ) : (
          <ul className="ec-list">
            {cats.map(c => (
              <li key={c.id} className="ec-item">
                <div className="ec-ico" aria-hidden><Receipt /></div>
                {editId === c.id ? (
                  <>
                    <input
                      className="ec-edit-input" value={editName} autoFocus
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") saveEdit(c.id)
                        if (e.key === "Escape") cancelEdit()
                      }}
                    />
                    <div className="ec-actions">
                      <button className="ec-btn ok" onClick={() => saveEdit(c.id)} aria-label="Guardar"><Check /></button>
                      <button className="ec-btn" onClick={cancelEdit} aria-label="Cancelar"><X /></button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="ec-name">{c.name}</span>
                    <div className="ec-actions">
                      <button className="ec-btn edit" onClick={() => startEdit(c)} aria-label={`Editar ${c.name}`}><Edit /></button>
                      <button className="ec-btn del" onClick={() => remove(c)} aria-label={`Eliminar ${c.name}`}><Trash2 /></button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
