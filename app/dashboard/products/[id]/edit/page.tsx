import { createClient } from "@/lib/supabase/server"
import { ProductForm } from "@/components/product-form"
import { notFound } from "next/navigation"
import { Package } from "lucide-react"

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: product } = await supabase.from("products").select("*").eq("id", id).single()

  if (!product) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
        <div>
          <h1 className="dashboard-title flex items-center gap-3">
            <Package className="h-7 w-7 icon-products" />
            Editar Producto
          </h1>
          <p className="dashboard-subtitle mt-1">
            Modifica <span>{product.name}</span> del catálogo
          </p>
        </div>
      </div>

      {/* Form Container */}
      <div className="card-dashboard">
        <ProductForm product={product} />
      </div>
    </div>
  )
}