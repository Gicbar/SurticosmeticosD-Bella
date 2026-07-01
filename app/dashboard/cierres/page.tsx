// app/dashboard/cierres/page.tsx
import { getUserPermissions } from "@/lib/auth"
import { CierreDashboard } from "@/components/cierre-dashboard"
import { redirect } from "next/navigation"

const PAGE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');
  .cmp {
    font-family: 'DM Sans', sans-serif;
    --cmp-p:      var(--primary, #984ca8);
    --cmp-border: rgba(26,26,24,0.08);
  }
  .cmp-header {
    display: flex; flex-direction: column; gap: 4px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--cmp-border);
    margin-bottom: 24px;
  }
  .cmp-title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 22px; font-weight: 400; color: #1a1a18; margin: 0;
    display: flex; align-items: center; gap: 10px;
  }
  .cmp-title-dot { width: 8px; height: 8px; background: var(--cmp-p); flex-shrink: 0; }
  .cmp-sub { font-size: 12px; color: rgba(26,26,24,0.45); margin: 2px 0 0; }
`

export default async function CierresPage() {
  const permissions = await getUserPermissions()
  if (!permissions?.permissions?.cierres) redirect("/dashboard")
  const companyId = permissions.company_id
  if (!companyId) redirect("/auth/sin-empresa")

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <div className="cmp">
        <div className="cmp-header">
          <h1 className="cmp-title">
            <span className="cmp-title-dot" aria-hidden />
            Cierre de Mes
          </h1>
          <p className="cmp-sub">
            Ingresos recibidos − gastos = saldo final · El saldo se arrastra como base del mes siguiente
          </p>
        </div>
        <CierreDashboard companyId={companyId} />
      </div>
    </>
  )
}
