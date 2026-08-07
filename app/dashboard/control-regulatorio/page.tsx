import { getUserPermissions } from "@/lib/auth"
import { ControlRegulatorioInterface } from "@/components/control-regulatorio-interface"
import { redirect } from "next/navigation"

const PAGE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');
  .crp { font-family: 'DM Sans', sans-serif; --crp-p: var(--primary, #984ca8); --crp-border: rgba(26,26,24,0.08); }
  .crp-header { display: flex; flex-direction: column; gap: 4px; padding-bottom: 20px; border-bottom: 1px solid var(--crp-border); margin-bottom: 24px; }
  .crp-title { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 22px; font-weight: 400; color: #1a1a18; margin: 0; display: flex; align-items: center; gap: 10px; }
  .crp-title-dot { width: 8px; height: 8px; background: var(--crp-p); flex-shrink: 0; }
  .crp-sub { font-size: 12px; color: rgba(26,26,24,0.45); margin: 2px 0 0; }
`

export default async function ControlRegulatorioPage() {
  const permissions = await getUserPermissions()
  if (!permissions?.permissions?.control_regulatorio) redirect("/dashboard")
  const companyId = permissions.company_id
  if (!companyId) redirect("/auth/sin-empresa")

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <div className="crp">
        <div className="crp-header">
          <h1 className="crp-title">
            <span className="crp-title-dot" aria-hidden />
            Control regulatorio
          </h1>
          <p className="crp-sub">Libro de sustancias controladas · Cadena de frío (Resolución 1478/2006 · Decreto 2200/2005)</p>
        </div>
        <ControlRegulatorioInterface companyId={companyId} key="cr_01" />
      </div>
    </>
  )
}
