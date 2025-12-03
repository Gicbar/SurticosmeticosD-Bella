"use client"

import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"
import * as XLSX from "xlsx"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { showSuccess, showError } from "@/lib/sweetalert"

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

export function ExportProfitsButton({ profits }: { profits: Profit[] }) {
  const handleExport = () => {
    try {
      if (profits.length === 0) {
        showError("No hay datos para exportar")
        return
      }

      const data = profits.map((profit) => ({
        "ID Venta": profit.sales?.id || "N/A",
        Fecha: profit.sales?.sale_date
          ? format(new Date(profit.sales.sale_date), "dd/MM/yyyy HH:mm", { locale: es })
          : "N/A",
        Cliente: (profit.sales?.clients as any)?.name || "N/A",
        "Método de Pago": profit.sales?.payment_method || "N/A",
        "Venta Total": Number(profit.total_sale).toFixed(2),
        "Costo Total": Number(profit.total_cost).toFixed(2),
        Ganancia: Number(profit.profit).toFixed(2),
        "Margen (%)": Number(profit.profit_margin).toFixed(2),
      }))

      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Rentabilidad")

      const fileName = `rentabilidad_${format(new Date(), "yyyy-MM-dd_HHmm")}.xlsx`
      XLSX.writeFile(workbook, fileName)

      showSuccess("Archivo exportado correctamente")
    } catch (error) {
      console.error("[v0] Error exporting:", error)
      showError("Error al exportar el archivo")
    }
  }

  return (
    <Button onClick={handleExport} variant="outline" className="btn-action-new">
      <FileDown className="mr-2 h-4 w-4" />
      Exportar a Excel
    </Button>
  )
}
