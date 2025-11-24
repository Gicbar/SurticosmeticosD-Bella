import { ProductForm } from "@/components/product-form"
import Link from "next/link"
import { ArrowLeft, Package } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NewProductPage() {
  return (
    <div className="flex-1 flex flex-col bg-card/70 backdrop-blur-md p-4 md:p-6 rounded-2xl shadow-inner border border-border/20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-4 border-b border-border">
        <div>
          <h1 className="dashboard-title flex items-center gap-3">
            <Package className="h-7 w-7 icon-products" />
            Nuevo Producto
          </h1>
          <p className="dashboard-subtitle mt-1">
            Agrega un nuevo <span>producto al catálogo</span>
          </p>
        </div>
        <Button asChild variant="outline" className="group w-full md:w-auto">
          <Link href="/dashboard/products" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4 group-hover:translate-x-[-2px] transition-transform" />
            Volver al catálogo
          </Link>
        </Button>
      </div>

      {/* Form Container */}
      <div className="card-dashboard">
        <ProductForm />
      </div>
    </div>
  )
}