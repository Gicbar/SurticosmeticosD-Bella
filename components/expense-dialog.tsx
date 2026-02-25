"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { showError, showSuccess } from "@/lib/sweetalert"
import { DollarSign, Calendar, Tag, X, ChevronDown, Check, Receipt } from "lucide-react"

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

.ed-bdrop {
  position:fixed; inset:0; z-index:1000;
  background:rgba(0,0,0,.35); backdrop-filter:blur(3px);
  display:flex; align-items:center; justify-content:center; padding:16px;
}
@keyframes edIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
.ed-modal {
  background:#fff; width:100%; max-width:480px;
  max-height:92vh; overflow-y:auto; -webkit-overflow-scrolling:touch;
  font-family:'DM Sans',sans-serif;
  animation:edIn .2s ease forwards; position:relative;
}
.ed-modal::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:var(--primary,#984ca8); z-index:1; }

.ed-hd {
  position:sticky; top:0; background:#fff; z-index:2;
  padding:16px 18px 13px; border-bottom:1px solid rgba(26,26,24,.08);
  display:flex; align-items:center; justify-content:space-between;
}
.ed-title { font-size:14px; font-weight:600; color:#1a1a18; margin:0; display:flex; align-items:center; gap:8px; }
.ed-title svg { color:var(--primary,#984ca8); width:14px; height:14px; }
.ed-close { width:28px; height:28px; border:none; background:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:rgba(26,26,24,.4); transition:color .14s; }
.ed-close:hover { color:#1a1a18; }

.ed-body { padding:18px; display:flex; flex-direction:column; gap:14px; }
.ed-lbl { display:block; font-size:9px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:rgba(26,26,24,.45); margin-bottom:5px; }
.ed-lbl-row { display:flex; align-items:center; gap:5px; }
.ed-lbl-row svg { width:11px; height:11px; }

.ed-inp {
  width:100%; height:42px; padding:0 13px;
  border:1px solid rgba(26,26,24,.08); background:#fff;
  font-family:'DM Sans',sans-serif; font-size:13px; color:#1a1a18;
  outline:none; -webkit-appearance:none; transition:border-color .14s;
}
.ed-inp:focus { border-color:var(--primary,#984ca8); }
.ed-inp:disabled { opacity:.5; }
.ed-inp[type=number] { -moz-appearance:textfield; }
.ed-inp[type=number]::-webkit-outer-spin-button,
.ed-inp[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
.ed-inp[type=date] { cursor:pointer; }
.ed-inp-ico { position:relative; }
.ed-inp-ico .ed-inp { padding-left:36px; }
.ed-inp-ico svg { position:absolute; left:11px; top:50%; transform:translateY(-50%); color:rgba(26,26,24,.35); pointer-events:none; width:14px; height:14px; }

.ed-textarea {
  width:100%; min-height:80px; padding:11px 13px; resize:vertical;
  border:1px solid rgba(26,26,24,.08); background:#fff;
  font-family:'DM Sans',sans-serif; font-size:13px; color:#1a1a18;
  outline:none; transition:border-color .14s;
}
.ed-textarea:focus { border-color:var(--primary,#984ca8); }
.ed-textarea:disabled { opacity:.5; }

.ed-g2 { display:grid; gap:12px; grid-template-columns:1fr 1fr; }
@media(max-width:440px){ .ed-g2{ grid-template-columns:1fr; } }

/* CustomSelect */
.ed-sel { position:relative; }
.ed-sel-btn {
  width:100%; height:42px; padding:0 36px 0 13px;
  border:1px solid rgba(26,26,24,.08); background:#fff; cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:13px; color:#1a1a18;
  display:flex; align-items:center; outline:none;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  transition:border-color .14s;
}
.ed-sel-btn.ph { color:rgba(26,26,24,.4); }
.ed-sel-btn:focus { border-color:var(--primary,#984ca8); }
.ed-sel-chev { position:absolute; right:11px; top:50%; transform:translateY(-50%); color:rgba(26,26,24,.4); pointer-events:none; width:13px; height:13px; transition:transform .14s; }
.ed-sel-chev.open { transform:translateY(-50%) rotate(180deg); }
.ed-sel-dd {
  position:absolute; top:calc(100% + 3px); left:0; right:0;
  background:#fff; border:1px solid rgba(26,26,24,.08);
  box-shadow:0 8px 24px rgba(26,26,24,.10); z-index:700;
  max-height:180px; overflow-y:auto;
}
.ed-sel-opt {
  padding:10px 13px; font-size:13px; color:#1a1a18; cursor:pointer;
  display:flex; align-items:center; justify-content:space-between; min-height:40px;
  transition:background .1s;
}
.ed-sel-opt:hover { background:rgba(var(--primary-rgb,152,76,168),.08); }
.ed-sel-opt.s  { color:var(--primary,#984ca8); font-weight:500; }
.ed-sel-opt svg { width:11px; height:11px; }
.ed-sel-none { padding:12px 13px; font-size:12px; color:rgba(26,26,24,.4); }

.ed-foot { padding:13px 18px; border-top:1px solid rgba(26,26,24,.08); display:flex; gap:8px; justify-content:flex-end; position:sticky; bottom:0; background:#fff; z-index:2; }
.ed-btn-cancel {
  height:38px; padding:0 16px; border:1px solid rgba(26,26,24,.08); background:#fff; cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:12px; color:rgba(26,26,24,.5);
  transition:border-color .14s, color .14s;
}
.ed-btn-cancel:hover { border-color:#1a1a18; color:#1a1a18; }
.ed-btn-save {
  height:38px; padding:0 22px; border:none; background:var(--primary,#984ca8); cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600;
  letter-spacing:.06em; text-transform:uppercase; color:#fff;
  display:flex; align-items:center; gap:6px; transition:opacity .14s;
}
.ed-btn-save:hover:not(:disabled) { opacity:.88; }
.ed-btn-save:disabled { opacity:.4; cursor:not-allowed; }
.ed-spin { width:13px; height:13px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:edSpin .7s linear infinite; flex-shrink:0; }
@keyframes edSpin { to{ transform:rotate(360deg); } }
`

type Expense = { id:string; description:string; amount:number; category:string|null; date:string }

function CategorySelect({ value, onChange, options, disabled }: {
  value: string; onChange: (v:string) => void
  options: {id:number; name:string}[]; disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const id = setTimeout(() => document.addEventListener("mousedown", h), 10)
    return () => { clearTimeout(id); document.removeEventListener("mousedown", h) }
  }, [open])

  const sel = options.find(o => o.id.toString() === value)
  return (
    <div className="ed-sel" ref={ref}>
      <button type="button"
        className={`ed-sel-btn${!sel ? " ph" : ""}`}
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled} aria-haspopup="listbox" aria-expanded={open}>
        {sel?.name ?? "Selecciona una categoría"}
      </button>
      <ChevronDown className={`ed-sel-chev${open ? " open" : ""}`} aria-hidden />
      {open && (
        <div className="ed-sel-dd" role="listbox">
          {options.length === 0
            ? <div className="ed-sel-none">Sin categorías</div>
            : options.map(o => (
              <div key={o.id}
                className={`ed-sel-opt${value === o.id.toString() ? " s" : ""}`}
                role="option" aria-selected={value === o.id.toString()}
                onClick={() => { onChange(o.id.toString()); setOpen(false) }}>
                {o.name}{value === o.id.toString() && <Check aria-hidden />}
              </div>
            ))
          }
        </div>
      )}
    </div>
  )
}

export function ExpenseDialog({
  expense, children, companyId,
}: {
  expense?: Expense; children: React.ReactNode; companyId: string
}) {
  const router = useRouter()
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<{id:number; name:string}[]>([])
  const [form, setForm] = useState({
    description: expense?.description || "",
    amount:      expense?.amount?.toString() || "",
    category:    expense?.category?.toString() || "",
    date:        expense?.date
      ? new Date(expense.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    if (!open) return
    createClient().from("categories_expense").select("id, name").order("name")
      .then(({ data }) => setCategories(data || []))
  }, [open])

  const closeModal = () => setOpen(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.description.trim() || !form.amount || !form.date) {
      showError("Completa todos los campos requeridos")
      return
    }
    setLoading(true)
    try {
      const { data: { user } } = await createClient().auth.getUser()
      if (!user) { showError("Usuario no autenticado"); return }

      const payload = {
        description: form.description.trim(),
        amount:      parseFloat(form.amount),
        category:    form.category ? parseInt(form.category) : null,
        date:        new Date(form.date).toISOString(),
        created_by:  user.id,
        company_id:  companyId,
      }

      const { error } = expense
        ? await createClient().from("expenses").update(payload).eq("id", expense.id).eq("company_id", companyId)
        : await createClient().from("expenses").insert(payload)

      if (error) throw error
      closeModal()
      await new Promise(r => setTimeout(r, 150))
      await showSuccess(expense ? "Gasto actualizado" : "Gasto creado")
      router.refresh()
    } catch (err: any) {
      showError(err.message || "Error al guardar el gasto")
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = !!form.description.trim() && !!form.amount

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <span onClick={() => setOpen(true)} style={{ cursor:"pointer", display:"contents" }}>
        {children}
      </span>

      {open && (
        <div className="ed-bdrop"
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}
          role="dialog" aria-modal="true">
          <div className="ed-modal">
            <div className="ed-hd">
              <p className="ed-title">
                <Receipt aria-hidden />{expense ? "Editar Gasto" : "Nuevo Gasto"}
              </p>
              <button className="ed-close" onClick={closeModal} aria-label="Cerrar" disabled={loading}>
                <X size={13} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="ed-body">
                <div>
                  <label className="ed-lbl" htmlFor="ed-desc">Descripción *</label>
                  <textarea id="ed-desc" className="ed-textarea" required
                    placeholder="Ej: Renta, suministros, servicios…"
                    value={form.description} disabled={loading}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>

                <div className="ed-g2">
                  <div>
                    <label className="ed-lbl ed-lbl-row" htmlFor="ed-amount">
                      <DollarSign aria-hidden />Monto *
                    </label>
                    <div className="ed-inp-ico">
                      <DollarSign aria-hidden />
                      <input id="ed-amount" className="ed-inp" type="number" step="0.01" required
                        placeholder="0.00" value={form.amount} disabled={loading}
                        onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="ed-lbl ed-lbl-row" htmlFor="ed-date">
                      <Calendar aria-hidden />Fecha *
                    </label>
                    <div className="ed-inp-ico">
                      <Calendar aria-hidden />
                      <input id="ed-date" className="ed-inp" type="date" required
                        value={form.date} disabled={loading}
                        onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                    </div>
                  </div>
                </div>

                <div>
                  <span className="ed-lbl ed-lbl-row"><Tag aria-hidden />Categoría</span>
                  <CategorySelect
                    value={form.category}
                    onChange={v => setForm(f => ({ ...f, category: v }))}
                    options={categories}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="ed-foot">
                <button type="button" className="ed-btn-cancel" onClick={closeModal} disabled={loading}>
                  Cancelar
                </button>
                <button type="submit" className="ed-btn-save" disabled={loading || !canSubmit}>
                  {loading ? <><div className="ed-spin" />Guardando…</> : expense ? "Actualizar" : "Crear gasto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
