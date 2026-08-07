import { getUserPermissions } from "@/lib/auth"
import { TurnosCajaInterface } from "@/components/turnos-caja-interface"
import { redirect } from "next/navigation"

const PAGE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');
  .tcp { font-family: 'DM Sans', sans-serif; --tcp-p: var(--primary, #984ca8); --tcp-border: rgba(26,26,24,0.08); }
  .tcp-header { display: flex; flex-direction: column; gap: 4px; padding-bottom: 20px; border-bottom: 1px solid var(--tcp-border); margin-bottom: 24px; }
  .tcp-title { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 22px; font-weight: 400; color: #1a1a18; margin: 0; display: flex; align-items: center; gap: 10px; }
  .tcp-title-dot { width: 8px; height: 8px; background: var(--tcp-p); flex-shrink: 0; }
  .tcp-sub { font-size: 12px; color: rgba(26,26,24,0.45); margin: 2px 0 0; }
`

export default async function TurnosCajaPage() {
  const permissions = await getUserPermissions()
  if (!permissions?.permissions?.cajas_turnos) redirect("/dashboard")
  const companyId = permissions.company_id
  if (!companyId) redirect("/auth/sin-empresa")

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <div className="tcp">
        <div className="tcp-header">
          <h1 className="tcp-title">
            <span className="tcp-title-dot" aria-hidden />
            Cajas y turnos
          </h1>
          <p className="tcp-sub">Apertura/cierre de turno con arqueo · Recogidas de efectivo</p>
        </div>
        <TurnosCajaInterface companyId={companyId} key="tc_01" />
      </div>
    </>
  )
}
