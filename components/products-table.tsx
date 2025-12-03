"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Package } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { showError, showConfirm, showSuccess } from "@/lib/sweetalert"

type Product = {
  id: string
  name: string
  barcode: string | null
  sale_price: number
  min_stock: number
  categories: { name: string } | null
  suppliers: { name: string } | null
  current_stock?: number
}

export function ProductsTable({ products }: { products: Product[] }) {
  const router = useRouter()

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm("Esta acción no se puede deshacer", "¿Eliminar este producto?")
    if (!confirmed) return
    const supabase = createClient()
    const { error } = await supabase.from("products").delete().eq("id", id)
    if (error) showError("Error al eliminar")
    else {
      await showSuccess("Producto eliminado")
      router.refresh()
    }
  }

  return (
    <div className="table-container">
      <Table className="table-base">
        <TableHeader className="table-header">
          <TableRow className="table-row">
            <TableHead className="table-cell">Nombre</TableHead>
            <TableHead className="table-cell">Código</TableHead>
            <TableHead className="table-cell">Categoría</TableHead>
            <TableHead className="table-cell text-right">Precio</TableHead>
            <TableHead className="table-cell text-center">Stock</TableHead>
            <TableHead className="table-cell text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow className="table-row">
              <TableCell colSpan={6} className="table-cell">
                <div className="empty-state-box">
                  <Package className="empty-state-icon" />
                  <p className="empty-state-title">Sin productos</p>
                  <p className="empty-state-desc">Comienza creando tu inventario</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => {
               const stock = product.current_stock || 0
               const stockClass = stock === 0 ? 'badge-stock-out' : stock <= product.min_stock ? 'badge-stock-low' : 'badge-stock-ok'
               
               return (
                <TableRow key={product.id} className="table-row">
                  <TableCell className="table-cell font-medium">{product.name}</TableCell>
                  <TableCell className="table-cell text-muted-foreground text-xs font-mono">{product.barcode || "-"}</TableCell>
                  <TableCell className="table-cell text-sm">{product.categories?.name}</TableCell>
                  <TableCell className="table-cell text-right font-medium text-chart-2">${Number(product.sale_price).toLocaleString('es-CO')}</TableCell>
                  <TableCell className="table-cell text-center">
                    <span className={`badge ${stockClass}`}>{stock}</span>
                  </TableCell>
                  <TableCell className="table-cell text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild className="btn-elegant-ghost">
                        <Link href={`/dashboard/products/${product.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)} className="btn-elegant-danger">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
               )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}