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

  const { data: saleItems } = await supabase
    .from("sale_items")
    .select("*, products(name, barcode), purchase_batches(created_at)")
    .eq("sale_id", id)

  const profit = sale.sales_profit?.[0]

  return (
    <div className="dashboard-page-container">
      {/* Header Compacto */}
      <div className="dashboard-toolbar">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="group">
            <Link href="/dashboard/sales">
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            </Link>
          </Button>
          <div>
            <h1 className="dashboard-title">
              <ShoppingCart className="dashboard-title-icon" />
              Detalle de Venta
            </h1>
            <p className="dashboard-subtitle">
              Transacción #{id.slice(0, 8)} • {new Date(sale.sale_date).toLocaleDateString("es-CO", {
                day: "2-digit",
                month: "short",
                year: "numeric"
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid Compacto */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6 animate-fadeIn">
        {profit && (
          <>
            <Card className="card group">
              <CardHeader className="card-header flex flex-row items-center justify-between pb-2">
                <CardTitle className="card-title text-xs uppercase tracking-wide text-muted-foreground">
                  Ganancia
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-chart-4 group-hover:scale-110 transition-transform" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold text-chart-4">
                  {profit.profit.toLocaleString("es-CO", {
                    style: "currency",
                    currency: "COP",
                    minimumFractionDigits: 0,
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Neta</p>
              </CardContent>
            </Card>

            <Card className="card group">
              <CardHeader className="card-header flex flex-row items-center justify-between pb-2">
                <CardTitle className="card-title text-xs uppercase tracking-wide text-muted-foreground">
                  Costo
                </CardTitle>
                <Package className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">
                  {profit.total_cost.toLocaleString("es-CO", {
                    style: "currency",
                    currency: "COP",
                    minimumFractionDigits: 0,
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Inversión</p>
              </CardContent>
            </Card>

            <Card className="card group">
              <CardHeader className="card-header flex flex-row items-center justify-between pb-2">
                <CardTitle className="card-title text-xs uppercase tracking-wide text-muted-foreground">
                  Margen
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-chart-2 group-hover:scale-110 transition-transform" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold text-chart-2">
                  {Number(profit.profit_margin).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">Rentabilidad</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Details Grid Compacto */}
      <div className="grid gap-4 md:grid-cols-2 mb-6 animate-fadeIn">
        {/* Información General */}
        <Card className="card">
          <CardHeader className="card-header">
            <CardTitle className="card-title flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Información General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center py-2 px-2 rounded-md bg-secondary/20 hover:bg-secondary/30 transition-colors">
              <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Fecha:
              </span>
              <span className="font-medium text-sm">
                {new Date(sale.sale_date).toLocaleString("es-ES", {
                  dateStyle: "medium",
                  timeStyle: "short"
                })}
              </span>
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
              <span className="font-semibold text-xs badge-payment">
                {sale.payment_method.charAt(0).toUpperCase() + sale.payment_method.slice(1)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Resumen Financiero */}
        <Card className="card">
          <CardHeader className="card-header">
            <CardTitle className="card-title flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Resumen Financiero
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
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

                <Separator className="my-2" />

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
                  <span className="font-semibold text-sm text-chart-2">
                    {Number(profit.profit_margin).toFixed(1)}%
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Productos Vendidos */}
      <Card className="card animate-fadeIn">
        <CardHeader className="card-header">
          <CardTitle className="card-title flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            Productos Vendidos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="table-container">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Producto
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">
                    Cant.
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Fecha Lote
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">
                    P. Unit.
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">
                    Subtotal
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {saleItems?.map((item) => (
                  <TableRow key={item.id} className="border-b border-border/30 hover:bg-primary/5 transition-colors">
                    <TableCell className="px-4 py-3 text-sm font-medium">{item.products?.name || "N/A"}</TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <span className="badge badge-stock in-stock text-[10px] px-1.5 py-0.5">
                        {item.quantity}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs">
                      {item.purchase_batches?.created_at
                        ? new Date(item.purchase_batches.created_at).toLocaleString("es-CO", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : "N/A"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right font-semibold text-sm">
                      {item.unit_price.toLocaleString("es-CO", {
                        style: "currency",
                        currency: "COP",
                        minimumFractionDigits: 0,
                      })}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right font-bold text-chart-3 text-sm">
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
