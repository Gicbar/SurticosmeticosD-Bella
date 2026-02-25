// ════════════════════════════════════════════════════════════════════════════
// app/dashboard/suppliers/page.tsx
// ════════════════════════════════════════════════════════════════════════════
import { getUserPermissions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { SuppliersTable } from "@/components/suppliers-table"
import { Plus, Truck, Package, Phone, Mail } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

const SUP_PAGE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
.sp {
  font-family:'DM Sans',sans-serif;
  --p:    var(--primary,#984ca8);
  --p10:  rgba(var(--primary-rgb,152,76,168),.10);
  --txt:  #1a1a18;
  --muted:rgba(26,26,24,.45);
  --border:rgba(26,26,24,.08);
}
.sp-hd { display:flex; flex-direction:column; gap:14px; padding-bottom:20px; border-bottom:1px solid var(--border); margin-bottom:22px; }
@media(min-width:640px){ .sp-hd{ flex-direction:row; align-items:center; justify-content:space-between; } }
.sp-title { font-family:'Cormorant Garamond',Georgia,serif; font-size:22px; font-weight:400; color:var(--txt); margin:0; display:flex; align-items:center; gap:10px; }
.sp-dot   { width:8px; height:8px; background:var(--p); flex-shrink:0; }
.sp-sub   { font-size:12px; color:var(--muted); margin:3px 0 0; }
.sp-btn-new {
  display:inline-flex; align-items:center; gap:7px;
  height:38px; padding:0 18px; background:var(--p); border:none; cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600;
  letter-spacing:.06em; text-transform:uppercase; color:#fff;
  text-decoration:none; transition:opacity .15s; white-space:nowrap; flex-shrink:0;
}
.sp-btn-new:hover { opacity:.88; }
.sp-kpi-grid { display:grid; gap:10px; margin-bottom:20px; grid-template-columns:repeat(2,1fr); }
@media(min-width:640px){ .sp-kpi-grid{ grid-template-columns:repeat(4,1fr); } }
.sp-kpi { background:#fff; border:1px solid var(--border); padding:15px 14px; position:relative; overflow:hidden; transition:box-shadow .18s,transform .18s; }
.sp-kpi:hover { box-shadow:0 4px 18px var(--p10); transform:translateY(-1px); }
.sp-kpi::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:var(--p); opacity:0; transition:opacity .18s; }
.sp-kpi:hover::before { opacity:1; }
.sp-kpi-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; }
.sp-kpi-lbl { font-size:8px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:var(--muted); }
.sp-kpi-ico { width:26px; height:26px; background:var(--p10); display:flex; align-items:center; justify-content:center; }
.sp-kpi-ico svg { color:var(--p); width:12px; height:12px; }
.sp-kpi-val { font-family:'Cormorant Garamond',Georgia,serif; font-size:20px; font-weight:500; color:var(--txt); margin:0; line-height:1; }
.sp-kpi-sub { font-size:10px; color:var(--muted); margin:4px 0 0; }
.sp-table-wrap { background:#fff; border:1px solid var(--border); overflow:hidden; }
.sp-empty { display:flex; flex-direction:column; align-items:center; gap:14px; padding:64px 20px; text-align:center; }
.sp-empty-ico { width:56px; height:56px; background:var(--p10); display:flex; align-items:center; justify-content:center; border-radius:50%; }
.sp-empty-ico svg { color:var(--p); opacity:.3; width:24px; height:24px; }
.sp-empty-t { font-size:14px; font-weight:500; color:var(--txt); margin:0; }
.sp-empty-s { font-size:12px; color:var(--muted); margin:0; }
`

function KpiCard({ title, value, sub, icon: Icon }: { title:string; value:string|number; sub?:string; icon:any }) {
  return (
    <div className="sp-kpi">
      <div className="sp-kpi-top">
        <span className="sp-kpi-lbl">{title}</span>
        <div className="sp-kpi-ico" aria-hidden><Icon /></div>
      </div>
      <p className="sp-kpi-val">{value}</p>
      {sub && <p className="sp-kpi-sub">{sub}</p>}
    </div>
  )
}

export default async function SuppliersPage() {
  const permissions = await getUserPermissions()
  if (!permissions?.permissions?.proveedores) redirect("/dashboard")
  const companyId = permissions.company_id
  if (!companyId) redirect("/auth/sin-empresa")

  const supabase = await createClient()
  const { data: suppliers } = await supabase
    .from("suppliers").select("*")
    .eq("company_id", companyId).order("name", { ascending: true })

  const total   = suppliers?.length || 0
  const conCtc  = suppliers?.filter(s => s.contact).length || 0
  const conTel  = suppliers?.filter(s => s.phone).length || 0
  const conMail = suppliers?.filter(s => s.email).length || 0

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SUP_PAGE_CSS }} />
      <div className="sp">
        <div className="sp-hd">
          <div>
            <h1 className="sp-title"><span className="sp-dot" aria-hidden />Proveedores</h1>
            <p className="sp-sub">{total} proveedores · {conCtc} con contacto · {conTel} con teléfono</p>
          </div>
          <Link href="/dashboard/suppliers/new" className="sp-btn-new">
            <Plus size={13} aria-hidden />Nuevo proveedor
          </Link>
        </div>

        <div className="sp-kpi-grid">
          <KpiCard title="Total"      value={total}   sub="Registros activos"   icon={Truck}   />
          <KpiCard title="Contacto"   value={conCtc}  sub="Persona de contacto" icon={Package} />
          <KpiCard title="Email"      value={conMail} sub="Correo electrónico"  icon={Mail}    />
          <KpiCard title="Teléfono"   value={conTel}  sub="Línea directa"       icon={Phone}   />
        </div>

        <div className="sp-table-wrap">
          {suppliers && suppliers.length > 0
            ? <SuppliersTable suppliers={suppliers} companyId={companyId} />
            : (
              <div className="sp-empty">
                <div className="sp-empty-ico"><Truck /></div>
                <p className="sp-empty-t">No hay proveedores registrados</p>
                <p className="sp-empty-s">Crea tu primer proveedor para gestionar las compras</p>
              </div>
            )
          }
        </div>
      </div>
    </>
  )
}
