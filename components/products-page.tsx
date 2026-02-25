// ════════════════════════════════════════════════════════════════════════════
// app/dashboard/products/page.tsx
// ════════════════════════════════════════════════════════════════════════════
import { getUserPermissions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { ProductsGrid } from "@/components/products-grid"
import { Plus, Package } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

const PAGE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');
.pp {
  font-family:'DM Sans',sans-serif;
  --p: var(--primary,#984ca8); --p10:rgba(var(--primary-rgb,152,76,168),.10); --border:rgba(26,26,24,.08);
}
.pp-hd { display:flex; flex-direction:column; gap:14px; padding-bottom:20px; border-bottom:1px solid var(--border); margin-bottom:22px; }
@media(min-width:640px){ .pp-hd{ flex-direction:row; align-items:center; justify-content:space-between; } }
.pp-title { font-family:'Cormorant Garamond',Georgia,serif; font-size:22px; font-weight:400; color:#1a1a18; margin:0; display:flex; align-items:center; gap:10px; }
.pp-dot   { width:8px; height:8px; background:var(--p); flex-shrink:0; }
.pp-sub   { font-size:12px; color:rgba(26,26,24,.45); margin:3px 0 0; }
.pp-new {
  display:inline-flex; align-items:center; gap:7px;
  height:38px; padding:0 18px; background:var(--p); border:none; cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600;
  letter-spacing:.06em; text-transform:uppercase; color:#fff;
  text-decoration:none; transition:opacity .15s; white-space:nowrap; flex-shrink:0;
}
.pp-new:hover { opacity:.88; }
`

export default async function ProductsPage() {
  const permissions = await getUserPermissions()
  if (!permissions?.permissions?.productos) redirect("/dashboard")

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: userCompany } = await supabase
    .from("user_companies").select("company_id").eq("user_id", user.id).single()
  if (!userCompany?.company_id) redirect("/dashboard")

  const companyId = userCompany.company_id
  const { data: products } = await supabase
    .from("products")
    .select("*, categories(name), suppliers(name), purchase_batches(remaining_quantity)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })

  const productsWithStock = products?.map(p => ({
    ...p,
    current_stock: p.purchase_batches?.reduce((s: number, b: any) => s + (b.remaining_quantity || 0), 0) || 0,
  })) || []

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <div className="pp">
        <div className="pp-hd">
          <div>
            <h1 className="pp-title">
              <span className="pp-dot" aria-hidden />
              Catálogo de Productos
            </h1>
            <p className="pp-sub">Gestión completa de {productsWithStock.length} productos</p>
          </div>
          <Link href="/dashboard/products/new" className="pp-new">
            <Plus size={14} aria-hidden />
            Nuevo producto
          </Link>
        </div>
        <ProductsGrid products={productsWithStock} />
      </div>
    </>
  )
}
