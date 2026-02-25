import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Edit } from "lucide-react"
import { getUserPermissions } from "@/lib/auth"
import Link from "next/link"
import { ArrowLeft, Truck } from "lucide-react"
import { redirect } from "next/navigation"
import { SupplierForm } from "@/components/supplier-form"

const FORM_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');
.sfp {
  font-family:'DM Sans',sans-serif;
  --p:var(--primary,#984ca8); --border:rgba(26,26,24,.08);
}
.sfp-hd { display:flex; flex-direction:column; gap:14px; padding-bottom:20px; border-bottom:1px solid var(--border); margin-bottom:22px; }
@media(min-width:640px){ .sfp-hd{ flex-direction:row; align-items:center; justify-content:space-between; } }
.sfp-left { display:flex; align-items:center; gap:12px; }
.sfp-back {
  width:34px; height:34px; border:1px solid var(--border); background:#fff;
  display:flex; align-items:center; justify-content:center; text-decoration:none;
  color:rgba(26,26,24,.4); flex-shrink:0; transition:border-color .14s, color .14s;
}
.sfp-back:hover { border-color:var(--p); color:var(--p); }
.sfp-back svg { width:14px; height:14px; }
.sfp-title { font-family:'Cormorant Garamond',Georgia,serif; font-size:22px; font-weight:400; color:#1a1a18; margin:0; display:flex; align-items:center; gap:10px; }
.sfp-dot { width:8px; height:8px; background:var(--p); flex-shrink:0; }
.sfp-sub { font-size:12px; color:rgba(26,26,24,.45); margin:3px 0 0; }
.sfp-card { background:#fff; border:1px solid var(--border); padding:24px; max-width:680px; }
@media(max-width:640px){ .sfp-card{ padding:16px; } }
`

export async function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const permissions = await getUserPermissions()
  if (!permissions?.permissions?.proveedores) redirect("/dashboard")
  const companyId = permissions.company_id
  if (!companyId) redirect("/auth/sin-empresa")

  const supabase = await createClient()
  const { data: supplier } = await supabase
    .from("suppliers").select("*")
    .eq("id", id).eq("company_id", companyId).single()

  if (!supplier) notFound()

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FORM_CSS }} />
      <div className="sfp">
        <div className="sfp-hd">
          <div className="sfp-left">
            <Link href="/dashboard/suppliers" className="sfp-back" aria-label="Volver a proveedores">
              <ArrowLeft aria-hidden />
            </Link>
            <div>
              <h1 className="sfp-title"><span className="sfp-dot" aria-hidden />Editar Proveedor</h1>
              <p className="sfp-sub">Modificando: <strong>{supplier.name}</strong></p>
            </div>
          </div>
        </div>
        <div className="sfp-card">
          <SupplierForm supplier={supplier} companyId={companyId} />
        </div>
      </div>
    </>
  )
}

// default export para Next.js (edit page)
export default EditSupplierPage