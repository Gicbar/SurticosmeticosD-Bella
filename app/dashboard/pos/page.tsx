import { getUserPermissions } from "@/lib/auth"
import { POSInterface } from "@/components/pos-interface"
import { Barcode } from "lucide-react"
import { redirect } from "next/navigation"

export default async function POSPage() {
  // ── 1. Permisos + company_id ──────────────────────────────────────────────
  const permissions = await getUserPermissions()

  if (!permissions?.permissions?.ventas) {
    redirect("/dashboard")
  }

  const companyId = permissions.company_id
  if (!companyId) redirect("/auth/sin-empresa")

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

      {/* POS Container — companyId fluye desde el server al cliente */}
      <div className="card-dashboard p-4 md:p-5">
        <POSInterface companyId={companyId} />
      </div>
    </div>
  )
}
