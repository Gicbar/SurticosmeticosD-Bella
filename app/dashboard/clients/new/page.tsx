import { getUserPermissions } from "@/lib/auth"
import { ClientForm } from "@/components/client-form"
import Link from "next/link"
import { ArrowLeft, Users } from "lucide-react"
import { redirect } from "next/navigation"

const PAGE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');
.cfp {
  font-family:'DM Sans',sans-serif;
  --p:var(--primary,#984ca8); --border:rgba(26,26,24,.08); --txt:#1a1a18; --muted:rgba(26,26,24,.45);
}
.cfp-hd { display:flex; flex-direction:column; gap:14px; padding-bottom:20px; border-bottom:1px solid var(--border); margin-bottom:22px; }
@media(min-width:640px){ .cfp-hd{ flex-direction:row; align-items:center; } }
.cfp-left { display:flex; align-items:center; gap:12px; }
.cfp-back { width:34px; height:34px; border:1px solid var(--border); background:#fff; display:flex; align-items:center; justify-content:center; text-decoration:none; color:var(--muted); flex-shrink:0; transition:border-color .14s, color .14s; }
.cfp-back:hover { border-color:var(--p); color:var(--p); }
.cfp-back svg { width:14px; height:14px; }
.cfp-title { font-family:'Cormorant Garamond',Georgia,serif; font-size:22px; font-weight:400; color:var(--txt); margin:0; display:flex; align-items:center; gap:10px; }
.cfp-dot { width:8px; height:8px; background:var(--p); flex-shrink:0; }
.cfp-sub { font-size:12px; color:var(--muted); margin:3px 0 0; }
.cfp-card { background:#fff; border:1px solid var(--border); padding:24px; max-width:680px; }
@media(max-width:640px){ .cfp-card{ padding:16px; } }
`

export default async function NewClientPage() {
  const permissions = await getUserPermissions()
  if (!permissions?.permissions?.clientes) redirect("/dashboard")
  const companyId = permissions.company_id
  if (!companyId) redirect("/auth/sin-empresa")

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <div className="cfp">
        <div className="cfp-hd">
          <div className="cfp-left">
            <Link href="/dashboard/clients" className="cfp-back" aria-label="Volver a clientes">
              <ArrowLeft aria-hidden />
            </Link>
            <div>
              <h1 className="cfp-title"><span className="cfp-dot" aria-hidden />Nuevo Cliente</h1>
              <p className="cfp-sub">Registra un nuevo cliente para tus ventas</p>
            </div>
          </div>
        </div>
        <div className="cfp-card">
          <ClientForm companyId={companyId} />
        </div>
      </div>
    </>
  )
}