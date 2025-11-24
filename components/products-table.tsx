"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2 } from "lucide-react"
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

    if (error) {
      showError("Error al eliminar el producto")
    } else {
      await showSuccess("Producto eliminado correctamente")
      router.refresh()
    }
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Código de Barras</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Proveedor</TableHead>
            <TableHead>Precio Venta</TableHead>
            <TableHead>Stock Mínimo</TableHead>
            <TableHead>Stock Actual</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                No hay productos registrados
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.barcode || "N/A"}</TableCell>
                <TableCell>{product.categories?.name || "Sin categoría"}</TableCell>
                <TableCell>{product.suppliers?.name || "Sin proveedor"}</TableCell>
                <TableCell>${Number(product.sale_price).toFixed(2)}</TableCell>
                <TableCell>{product.min_stock}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      (product.current_stock || 0) === 0
                        ? "destructive"
                        : (product.current_stock || 0) <= product.min_stock
                          ? "secondary"
                          : "default"
                    }
                  >
                    {product.current_stock || 0}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/dashboard/products/${product.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
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
