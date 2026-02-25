import { getUserPermissions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { ProductsGrid } from "@/components/products-grid"
import { Button } from "@/components/ui/button"
import { Plus, Package } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

const CAT_PAGE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');
.cp { font-family:'DM Sans',sans-serif; --p:var(--primary,#984ca8); --border:rgba(26,26,24,.08); }
.cp-hd { display:flex; flex-direction:column; gap:14px; padding-bottom:20px; border-bottom:1px solid var(--border); margin-bottom:22px; }
@media(min-width:640px){ .cp-hd{ flex-direction:row; align-items:center; justify-content:space-between; } }
.cp-title { font-family:'Cormorant Garamond',Georgia,serif; font-size:22px; font-weight:400; color:#1a1a18; margin:0; display:flex; align-items:center; gap:10px; }
.cp-dot { width:8px; height:8px; background:var(--p); flex-shrink:0; }
.cp-sub { font-size:12px; color:rgba(26,26,24,.45); margin:3px 0 0; }
.cp-table-wrap { background:#fff; border:1px solid var(--border); overflow:hidden; }
`

export default async function ProductsPage() {
  // ── 1. Validar permisos ───────────────────────────────────────────────────
  const permissions = await getUserPermissions()

  if (!permissions?.permissions?.productos) {
    redirect("/dashboard")
  }

  // ── 2. Obtener company_id del usuario autenticado ─────────────────────────
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const { data: userCompany } = await supabase
    .from("user_companies")
    .select("company_id")
    .eq("user_id", user.id)
    .single()

  if (!userCompany?.company_id) redirect("/dashboard")

  const companyId = userCompany.company_id

  // ── 3. Query filtrada por company_id ──────────────────────────────────────
  const { data: products } = await supabase
    .from("products")
    .select(`
      *,
      categories(name),
      suppliers(name),
      purchase_batches(remaining_quantity)
    `)
    .eq("company_id", companyId)           // ← FILTRO MULTIEMPRESA
    .order("created_at", { ascending: false })

  const productsWithStock =
    products?.map((product) => ({
      ...product,
      current_stock:
        product.purchase_batches?.reduce(
          (sum: number, batch: any) => sum + (batch.remaining_quantity || 0),
          0
        ) || 0,
    })) || []

  return (
    <>
    <style dangerouslySetInnerHTML={{ __html: CAT_PAGE_CSS }} />
    
    <div className="cp">
      <div className="cp-hd"> 
        <div>
          <h1 className="cp-title"><span className="cp-dot" aria-hidden />Catálogo de Productos</h1>
          <p className="cp-sub">Gestión completa de <span>{productsWithStock.length} productos</span></p>
        </div>
        <Button className="btn-action-new">
          <Link href="/dashboard/products/new" className="flex items-center relative z-10">
            <Plus className="icon-plus" />
            Nuevo Producto
          </Link>
        </Button>
      </div>
      {/* Products Grid */}
      <div className="animate-fadeIn">
        <ProductsGrid products={productsWithStock} />
      </div>
    </div>
    </>
  )
}
