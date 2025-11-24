import { createClient } from "@/lib/supabase/server"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, DollarSign, Package, Calendar, TrendingUp, ShoppingCart } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface ProfitDetail {
  id: string
  product_id: string
  nombre: string
  cantidad: number
  fecha_lote: string | null
  Precio_compra: number
  precio_unitario: number
  ganancia: number
  ganancia_unitaria: number
  ganancia_total: number
}

// ✅ FUNCIÓN FORMATCURRENCY - Con manejo seguro de valores
function formatCurrency(amount: number | string | null | undefined): string {
  // Convierte a número y valida
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (numAmount === null || numAmount === undefined || isNaN(numAmount)) {
    return "$0"; // Valor por defecto para datos inválidos
  }
  
  return numAmount.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

// ✅ COMPONENTE STATCARD PREMIUM
function StatCard({ 
  title, 
  value, 
  icon, 
  variant = "default",
  subtitle = null
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  variant?: "default" | "primary" | "accent"
  subtitle?: string | null
}) {
  const variants = {
    default: "icon-inventory",
    primary: "text-primary",
    accent: "text-chart-4",
  }
  
  return (
    <Card className="card-dashboard group">
      <CardHeader className="card-header-dashboard flex flex-row items-center justify-between pb-2">
        <CardTitle className="card-title-dashboard text-xs uppercase tracking-wide">
          {title}
        </CardTitle>
        <div className={`${variants[variant]} group-hover:scale-110 transition-transform duration-200`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="card-value-dashboard text-xl md:text-2xl font-bold">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}

export default async function profitsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profitsDetail, error } = await supabase
    .from("sales_profit_view")
    .select("*")
    .eq("id_venta", id)

  if (error || !profitsDetail || profitsDetail.length === 0) {
    notFound()
  }

  // 🔥 CÁLCULOS ROBUSTOS - Con valores seguros
  const totalGanancia = profitsDetail.reduce((acc, item) => {
    const ganancia = item.ganancia_total ?? 0;
    return acc + (typeof ganancia === 'string' ? parseFloat(ganancia) : ganancia);
  }, 0)
  
  const totalCosto = profitsDetail.reduce((acc, item) => {
    const costo = item.Precio_compra ?? 0;
    const cantidad = item.cantidad ?? 0;
    return acc + (typeof costo === 'string' ? parseFloat(costo) : costo) * cantidad;
  }, 0)
  
  const totalVenta = profitsDetail.reduce((acc, item) => {
    const venta = item.precio_unitario ?? 0;
    const cantidad = item.cantidad ?? 0;
    return acc + (typeof venta === 'string' ? parseFloat(venta) : venta) * cantidad;
  }, 0)
  
  const margenPromedio = totalVenta > 0 ? (totalGanancia / totalVenta) * 100 : 0
  const productosUnicos = new Set(profitsDetail.map(p => p.nombre)).size

  return (
    // ✅ LAYOUT PREMIUM - Mismo que inventario
    <div className="flex-1 flex flex-col bg-card/70 backdrop-blur-md p-4 md:p-6 rounded-2xl shadow-inner border border-border/20">
      {/* Header Premium */}
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border">
        <Button variant="ghost" size="icon" asChild className="group">
          <Link href="/dashboard/profits">
            <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        </Button>
        <div>
          <h1 className="dashboard-title">Detalle de Rentabilidad</h1>
          <p className="dashboard-subtitle mt-1">
            Venta #{id.slice(0, 8)} • {productosUnicos} productos • {formatCurrency(totalGanancia)} netos
          </p>
        </div>
      </div>

      {/* Stats Cards Premium */}
      <div className="grid gap-4 md:gap-5 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard 
          title="Total Venta" 
          value={formatCurrency(totalVenta)} 
          icon={<ShoppingCart className="h-5 w-5" />} 
          variant="primary"
          subtitle={`${profitsDetail.length} líneas de producto`}
        />
        <StatCard 
          title="Costo Total" 
          value={formatCurrency(totalCosto)} 
          icon={<DollarSign className="h-5 w-5" />} 
          subtitle="Inversión en productos"
        />
        <StatCard 
          title="Ganancia Neta" 
          value={formatCurrency(totalGanancia)} 
          icon={<TrendingUp className="h-5 w-5" />} 
          variant="accent"
          subtitle={`Margen ${margenPromedio.toFixed(1)}%`}
        />
        <StatCard 
          title="Productos" 
          value={productosUnicos} 
          icon={<Package className="h-5 w-5" />} 
          subtitle="Productos únicos"
        />
      </div>

      {/* Tabla Premium */}
      <Card className="card-dashboard p-0 overflow-hidden">
        <CardHeader className="card-header-dashboard">
          <CardTitle className="card-title-dashboard">Rentabilidad por Producto</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="table-container">
            <Table className="table-base min-w-[1200px]">
              <TableHeader className="table-header sticky top-0 z-10 bg-card/95 backdrop-blur-md">
                <TableRow className="table-row">
                  <TableHead className="table-cell">Producto</TableHead>
                  <TableHead className="table-cell text-center">Cantidad</TableHead>
                  <TableHead className="table-cell">Fecha Lote</TableHead>
                  <TableHead className="table-cell text-right">Precio Compra</TableHead>
                  <TableHead className="table-cell text-right">Precio Venta</TableHead>
                  <TableHead className="table-cell text-right">Ganancia Unitaria</TableHead>
                  <TableHead className="table-cell text-right">Ganancia Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profitsDetail.map((item) => {
                  // ✅ VALORES SEGUROS - Manejo de null/undefined
                  const precioCompra = item.Precio_compra ?? 0
                  const precioVenta = item.precio_unitario ?? 0
                  const cantidad = item.cantidad ?? 0
                  const gananciaUnitaria = item.ganancia_unitaria ?? (precioVenta - precioCompra)
                  const gananciaTotal = item.ganancia_total ?? (gananciaUnitaria * cantidad)
                  
                  return (
                    <TableRow 
                      key={item.id} 
                      className="table-row transition-all duration-200 hover:bg-primary/5 hover:translate-x-1"
                    >
                      <TableCell className="table-cell">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm text-foreground">{item.nombre || "N/A"}</span>
                        </div>
                      </TableCell>

                      <TableCell className="table-cell text-center">
                        <Badge variant="secondary" className="font-mono text-xs">
                          {cantidad}
                        </Badge>
                      </TableCell>

                      <TableCell className="table-cell">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {item.fecha_lote
                            ? format(new Date(item.fecha_lote), "dd MMM yyyy", { locale: es })
                            : "N/A"}
                        </div>
                      </TableCell>

                      <TableCell className="table-cell text-right">
                        <div className="flex justify-end items-center gap-1">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          <span className="font-mono text-sm text-muted-foreground">
                            {formatCurrency(precioCompra)}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="table-cell text-right">
                        <div className="flex justify-end items-center gap-1">
                          <DollarSign className="h-3 w-3 text-chart-2" />
                          <span className="font-bold text-sm text-chart-2">
                            {formatCurrency(precioVenta)}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="table-cell text-right">
                        <div className="flex justify-end items-center gap-1">
                          <TrendingUp className={`h-3 w-3 ${gananciaUnitaria >= 0 ? "text-chart-4" : "text-destructive"}`} />
                          <span className={`font-bold text-sm ${gananciaUnitaria >= 0 ? "text-chart-4" : "text-destructive"}`}>
                            {formatCurrency(gananciaUnitaria)}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="table-cell text-right">
                        <div className="flex justify-end items-center gap-1">
                          <TrendingUp className={`h-3 w-3 ${gananciaTotal >= 0 ? "text-chart-5" : "text-destructive"}`} />
                          <span className={`font-bold text-base ${gananciaTotal >= 0 ? "text-chart-5" : "text-destructive"}`}>
                            {formatCurrency(gananciaTotal)}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}