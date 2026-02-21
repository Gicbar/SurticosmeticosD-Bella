import { getUserPermissions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Plus, FolderTree } from "lucide-react"
import { CategoriesTable } from "@/components/categories-table"
import { CategoryDialog } from "@/components/category-dialog"
import { redirect } from "next/navigation"

export default async function CategoriesPage() {
  // ── 1. Permisos + company_id en una sola llamada ──────────────────────────
  const permissions = await getUserPermissions()

  if (!permissions?.permissions?.categorias) {
    redirect("/dashboard")
  }

  const companyId = permissions.company_id
  if (!companyId) redirect("/auth/sin-empresa")

  // ── 2. Query filtrada por empresa ─────────────────────────────────────────
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("company_id", companyId)          // ← FILTRO MULTIEMPRESA
    .order("name", { ascending: true })

  return (
    <div className="dashboard-page-container">
      <div className="dashboard-toolbar">
        <div className="dashboard-header">
          <h1 className="dashboard-title flex items-center gap-3">
            <FolderTree className="dashboard-title-icon h-7 w-7 icon-products" />
            Categorías
          </h1>
          <p className="dashboard-subtitle mt-1">
            {categories?.length || 0} categorías activas
          </p>
        </div>

        <CategoryDialog companyId={companyId}>
          <Button className="btn-action-new">
            <Plus className="icon-plus" />
            Nueva Categoría
          </Button>
        </CategoryDialog>
      </div>

      <div className="table-container">
        <CategoriesTable categories={categories || []} companyId={companyId} />
      </div>
    </div>
  )
}
