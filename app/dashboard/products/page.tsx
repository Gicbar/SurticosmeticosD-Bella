import { getUserPermissions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { ProductsGrid } from "@/components/products-grid"
import { Button } from "@/components/ui/button"
import { Plus, Package } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation" 

export default async function ProductsPage() {
  // ✅ VALIDAR PERMISOS AL INICIO
  const permissions = await getUserPermissions()
    // Verificar si existe el permiso rentabilidad y es true
  if (!permissions?.permissions?.productos) {
    redirect("/dashboard") // Redirige si no tiene permiso
  }
  const supabase = await createClient()

  const { data: products } = await supabase
    .from("products")
    .select(`
      *,
      categories(name),
      suppliers(name),
      purchase_batches(remaining_quantity)
    `)
    .order("created_at", { ascending: false })

  const productsWithStock =
    products?.map((product) => ({
      ...product,
      current_stock:
        product.purchase_batches?.reduce((sum: number, batch: any) => sum + (batch.remaining_quantity || 0), 0) || 0,
    })) || []

  return (
    <div className="dashboard-page-container">
      {/* Header */}
      <div className="dashboard-toolbar">
        <div className="dashboard-header">
          <h1 className="dashboard-title flex items-center gap-3">
            <Package className="dashboard-title-icon h-7 w-7 icon-products" />
            Catálogo de Productos
          </h1>
          <p className="dashboard-subtitle mt-1">
            Gestión completa de <span>{productsWithStock.length} productos</span>
          </p>
        </div>
        <Button className="btn-action-new">
          <Link href="/dashboard/products/new" className="flex items-center relative z-10">
            <Plus className="icon-plus"/>
            Nuevo Producto
          </Link>
        </Button>
      </div>

      {/* Products Grid */}
      <div className="animate-fadeIn">
        
        <ProductsGrid products={productsWithStock} />
      </div>
    </div>
  )
}