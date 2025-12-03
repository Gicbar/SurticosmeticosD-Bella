"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

type Sale = {
  id: string
  total: number
  payment_method: string
  sale_date: string
  clients: { name: string } | null
  sales_profit: { profit: number; profit_margin: number }[] | null
}

export function ExportSalesButton({ sales }: { sales: Sale[] }) {
  const handleExport = () => {
    // Create CSV content
    const headers = ["Fecha", "Cliente", "Método de Pago", "Total", "Ganancia", "Margen %"]
    const rows = sales.map((sale) => [
      new Date(sale.sale_date).toLocaleDateString("es-ES"),
      sale.clients?.name || "Cliente General",
      sale.payment_method,
      Number(sale.total).toFixed(2),
      Number(sale.sales_profit?.[0]?.profit || 0).toFixed(2),
      Number(sale.sales_profit?.[0]?.profit_margin || 0).toFixed(2),
    ])

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute("download", `ventas_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Button onClick={handleExport} disabled={sales.length === 0} className="btn-action-new">
      
      <Download className="mr-2 h-4 w-4" />
      Exportar CSV
    </Button>
  )
}
