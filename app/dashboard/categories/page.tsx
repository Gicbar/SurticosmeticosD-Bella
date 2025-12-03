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
  if (!permissions?.permissions?.categorias) {
    redirect("/dashboard") 
  }
  
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true }) 

  return (
    // 1. Usamos la nueva clase contenedora general
    <div className="dashboard-page-container">
      
      {/* 2. Barra de Herramientas (Header + Botón) */}
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

        {/* Botón de Acción con estilo RSNL */}
        <CategoryDialog>
          <Button className="btn-action-new"> 
            {/* Importante: Clase icon-plus para la animación */}
            <Plus className="icon-plus" />
            Nueva Categoría
          </Button>
        </CategoryDialog>
      </div>

      {/* 3. Contenedor de la Tabla */}
      <div className="table-container">
        <CategoriesTable categories={categories || []} />
      </div>
    </div>
  )
}