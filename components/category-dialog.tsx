"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { showError, showSuccess } from "@/lib/sweetalert"
import { X, Plus } from "lucide-react"

// ── CSS inline ────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

.cd-backdrop {
  position:fixed; inset:0; z-index:1000;
  background:rgba(0,0,0,.35); backdrop-filter:blur(3px);
  display:flex; align-items:center; justify-content:center; padding:16px;
}
@keyframes cdIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }

.cd-modal {
  background:#fff; width:100%; max-width:420px;
  font-family:'DM Sans',sans-serif;
  animation:cdIn .2s ease forwards;
  position:relative; overflow:hidden;
}
.cd-modal::before {
  content:''; position:absolute; top:0; left:0; right:0; height:3px;
  background:var(--primary,#984ca8);
}
.cd-hd {
  padding:18px 20px 14px;
  border-bottom:1px solid rgba(26,26,24,.08);
  display:flex; align-items:center; justify-content:space-between;
}
.cd-title { font-size:14px; font-weight:600; color:#1a1a18; margin:0; letter-spacing:.02em; }
.cd-close {
  width:28px; height:28px; border:none; background:none; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  color:rgba(26,26,24,.4); transition:color .14s;
}
.cd-close:hover { color:#1a1a18; }

.cd-body { padding:20px; display:flex; flex-direction:column; gap:14px; }

.cd-label { display:block; font-size:9px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:rgba(26,26,24,.45); margin-bottom:5px; }
.cd-input {
  width:100%; height:40px; padding:0 12px;
  border:1px solid rgba(26,26,24,.08); background:#fff;
  font-family:'DM Sans',sans-serif; font-size:13px; color:#1a1a18;
  outline:none; -webkit-appearance:none; transition:border-color .14s;
}
.cd-input:focus { border-color:var(--primary,#984ca8); }
.cd-input:disabled { opacity:.5; cursor:not-allowed; }
.cd-textarea {
  width:100%; padding:10px 12px; min-height:80px;
  border:1px solid rgba(26,26,24,.08); background:#fff;
  font-family:'DM Sans',sans-serif; font-size:13px; color:#1a1a18;
  outline:none; resize:vertical; line-height:1.5; transition:border-color .14s;
}
.cd-textarea:focus { border-color:var(--primary,#984ca8); }
.cd-textarea:disabled { opacity:.5; cursor:not-allowed; }

.cd-foot { padding:14px 20px; border-top:1px solid rgba(26,26,24,.08); display:flex; gap:8px; justify-content:flex-end; }
.cd-btn-cancel {
  height:36px; padding:0 16px; border:1px solid rgba(26,26,24,.08); background:#fff;
  font-family:'DM Sans',sans-serif; font-size:12px; font-weight:500; color:rgba(26,26,24,.55);
  cursor:pointer; transition:border-color .14s, color .14s;
}
.cd-btn-cancel:hover { border-color:#1a1a18; color:#1a1a18; }
.cd-btn-save {
  height:36px; padding:0 20px; border:none; background:var(--primary,#984ca8);
  font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600;
  letter-spacing:.06em; text-transform:uppercase; color:#fff;
  cursor:pointer; display:flex; align-items:center; gap:6px; transition:opacity .14s;
}
.cd-btn-save:hover:not(:disabled) { opacity:.88; }
.cd-btn-save:disabled { opacity:.4; cursor:not-allowed; }
.cd-spinner { width:13px; height:13px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; flex-shrink:0; }
@keyframes spin { to{ transform:rotate(360deg); } }

/* Trigger "Nueva Categoría" — mismo estilo que pp-new */
.cd-trigger {
  display:inline-flex; align-items:center; gap:7px;
  height:38px; padding:0 18px; background:var(--primary,#984ca8); border:none; cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600;
  letter-spacing:.06em; text-transform:uppercase; color:#fff;
  transition:opacity .15s; white-space:nowrap; flex-shrink:0;
}
.cd-trigger:hover { opacity:.88; }
`

type Category = { id: string; name: string; description: string | null }

interface CategoryDialogProps {
  category?: Category
  children?: React.ReactNode   // opcional — si no se pasa, muestra botón por defecto
  companyId: string
}

export function CategoryDialog({ category, children, companyId }: CategoryDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: category?.name || "",
    description: category?.description || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    try {
      if (category) {
        const { error } = await supabase.from("categories")
          .update({ ...form, company_id: companyId })
          .eq("id", category.id).eq("company_id", companyId)
        if (error) throw error
        setOpen(false)
        await new Promise(r => setTimeout(r, 100))
        await showSuccess("Categoría actualizada")
      } else {
        const { error } = await supabase.from("categories")
          .insert({ ...form, company_id: companyId })
        if (error) throw error
        setOpen(false)
        await new Promise(r => setTimeout(r, 100))
        await showSuccess("Categoría creada")
      }
      setForm({ name: "", description: "" })
      router.refresh()
    } catch (err: any) {
      showError(err.message || "Error inesperado")
    } finally {
      setLoading(false) }
  }

  const openModal = () => setOpen(true)
  const closeModal = () => { if (!loading) setOpen(false) }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Trigger */}
      {children ? (
        <span onClick={openModal} style={{ cursor:"pointer", display:"contents" }}>{children}</span>
      ) : (
        <button className="cd-trigger" onClick={openModal} aria-haspopup="dialog">
          <Plus size={13} aria-hidden />
          Nueva categoría
        </button>
      )}

      {/* Modal */}
      {open && (
        <div className="cd-backdrop" onClick={e => { if (e.target === e.currentTarget) closeModal() }} role="dialog" aria-modal="true" aria-label={category ? "Editar categoría" : "Nueva categoría"}>
          <div className="cd-modal">
            <div className="cd-hd">
              <p className="cd-title">{category ? "Editar categoría" : "Nueva categoría"}</p>
              <button className="cd-close" onClick={closeModal} aria-label="Cerrar" disabled={loading}>
                <X size={14}/>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="cd-body">
                <div>
                  <label className="cd-label" htmlFor="cat-name">Nombre *</label>
                  <input
                    id="cat-name" className="cd-input" required
                    value={form.name} disabled={loading}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ej: Cuidado facial"
                  />
                </div>
                <div>
                  <label className="cd-label" htmlFor="cat-desc">Descripción</label>
                  <textarea
                    id="cat-desc" className="cd-textarea"
                    value={form.description} disabled={loading}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Descripción opcional..."
                  />
                </div>
              </div>

              <div className="cd-foot">
                <button type="button" className="cd-btn-cancel" onClick={closeModal} disabled={loading}>
                  Cancelar
                </button>
                <button type="submit" className="cd-btn-save" disabled={loading || !form.name.trim()}>
                  {loading ? (
                    <><div className="cd-spinner"/>Guardando…</>
                  ) : category ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
