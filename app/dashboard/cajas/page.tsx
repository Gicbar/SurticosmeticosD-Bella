import { getUserPermissions } from "@/lib/auth"
import { CajasInterface } from "@/components/cajas-interface"
import { redirect } from "next/navigation"

const PAGE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');
  .cjp { font-family: 'DM Sans', sans-serif; --cjp-p: var(--primary, #984ca8); --cjp-border: rgba(26,26,24,0.08); }
  .cjp-header { display: flex; flex-direction: column; gap: 4px; padding-bottom: 20px; border-bottom: 1px solid var(--cjp-border); margin-bottom: 24px; }
  .cjp-title { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 22px; font-weight: 400; color: #1a1a18; margin: 0; display: flex; align-items: center; gap: 10px; }
  .cjp-title-dot { width: 8px; height: 8px; background: var(--cjp-p); flex-shrink: 0; }
  .cjp-sub { font-size: 12px; color: rgba(26,26,24,0.45); margin: 2px 0 0; }
`

export default async function CajasPage() {
  const permissions = await getUserPermissions()
  if (!permissions?.permissions?.cajas) redirect("/dashboard")
  const companyId = permissions.company_id
  if (!companyId) redirect("/auth/sin-empresa")

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <div className="cjp">
        <div className="cjp-header">
          <h1 className="cjp-title">
            <span className="cjp-title-dot" aria-hidden />
            Cajas
          </h1>
          <p className="cjp-sub">Administración de cajas registradoras del negocio</p>
        </div>
        <CajasInterface companyId={companyId} key="cj_01" />
      </div>
    </>
  )
}
