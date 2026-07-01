// ════════════════════════════════════════════════════════════════════════════
// app/dashboard/categories/page.tsx
// ════════════════════════════════════════════════════════════════════════════
import { getUserPermissions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { CategoriesTable } from "@/components/categories-table"
import { CategoryDialog } from "@/components/category-dialog"
import { ExpenseCategoriesPanel } from "@/components/expense-categories-panel"
import { FolderTree, Receipt } from "lucide-react"
import { redirect } from "next/navigation"

const CAT_PAGE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');
.cp { font-family:'DM Sans',sans-serif; --p:var(--primary,#984ca8); --p10:rgba(var(--primary-rgb,152,76,168),.10); --border:rgba(26,26,24,.08); --muted:rgba(26,26,24,.45); }
.cp-hd { display:flex; flex-direction:column; gap:4px; padding-bottom:20px; border-bottom:1px solid var(--border); margin-bottom:22px; }
.cp-title { font-family:'Cormorant Garamond',Georgia,serif; font-size:22px; font-weight:400; color:#1a1a18; margin:0; display:flex; align-items:center; gap:10px; }
.cp-dot { width:8px; height:8px; background:var(--p); flex-shrink:0; }
.cp-sub { font-size:12px; color:var(--muted); margin:3px 0 0; }

/* Paneles lado a lado */
.cp-panels { display:grid; gap:18px; grid-template-columns:1fr; align-items:start; }
@media(min-width:900px){ .cp-panels{ grid-template-columns:1fr 1fr; } }

.cp-panel { background:#fff; border:1px solid var(--border); overflow:hidden; }
.cp-panel-hd { display:flex; align-items:center; gap:10px; padding:14px 16px; border-bottom:1px solid var(--border); }
.cp-panel-ico { width:28px; height:28px; background:var(--p10); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.cp-panel-ico svg { color:var(--p); width:14px; height:14px; }
.cp-panel-titles { flex:1; min-width:0; }
.cp-panel-title { font-size:11px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:#1a1a18; margin:0; }
.cp-panel-cnt { font-size:11px; color:var(--muted); margin:2px 0 0; }
.cp-panel-action { flex-shrink:0; }
`

export default async function CategoriesPage() {
  const permissions = await getUserPermissions()
  if (!permissions?.permissions?.categorias) redirect("/dashboard")

  const companyId = permissions.company_id
  if (!companyId) redirect("/auth/sin-empresa")

  const supabase = await createClient()
  const [{ data: categories }, { data: expenseCategories }] = await Promise.all([
    supabase.from("categories").select("*")
      .eq("company_id", companyId).order("name", { ascending: true }),
    supabase.from("categories_expense").select("id, name")
      .eq("company_id", companyId).order("name", { ascending: true }),
  ])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CAT_PAGE_CSS }} />
      <div className="cp">
        <div className="cp-hd">
          <h1 className="cp-title"><span className="cp-dot" aria-hidden />Categorías</h1>
          <p className="cp-sub">Organiza tus productos y clasifica tus gastos</p>
        </div>

        <div className="cp-panels">
          {/* ── Panel: Categorías de productos ── */}
          <div className="cp-panel">
            <div className="cp-panel-hd">
              <div className="cp-panel-ico" aria-hidden><FolderTree /></div>
              <div className="cp-panel-titles">
                <p className="cp-panel-title">Categorías de productos</p>
                <p className="cp-panel-cnt">{categories?.length || 0} categorías</p>
              </div>
              <div className="cp-panel-action">
                <CategoryDialog companyId={companyId} />
              </div>
            </div>
            <CategoriesTable categories={categories || []} companyId={companyId} />
          </div>

          {/* ── Panel: Categorías de gastos ── */}
          <div className="cp-panel">
            <div className="cp-panel-hd">
              <div className="cp-panel-ico" aria-hidden><Receipt /></div>
              <div className="cp-panel-titles">
                <p className="cp-panel-title">Categorías de gastos</p>
                <p className="cp-panel-cnt">{expenseCategories?.length || 0} categorías</p>
              </div>
            </div>
            <ExpenseCategoriesPanel
              initialCategories={(expenseCategories as { id: number; name: string }[]) || []}
              companyId={companyId}
            />
          </div>
        </div>
      </div>
    </>
  )
}
