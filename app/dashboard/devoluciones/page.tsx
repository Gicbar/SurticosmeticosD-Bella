import { getUserPermissions } from "@/lib/auth"
import { DevolucionesInterface } from "@/components/devoluciones-interface"
import { redirect } from "next/navigation"

const PAGE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');
  .dvp { font-family: 'DM Sans', sans-serif; --dvp-p: var(--primary, #984ca8); --dvp-border: rgba(26,26,24,0.08); }
  .dvp-header { display: flex; flex-direction: column; gap: 4px; padding-bottom: 20px; border-bottom: 1px solid var(--dvp-border); margin-bottom: 24px; }
  .dvp-title { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 22px; font-weight: 400; color: #1a1a18; margin: 0; display: flex; align-items: center; gap: 10px; }
  .dvp-title-dot { width: 8px; height: 8px; background: var(--dvp-p); flex-shrink: 0; }
  .dvp-sub { font-size: 12px; color: rgba(26,26,24,0.45); margin: 2px 0 0; }
`

export default async function DevolucionesPage() {
  const permissions = await getUserPermissions()
  if (!permissions?.permissions?.devoluciones) redirect("/dashboard")
  const companyId = permissions.company_id
  if (!companyId) redirect("/auth/sin-empresa")

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <div className="dvp">
        <div className="dvp-header">
          <h1 className="dvp-title">
            <span className="dvp-title-dot" aria-hidden />
            Devoluciones y garantías
          </h1>
          <p className="dvp-sub">Devoluciones registradas · Notas crédito/débito internas</p>
        </div>
        <DevolucionesInterface companyId={companyId} key="dev_dv_01" />
      </div>
    </>
  )
}
