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
import { Package, Truck, DollarSign, Hash, Search, Barcode } from "lucide-react"

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
          p.barcode?.toLowerCase().includes(searchTerm.toLowerCase()),
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
    setSearchTerm("")
  }

  const selectedProduct = products.find((p) => p.id === formData.product_id)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-card/90 backdrop-blur-md border border-border/30 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {selectedProduct ? `Nueva Compra - ${selectedProduct.name}` : "Nueva Compra de Inventario"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Busqueda de Producto */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              Buscar Producto
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Buscar por nombre o código de barras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                disabled={isLoading}
              />
            </div>
            {filteredProducts.length > 0 && (
              <div className="border rounded-md bg-card max-h-48 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    className="w-full flex items-center justify-between p-3 hover:bg-accent transition-colors text-left"
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
            <Label className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              Producto Seleccionado *
            </Label>
            {selectedProduct ? (
              <div className="p-3 border rounded-md bg-muted/50 hover:bg-muted transition-colors">
                <p className="font-medium text-sm">{selectedProduct.name}</p>
                {selectedProduct.barcode && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Barcode className="h-3 w-3" />
                    {selectedProduct.barcode}
                  </p>
                )}
              </div>
            ) : (
              <Select
                value={formData.product_id}
                onValueChange={(value) => setFormData({ ...formData, product_id: value })}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un producto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Proveedor */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-muted-foreground" />
              Proveedor
            </Label>
            <Select
              value={formData.supplier_id}
              onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un proveedor" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cantidad */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
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
            />
          </div>

          {/* Precio de Compra */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Precio de Compra (unitario) *
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="0.00"
              value={formData.purchase_price}
              onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
              disabled={isLoading}
              prefix={<DollarSign className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          {/* Botones */}
          <div className="flex gap-2 justify-end pt-4 border-t border-border/20">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setOpen(false)
                setSearchTerm("")
              }} 
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !formData.product_id || !formData.quantity || !formData.purchase_price}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
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