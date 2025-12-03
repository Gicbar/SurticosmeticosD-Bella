"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Eye, TrendingUp, DollarSign, Package } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

function MarginBadge({ value }: { value: number }) {
  const badgeClass = value >= 40 ? "badge-margin-high" : value >= 20 ? "badge-margin-medium" : "badge-margin-low"
  const icon = value >= 40 ? "📈" : value >= 20 ? "📊" : "⚠️"
  return (
    <div className={`badge ${badgeClass} gap-1`}>
      <span>{icon}</span> {value.toFixed(1)}%
    </div>
  )
}

function formatCurrency(amount: number) {
  return amount.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })
}

export function ProfitsTable({ profits }: { profits: any[] }) {
  return (
    <div className="table-container">
      <Table className="table-base min-w-[1100px]">
        <TableHeader className="table-header">
          <TableRow className="table-row">
            <TableHead className="table-cell">ID Venta</TableHead>
            <TableHead className="table-cell">Fecha</TableHead>
            <TableHead className="table-cell">Cliente</TableHead>
            <TableHead className="table-cell text-right">Venta</TableHead>
            <TableHead className="table-cell text-right">Costo</TableHead>
            <TableHead className="table-cell text-right">Ganancia</TableHead>
            <TableHead className="table-cell text-center">Margen</TableHead>
            <TableHead className="table-cell text-right">Ver</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profits.length === 0 ? (
            <TableRow className="table-row">
              <TableCell colSpan={8} className="table-cell">
                <div className="empty-state-box">
                  <TrendingUp className="empty-state-icon" />
                  <p className="empty-state-title">Sin datos de rentabilidad</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            profits.map((profit) => {
              const margin = Number(profit.profit_margin)
              // Clases semánticas para el color de fila
              const rowClass = margin >= 40 ? "row-profit-high" : margin >= 20 ? "row-profit-medium" : ""
              
              return (
                <TableRow key={profit.id} className={`table-row ${rowClass}`}>
                  <TableCell className="table-cell font-mono text-xs">#{profit.sales?.id.slice(0, 8)}</TableCell>
                  <TableCell className="table-cell text-xs text-muted-foreground">
                    {profit.sales?.sale_date ? format(new Date(profit.sales.sale_date), "dd MMM, HH:mm", { locale: es }) : "N/A"}
                  </TableCell>
                  <TableCell className="table-cell font-medium">{(profit.sales?.clients as any)?.name || "Cliente General"}</TableCell>
                  
                  <TableCell className="table-cell text-right font-bold text-chart-2">
                    {formatCurrency(Number(profit.total_sale))}
                  </TableCell>
                  <TableCell className="table-cell text-right text-muted-foreground">
                    {formatCurrency(Number(profit.total_cost))}
                  </TableCell>
                  <TableCell className="table-cell text-right font-bold text-chart-4">
                    {formatCurrency(Number(profit.profit))}
                  </TableCell>
                  
                  <TableCell className="table-cell text-center"><MarginBadge value={margin} /></TableCell>
                  <TableCell className="table-cell text-right">
                    <Button variant="ghost" size="icon" asChild className="btn-elegant-ghost">
                      <Link href={`/dashboard/profits/${profit.sale_id}`}><Eye className="h-4 w-4" /></Link>
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