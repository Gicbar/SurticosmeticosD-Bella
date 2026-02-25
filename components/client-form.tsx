"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { showError, showSuccess } from "@/lib/sweetalert"
import { User, Mail, Phone, MapPin } from "lucide-react"

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
.cf {
  font-family:'DM Sans',sans-serif;
  --p:    var(--primary,#984ca8);
  --p10:  rgba(var(--primary-rgb,152,76,168),.10);
  --txt:  #1a1a18;
  --muted:rgba(26,26,24,.45);
  --border:rgba(26,26,24,.08);
}
.cf-lbl { display:block; font-size:9px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:var(--muted); margin-bottom:5px; }
.cf-lbl-row { display:flex; align-items:center; gap:5px; }
.cf-lbl-row svg { width:11px; height:11px; }
.cf-inp {
  width:100%; height:42px; padding:0 13px;
  border:1px solid var(--border); background:#fff;
  font-family:'DM Sans',sans-serif; font-size:13px; color:var(--txt);
  outline:none; -webkit-appearance:none; transition:border-color .14s;
}
.cf-inp:focus { border-color:var(--p); }
.cf-inp:disabled { opacity:.5; cursor:not-allowed; }
.cf-textarea {
  width:100%; min-height:90px; padding:11px 13px; resize:vertical;
  border:1px solid var(--border); background:#fff;
  font-family:'DM Sans',sans-serif; font-size:13px; color:var(--txt);
  outline:none; transition:border-color .14s;
}
.cf-textarea:focus { border-color:var(--p); }
.cf-textarea:disabled { opacity:.5; cursor:not-allowed; }
.cf-g2 { display:grid; gap:16px; grid-template-columns:1fr 1fr; }
@media(max-width:500px){ .cf-g2{ grid-template-columns:1fr; } }
.cf-row { margin-bottom:16px; }
.cf-sep { height:1px; background:var(--border); margin:20px 0 16px; }
.cf-btn-row { display:flex; gap:8px; justify-content:flex-end; }
.cf-btn-save {
  height:42px; padding:0 24px; border:none; background:var(--p); cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600;
  letter-spacing:.08em; text-transform:uppercase; color:#fff;
  display:flex; align-items:center; gap:6px; transition:opacity .14s;
  min-width:150px; justify-content:center;
}
.cf-btn-save:hover:not(:disabled) { opacity:.88; }
.cf-btn-save:disabled { opacity:.4; cursor:not-allowed; }
.cf-btn-cancel {
  height:42px; padding:0 20px; border:1px solid var(--border); background:#fff; cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:12px; color:var(--muted);
  transition:border-color .14s, color .14s;
}
.cf-btn-cancel:hover { border-color:var(--txt); color:var(--txt); }
.cf-spin { width:13px; height:13px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:cfSpin .7s linear infinite; flex-shrink:0; }
@keyframes cfSpin { to{ transform:rotate(360deg); } }
`

interface Props { client?: any; companyId: string }

export function ClientForm({ client, companyId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name:    client?.name    || "",
    email:   client?.email   || "",
    phone:   client?.phone   || "",
    address: client?.address || "",
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const payload = {
      ...form,
      email:   form.email   || null,
      phone:   form.phone   || null,
      address: form.address || null,
      company_id: companyId,
    }
    try {
      const { error } = client
        ? await createClient().from("clients").update(payload)
            .eq("id", client.id).eq("company_id", companyId)
        : await createClient().from("clients").insert(payload)
      if (error) throw error
      await showSuccess(client ? "Cliente actualizado" : "Cliente creado")
      router.push("/dashboard/clients")
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
      <div className="cf">
        <form onSubmit={handleSubmit}>
          <div className="cf-g2" style={{ marginBottom: 16 }}>
            <div>
              <label className="cf-lbl cf-lbl-row" htmlFor="cf-name">
                <User aria-hidden />Nombre *
              </label>
              <input id="cf-name" className="cf-inp" required
                placeholder="Nombre completo"
                value={form.name} disabled={loading} onChange={set("name")} />
            </div>
            <div>
              <label className="cf-lbl cf-lbl-row" htmlFor="cf-email">
                <Mail aria-hidden />Email
              </label>
              <input id="cf-email" className="cf-inp" type="email"
                placeholder="correo@ejemplo.com"
                value={form.email} disabled={loading} onChange={set("email")} />
            </div>
          </div>

          <div className="cf-row">
            <label className="cf-lbl cf-lbl-row" htmlFor="cf-phone">
              <Phone aria-hidden />Teléfono
            </label>
            <input id="cf-phone" className="cf-inp"
              placeholder="Número de contacto"
              value={form.phone} disabled={loading} onChange={set("phone")} />
          </div>

          <div className="cf-row">
            <label className="cf-lbl cf-lbl-row" htmlFor="cf-addr">
              <MapPin aria-hidden />Dirección
            </label>
            <textarea id="cf-addr" className="cf-textarea"
              placeholder="Dirección completa"
              value={form.address} disabled={loading}
              onChange={set("address")} />
          </div>

          <div className="cf-sep" aria-hidden />

          <div className="cf-btn-row">
            <button type="button" className="cf-btn-cancel" disabled={loading}
              onClick={() => router.back()}>
              Cancelar
            </button>
            <button type="submit" className="cf-btn-save"
              disabled={loading || !form.name.trim()}>
              {loading
                ? <><div className="cf-spin" />Guardando…</>
                : client ? "Actualizar cliente" : "Guardar cliente"}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
