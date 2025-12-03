"use client"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Search, Package, Sparkles } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { showConfirm, showSuccess, showError } from "@/lib/sweetalert"
import { Separator } from "@/components/ui/separator"

type Product = {
  id: string
  name: string
  description: string | null
  barcode: string | null
  sale_price: number
  min_stock: number
  image_url: string | null
  current_stock: number
  categories: { name: string } | null
  suppliers: { name: string } | null
}

// Componente de búsqueda reutilizable
function SearchInput({ value, onChange, placeholder, icon }: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  icon: React.ReactNode
}) {
  return (
    <div className="relative flex-1 group">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
        {icon}
      </div>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 rounded-xl border-border bg-card/50 focus-visible:ring-2 focus-visible:ring-primary/30"
      />
    </div>
  )
}

// Componente Badge de Stock
function StockBadge({ current, min }: { current: number; min: number }) {
  const stockStatus = current === 0 ? "out-stock" : current <= min ? "low-stock" : "in-stock";
  const stockText = current === 0 ? "Sin Stock" : current <= min ? `Stock Bajo (${current})` : `En Stock (${current})`;

  const badgeClasses = {
    "out-stock": "badge-destructive",
    "low-stock": "badge-warning",
    "in-stock": "badge-success",
  };

  return (
    <Badge className={`badge ${badgeClasses[stockStatus]}`}>
      <Package className="h-3 w-3 mr-1" />
      {stockText}
    </Badge>
  );
}

export function ProductsGrid({ products }: { products: Product[] }) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const filteredProducts = products.filter((product) => {
    const search = searchTerm.toLowerCase()
    return (
      product.name.toLowerCase().includes(search) ||
      product.barcode?.toLowerCase().includes(search) ||
      product.categories?.name.toLowerCase().includes(search)
    )
  })

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await showConfirm(
      `¿Eliminar "${name}"?`,
      "Esta acción no se puede deshacer"
    )
    if (confirmed) {
      const supabase = createClient()
      const { error } = await supabase.from("products").delete().eq("id", id)
      if (error) {
        showError(error.message, "Error al eliminar")
      } else {
        await showSuccess("Producto eliminado", "El producto fue eliminado del catálogo")
        router.refresh()
      }
    }
  }

  return (
    <div className="space-y-5">
      {/* Búsqueda */}
      <SearchInput
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Busca por nombre, código o categoría..."
        icon={<Search className="h-4 w-4" />}
      />

      {/* Grid */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {filteredProducts.map((product) => (
          <Card
            key={product.id}
            className="card group overflow-hidden border border-border/30 hover:shadow-lg transition-all duration-300 bg-card/80 backdrop-blur-sm"
          >
            {/* Imagen */}
            <div className="aspect-[1/1] relative bg-muted overflow-hidden rounded-t-xl">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary bg-gradient-to-br from-muted to-secondary/20">
                  <Sparkles className="w-6 h-6" />
                </div>
              )}
            </div>

            {/* Contenido */}
            <CardContent className="p-4 space-y-3">
              {/* Nombre y descripción */}
              <div className="space-y-1">
                <h3 className="font-semibold text-sm text-foreground tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
                {product.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                )}
              </div>

              {/* Info técnica */}
              <div className="space-y-1.5">
                {product.barcode && (
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Código
                    </span>
                    <span className="text-[11px] font-mono text-foreground bg-secondary/20 px-1.5 py-0.5 rounded">
                      {product.barcode}
                    </span>
                  </div>
                )}
                {product.categories && (
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Categoría
                    </span>
                    <span className="text-[11px] font-medium text-foreground truncate max-w-[60%] bg-accent/10 px-1.5 py-0.5 rounded">
                      {product.categories.name}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Stock 
                  </span>
                  <StockBadge current={product.current_stock} min={product.min_stock} />
                </div>
                <Separator className="my-1" />
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Precio
                  </span>
                  <span className="text-base font-extrabold text-chart-3">
                    {Number(product.sale_price).toLocaleString("es-CO", {
                      style: "currency",
                      currency: "COP",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-1 pt-1">
                <Button
                  asChild
                  variant="outline"
                  size="xs"
                  className="flex-1 group border-primary/30 hover:bg-primary/10 hover:border-primary/50"
                >
                  <Link href={`/dashboard/products/${product.id}/edit`}>
                    <Edit className="h-3 w-3 mr-1 group-hover:scale-110 transition-transform" />
                    Editar
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  className="px-2 group hover:bg-destructive/10 hover:border-destructive transition-all border-destructive/30"
                  onClick={() => handleDelete(product.id, product.name)}
                >
                  <Trash2 className="h-3 w-3 group-hover:text-destructive transition-colors" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Estado vacío */}
      {filteredProducts.length === 0 && (
        <div className="py-12 flex items-center justify-center">
          <div className="text-center max-w-xs space-y-3">
            <div className="w-20 h-20 mx-auto flex items-center justify-center rounded-full bg-gradient-to-br from-secondary to-primary/20">
              <Package className="h-10 w-10 text-primary/50" />
            </div>
            <p className="text-base font-medium text-muted-foreground">
              No se encontraron productos
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Intenta con otros términos de búsqueda
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
