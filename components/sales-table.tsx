"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Eye, Receipt } from "lucide-react"
import Link from "next/link"

type Sale = {
  id: string
  total: number
  payment_method: string
  sale_date: string
  clients: { name: string } | null
  sales_profit?: { profit: number; profit_margin: number }[] | null
}

interface SalesTableProps {
  sales: Sale[]
  showFinancialColumns: boolean   // ← implementado correctamente
}

export function SalesTable({ sales, showFinancialColumns }: SalesTableProps) {
  return (
    <div className="table-container">
      <Table>
        <TableHeader className="table-header">
          <TableRow className="table-row">
            <TableHead className="table-cell">Fecha</TableHead>
            <TableHead className="table-cell">Cliente</TableHead>
            <TableHead className="table-cell">Método de Pago</TableHead>
            {/* Columnas financieras: solo si tiene permiso */}
            {showFinancialColumns && (
              <>
                <TableHead className="table-cell text-right">Total</TableHead>
                <TableHead className="table-cell text-right">Ganancia</TableHead>
                <TableHead className="table-cell text-right">Margen</TableHead>
              </>
            )}
            <TableHead className="table-cell text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.length === 0 ? (
            <TableRow className="table-row">
              <TableCell
                colSpan={showFinancialColumns ? 7 : 4}
                className="table-cell"
              >
                <div className="py-12 flex items-center justify-center">
                  <div className="text-center max-w-sm">
                    <Receipt className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">
                      No hay ventas registradas
                    </p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            sales.map((sale) => {
              const profit = sale.sales_profit?.[0]
              return (
                <TableRow key={sale.id} className="table-row">
                  <TableCell className="table-cell text-xs text-muted-foreground">
                    {new Date(sale.sale_date).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="table-cell font-medium">
                    {sale.clients?.name || "Cliente General"}
                  </TableCell>
                  <TableCell className="table-cell capitalize text-sm">
                    {sale.payment_method}
                  </TableCell>
                  {showFinancialColumns && (
                    <>
                      <TableCell className="table-cell text-right font-bold text-chart-3">
                        {Number(sale.total).toLocaleString("es-CO", {
                          style: "currency",
                          currency: "COP",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </TableCell>
                      <TableCell className="table-cell text-right font-semibold text-chart-4">
                        {profit
                          ? Number(profit.profit).toLocaleString("es-CO", {
                              style: "currency",
                              currency: "COP",
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })
                          : "—"}
                      </TableCell>
                      <TableCell className="table-cell text-right text-chart-2 font-semibold">
                        {profit ? `${Number(profit.profit_margin).toFixed(1)}%` : "—"}
                      </TableCell>
                    </>
                  )}
                  <TableCell className="table-cell text-right">
                    <Button variant="ghost" size="icon" asChild className="btn-elegant-ghost">
                      <Link href={`/dashboard/sales/${sale.id}`}>
                        <Eye className="h-4 w-4" />
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
