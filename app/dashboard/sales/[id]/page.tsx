import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Calendar, DollarSign, User, CreditCard, Package, TrendingUp, ShoppingCart } from "lucide-react"

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: sale } = await supabase
    .from("sales")
    .select("*, clients(name, email, phone), sales_profit(*)")
    .eq("id", id)
    .single()

  if (!sale) {
    notFound()
  }

  const { data: saleItems } = await supabase.from("sale_items").select("*, products(name, barcode),purchase_batches(created_at)").eq("sale_id", id)

  const profit = sale.sales_profit?.[0]

  return (
    <div className="flex-1 flex flex-col bg-card/70 backdrop-blur-md p-4 md:p-5 rounded-2xl shadow-inner border border-border/20">
      {/* Header Compacto */}
      <div className="dashboard-header mb-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="group">
            <Link href="/dashboard/sales">
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            </Link>
          </Button>
          <div>
            <h1 className="dashboard-title flex items-center gap-2 text-xl md:text-2xl">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Detalle de Venta
            </h1>
            <p className="dashboard-subtitle mt-0.5 text-xs md:text-sm">
              Transacción #{id.slice(0, 8)} • {new Date(sale.sale_date).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid Compacto */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        {profit && (
          <>
            <Card className="card-dashboard group">
              <CardHeader className="card-header-dashboard px-3 py-2">
                <CardTitle className="card-title-dashboard text-xs">Ganancia</CardTitle>
                <TrendingUp className="h-4 w-4 icon-profit group-hover:scale-110 transition-transform" />
              </CardHeader>
              <CardContent className="px-3 py-2">
                <div className="text-lg font-bold text-chart-4">
                  {profit.profit.toLocaleString("es-CO", {
                    style: "currency",
                    currency: "COP",
                    minimumFractionDigits: 0,
                  })}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">Neta</p>
              </CardContent>
            </Card>

            <Card className="card-dashboard group">
              <CardHeader className="card-header-dashboard px-3 py-2">
                <CardTitle className="card-title-dashboard text-xs">Costo</CardTitle>
                <Package className="h-4 w-4 icon-products group-hover:scale-110 transition-transform" />
              </CardHeader>
              <CardContent className="px-3 py-2">
                <div className="text-lg font-bold">
                  {profit.total_cost.toLocaleString("es-CO", {
                    style: "currency",
                    currency: "COP",
                    minimumFractionDigits: 0,
                  })}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">Inversión</p>
              </CardContent>
            </Card>

            <Card className="card-dashboard group">
              <CardHeader className="card-header-dashboard px-3 py-2">
                <CardTitle className="card-title-dashboard text-xs">Margen</CardTitle>
                <TrendingUp className="h-4 w-4 icon-sales group-hover:scale-110 transition-transform" />
              </CardHeader>
              <CardContent className="px-3 py-2">
                <div className="text-lg font-bold text-chart-2">
                  {Number(profit.profit_margin).toFixed(1)}%
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">Rentabilidad</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Details Grid Compacto */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        {/* Información General */}
        <Card className="card-dashboard">
          <CardHeader className="card-header-dashboard px-4 py-3">
            <CardTitle className="card-title-dashboard flex items-center gap-2 text-sm">
              <User className="h-4 w-4 icon-clients" />
              Información General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4">
            <div className="flex justify-between items-center py-2 px-2 rounded-md bg-secondary/20 hover:bg-secondary/30 transition-colors">
              <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Fecha:
              </span>
              <span className="font-medium text-sm">{new Date(sale.sale_date).toLocaleString("es-ES")}</span>
            </div>
            <div className="flex justify-between items-center py-2 px-2 rounded-md bg-secondary/20 hover:bg-secondary/30 transition-colors">
              <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                Cliente:
              </span>
              <span className="font-medium text-sm">{sale.clients?.name || "Cliente General"}</span>
            </div>
            {sale.clients?.email && (
              <div className="flex justify-between items-center py-2 px-2 rounded-md bg-secondary/20 hover:bg-secondary/30 transition-colors">
                <span className="text-muted-foreground text-xs">Email:</span>
                <span className="font-medium text-xs truncate">{sale.clients.email}</span>
              </div>
            )}
            {sale.clients?.phone && (
              <div className="flex justify-between items-center py-2 px-2 rounded-md bg-secondary/20 hover:bg-secondary/30 transition-colors">
                <span className="text-muted-foreground text-xs">Teléfono:</span>
                <span className="font-medium text-xs">{sale.clients.phone}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-2 px-2 rounded-md bg-secondary/20 hover:bg-secondary/30 transition-colors">
              <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5" />
                Pago:
              </span>
              <span className="font-semibold text-xs badge-payment">{sale.payment_method}</span>
            </div>
          </CardContent>
        </Card>

        {/* Resumen Financiero */}
        <Card className="card-dashboard">
          <CardHeader className="card-header-dashboard px-4 py-3">
            <CardTitle className="card-title-dashboard flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 icon-revenue" />
              Resumen Financiero
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4">
            <div className="flex justify-between items-center py-2 px-2 rounded-md bg-chart-4/10 hover:bg-chart-4/15 transition-colors">
              <span className="text-muted-foreground text-xs">Total:</span>
              <span className="font-bold text-base text-chart-3">
                {sale.total.toLocaleString("es-CO", {
                  style: "currency",
                  currency: "COP",
                  minimumFractionDigits: 0,
                })}
              </span>
            </div>
            {profit && (
              <>
                <div className="flex justify-between items-center py-2 px-2 rounded-md bg-destructive/10 hover:bg-destructive/15 transition-colors">
                  <span className="text-muted-foreground text-xs">Costo:</span>
                  <span className="font-medium text-sm">
                    {profit.total_cost.toLocaleString("es-CO", {
                      style: "currency",
                      currency: "COP",
                      minimumFractionDigits: 0,
                    })}
                  </span>
                </div>
                <Separator className="my-1" />
                <div className="flex justify-between items-center py-2 px-2 rounded-md bg-chart-4/10 hover:bg-chart-4/15 transition-colors">
                  <span className="text-muted-foreground text-xs">Ganancia:</span>
                  <span className="font-bold text-base text-chart-4">
                    {profit.profit.toLocaleString("es-CO", {
                      style: "currency",
                      currency: "COP",
                      minimumFractionDigits: 0,
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 px-2 rounded-md bg-chart-2/10 hover:bg-chart-2/15 transition-colors">
                  <span className="text-muted-foreground text-xs">Margen:</span>
                  <span className="font-semibold text-sm text-chart-2">{Number(profit.profit_margin).toFixed(1)}%</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Productos Vendidos */}
      <Card className="card-dashboard">
        <CardHeader className="card-header-dashboard px-4 py-3">
          <CardTitle className="card-title-dashboard flex items-center gap-2 text-sm">
            <Package className="h-4 w-4 icon-products" />
            Productos Vendidos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="table-container">
            <Table className="table-base">
              <TableHeader className="table-header">
                <TableRow className="table-row">
                  <TableHead className="table-cell">Producto</TableHead>
                  <TableHead className="table-cell text-center">Cant.</TableHead>
                  <TableHead className="table-cell">Fecha Lote</TableHead>
                  <TableHead className="table-cell text-right">P. Unit.</TableHead>
                  <TableHead className="table-cell text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {saleItems?.map((item) => (
                  <TableRow key={item.id} className="table-row">
                    <TableCell className="table-cell font-medium text-sm">{item.products?.name || "N/A"}</TableCell>
                    <TableCell className="table-cell text-center">
                      <span className="badge badge-stock in-stock text-[10px] px-1.5 py-0.5">{item.quantity}</span>
                    </TableCell>
                    <TableCell className="table-cell text-xs">
                      {item.purchase_batches?.created_at
                        ? new Date(item.purchase_batches.created_at).toLocaleString("es-CO", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : "N/A"}
                    </TableCell>
                    <TableCell className="table-cell text-right font-semibold text-sm">
                      {item.unit_price.toLocaleString("es-CO", {
                        style: "currency",
                        currency: "COP",
                        minimumFractionDigits: 0,
                      })}
                    </TableCell>
                    <TableCell className="table-cell text-right font-bold text-chart-3 text-sm">
                      {item.subtotal.toLocaleString("es-CO", {
                        style: "currency",
                        currency: "COP",
                        minimumFractionDigits: 0,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}