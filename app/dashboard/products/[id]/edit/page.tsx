import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { redirect } from "next/navigation"
import { ProductForm } from "@/components/product-form"


const FORM_PAGE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');
.fp {
  font-family:'DM Sans',sans-serif;
  --p:var(--primary,#984ca8); --border:rgba(26,26,24,.08);
}
.fp-hd { display:flex; flex-direction:column; gap:14px; padding-bottom:20px; border-bottom:1px solid var(--border); margin-bottom:22px; }
@media(min-width:640px){ .fp-hd{ flex-direction:row; align-items:center; justify-content:space-between; } }
.fp-title { font-family:'Cormorant Garamond',Georgia,serif; font-size:22px; font-weight:400; color:#1a1a18; margin:0; display:flex; align-items:center; gap:10px; }
.fp-dot   { width:8px; height:8px; background:var(--p); flex-shrink:0; }
.fp-sub   { font-size:12px; color:rgba(26,26,24,.45); margin:3px 0 0; }
.fp-back {
  display:inline-flex; align-items:center; gap:6px;
  height:36px; padding:0 14px;
  border:1px solid rgba(26,26,24,.08); background:#fff;
  font-family:'DM Sans',sans-serif; font-size:12px; color:rgba(26,26,24,.55);
  text-decoration:none; transition:border-color .14s, color .14s; white-space:nowrap;
}
.fp-back:hover { border-color:var(--p); color:var(--p); }
.fp-back svg { width:13px; height:13px; }
.fp-card { background:#fff; border:1px solid rgba(26,26,24,.08); padding:24px; }
@media(max-width:640px){ .fp-card{ padding:16px; } }
`

export async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: userCompany } = await supabase
    .from("user_companies").select("company_id").eq("user_id", user.id).single()
  if (!userCompany?.company_id) redirect("/dashboard")

  const { data: product } = await supabase
    .from("products").select("*")
    .eq("id", id).eq("company_id", userCompany.company_id).single()

  if (!product) notFound()

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FORM_PAGE_CSS }} />
      <div className="fp">
        <div className="fp-hd">
          <div>
            <h1 className="fp-title"><span className="fp-dot" aria-hidden />Editar Producto</h1>
            <p className="fp-sub">Modificando: <strong>{product.name}</strong></p>
          </div>
          <Link href="/dashboard/products" className="fp-back">
            <ArrowLeft aria-hidden /> Volver al catálogo
          </Link>
        </div>
        <div className="fp-card">
          <ProductForm product={product} companyId={userCompany.company_id} />
        </div>
      </div>
    </>
  )
}

// Default export para Next.js (edit page)
export default EditProductPage
