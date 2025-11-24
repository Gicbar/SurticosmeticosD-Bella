"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Eye, Package, TrendingUp, DollarSign } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

type Profit = {
  id: string
  sale_id: string
  total_cost: number
  total_sale: number
  profit: number
  profit_margin: number
  sales?: {
    id: string
    sale_date: string
    payment_method: string
    clients?: {
      name: string
    }
  }
}

// ✅ BADGE DE MARGEN CON COLORES DINÁMICOS
function MarginBadge({ value }: { value: number }) {
  const variant = value >= 40 ? "default" : value >= 20 ? "secondary" : "destructive"
  const icon = value >= 40 ? "📈" : value >= 20 ? "📊" : "⚠️"
  
  return (
    <Badge variant={variant} className="gap-1 px-2 py-1 text-xs font-semibold">
      <span>{icon}</span>
      {value.toFixed(1)}%
    </Badge>
  )
}

// ✅ FORMATO MONEDA LOCAL
function formatCurrency(amount: number): string {
  return amount.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

export function ProfitsTable({ profits }: { profits: Profit[] }) {
  return (
    <div className="table-container">
      <Table className="table-base min-w-[1100px]">
        <TableHeader className="table-header sticky top-0 z-10 bg-card/95 backdrop-blur-md">
          <TableRow className="table-row">
            <TableHead className="table-cell">ID Venta</TableHead>
            <TableHead className="table-cell">Fecha</TableHead>
            <TableHead className="table-cell">Cliente</TableHead>
            <TableHead className="table-cell">Método de Pago</TableHead>
            <TableHead className="table-cell text-right">Venta Total</TableHead>
            <TableHead className="table-cell text-right">Costo Total</TableHead>
            <TableHead className="table-cell text-right">Ganancia</TableHead>
            <TableHead className="table-cell text-center">Margen</TableHead>
            <TableHead className="table-cell text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profits.length === 0 ? (
            // ✅ ESTADO VACÍO PREMIUM
            <TableRow className="table-row">
              <TableCell colSpan={9} className="table-cell">
                <div className="py-12 flex items-center justify-center">
                  <div className="text-center max-w-sm group">
                    <TrendingUp className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4 transition-all duration-300 group-hover:scale-110" />
                    <p className="text-lg font-medium text-muted-foreground mb-1">
                      No hay datos de rentabilidad
                    </p>
                    <p className="text-sm text-muted-foreground/70">
                      Registra ventas para ver el análisis de ganancias
                    </p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            profits.map((profit) => {
              const margin = Number(profit.profit_margin)
              const isHighProfit = margin >= 40
              const isMediumProfit = margin >= 20 && margin < 40
              
              return (
                <TableRow 
                  key={profit.id} 
                  className={`table-row transition-all duration-200 hover:bg-primary/5 hover:translate-x-1 ${
                    isHighProfit ? "bg-chart-4/5" : isMediumProfit ? "bg-chart-2/5" : ""
                  }`}
                >
                  <TableCell className="table-cell">
                    <div className="flex items-center gap-2 font-mono text-sm font-semibold text-foreground">
                      <Package className="h-3.5 w-3.5 text-muted-foreground" />
                      #{profit.sales?.id.slice(0, 8)}
                    </div>
                  </TableCell>

                  <TableCell className="table-cell">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {profit.sales?.sale_date
                        ? format(new Date(profit.sales.sale_date), "dd MMM yyyy, HH:mm", { locale: es })
                        : "N/A"}
                    </div>
                  </TableCell>

                  <TableCell className="table-cell">
                    <span className={`text-sm font-medium ${
                      (profit.sales?.clients as any)?.name ? "text-foreground" : "text-muted-foreground"
                    }`}>
                      {(profit.sales?.clients as any)?.name || "N/A"}
                    </span>
                  </TableCell>

                  <TableCell className="table-cell">
                    <Badge variant="outline" className="capitalize text-xs font-medium">
                      {profit.sales?.payment_method || "N/A"}
                    </Badge>
                  </TableCell>

                  <TableCell className="table-cell text-right">
                    <div className="flex justify-end items-center gap-1 group">
                      <DollarSign className="h-3 w-3 text-chart-2 group-hover:scale-110 transition-transform" />
                      <span className="font-bold text-chart-2 group-hover:text-chart-3 transition-colors">
                        {formatCurrency(Number(profit.total_sale))}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="table-cell text-right">
                    <span className="font-medium text-muted-foreground">
                      {formatCurrency(Number(profit.total_cost))}
                    </span>
                  </TableCell>

                  <TableCell className="table-cell text-right">
                    <div className="flex justify-end items-center gap-1 group">
                      <TrendingUp className="h-3 w-3 text-chart-4 group-hover:scale-110 transition-transform" />
                      <span className={`font-bold text-chart-4 group-hover:text-chart-5 transition-colors ${
                        Number(profit.profit) < 0 ? "text-destructive" : ""
                      }`}>
                        {formatCurrency(Number(profit.profit))}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="table-cell text-center">
                    <MarginBadge value={margin} />
                  </TableCell>

                  <TableCell className="table-cell text-right">
                    <Button variant="ghost" size="icon" asChild className="group">
                      <Link href={`/dashboard/profits/${profit.sale_id}`}>
                        <Eye className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all group-hover:scale-110" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}