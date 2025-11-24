import { getUserPermissions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Plus, FolderTree } from "lucide-react"
import { CategoriesTable } from "@/components/categories-table"
import { CategoryDialog } from "@/components/category-dialog"
import { redirect } from "next/navigation" 

export default async function CategoriesPage() {
  // ✅ VALIDAR PERMISOS AL INICIO
  const permissions = await getUserPermissions()
   // Verificar si existe el permiso rentabilidad y es true
  if (!permissions?.permissions?.categorias) {
    redirect("/dashboard") // Redirige si no tiene permiso
  }
  
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true })

  return (
    <div className="flex-1 flex flex-col bg-card/70 backdrop-blur-md p-4 md:p-6 rounded-2xl shadow-inner border border-border/20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <FolderTree className="h-7 w-7 icon-categories" />
          <div>
            <h1 className="dashboard-title">Categorías</h1>
            <p className="dashboard-subtitle mt-1">
              {categories?.length || 0} categorías activas
            </p>
          </div>
        </div>
        <CategoryDialog>
          <Button className="group w-full md:w-auto bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary transition-all duration-300 shadow-md">
            <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
            Nueva Categoría
          </Button>
        </CategoryDialog>
      </div>

      {/* Table Container */}
      <div className="card-dashboard p-4">
        <CategoriesTable categories={categories || []} />
      </div>
    </div>
  )
}