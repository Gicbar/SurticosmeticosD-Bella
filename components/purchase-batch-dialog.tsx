"use client"
import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { showError, showSuccess } from "@/lib/sweetalert"
import { Package, Truck, DollarSign, Hash, Search, Barcode, X } from "lucide-react"

type Product = {
  id: string
  name: string
  barcode: string | null
}

export function PurchaseBatchDialog({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [formData, setFormData] = useState({
    product_id: "",
    quantity: "",
    purchase_price: "",
    supplier_id: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: productsData } = await supabase.from("products").select("id, name, barcode").order("name")
      const { data: suppliersData } = await supabase.from("suppliers").select("id, name").order("name")
      setProducts(productsData || [])
      setSuppliers(suppliersData || [])
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredProducts(filtered.slice(0, 10))
    } else {
      setFilteredProducts([])
    }
  }, [searchTerm, products])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validación frontend
    if (!formData.product_id || !formData.quantity || !formData.purchase_price) {
      showError("Por favor completa todos los campos requeridos")
      return
    }

    setIsLoading(true)
    const supabase = createClient()
    try {
      const batchData = {
        product_id: formData.product_id,
        quantity: Number.parseInt(formData.quantity),
        purchase_price: Number.parseFloat(formData.purchase_price),
        remaining_quantity: Number.parseInt(formData.quantity),
        supplier_id: formData.supplier_id || null,
      }

      const { error } = await supabase.from("purchase_batches").insert(batchData)
      if (error) throw error

      // ✅ CIERRA EL MODAL PRIMERO
      setOpen(false)
      await new Promise(resolve => setTimeout(resolve, 150))
      await showSuccess("Compra registrada correctamente")
      // Reset form
      setFormData({ product_id: "", quantity: "", purchase_price: "", supplier_id: "" })
      setSearchTerm("")
      router.refresh()
    } catch (error: any) {
      // ✅ Muestra error específico
      showError(error.message || "Error al registrar la compra")
      console.error("Error completo:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProductSelect = (productId: string) => {
    setFormData({ ...formData, product_id: productId })
  }

  const clearProductSelection = () => {
    setFormData({ ...formData, product_id: "" })
    setSearchTerm("")
  }

  const selectedProduct = products.find((p) => p.id === formData.product_id)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] card">
        <DialogHeader>
          <DialogTitle className="dashboard-title">
            <Package className="dashboard-title-icon" />
            {selectedProduct ? `Nueva Compra - ${selectedProduct.name}` : "Nueva Compra de Inventario"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Busqueda de Producto */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Search className="h-4 w-4" />
              Buscar Producto *
            </Label>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o código de barras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 input-modern h-10"
                disabled={isLoading}
              />
            </div>

            {filteredProducts.length > 0 && (
              <div className="border rounded-lg bg-card max-h-48 overflow-y-auto shadow-sm mt-1">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    className="w-full flex items-center justify-between p-3 hover:bg-accent/10 transition-colors text-left"
                    onClick={() => handleProductSelect(product.id)}
                    disabled={isLoading}
                  >
                    <div>
                      <span className="font-medium text-sm">{product.name}</span>
                      {product.barcode && (
                        <span className="text-xs text-muted-foreground ml-2">({product.barcode})</span>
                      )}
                    </div>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Producto Seleccionado */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Package className="h-4 w-4" />
              Producto Seleccionado *
            </Label>

            {selectedProduct ? (
              <div className="p-3 border rounded-lg bg-muted/50 hover:bg-muted transition-colors relative">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{selectedProduct.name}</p>
                    {selectedProduct.barcode && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Barcode className="h-3 w-3" />
                        {selectedProduct.barcode}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                    onClick={clearProductSelection}
                    disabled={isLoading}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <Select
                value={formData.product_id}
                onValueChange={handleProductSelect}
                disabled={isLoading}
              >
                <SelectTrigger className="h-11 border border-border bg-background rounded-lg">
                  <SelectValue placeholder="Selecciona un producto" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#1e1e1e] border-border rounded-lg shadow-lg">
                  {products.map((product) => (
                    <SelectItem 
                      key={product.id}
                      value={product.id}
                      className="hover:bg-secondary/20 cursor-pointer"
                    >
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Proveedor */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Truck className="h-4 w-4" />
              Proveedor
            </Label>
            <Select
              value={formData.supplier_id}
              onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
              disabled={isLoading}
            >
              <SelectTrigger className="input-modern h-10">
                <SelectValue placeholder="Selecciona un proveedor" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#1e1e1e] border-border rounded-lg shadow-lg">
                {suppliers.map((supplier) => (
                  <SelectItem
                    key={supplier.id}
                    value={supplier.id}
                    className="hover:bg-secondary/20 cursor-pointer"
                  >
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cantidad */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Hash className="h-4 w-4" />
              Cantidad *
            </Label>
            <Input
              type="number"
              min="1"
              required
              placeholder="Ingresa la cantidad"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              disabled={isLoading}
              className="input-modern h-10"
            />
          </div>

          {/* Precio de Compra */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              Precio de Compra (unitario) *
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                disabled={isLoading}
                className="pl-9 input-modern h-10"
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-2 justify-end pt-4 border-t border-border/20">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false)
                setSearchTerm("")
                setFormData({ product_id: "", quantity: "", purchase_price: "", supplier_id: "" })
              }}
              disabled={isLoading}
              className="btn-elegant-secondary"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.product_id || !formData.quantity || !formData.purchase_price}
              className="btn-action-new min-w-[120px]"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Guardando...
                </span>
              ) : (
                "Registrar Compra"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
