import { POSInterface } from "@/components/pos-interface"
import { Barcode } from "lucide-react"

export default function POSPage() {
  return (
    <div className="dashboard-page-container">
      {/* Header */}
      <div className="dashboard-toolbar">
        <div>
          <h1 className="dashboard-title">
            <Barcode className="dashboard-title-icon" />
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