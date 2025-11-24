"use client"

import { useState, useMemo, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit, Search, Package, Barcode, Calendar, User, DollarSign, AlertTriangle, CheckCircle, Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { showConfirm, showSuccess, showError } from "@/lib/sweetalert"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// TIPOS
type Batch = {
  id: string
  quantity: number
  purchase_price: number
  purchase_date: string
  remaining_quantity: number
  products: { name: string; barcode: string | null; min_stock: number } | null
  suppliers: { name: string } | null
}

// 🔥 COMPONENTE BADGE DE ESTADO
function StockStatusBadge({ status, quantity, showZero = false }: { 
  status: "ok" | "low" | "out"; 
  quantity: number;
  showZero?: boolean;
}) {
  const config = {
    ok: { text: "Disponible", class: "bg-chart-4/15 text-chart-4 border-chart-4/30", icon: <CheckCircle className="h-3 w-3" /> },
    low: { text: "Bajo Stock", class: "bg-chart-3/15 text-chart-3 border-chart-3/30", icon: <AlertTriangle className="h-3 w-3" /> },
    out: { text: "Agotado", class: "bg-destructive/15 text-destructive border-destructive/30", icon: <Package className="h-3 w-3" /> },
  }

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${config[status].class}`}>
      {config[status].icon}
      {config[status].text}
      {showZero && quantity === 0 && <span className="ml-1 font-mono">(0)</span>}
    </div>
  )
}

// COMPONENTE DE BÚSQUEDA PREMIUM
function SearchInput({ value, onChange, placeholder, icon }: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  icon: React.ReactNode
}) {
  return (
    <div className="relative flex-1 group">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none">
        {icon}
      </div>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 pr-4 py-2 rounded-xl border-border bg-card/50 focus-visible:ring-2 focus-visible:ring-primary/30 transition-all duration-300"
      />
    </div>
  )
}

// 🔥 TOGGLE PARA VER LOTES CON/SIN STOCK
function StockFilterToggle({ showZeroStock, onToggle }: {
  showZeroStock: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onToggle}
      className={`group ${showZeroStock ? "bg-destructive/10 border-destructive/30 text-destructive" : "bg-chart-4/10 border-chart-4/30 text-chart-4"}`}
    >
      {showZeroStock ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
      <span className="text-xs font-medium">
        {showZeroStock ? "Mostrando todos" : "Ocultando agotados"}
      </span>
    </Button>
  )
}

// 🔥 DIALOGO DE EDICIÓN INLINE
function EditBatchDialog({ batch, products, suppliers, children }: {
  batch: Batch
  products: { id: string; name: string; barcode: string | null }[]
  suppliers: { id: string; name: string }[]
  children: React.ReactNode
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    quantity: batch.quantity.toString(),
    purchase_price: batch.purchase_price.toString(),
    supplier_id: batch.suppliers?.id || "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.quantity || !formData.purchase_price || parseInt(formData.quantity) < 0 || parseFloat(formData.purchase_price) < 0) {
      showError("Por favor ingresa valores válidos")
      return
    }

    setIsLoading(true)

    const supabase = createClient()

    try {
      // Verificar si el lote sigue intacto
      const { data: currentBatch } = await supabase
        .from("purchase_batches")
        .select("remaining_quantity, quantity")
        .eq("id", batch.id)
        .single()

      if (!currentBatch || currentBatch.remaining_quantity !== currentBatch.quantity) {
        // ✅ Primero cerrar modal, luego mostrar error
        setOpen(false)
        await new Promise(resolve => setTimeout(resolve, 300))
        showError("Este lote ya no puede ser modificado porque se han descontado productos del inventario")
        return
      }

      const updateData = {
        quantity: Number.parseInt(formData.quantity),
        purchase_price: Number.parseFloat(formData.purchase_price),
        remaining_quantity: Number.parseInt(formData.quantity),
        supplier_id: formData.supplier_id || null,
      }

      const { error } = await supabase
        .from("purchase_batches")
        .update(updateData)
        .eq("id", batch.id)

      if (error) throw error

      // ✅ Cerrar modal primero, esperar, luego éxito
      setOpen(false)
      await new Promise(resolve => setTimeout(resolve, 300))
      await showSuccess("Lote actualizado correctamente")
      router.refresh()
    } catch (error: any) {
      // ✅ En errores inesperados, cerrar modal y mostrar error
      setOpen(false)
      await new Promise(resolve => setTimeout(resolve, 300))
      showError(error.message || "Error al actualizar el lote")
      console.error("Error completo:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card/90 backdrop-blur-md border border-border/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Editar Lote - {batch.products?.name}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Producto</Label>
            <div className="p-3 border rounded-md bg-muted/50">
              <p className="font-medium text-sm">{batch.products?.name}</p>
              {batch.products?.barcode && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Barcode className="h-3 w-3" />
                  {batch.products.barcode}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                Cantidad *
              </Label>
              <Input
                type="number"
                min="1"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Precio Unitario *
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Proveedor
            </Label>
            <Select
              value={formData.supplier_id}
              onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={batch.suppliers?.name || "Selecciona un proveedor"} />
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

          <div className="flex gap-2 justify-end pt-4 border-t border-border/20">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)} 
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="min-w-[100px]"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  Actualizando...
                </span>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// TABLA PRINCIPAL - EXPORTACIÓN FINAL
export function InventoryTable({ batches }: { batches: Batch[] }) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [showZeroStock, setShowZeroStock] = useState(false)
  const [products, setProducts] = useState<{ id: string; name: string; barcode: string | null }[]>([])
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([])

  // Cargar productos y proveedores para el diálogo de edición
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

  // 🔥 FILTRO COMPLETO: Búsqueda + Filtro de stock
  const filteredBatches = useMemo(() => {
    let filtered = batches

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(batch => 
        batch.products?.name.toLowerCase().includes(search) ||
        batch.suppliers?.name.toLowerCase().includes(search) ||
        batch.products?.barcode?.toLowerCase().includes(search)
      )
    }

    if (!showZeroStock) {
      filtered = filtered.filter(batch => batch.remaining_quantity > 0)
    }

    return filtered
  }, [batches, searchTerm, showZeroStock])

  return (
    <div className="space-y-0">
      {/* 🔥 Búsqueda + Toggle de Stock */}
      <div className="px-5 py-4 border-b border-border bg-card/30 backdrop-blur-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Busca por producto, proveedor o código..."
          icon={<Search className="h-4 w-4" />}
        />
        <div className="flex items-center gap-2">
          <StockFilterToggle 
            showZeroStock={showZeroStock} 
            onToggle={() => setShowZeroStock(!showZeroStock)} 
          />
        </div>
      </div>

      {/* Tabla Responsive con Scroll Horizontal */}
      <div className="overflow-x-auto">
        <Table className="table-base min-w-[1200px]">
          <TableHeader className="table-header sticky top-0 z-10 bg-card/95 backdrop-blur-md">
            <TableRow className="table-row">
              <TableHead className="table-cell">Producto</TableHead>
              <TableHead className="table-cell">Código</TableHead>
              <TableHead className="table-cell">Proveedor</TableHead>
              <TableHead className="table-cell text-right">Comprado</TableHead>
              <TableHead className="table-cell text-right">Disponible</TableHead>
              <TableHead className="table-cell text-right">Precio</TableHead>
              <TableHead className="table-cell">Fecha Creación</TableHead>
              <TableHead className="table-cell text-center">Estado</TableHead>
              <TableHead className="table-cell text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBatches.length === 0 ? (
              // ESTADO VACÍO PREMIUM
              <TableRow className="table-row">
                <TableCell colSpan={9} className="table-cell">
                  <div className="py-12 flex items-center justify-center">
                    <div className="text-center max-w-sm">
                      <Package className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-lg font-medium text-muted-foreground mb-1">
                        {searchTerm ? "Sin resultados" : showZeroStock ? "Inventario vacío" : "Sin lotes activos"}
                      </p>
                      <p className="text-sm text-muted-foreground/70">
                        {searchTerm ? "Intenta con otros términos de búsqueda" : 
                         showZeroStock ? "Todas las compras han sido agotadas" : 
                         "Activa 'Mostrar agotados' para ver historial"}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredBatches.map((batch) => {
                const stockPercentage = batch.quantity > 0 ? (batch.remaining_quantity / batch.quantity) * 100 : 0
                const stockStatus = batch.remaining_quantity === 0 ? "out" : 
                                  batch.remaining_quantity <= (batch.products?.min_stock || 0) ? "low" : "ok"
                
                // 🔥 LÓGICA CLAVE: Solo se puede modificar si NO se ha descontado nada
                const canBeModified = batch.remaining_quantity === batch.quantity

                return (
                  <TableRow 
                    key={batch.id} 
                    className={`table-row hover:bg-primary/5 hover:translate-x-1 transition-all duration-200 ${
                      batch.remaining_quantity === 0 ? "opacity-60 bg-muted/30" : ""
                    }`}
                  >
                    {/* Producto */}
                    <TableCell className="table-cell">
                      <div className="flex items-center gap-2 group">
                        <Package className={`h-4 w-4 ${
                          batch.remaining_quantity === 0 ? "text-muted-foreground/50" : "text-muted-foreground group-hover:text-chart-5"
                        } transition-colors`} />
                        <span className={`font-medium text-sm ${
                          batch.remaining_quantity === 0 ? "text-muted-foreground line-through" : "text-foreground tracking-tight"
                        }`}>
                          {batch.products?.name || "N/A"}
                        </span>
                      </div>
                    </TableCell>

                    {/* Código */}
                    <TableCell className="table-cell">
                      <div className="flex items-center gap-1">
                        <Barcode className={`h-3 w-3 ${batch.remaining_quantity === 0 ? "text-muted-foreground/50" : "text-muted-foreground"}`} />
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {batch.products?.barcode || "N/A"}
                        </span>
                      </div>
                    </TableCell>

                    {/* Proveedor */}
                    <TableCell className="table-cell">
                      <div className="flex items-center gap-1">
                        <User className={`h-3 w-3 ${batch.remaining_quantity === 0 ? "text-muted-foreground/50" : "text-muted-foreground"}`} />
                        <span className={`text-sm ${batch.remaining_quantity === 0 ? "text-muted-foreground" : "text-foreground"}`}>
                          {batch.suppliers?.name || "N/A"}
                        </span>
                      </div>
                    </TableCell>

                    {/* Comprado */}
                    <TableCell className="table-cell text-right font-medium text-muted-foreground">
                      <span className="font-mono">{batch.quantity}</span>
                      <span className="text-xs ml-1">unids</span>
                    </TableCell>

                    {/* Disponible con Barra de Progreso Visual */}
                    <TableCell className="table-cell text-right">
                      <div className="flex justify-end items-center gap-2">
                        <span className={`font-bold text-sm pr-2 ${
                          stockStatus === "out" ? "text-destructive line-through" : 
                          stockStatus === "low" ? "text-chart-3" : "text-chart-4"
                        }`}>
                          {batch.remaining_quantity}
                        </span>
                        {batch.remaining_quantity > 0 && (
                          <div className="w-8 h-1.5 bg-muted-foreground/20 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${
                                stockStatus === "low" ? "bg-chart-3" : "bg-chart-4"
                              }`}
                              style={{ width: `${stockPercentage}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Precio */}
                    <TableCell className="table-cell text-right">
                      <div className="flex justify-end items-center gap-1 group">
                        <DollarSign className={`h-3 w-3 ${
                          batch.remaining_quantity === 0 ? "text-muted-foreground/50" : "text-chart-2 group-hover:scale-110"
                        } transition-transform`} />
                        <span className={`font-bold ${
                          batch.remaining_quantity === 0 ? "text-muted-foreground line-through" : "text-chart-2 group-hover:text-chart-3"
                        } transition-colors`}>
                          {formatCurrency(batch.purchase_price)}
                        </span>
                      </div>
                    </TableCell>

                    {/* Fecha */}
                    <TableCell className="table-cell">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className={`h-3 w-3 ${batch.remaining_quantity === 0 ? "text-muted-foreground/50" : "text-muted-foreground"}`} />
                        {formatDate(batch.purchase_date)}
                      </div>
                    </TableCell>

                    {/* Estado */}
                    <TableCell className="table-cell text-center">
                      <StockStatusBadge 
                        status={stockStatus} 
                        quantity={batch.remaining_quantity}
                        showZero={batch.remaining_quantity === 0}
                      />
                    </TableCell>

                    {/* 🔥 ACCIONES CONDICIONALES - SOLO EDITAR */}
                    <TableCell className="table-cell">
                      <div className="flex justify-end">
                        {/* 🔥 Diálogo de Edición Inline */}
                        <EditBatchDialog 
                          batch={batch} 
                          products={products} 
                          suppliers={suppliers}
                        >
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={`group ${canBeModified ? "hover:bg-chart-2/10" : "opacity-50 cursor-not-allowed hover:bg-muted/10"}`}
                            disabled={!canBeModified}
                            title={canBeModified ? "Editar lote" : "No se puede editar: productos ya descontados del inventario"}
                          >
                            <Edit className="h-4 w-4 text-muted-foreground group-hover:text-chart-2 transition-all group-hover:scale-110" />
                          </Button>
                        </EditBatchDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}