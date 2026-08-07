"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { showError, showSuccess } from "@/lib/sweetalert"
import { Building2, Globe, Hash, Phone, Save, FileText, UserCheck, ShieldCheck, ChevronDown, Check } from "lucide-react"

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

/* Sub-encabezado de sección */
.csf-section {
  font-size: 9px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase;
  color: var(--muted); margin: 0 0 12px;
}

/* Select simple (tipo de negocio) */
.csf-sel-wrap { position: relative; }
.csf-sel-btn {
  width:100%; height:42px; padding:0 36px 0 13px;
  border:1px solid var(--border); background:#fff; cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:13px; color:var(--txt);
  display:flex; align-items:center; outline:none; transition:border-color .14s;
}
.csf-sel-btn:disabled { opacity:.5; cursor:not-allowed; }
.csf-sel-chev { position:absolute; right:11px; top:50%; transform:translateY(-50%); color:var(--muted); pointer-events:none; width:13px; height:13px; transition:transform .14s; }
.csf-sel-chev.open { transform:translateY(-50%) rotate(180deg); }
.csf-sel-dd {
  position:absolute; top:calc(100% + 3px); left:0; right:0;
  background:#fff; border:1px solid var(--border);
  box-shadow:0 8px 24px rgba(26,26,24,.10); z-index:600; max-height:200px; overflow-y:auto;
}
.csf-sel-opt {
  padding:10px 13px; font-size:13px; color:var(--txt); cursor:pointer;
  display:flex; align-items:center; justify-content:space-between; min-height:40px;
  transition:background .1s;
}
.csf-sel-opt:hover { background:var(--p10); }
.csf-sel-opt.s { color:var(--p); font-weight:500; }
`

interface Company {
  id:         string
  name:       string
  slug:       string | null
  domain:     string | null
  phone:      string | null
  created_at: string
  // Fiscal (008/009) — preparación para futura facturación electrónica
  tipo_negocio?:                        string | null
  nit?:                                 string | null
  nit_dv?:                              string | null
  razon_social?:                        string | null
  regimen_tributario?:                  string | null
  direccion_fiscal?:                    string | null
  // Establecimiento farmacéutico (009)
  director_tecnico_nombre?:             string | null
  director_tecnico_documento?:          string | null
  numero_licencia_funcionamiento?:      string | null
  entidad_territorial_salud?:           string | null
  vigencia_licencia_funcionamiento?:    string | null
}

interface Props {
  company:  Company
  isAdmin:  boolean
}

const FMT = (s: string) => {
  try { return new Date(s).toLocaleDateString("es-CO", { day:"2-digit", month:"long", year:"numeric" }) }
  catch { return s }
}

const TIPO_NEGOCIO_OPTS = [
  { id: "general",       name: "General" },
  { id: "cosmeticos",    name: "Cosméticos" },
  { id: "drogueria",     name: "Droguería / Farmacia" },
  { id: "comida_rapida", name: "Comida rápida" },
]

const REGIMEN_OPTS = [
  { id: "",                  name: "Sin definir" },
  { id: "responsable_iva",   name: "Responsable de IVA" },
  { id: "no_responsable_iva", name: "No responsable de IVA" },
]

// ── Select simple reutilizable ────────────────────────────────────────────────
function SimpleSelect({ value, onChange, options, disabled }: {
  value: string; onChange: (v: string) => void
  options: { id: string; name: string }[]; disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const id = setTimeout(() => document.addEventListener("mousedown", h), 10)
    return () => { clearTimeout(id); document.removeEventListener("mousedown", h) }
  }, [open])

  const sel = options.find(o => o.id === value)
  return (
    <div className="csf-sel-wrap" ref={ref}>
      <button type="button" className="csf-sel-btn" disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)} aria-haspopup="listbox" aria-expanded={open}>
        {sel?.name ?? "Selecciona"}
      </button>
      <ChevronDown className={`csf-sel-chev${open ? " open" : ""}`} aria-hidden />
      {open && (
        <div className="csf-sel-dd" role="listbox">
          {options.map(o => (
            <div key={o.id} className={`csf-sel-opt${value === o.id ? " s" : ""}`}
              role="option" aria-selected={value === o.id}
              onClick={() => { onChange(o.id); setOpen(false) }}>
              {o.name}{value === o.id && <Check size={11} aria-hidden />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function CompanySettingsForm({ company, isAdmin }: Props) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name:   company.name   || "",
    slug:   company.slug   || "",
    domain: company.domain || "",
    phone:  company.phone  || "",
    tipo_negocio:        company.tipo_negocio || "general",
    nit:                 company.nit || "",
    nit_dv:              company.nit_dv || "",
    razon_social:        company.razon_social || "",
    regimen_tributario:  company.regimen_tributario || "",
    direccion_fiscal:    company.direccion_fiscal || "",
    director_tecnico_nombre:          company.director_tecnico_nombre || "",
    director_tecnico_documento:       company.director_tecnico_documento || "",
    numero_licencia_funcionamiento:   company.numero_licencia_funcionamiento || "",
    entidad_territorial_salud:        company.entidad_territorial_salud || "",
    vigencia_licencia_funcionamiento: company.vigencia_licencia_funcionamiento || "",
  })

  const isDrogueria = form.tipo_negocio === "drogueria"

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
          tipo_negocio:       form.tipo_negocio,
          nit:                form.nit.trim() || null,
          nit_dv:             form.nit_dv.trim() || null,
          razon_social:       form.razon_social.trim() || null,
          regimen_tributario: form.regimen_tributario || null,
          direccion_fiscal:   form.direccion_fiscal.trim() || null,
          director_tecnico_nombre:          form.director_tecnico_nombre.trim() || null,
          director_tecnico_documento:       form.director_tecnico_documento.trim() || null,
          numero_licencia_funcionamiento:   form.numero_licencia_funcionamiento.trim() || null,
          entidad_territorial_salud:        form.entidad_territorial_salud.trim() || null,
          vigencia_licencia_funcionamiento: form.vigencia_licencia_funcionamiento || null,
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

          {/* ── Vertical de negocio ──────────────────────────────────────────── */}
          <p className="csf-section">Vertical de negocio</p>
          <div className="csf-row">
            <label className="csf-lbl"><Building2 aria-hidden />Tipo de negocio</label>
            <SimpleSelect
              value={form.tipo_negocio}
              onChange={v => setForm(f => ({ ...f, tipo_negocio: v }))}
              options={TIPO_NEGOCIO_OPTS}
              disabled={loading}
            />
            <p className="csf-hint">Controla qué campos de dominio (ej. droguería) se muestran al crear productos.</p>
          </div>

          <div className="csf-sep" aria-hidden />

          {/* ── Datos fiscales (preparación futura DIAN) ─────────────────────── */}
          <p className="csf-section">Datos fiscales</p>
          <div className="csf-g2">
            <div>
              <label className="csf-lbl"><FileText aria-hidden />NIT</label>
              <input className="csf-inp" placeholder="900123456" value={form.nit} disabled={loading} onChange={set("nit")} />
            </div>
            <div>
              <label className="csf-lbl"><Hash aria-hidden />Dígito de verificación</label>
              <input className="csf-inp" placeholder="Ej: 7" value={form.nit_dv} disabled={loading} onChange={set("nit_dv")} />
            </div>
          </div>
          <div className="csf-row">
            <label className="csf-lbl"><Building2 aria-hidden />Razón social</label>
            <input className="csf-inp" placeholder="Razón social legal (si difiere del nombre comercial)" value={form.razon_social} disabled={loading} onChange={set("razon_social")} />
          </div>
          <div className="csf-g2">
            <div>
              <label className="csf-lbl"><ShieldCheck aria-hidden />Régimen tributario</label>
              <SimpleSelect
                value={form.regimen_tributario}
                onChange={v => setForm(f => ({ ...f, regimen_tributario: v }))}
                options={REGIMEN_OPTS}
                disabled={loading}
              />
            </div>
            <div>
              <label className="csf-lbl"><Globe aria-hidden />Dirección fiscal</label>
              <input className="csf-inp" placeholder="Dirección registrada" value={form.direccion_fiscal} disabled={loading} onChange={set("direccion_fiscal")} />
            </div>
          </div>
          <p className="csf-hint" style={{ marginTop: -8, marginBottom: 16 }}>
            Estos datos no activan facturación electrónica — solo quedan listos para cuando se integre.
          </p>

          {/* ── Establecimiento farmacéutico (solo droguería) ────────────────── */}
          {isDrogueria && (
            <>
              <div className="csf-sep" aria-hidden />
              <p className="csf-section">Establecimiento farmacéutico</p>
              <div className="csf-g2">
                <div>
                  <label className="csf-lbl"><UserCheck aria-hidden />Director técnico</label>
                  <input className="csf-inp" placeholder="Nombre completo" value={form.director_tecnico_nombre} disabled={loading} onChange={set("director_tecnico_nombre")} />
                </div>
                <div>
                  <label className="csf-lbl"><Hash aria-hidden />Documento del director técnico</label>
                  <input className="csf-inp" placeholder="Cédula / tarjeta profesional" value={form.director_tecnico_documento} disabled={loading} onChange={set("director_tecnico_documento")} />
                </div>
              </div>
              <div className="csf-g2">
                <div>
                  <label className="csf-lbl"><FileText aria-hidden />N.º licencia de funcionamiento</label>
                  <input className="csf-inp" placeholder="Número de licencia" value={form.numero_licencia_funcionamiento} disabled={loading} onChange={set("numero_licencia_funcionamiento")} />
                </div>
                <div>
                  <label className="csf-lbl"><Globe aria-hidden />Entidad territorial de salud</label>
                  <input className="csf-inp" placeholder="Ej: Secretaría de Salud de..." value={form.entidad_territorial_salud} disabled={loading} onChange={set("entidad_territorial_salud")} />
                </div>
              </div>
              <div className="csf-row">
                <label className="csf-lbl"><FileText aria-hidden />Vigencia de la licencia</label>
                <input className="csf-inp" type="date" value={form.vigencia_licencia_funcionamiento} disabled={loading} onChange={set("vigencia_licencia_funcionamiento")} />
              </div>
            </>
          )}

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
