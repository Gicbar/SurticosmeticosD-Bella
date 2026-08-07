import { getUserPermissions } from "@/lib/auth"
import { SupplierDebtsInterface } from "@/components/supplier-debts-interface"
import { redirect } from "next/navigation"

// Mismo sistema de CSS que app/dashboard/debts/page.tsx (cartera de clientes)
const PAGE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');
  .spp {
    font-family: 'DM Sans', sans-serif;
    --spp-p:      var(--primary, #984ca8);
    --spp-border: rgba(26,26,24,0.08);
  }
  .spp-header {
    display: flex; flex-direction: column; gap: 4px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--spp-border);
    margin-bottom: 24px;
  }
  .spp-title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 22px; font-weight: 400; color: #1a1a18; margin: 0;
    display: flex; align-items: center; gap: 10px;
  }
  .spp-title-dot { width: 8px; height: 8px; background: var(--spp-p); flex-shrink: 0; }
  .spp-sub { font-size: 12px; color: rgba(26,26,24,0.45); margin: 2px 0 0; }
`

export default async function SupplierDebtsPage() {
  const permissions = await getUserPermissions()
  if (!permissions?.permissions?.cuentas_por_pagar) redirect("/dashboard")
  const companyId = permissions.company_id
  if (!companyId) redirect("/auth/sin-empresa")

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <div className="spp">
        <div className="spp-header">
          <h1 className="spp-title">
            <span className="spp-title-dot" aria-hidden />
            Cuentas por pagar a proveedor
          </h1>
          <p className="spp-sub">
            Compras a crédito · Pagos · Saldo pendiente por proveedor
          </p>
        </div>
        <SupplierDebtsInterface companyId={companyId} key="sup_debt_01" />
      </div>
    </>
  )
}
