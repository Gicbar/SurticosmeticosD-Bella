"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, FolderTree } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { CategoryDialog } from "@/components/category-dialog"
import { showError, showConfirm, showSuccess } from "@/lib/sweetalert"

interface CategoriesTableProps {
  categories: any[]
  companyId: string   // ← recibido desde page.tsx
}

export function CategoriesTable({ categories, companyId }: CategoriesTableProps) {
  const router = useRouter()

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm("Esta acción es irreversible", "¿Eliminar categoría?")
    if (!confirmed) return

    const supabase = createClient()

    // Doble filtro: id + company_id → nadie puede borrar categorías de otra empresa
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .eq("company_id", companyId)   // ← SEGURIDAD MULTIEMPRESA

    if (error) {
      showError(error.message || "Error al eliminar")
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
                <div className="empty-state-box">
                  <FolderTree className="empty-state-icon" />
                  <p className="empty-state-title">Sin categorías</p>
                  <p className="empty-state-desc">Crea la primera categoría para organizar tus productos</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            categories.map((category) => (
              <TableRow key={category.id} className="table-row">
                <TableCell className="table-cell font-medium">
                  <div className="flex items-center gap-2">
                    <FolderTree className="h-4 w-4 text-primary/50" />
                    {category.name}
                  </div>
                </TableCell>
                <TableCell className="table-cell text-muted-foreground">
                  {category.description || "-"}
                </TableCell>
                <TableCell className="table-cell text-right">
                  <div className="flex justify-end gap-1">
                    {/* CategoryDialog recibe companyId para el update */}
                    <CategoryDialog category={category} companyId={companyId}>
                      <Button variant="ghost" size="icon" className="btn-elegant-ghost">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </CategoryDialog>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(category.id)}
                      className="btn-elegant-danger"
                    >
                      <Trash2 className="h-4 w-4" />
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
