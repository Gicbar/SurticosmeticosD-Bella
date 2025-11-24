"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, FolderTree } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { CategoryDialog } from "@/components/category-dialog"
import { showError, showConfirm, showSuccess } from "@/lib/sweetalert"

type Category = {
  id: string
  name: string
  description: string | null
}

export function CategoriesTable({ categories }: { categories: Category[] }) {
  const router = useRouter()

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm(
      "Esta acción no se puede deshacer",
      "¿Eliminar esta categoría?"
    )

    if (!confirmed) return

    const supabase = createClient()
    const { error } = await supabase.from("categories").delete().eq("id", id)

    if (error) {
      showError("Error al eliminar la categoría")
    } else {
      await showSuccess("Categoría eliminada correctamente")
      router.refresh()
    }
  }

  return (
    <div className="table-container">
      <Table className="table-base">
        <TableHeader className="table-header">
          <TableRow className="table-row">
            <TableHead className="table-cell">Nombre</TableHead>
            <TableHead className="table-cell">Descripción</TableHead>
            <TableHead className="table-cell text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.length === 0 ? (
            <TableRow className="table-row">
              <TableCell colSpan={3} className="table-cell">
                <div className="py-8 flex items-center justify-center">
                  <div className="text-center max-w-xs">
                    <FolderTree className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-base font-medium text-muted-foreground">
                      No hay categorías registradas
                    </p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Crea tu primera categoría para organizar productos
                    </p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            categories.map((category) => (
              <TableRow key={category.id} className="table-row hover:bg-primary/5 hover:translate-x-1 transition-all duration-200">
                <TableCell className="table-cell">
                  <div className="flex items-center gap-2">
                    <FolderTree className="h-4 w-4 text-muted-foreground group-hover:text-chart-5 transition-colors" />
                    <span className="font-medium text-sm text-foreground">{category.name}</span>
                  </div>
                </TableCell>
                <TableCell className="table-cell text-muted-foreground text-sm">
                  {category.description || "Sin descripción"}
                </TableCell>
                <TableCell className="table-cell">
                  <div className="flex justify-end gap-2">
                    <CategoryDialog category={category}>
                      <Button variant="ghost" size="icon" className="group hover:bg-primary/10">
                        <Edit className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all" />
                      </Button>
                    </CategoryDialog>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="group hover:bg-destructive/10"
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground group-hover:text-destructive transition-all" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}