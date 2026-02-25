// app/dashboard/clients/page.tsx
import { getUserPermissions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { ClientsTable } from "@/components/clients-table"
import { Plus, Users, UserPlus, Mail, Phone } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
.cl-page {
  font-family:'DM Sans',sans-serif;
  --p:    var(--primary,#984ca8);
  --p10:  rgba(var(--primary-rgb,152,76,168),.10);
  --txt:  #1a1a18;
  --muted:rgba(26,26,24,.45);
  --border:rgba(26,26,24,.08);
}
.cl-hd { display:flex; flex-direction:column; gap:14px; padding-bottom:20px; border-bottom:1px solid var(--border); margin-bottom:22px; }
@media(min-width:640px){ .cl-hd{ flex-direction:row; align-items:center; justify-content:space-between; } }
.cl-title { font-family:'Cormorant Garamond',Georgia,serif; font-size:22px; font-weight:400; color:var(--txt); margin:0; display:flex; align-items:center; gap:10px; }
.cl-dot   { width:8px; height:8px; background:var(--p); flex-shrink:0; }
.cl-sub   { font-size:12px; color:var(--muted); margin:3px 0 0; }
.cl-btn-new {
  display:inline-flex; align-items:center; gap:7px;
  height:38px; padding:0 18px; background:var(--p); border:none; cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600;
  letter-spacing:.06em; text-transform:uppercase; color:#fff;
  text-decoration:none; transition:opacity .15s; white-space:nowrap; flex-shrink:0;
}
.cl-btn-new:hover { opacity:.88; }
.cl-btn-new svg { width:13px; height:13px; }

/* KPIs */
.cl-kpi-grid { display:grid; gap:10px; margin-bottom:20px; grid-template-columns:repeat(3,1fr); }
@media(max-width:480px){ .cl-kpi-grid{ grid-template-columns:1fr 1fr; } }
.cl-kpi { background:#fff; border:1px solid var(--border); padding:15px 14px; position:relative; overflow:hidden; transition:box-shadow .18s,transform .18s; }
.cl-kpi:hover { box-shadow:0 4px 18px var(--p10); transform:translateY(-1px); }
.cl-kpi::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:var(--p); opacity:0; transition:opacity .18s; }
.cl-kpi:hover::before { opacity:1; }
.cl-kpi-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; }
.cl-kpi-lbl { font-size:8px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:var(--muted); }
.cl-kpi-ico { width:26px; height:26px; background:var(--p10); display:flex; align-items:center; justify-content:center; }
.cl-kpi-ico svg { color:var(--p); width:12px; height:12px; }
.cl-kpi-val { font-family:'Cormorant Garamond',Georgia,serif; font-size:20px; font-weight:500; color:var(--txt); margin:0; line-height:1; }
.cl-kpi-sub { font-size:10px; color:var(--muted); margin:4px 0 0; }

.cl-table-wrap { background:#fff; border:1px solid var(--border); overflow:hidden; }

/* Vacío */
.cl-empty { display:flex; flex-direction:column; align-items:center; gap:14px; padding:64px 20px; text-align:center; }
.cl-empty-ico { width:56px; height:56px; background:var(--p10); display:flex; align-items:center; justify-content:center; border-radius:50%; }
.cl-empty-ico svg { color:var(--p); opacity:.3; width:24px; height:24px; }
.cl-empty-t { font-size:14px; font-weight:500; color:var(--txt); margin:0; }
.cl-empty-s { font-size:12px; color:var(--muted); margin:0; }
`

function KpiCard({ title, value, sub, icon: Icon }: { title:string; value:string|number; sub?:string; icon:any }) {
  return (
    <div className="cl-kpi">
      <div className="cl-kpi-top">
        <span className="cl-kpi-lbl">{title}</span>
        <div className="cl-kpi-ico" aria-hidden><Icon /></div>
      </div>
      <p className="cl-kpi-val">{value}</p>
      {sub && <p className="cl-kpi-sub">{sub}</p>}
    </div>
  )
}

export default async function ClientsPage() {
  const permissions = await getUserPermissions()
  if (!permissions?.permissions?.clientes) redirect("/dashboard")
  const companyId = permissions.company_id
  if (!companyId) redirect("/auth/sin-empresa")

  const supabase = await createClient()
  const { data: clients } = await supabase
    .from("clients").select("*")
    .eq("company_id", companyId).order("name", { ascending: true })

  const total    = clients?.length || 0
  const conMail  = clients?.filter(c => c.email).length || 0
  const conPhone = clients?.filter(c => c.phone).length || 0

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="cl-page">
        <div className="cl-hd">
          <div>
            <h1 className="cl-title"><span className="cl-dot" aria-hidden />Clientes</h1>
            <p className="cl-sub">{total} clientes · {conMail} con email · {conPhone} con teléfono</p>
          </div>
          <Link href="/dashboard/clients/new" className="cl-btn-new">
            <Plus size={13} aria-hidden />Nuevo cliente
          </Link>
        </div>

        <div className="cl-kpi-grid">
          <KpiCard title="Total clientes" value={total}   sub="Registros activos" icon={Users}   />
          <KpiCard title="Con email"      value={conMail} sub="Correo registrado"  icon={Mail}    />
          <KpiCard title="Con teléfono"   value={conPhone} sub="Línea directa"    icon={Phone}   />
        </div>

        <div className="cl-table-wrap">
          {clients && clients.length > 0
            ? <ClientsTable clients={clients} companyId={companyId} />
            : (
              <div className="cl-empty">
                <div className="cl-empty-ico"><UserPlus /></div>
                <p className="cl-empty-t">No hay clientes registrados</p>
                <p className="cl-empty-s">Crea tu primer cliente para gestionar tus ventas</p>
              </div>
            )
          }
        </div>
      </div>
    </>
  )
}
