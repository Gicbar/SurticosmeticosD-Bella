// ════════════════════════════════════════════════════════════════════════════
// app/dashboard/categories/page.tsx
// ════════════════════════════════════════════════════════════════════════════
import { getUserPermissions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { CategoriesTable } from "@/components/categories-table"
import { CategoryDialog } from "@/components/category-dialog"
import { Plus } from "lucide-react"
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

export default async function CategoriesPage() {
  const permissions = await getUserPermissions()
  if (!permissions?.permissions?.categorias) redirect("/dashboard")

  const companyId = permissions.company_id
  if (!companyId) redirect("/auth/sin-empresa")

  const supabase = await createClient()
  const { data: categories } = await supabase
    .from("categories").select("*")
    .eq("company_id", companyId)
    .order("name", { ascending: true })

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CAT_PAGE_CSS }} />
      <div className="cp">
        <div className="cp-hd">
          <div>
            <h1 className="cp-title"><span className="cp-dot" aria-hidden />Categorías</h1>
            <p className="cp-sub">{categories?.length || 0} categorías activas</p>
          </div>
          <CategoryDialog companyId={companyId} />
        </div>
        <div className="cp-table-wrap">
          <CategoriesTable categories={categories || []} companyId={companyId} />
        </div>
      </div>
    </>
  )
}
