"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { showError, showSuccess } from "@/lib/sweetalert"
import { Phone, Mail, MapPin, Building2, User, ArrowLeft } from "lucide-react"

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
.sf {
  font-family:'DM Sans',sans-serif;
  --p:    var(--primary,#984ca8);
  --p10:  rgba(var(--primary-rgb,152,76,168),.10);
  --txt:  #1a1a18;
  --muted:rgba(26,26,24,.45);
  --border:rgba(26,26,24,.08);
}
.sf-lbl { display:block; font-size:9px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:var(--muted); margin-bottom:5px; }
.sf-lbl-ico { display:flex; align-items:center; gap:5px; }
.sf-lbl-ico svg { width:12px; height:12px; }
.sf-inp {
  width:100%; height:42px; padding:0 13px;
  border:1px solid var(--border); background:#fff;
  font-family:'DM Sans',sans-serif; font-size:13px; color:var(--txt);
  outline:none; -webkit-appearance:none; transition:border-color .14s;
}
.sf-inp:focus { border-color:var(--p); }
.sf-inp:disabled { opacity:.5; cursor:not-allowed; }
.sf-g2 { display:grid; gap:16px; grid-template-columns:1fr 1fr; }
@media(max-width:500px){ .sf-g2{ grid-template-columns:1fr; } }
.sf-sep { height:1px; background:var(--border); margin:20px 0 16px; }
.sf-row { margin-bottom:16px; }
.sf-btn-row { display:flex; gap:8px; justify-content:flex-end; padding-top:4px; }
.sf-btn-save {
  height:42px; padding:0 24px; border:none; background:var(--p); cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600;
  letter-spacing:.08em; text-transform:uppercase; color:#fff;
  display:flex; align-items:center; gap:6px; transition:opacity .14s; min-width:160px; justify-content:center;
}
.sf-btn-save:hover:not(:disabled) { opacity:.88; }
.sf-btn-save:disabled { opacity:.4; cursor:not-allowed; }
.sf-btn-cancel {
  height:42px; padding:0 20px; border:1px solid var(--border); background:#fff; cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:12px; color:var(--muted);
  transition:border-color .14s, color .14s;
}
.sf-btn-cancel:hover { border-color:var(--txt); color:var(--txt); }
.sf-spin { width:13px; height:13px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:sfSpin .7s linear infinite; flex-shrink:0; }
@keyframes sfSpin { to{ transform:rotate(360deg); } }
`

interface Props { supplier?: any; companyId: string }

export function SupplierForm({ supplier, companyId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name:    supplier?.name    || "",
    contact: supplier?.contact || "",
    email:   supplier?.email   || "",
    phone:   supplier?.phone   || "",
    address: supplier?.address || "",
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...form,
        contact: form.contact || null,
        email:   form.email   || null,
        address: form.address || null,
        company_id: companyId,
      }
      const { error } = supplier
        ? await createClient().from("suppliers").update(payload)
            .eq("id", supplier.id).eq("company_id", companyId)
        : await createClient().from("suppliers").insert(payload)

      if (error) throw error
      await showSuccess(supplier ? "Proveedor actualizado" : "Proveedor registrado")
      router.push("/dashboard/suppliers")
      router.refresh()
    } catch (err: any) {
      showError(err.message || "Error al guardar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="sf">
        <form onSubmit={handleSubmit}>

          <div className="sf-row">
            <label className="sf-lbl sf-lbl-ico" htmlFor="sf-name">
              <Building2 aria-hidden />Nombre del proveedor *
            </label>
            <input id="sf-name" className="sf-inp" required
              placeholder="Empresa o razón social"
              value={form.name} disabled={loading} onChange={set("name")} />
          </div>

          <div className="sf-row">
            <label className="sf-lbl sf-lbl-ico" htmlFor="sf-contact">
              <User aria-hidden />Persona de contacto
            </label>
            <input id="sf-contact" className="sf-inp"
              placeholder="Nombre del contacto"
              value={form.contact} disabled={loading} onChange={set("contact")} />
          </div>

          <div className="sf-g2" style={{ marginBottom: 16 }}>
            <div>
              <label className="sf-lbl sf-lbl-ico" htmlFor="sf-email">
                <Mail aria-hidden />Email
              </label>
              <input id="sf-email" className="sf-inp" type="email"
                placeholder="correo@proveedor.com"
                value={form.email} disabled={loading} onChange={set("email")} />
            </div>
            <div>
              <label className="sf-lbl sf-lbl-ico" htmlFor="sf-phone">
                <Phone aria-hidden />Teléfono *
              </label>
              <input id="sf-phone" className="sf-inp" type="tel" required
                placeholder="Número de contacto"
                value={form.phone} disabled={loading} onChange={set("phone")} />
            </div>
          </div>

          <div className="sf-row">
            <label className="sf-lbl sf-lbl-ico" htmlFor="sf-address">
              <MapPin aria-hidden />Dirección
            </label>
            <input id="sf-address" className="sf-inp"
              placeholder="Dirección completa"
              value={form.address} disabled={loading} onChange={set("address")} />
          </div>

          <div className="sf-sep" aria-hidden />

          <div className="sf-btn-row">
            <button type="button" className="sf-btn-cancel" disabled={loading}
              onClick={() => router.push("/dashboard/suppliers")}>
              Cancelar
            </button>
            <button type="submit" className="sf-btn-save"
              disabled={loading || !form.name.trim() || !form.phone.trim()}>
              {loading
                ? <><div className="sf-spin" />Guardando…</>
                : supplier ? "Actualizar proveedor" : "Registrar proveedor"}
            </button>
          </div>

        </form>
      </div>
    </>
  )
}
