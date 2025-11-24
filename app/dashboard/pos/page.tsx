import { POSInterface } from "@/components/pos-interface"
import { Barcode } from "lucide-react"

export default function POSPage() {
  return (
    <div className="flex-1 flex flex-col bg-card/70 backdrop-blur-md p-4 md:p-6 rounded-2xl shadow-inner border border-border/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
        <div>
          <h1 className="dashboard-title flex items-center gap-3">
            <Barcode className="h-7 w-7 icon-pos" />
            Punto de Venta
          </h1>
          <p className="dashboard-subtitle mt-1">
            Sistema de ventas con escaneo de código de barras
          </p>
        </div>
      </div>

      {/* POS Container */}
      <div className="card-dashboard p-4 md:p-5">
        <POSInterface />
      </div>
    </div>
  )
}