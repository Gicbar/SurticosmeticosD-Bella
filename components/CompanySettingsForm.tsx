"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { showError, showSuccess } from "@/lib/sweetalert"
import { Building2, Globe, Hash, Phone, Save } from "lucide-react"

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
.csf {
  font-family:'DM Sans',sans-serif;
  --p:     var(--primary,#984ca8);
  --p10:   rgba(var(--primary-rgb,152,76,168),.10);
  --p20:   rgba(var(--primary-rgb,152,76,168),.20);
  --txt:   #1a1a18;
  --muted: rgba(26,26,24,.45);
  --border:rgba(26,26,24,.08);
}

/* Grid 2 columnas */
.csf-g2 { display:grid; gap:16px; grid-template-columns:1fr 1fr; margin-bottom:16px; }
@media(max-width:560px){ .csf-g2{ grid-template-columns:1fr; } }
.csf-row { margin-bottom:16px; }

/* Label */
.csf-lbl {
  display:flex; align-items:center; gap:5px; margin-bottom:5px;
  font-size:9px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:var(--muted);
}
.csf-lbl svg { width:11px; height:11px; }

/* Input */
.csf-inp {
  width:100%; height:42px; padding:0 13px;
  border:1px solid var(--border); background:#fff;
  font-family:'DM Sans',sans-serif; font-size:13px; color:var(--txt);
  outline:none; -webkit-appearance:none; transition:border-color .14s;
}
.csf-inp:focus   { border-color:var(--p); }
.csf-inp:disabled{ opacity:.45; cursor:not-allowed; background:rgba(26,26,24,.02); }

/* Hint */
.csf-hint { font-size:10px; color:var(--muted); margin-top:4px; }

/* Separador */
.csf-sep { height:1px; background:var(--border); margin:20px 0 16px; }

/* Readonly info (no admin) */
.csf-info-grid { display:grid; gap:0; }
.csf-info-row {
  display:flex; align-items:center; justify-content:space-between;
  padding:11px 0; border-bottom:1px solid var(--border);
}
.csf-info-row:last-child { border-bottom:none; }
.csf-info-lbl { font-size:9px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:var(--muted); }
.csf-info-val { display:flex; align-items:center; gap:6px; font-size:12px; font-weight:500; color:var(--txt); }
.csf-info-val svg { width:11px; height:11px; color:var(--muted); }
.csf-mono { font-family:monospace; font-size:10px; color:var(--muted); background:rgba(26,26,24,.03); padding:2px 8px; border:1px solid var(--border); }

/* Botón guardar */
.csf-foot { display:flex; justify-content:flex-end; gap:8px; }
.csf-btn-save {
  height:40px; padding:0 22px; border:none; background:var(--p); cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600;
  letter-spacing:.08em; text-transform:uppercase; color:#fff;
  display:flex; align-items:center; gap:6px; transition:opacity .14s;
}
.csf-btn-save:hover:not(:disabled) { opacity:.88; }
.csf-btn-save:disabled { opacity:.4; cursor:not-allowed; }
.csf-btn-save svg { width:12px; height:12px; }
.csf-spin { width:13px; height:13px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:csfSpin .7s linear infinite; flex-shrink:0; }
@keyframes csfSpin { to{ transform:rotate(360deg); } }
`

interface Company {
  id:         string
  name:       string
  slug:       string | null
  domain:     string | null
  phone:      string | null
  created_at: string
}

interface Props {
  company:  Company
  isAdmin:  boolean
}

const FMT = (s: string) => {
  try { return new Date(s).toLocaleDateString("es-CO", { day:"2-digit", month:"long", year:"numeric" }) }
  catch { return s }
}

export function CompanySettingsForm({ company, isAdmin }: Props) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name:   company.name   || "",
    slug:   company.slug   || "",
    domain: company.domain || "",
    phone:  company.phone  || "",
  })

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { showError("El nombre de la empresa es requerido"); return }
    setLoading(true)
    try {
      const { error } = await createClient()
        .from("companies")
        .update({
          name:   form.name.trim(),
          slug:   form.slug.trim()   || null,
          domain: form.domain.trim() || null,
          phone:  form.phone.trim()  || null,
        })
        .eq("id", company.id)
      if (error) throw error
      await showSuccess("Información de la empresa actualizada")
    } catch (err: any) {
      showError(err.message || "Error al guardar")
    } finally {
      setLoading(false)
    }
  }

  // ── Vista solo lectura para no-admins ─────────────────────────────────────
  if (!isAdmin) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="csf">
          <div className="csf-info-grid">
            <div className="csf-info-row">
              <span className="csf-info-lbl">Nombre</span>
              <span className="csf-info-val"><Building2 aria-hidden />{company.name}</span>
            </div>
            {company.slug && (
              <div className="csf-info-row">
                <span className="csf-info-lbl">Slug</span>
                <span className="csf-info-val"><Hash aria-hidden /><span className="csf-mono">{company.slug}</span></span>
              </div>
            )}
            {company.domain && (
              <div className="csf-info-row">
                <span className="csf-info-lbl">Dominio</span>
                <span className="csf-info-val"><Globe aria-hidden />{company.domain}</span>
              </div>
            )}
            {company.phone && (
              <div className="csf-info-row">
                <span className="csf-info-lbl">Teléfono</span>
                <span className="csf-info-val"><Phone aria-hidden />{company.phone}</span>
              </div>
            )}
            <div className="csf-info-row">
              <span className="csf-info-lbl">Registrada</span>
              <span className="csf-info-val">{FMT(company.created_at)}</span>
            </div>
          </div>
        </div>
      </>
    )
  }

  // ── Vista editable solo para admins ──────────────────────────────────────
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="csf">
        <form onSubmit={handleSave}>
          <div className="csf-g2">
            <div>
              <label className="csf-lbl" htmlFor="csf-name"><Building2 aria-hidden />Nombre *</label>
              <input id="csf-name" className="csf-inp" required
                placeholder="Nombre de la empresa"
                value={form.name} disabled={loading} onChange={set("name")} />
            </div>
            <div>
              <label className="csf-lbl" htmlFor="csf-phone"><Phone aria-hidden />Teléfono</label>
              <input id="csf-phone" className="csf-inp" type="tel"
                placeholder="Número de contacto"
                value={form.phone} disabled={loading} onChange={set("phone")} />
            </div>
          </div>

          <div className="csf-g2">
            <div>
              <label className="csf-lbl" htmlFor="csf-slug"><Hash aria-hidden />Slug</label>
              <input id="csf-slug" className="csf-inp"
                placeholder="mi-empresa"
                value={form.slug} disabled={loading} onChange={set("slug")} />
              <p className="csf-hint">Identificador único en URLs</p>
            </div>
            <div>
              <label className="csf-lbl" htmlFor="csf-domain"><Globe aria-hidden />Dominio</label>
              <input id="csf-domain" className="csf-inp"
                placeholder="miempresa.com"
                value={form.domain} disabled={loading} onChange={set("domain")} />
              <p className="csf-hint">Sin https://</p>
            </div>
          </div>

          <div className="csf-sep" aria-hidden />
          <div className="csf-foot">
            <button type="submit" className="csf-btn-save" disabled={loading}>
              {loading
                ? <><div className="csf-spin" />Guardando…</>
                : <><Save aria-hidden />Guardar cambios</>}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
