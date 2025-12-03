"use client"

import { useState, useMemo, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit, Search, Package, Barcode, Calendar, User, DollarSign, AlertTriangle, CheckCircle, Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { showSuccess, showError } from "@/lib/sweetalert"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Batch = {
  id: string
  quantity: number
  purchase_price: number
  purchase_date: string
  remaining_quantity: number
  products: { name: string; barcode: string | null; min_stock: number } | null
  suppliers: { name: string } | null
}

function StockStatusBadge({ status, quantity }: { status: "ok" | "low" | "out"; quantity: number }) {
  const config = {
    ok: { text: "Disponible", class: "badge-stock-ok", icon: <CheckCircle className="h-3 w-3" /> },
    low: { text: "Bajo Stock", class: "badge-stock-low", icon: <AlertTriangle className="h-3 w-3" /> },
    out: { text: "Agotado", class: "badge-stock-out", icon: <Package className="h-3 w-3" /> },
  }
  return (
    <div className={`badge ${config[status].class} gap-1`}>
      {config[status].icon}
      {config[status].text}
      {quantity === 0 && <span className="ml-1 opacity-70">(0)</span>}
    </div>
  )
}

function SearchInput({ value, onChange, placeholder }: { value: string, onChange: (v: string) => void, placeholder: string }) {
  return (
    <div className="search-container">
      <Search className="search-icon" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-modern input-search"
      />
    </div>
  )
}

function EditBatchDialog({ batch, products, suppliers, children }: { batch: Batch, products: any[], suppliers: any[], children: React.ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    quantity: batch.quantity.toString(),
    purchase_price: batch.purchase_price.toString(),
    supplier_id: batch.suppliers?.id || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const supabase = createClient()

    try {
      const { data: currentBatch } = await supabase.from("purchase_batches").select("remaining_quantity, quantity").eq("id", batch.id).single()

      if (!currentBatch || currentBatch.remaining_quantity !== currentBatch.quantity) {
        setOpen(false)
        await new Promise(resolve => setTimeout(resolve, 300))
        showError("No se puede editar: ya se han vendido productos de este lote")
        return
      }

      const updateData = {
        quantity: Number.parseInt(formData.quantity),
        purchase_price: Number.parseFloat(formData.purchase_price),
        remaining_quantity: Number.parseInt(formData.quantity),
        supplier_id: formData.supplier_id || null,
      }

      const { error } = await supabase.from("purchase_batches").update(updateData).eq("id", batch.id)
      if (error) throw error

      setOpen(false)
      await new Promise(resolve => setTimeout(resolve, 300))
      await showSuccess("Lote actualizado")
      router.refresh()
    } catch (error: any) {
      showError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card backdrop-blur-md border border-border/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" /> Editar Lote
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Producto</Label>
            <div className="p-3 border border-border/50 rounded-xl bg-muted/30">
              <p className="font-medium text-sm">{batch.products?.name}</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Cantidad *</Label>
              <Input type="number" min="1" required value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} className="input-modern" />
            </div>
            <div className="space-y-2">
              <Label>Precio Unitario *</Label>
              <Input type="number" step="0.01" min="0" required value={formData.purchase_price} onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })} className="input-modern" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Proveedor</Label>
            <Select value={formData.supplier_id} onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}>
              <SelectTrigger className="input-modern">
                <SelectValue placeholder={batch.suppliers?.name || "Selecciona..."} />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="btn-elegant-secondary">Cancelar</Button>
            <Button type="submit" disabled={isLoading} className="btn-action-new">Guardar Cambios</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function InventoryTable({ batches }: { batches: Batch[] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [showZeroStock, setShowZeroStock] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: p } = await supabase.from("products").select("id, name, barcode").order("name")
      const { data: s } = await supabase.from("suppliers").select("id, name").order("name")
      setProducts(p || [])
      setSuppliers(s || [])
    }
    fetchData()
  }, [])

  const filteredBatches = useMemo(() => {
    let filtered = batches
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(b => b.products?.name.toLowerCase().includes(search) || b.suppliers?.name.toLowerCase().includes(search))
    }
    if (!showZeroStock) {
      filtered = filtered.filter(b => b.remaining_quantity > 0)
    }
    return filtered
  }, [batches, searchTerm, showZeroStock])

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Buscar lote..." />
        <Button
          variant="outline"
          onClick={() => setShowZeroStock(!showZeroStock)}
          className={`btn-elegant-secondary ${showZeroStock ? "text-primary border-primary" : "text-muted-foreground"}`}
        >
          {showZeroStock ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
          {showZeroStock ? "Ver Todos" : "Ocultar Agotados"}
        </Button>
      </div>

      <div className="table-container">
        <Table className="table-base min-w-[1000px]">
          <TableHeader className="table-header">
            <TableRow className="table-row">
              <TableHead className="table-cell">Producto</TableHead>
              <TableHead className="table-cell">Código</TableHead>
              <TableHead className="table-cell">Proveedor</TableHead>
              <TableHead className="table-cell text-right">Cantidad</TableHead>
              <TableHead className="table-cell text-right">Disponible</TableHead>
              <TableHead className="table-cell text-right">Costo</TableHead>
              <TableHead className="table-cell">Fecha</TableHead>
              <TableHead className="table-cell text-center">Estado</TableHead>
              <TableHead className="table-cell text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBatches.length === 0 ? (
              <TableRow className="table-row">
                <TableCell colSpan={9} className="table-cell">
                  <div className="empty-state-box">
                    <Package className="empty-state-icon" />
                    <p className="empty-state-title">No hay lotes</p>
                    <p className="empty-state-desc">Ajusta los filtros o registra una compra</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredBatches.map((batch) => {
                const stockStatus = batch.remaining_quantity === 0 ? "out" : batch.remaining_quantity <= (batch.products?.min_stock || 0) ? "low" : "ok"
                const canModify = batch.remaining_quantity === batch.quantity

                return (
                  <TableRow key={batch.id} className={`table-row ${batch.remaining_quantity === 0 ? "opacity-60" : ""}`}>
                    <TableCell className="table-cell font-medium">{batch.products?.name}</TableCell>
                    <TableCell className="table-cell font-mono text-xs text-muted-foreground">{batch.products?.barcode || "N/A"}</TableCell>
                    <TableCell className="table-cell text-sm">{batch.suppliers?.name}</TableCell>
                    <TableCell className="table-cell text-right font-mono">{batch.quantity}</TableCell>
                    <TableCell className="table-cell text-right font-bold">{batch.remaining_quantity}</TableCell>
                    <TableCell className="table-cell text-right text-chart-2 font-medium">{formatCurrency(batch.purchase_price)}</TableCell>
                    <TableCell className="table-cell text-xs text-muted-foreground">{formatDate(batch.purchase_date)}</TableCell>
                    <TableCell className="table-cell text-center"><StockStatusBadge status={stockStatus} quantity={batch.remaining_quantity} /></TableCell>
                    <TableCell className="table-cell text-right">
                      <EditBatchDialog batch={batch} products={products} suppliers={suppliers}>
                        <Button variant="ghost" size="icon" className="btn-elegant-ghost" disabled={!canModify}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </EditBatchDialog>
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