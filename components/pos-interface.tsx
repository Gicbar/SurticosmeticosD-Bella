"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Barcode, Plus, Minus, Trash2, ShoppingCart, Search, User, CreditCard, Receipt } from "lucide-react"
import { useRouter } from "next/navigation"
import { showSuccess, showError, showWarning, showInput } from "@/lib/sweetalert"

type CartItem = {
  product_id: string
  name: string
  barcode: string | null
  quantity: number
  unit_price: number
  subtotal: number
}

type Product = {
  id: string
  name: string
  barcode: string | null
  sale_price: number
}

type Client = {
  id: string
  name: string
}

// Componente Input con Icono Integrado
function InputWithIcon({
  icon,
  className = "",
  ...props
}: React.ComponentProps<typeof Input> & { icon: React.ReactNode }) {
  return (
    <div className="relative flex items-center">
      <div className="absolute left-3 z-10 text-muted-foreground group-focus-within:text-primary transition-colors">
        {icon}
      </div>
      <Input className={`pl-10 ${className}`} {...props} />
    </div>
  )
}

export function POSInterface() {
  const router = useRouter()
  const barcodeInputRef = useRef<HTMLInputElement>(null)

  const [cart, setCart] = useState<CartItem[]>([])
  const [barcodeInput, setBarcodeInput] = useState("")
  const [nameSearch, setNameSearch] = useState("")
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState<string>("efectivo")
  const [isProcessing, setIsProcessing] = useState(false)

  const [products, setProducts] = useState<Product[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: productsData } = await supabase.from("products").select("id, name, barcode, sale_price")
      const { data: clientsData } = await supabase.from("clients").select("id, name")

      setProducts(productsData || [])
      setClients(clientsData || [])
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (nameSearch.trim()) {
      const filtered = products.filter((p) => p.name.toLowerCase().includes(nameSearch.toLowerCase()))
      setFilteredProducts(filtered.slice(0, 10))
    } else {
      setFilteredProducts([])
    }
  }, [nameSearch, products])

  useEffect(() => {
    barcodeInputRef.current?.focus()
  }, [cart])

  const checkStockAvailability = async (cart: CartItem[]) => {
    const supabase = createClient()

    for (const item of cart) {
      const { data: batches, error } = await supabase
        .from("purchase_batches")
        .select("remaining_quantity")
        .eq("product_id", item.product_id)
        .gt("remaining_quantity", 0)

      if (error) {
        console.error("Error al consultar stock:", error)
        return `Error al verificar el stock de ${item.name}`
      }

      const totalAvailable = batches?.reduce((sum, b) => sum + (b.remaining_quantity || 0), 0) || 0

      if (totalAvailable < item.quantity) {
        return `Stock insuficiente para ${item.name}, solo hay ${totalAvailable} unidades disponibles.`
      }
    }
    return null
  }

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!barcodeInput.trim()) return

    const product = products.find((p) => p.barcode === barcodeInput.trim())
    if (product) {
      addToCart(product)
      setBarcodeInput("")
    } else {
      showWarning("Producto no encontrado", "Código de barras no existe")
      setBarcodeInput("")
    }
  }

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product_id === product.id)
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unit_price }
            : item
        )
      )
    } else {
      setCart([
        ...cart,
        {
          product_id: product.id,
          name: product.name,
          barcode: product.barcode,
          quantity: 1,
          unit_price: Number(product.sale_price),
          subtotal: Number(product.sale_price),
        },
      ])
    }
    setNameSearch("")
  }

  const updateQuantity = (product_id: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.product_id === product_id) {
            const newQuantity = item.quantity + delta
            if (newQuantity <= 0) return null
            return { ...item, quantity: newQuantity, subtotal: newQuantity * item.unit_price }
          }
          return item
        })
        .filter((item): item is CartItem => item !== null)
    )
  }

  const removeFromCart = (product_id: string) => setCart(cart.filter((item) => item.product_id !== product_id))

  const calculateTotal = () => cart.reduce((sum, item) => sum + item.subtotal, 0)

  const handleCheckout = async () => {
    if (cart.length === 0) return showWarning("El carrito está vacío", "No hay productos")
    if (!selectedClient) return showWarning("Selecciona un cliente", "Cliente requerido")

    let amountGiven = 0
    let change = 0
    const total = calculateTotal()

    if (paymentMethod === "efectivo") {
      const input = await showInput(
        "Pago en Efectivo",
        `Total: $${total.toFixed(2)} - Ingresa el monto recibido`,
        "number"
      )
      if (input === null) return
      amountGiven = Number.parseFloat(input)
      if (isNaN(amountGiven) || amountGiven < total)
        return showError("El monto recibido debe ser mayor o igual al total", "Monto insuficiente")
      change = amountGiven - total
    }

    const stockError = await checkStockAvailability(cart)
    if (stockError) return showWarning("Stock insuficiente", stockError)

    setIsProcessing(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuario no autenticado")

      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({ client_id: selectedClient, total, payment_method: paymentMethod, created_by: user.id })
        .select()
        .single()
      if (saleError) throw saleError

      let totalCost = 0
      for (const item of cart) {
        const { data: batches } = await supabase
          .from("purchase_batches")
          .select("*")
          .eq("product_id", item.product_id)
          .gt("remaining_quantity", 0)
          .order("purchase_date", { ascending: true })

        if (!batches || batches.length === 0) throw new Error(`No hay stock disponible para ${item.name}`)
        let remainingQty = item.quantity

        for (const batch of batches) {
          if (remainingQty <= 0) break
          const qtyToDeduct = Math.min(batch.remaining_quantity, remainingQty)
          await supabase
            .from("purchase_batches")
            .update({ remaining_quantity: batch.remaining_quantity - qtyToDeduct })
            .eq("id", batch.id)

          await supabase.from("sale_items").insert({
            sale_id: sale.id,
            product_id: item.product_id,
            batch_id: batch.id,
            quantity: qtyToDeduct,
            unit_price: item.unit_price,
            subtotal: qtyToDeduct * item.unit_price,
          })

          totalCost += qtyToDeduct * Number(batch.purchase_price)
          remainingQty -= qtyToDeduct
        }

        if (remainingQty > 0) throw new Error(`Stock insuficiente para ${item.name}`)

        await supabase.from("inventory_movements").insert({
          product_id: item.product_id,
          movement_type: "salida",
          quantity: item.quantity,
          reason: `Venta #${sale.id}`,
          created_by: user.id,
        })
      }

      const profit = total - totalCost
      const profitMargin = (profit / total) * 100

      await supabase.from("sales_profit").insert({
        sale_id: sale.id,
        total_cost: totalCost,
        total_sale: total,
        profit,
        profit_margin: profitMargin,
      })

      setCart([])
      setSelectedClient("")
      setPaymentMethod("efectivo")

      if (paymentMethod === "efectivo" && change > 0) {
        await showSuccess(
          `Total: $${total.toFixed(2)}\nRecibido: $${amountGiven.toFixed(2)}\nCambio: $${change.toFixed(2)}`,
          "¡Venta Completada!"
        )
      } else {
        await showSuccess(`Total: $${total.toFixed(2)}`, "¡Venta Completada!")
      }

      router.refresh()
    } catch (error) {
      console.error("Error en venta:", error)
      showError(error instanceof Error ? error.message : "Error al procesar la venta", "Error")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {/* Columna Izquierda */}
      <div className="lg:col-span-2 space-y-5">
        {/* Escáner */}
        <Card className="card-dashboard">
          <CardHeader className="card-header-dashboard">
            <CardTitle className="card-title-dashboard flex items-center gap-2">
              <Barcode className="h-5 w-5 icon-pos" />
              Escáner de Productos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
              <InputWithIcon
                ref={barcodeInputRef}
                icon={<Barcode className="h-4  w-a" />}
                placeholder="Escanea o ingresa código de barras"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
              />
              <Button type="submit" className="group w-full md:w-auto bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary transition-all duration-300 shadow-md">
                Agregar
              </Button>
            </form>

            {/* Buscador por nombre */}
            <div className="space-y-2">
              <Label htmlFor="search-product">Buscar por nombre</Label>
              <InputWithIcon
                id="search-product"
                icon={<Search className="h-4 w-4" />}
                placeholder="Escribe para buscar productos..."
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
              />

              {filteredProducts.length > 0 && (
                <div className="border rounded-md bg-card/95 max-h-60 overflow-y-auto shadow-lg z-50 relative backdrop-blur-sm">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors text-left border-b last:border-0"
                      onClick={() => addToCart(product)}
                    >
                      <span className="font-medium text-sm">{product.name}</span>
                      <span className="text-sm font-bold text-chart-3">
                        {Number(product.sale_price).toLocaleString("es-CO", {
                          style: "currency",
                          currency: "COP",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Carrito */}
        <Card className="card-dashboard">
          <CardHeader className="card-header-dashboard">
            <CardTitle className="card-title-dashboard flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 icon-cart" />
              Carrito de Compras
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <div className="py-10 flex items-center justify-center">
                <div className="text-center max-w-xs">
                  <ShoppingCart className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-base font-medium text-muted-foreground">
                    El carrito está vacío
                  </p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Escanea un producto para comenzar
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-0">
                {cart.map((item) => (
                  <div
                    key={item.product_id}
                    className="group flex items-center justify-between py-3 px-2 rounded-md hover:bg-primary/5 hover:translate-x-1 transition-all duration-200 border-b last:border-0"
                  >
                    <div className="flex-1 group-hover:pl-2 transition-all">
                      <p className="font-medium text-sm text-foreground tracking-tight">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.unit_price.toLocaleString("es-CO", {
                          style: "currency",
                          currency: "COP",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })} c/u
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="group hover:bg-destructive/10 hover:border-destructive transition-all"
                        onClick={() => updateQuantity(item.product_id, -1)}
                      >
                        <Minus className="h-4 w-4 group-hover:text-destructive" />
                      </Button>
                      <span className="w-10 text-center font-bold text-foreground">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="group hover:bg-success/10 hover:border-success transition-all"
                        onClick={() => updateQuantity(item.product_id, 1)}
                      >
                        <Plus className="h-4 w-4 group-hover:text-success" />
                      </Button>
                      <span className="w-20 text-right font-bold text-chart-3">
                        {item.subtotal.toLocaleString("es-CO", {
                          style: "currency",
                          currency: "COP",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="group hover:bg-destructive/10 hover:text-destructive transition-colors"
                        onClick={() => removeFromCart(item.product_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Columna Derecha */}
      <div className="space-y-5">
        <Card className="card-dashboard">
          <CardHeader className="card-header-dashboard border-b">
            <CardTitle className="card-title-dashboard">Detalles de Venta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client" className="text-xs font-medium uppercase tracking-wide">
                Cliente *
              </Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger id="client" className="bg-card/50">
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent className="z-[9999] backdrop-blur-md bg-card/95 border-2 border-border shadow-xl">
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id} className="hover:bg-accent/30">
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment" className="text-xs font-medium uppercase tracking-wide">
                Método de Pago *
              </Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="payment" className="bg-card/50">
                  <SelectValue placeholder="Selecciona método" />
                </SelectTrigger>
                <SelectContent className="z-[9999] backdrop-blur-md bg-card/95 border-2 border-border shadow-xl">
                  <SelectItem value="efectivo" className="hover:bg-accent/30">Efectivo</SelectItem>
                  <SelectItem value="tarjeta" className="hover:bg-accent/30">Tarjeta</SelectItem>
                  <SelectItem value="transferencia" className="hover:bg-accent/30">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator className="my-4" />

            <div className="space-y-3">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal:</span>
                <span className="font-medium text-foreground">
                  {calculateTotal().toLocaleString("es-CO", {
                    style: "currency",
                    currency: "COP",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-lg font-extrabold text-primary pt-2 border-t border-border">
                <span>Total:</span>
                <span>
                  {calculateTotal().toLocaleString("es-CO", {
                    style: "currency",
                    currency: "COP",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
            </div>

            <Button
              className="w-full h-12 font-bold text-base uppercase tracking-wide
                         bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary
                         transition-all duration-300"
              size="lg"
              onClick={handleCheckout}
              disabled={isProcessing || cart.length === 0}
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Procesando...
                </span>
              ) : (
                "Completar Venta"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}