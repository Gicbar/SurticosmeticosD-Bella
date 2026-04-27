import { getUserPermissions } from "@/lib/auth"
import { DebtsInterface } from "@/components/debts-interface"
import { TrendingDown } from "lucide-react"
import { redirect } from "next/navigation"

// Mismo sistema de CSS del page.tsx del POS
const PAGE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');
  .dph {
    font-family: 'DM Sans', sans-serif;
    --dph-p:      var(--primary, #984ca8);
    --dph-border: rgba(26,26,24,0.08);
  }
  .dph-header {
    display: flex; flex-direction: column; gap: 4px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--dph-border);
    margin-bottom: 24px;
  }
  .dph-title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 22px; font-weight: 400; color: #1a1a18; margin: 0;
    display: flex; align-items: center; gap: 10px;
  }
  .dph-title-dot { width: 8px; height: 8px; background: var(--dph-p); flex-shrink: 0; }
  .dph-sub { font-size: 12px; color: rgba(26,26,24,0.45); margin: 2px 0 0; }
`

export default async function DebtsPage() {
  const permissions = await getUserPermissions()
  if (!permissions?.permissions?.creditos) redirect("/dashboard")
  const companyId = permissions.company_id
  if (!companyId) redirect("/auth/sin-empresa")

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <div className="dph">
        <div className="dph-header">
          <h1 className="dph-title">
            <span className="dph-title-dot" aria-hidden />
            Deudas de clientes
          </h1>
          <p className="dph-sub">
            Gestión de ventas a crédito · Abonos · Recordatorios de pago
          </p>
        </div>
        <DebtsInterface companyId={companyId} key="deb_01" />
      </div>
    </>
  )
}
