import { getUserPermissions } from "@/lib/auth"
import { OrdenesCompraInterface } from "@/components/ordenes-compra-interface"
import { redirect } from "next/navigation"

const PAGE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');
  .ocp { font-family: 'DM Sans', sans-serif; --ocp-p: var(--primary, #984ca8); --ocp-border: rgba(26,26,24,0.08); }
  .ocp-header { display: flex; flex-direction: column; gap: 4px; padding-bottom: 20px; border-bottom: 1px solid var(--ocp-border); margin-bottom: 24px; }
  .ocp-title { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 22px; font-weight: 400; color: #1a1a18; margin: 0; display: flex; align-items: center; gap: 10px; }
  .ocp-title-dot { width: 8px; height: 8px; background: var(--ocp-p); flex-shrink: 0; }
  .ocp-sub { font-size: 12px; color: rgba(26,26,24,0.45); margin: 2px 0 0; }
`

export default async function PurchaseOrdersPage() {
  const permissions = await getUserPermissions()
  if (!permissions?.permissions?.ordenes_compra) redirect("/dashboard")
  const companyId = permissions.company_id
  if (!companyId) redirect("/auth/sin-empresa")
  const canApprove = !!permissions?.permissions?.aprobar_ordenes_compra

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <div className="ocp">
        <div className="ocp-header">
          <h1 className="ocp-title">
            <span className="ocp-title-dot" aria-hidden />
            Órdenes de compra
          </h1>
          <p className="ocp-sub">Solicitudes a proveedores · Aprobación y compra real</p>
        </div>
        <OrdenesCompraInterface companyId={companyId} canApprove={canApprove} key="po_01" />
      </div>
    </>
  )
}
