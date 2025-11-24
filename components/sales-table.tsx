"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import Link from "next/link"

type Sale = {
  id: string
  total: number
  payment_method: string
  sale_date: string
  clients: { name: string } | null
  sales_profit: { profit: number; profit_margin: number }[] | null
}

export function SalesTable({ sales }: { sales: Sale[] }) {
  return (
    <div className="table-container">
      <Table>
        <TableHeader className="table-header">
          <TableRow  className="table-row">
            <TableHead>Fecha</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Método de Pago</TableHead>
            <TableHead>Total</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.length === 0 ? (
            <TableRow className="table-row">
              <TableCell colSpan={7} className="table-cell text-center">
                No hay ventas registradas
              </TableCell>
            </TableRow>
          ) : (
            sales.map((sale) => {
              return (
                <TableRow key={sale.id} className="table-row">
                  <TableCell className="table-cell">{new Date(sale.sale_date).toLocaleDateString("es-ES")}</TableCell>
                  <TableCell className="table-cell">{sale.clients?.name || "Cliente General"}</TableCell>
                  <TableCell className="table-cell">{sale.payment_method}</TableCell>
                  <TableCell className="table-cell font-semibold">{Number(sale.total).toLocaleString("es-CO", {
                      style: "currency",
                      currency: "COP",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}</TableCell>
                  <TableCell className="table-cell text-right">
                    <Button variant="ghost" size="icon" asChild>
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
