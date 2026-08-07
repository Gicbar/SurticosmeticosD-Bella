import { createClient } from "@/lib/supabase/server"
import { CalendarClock, PackageSearch, CheckCircle2 } from "lucide-react"

// ── CSS ── (mismo sistema de tokens que low-stock-alert.tsx, prefijo "esa-",
// paleta ámbar en vez de roja para distinguir "vence pronto" de "sin stock")
const ESA_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  .esa {
    font-family: 'DM Sans', sans-serif;
    --esa-border:  rgba(26,26,24,0.08);
    --esa-txt:     #1a1a18;
    --esa-muted:   rgba(26,26,24,0.45);
    --esa-warn:    #b45309;
    --esa-w10:     rgba(180,83,9,0.08);
    --esa-w20:     rgba(180,83,9,0.18);
    --esa-ok:      #16a34a;
    --esa-ok10:    rgba(22,163,74,0.08);
    background: #fff;
    border: 1px solid var(--esa-border);
    overflow: hidden;
  }

  .esa-hd { padding: 14px 18px 12px; border-bottom: 1px solid var(--esa-border); display: flex; align-items: center; gap: 9px; }
  .esa-hd.alert { border-bottom-color: var(--esa-w20); }
  .esa-hd.ok    { border-bottom-color: rgba(22,163,74,0.15); }
  .esa-hd-icon { width: 26px; height: 26px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
  .esa-hd-icon.alert { background: var(--esa-w10); }
  .esa-hd-icon.ok    { background: var(--esa-ok10); }
  .esa-hd-icon.alert svg { color: var(--esa-warn); width: 13px; height: 13px; }
  .esa-hd-icon.ok    svg { color: var(--esa-ok);   width: 13px; height: 13px; }
  .esa-hd-title { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; margin: 0; }
  .esa-hd-title.alert { color: var(--esa-warn); }
  .esa-hd-title.ok    { color: var(--esa-ok); }
  .esa-count { margin-left: auto; flex-shrink: 0; font-size: 9px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 3px 9px; background: var(--esa-w10); color: var(--esa-warn); }

  .esa-ok-body { padding: 36px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px; }
  .esa-ok-icon { width: 48px; height: 48px; background: var(--esa-ok10); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
  .esa-ok-icon svg { color: var(--esa-ok); width: 20px; height: 20px; }
  .esa-ok-title { font-size: 13px; font-weight: 500; color: var(--esa-txt); margin: 0; }
  .esa-ok-sub   { font-size: 11px; color: var(--esa-muted); margin: 0; }

  .esa-list { display: flex; flex-direction: column; }
  .esa-item { display: flex; align-items: center; gap: 12px; padding: 12px 18px; border-bottom: 1px solid var(--esa-border); transition: background 0.12s; }
  .esa-item:last-child { border-bottom: none; }
  .esa-item:hover { background: var(--esa-w10); }
  .esa-item-icon { width: 32px; height: 32px; flex-shrink: 0; background: var(--esa-w10); display: flex; align-items: center; justify-content: center; }
  .esa-item-icon svg { color: var(--esa-warn); width: 14px; height: 14px; }
  .esa-item-info { flex: 1; min-width: 0; }
  .esa-item-name { font-size: 13px; font-weight: 500; color: var(--esa-txt); margin: 0 0 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .esa-item-sub  { font-size: 11px; color: var(--esa-muted); margin: 0; }
  .esa-item-sub strong { color: var(--esa-warn); font-weight: 600; }
  .esa-chip { flex-shrink: 0; font-size: 9px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 4px 9px; background: var(--esa-w10); color: var(--esa-warn); white-space: nowrap; }
  @media (max-width: 480px) { .esa-chip { display: none; } }
  .esa-critical .esa-item-icon { background: rgba(180,83,9,0.18); }
  .esa-critical .esa-item-name { color: var(--esa-warn); }

  .esa-footer { padding: 9px 18px; border-top: 1px solid var(--esa-w20); background: var(--esa-w10); display: flex; align-items: center; justify-content: space-between; }
  .esa-footer-txt { font-size: 10px; color: var(--esa-warn); font-weight: 500; letter-spacing: 0.06em; }
  .esa-footer-num { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 18px; font-weight: 400; color: var(--esa-warn); line-height: 1; }
`

type ExpiringBatch = {
  batch_id: string
  product_id: string
  product_name: string
  numero_lote_fabricante: string | null
  remaining_quantity: number
  fecha_vencimiento: string
  dias_para_vencer: number
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })

// ── Componente ────────────────────────────────────────────────────────────────
// Solo tiene sentido para empresas tipo "drogueria" (fecha_vencimiento es
// específico de ese modelo de negocio) — la página que lo usa decide si
// renderizarlo según company.tipo_negocio.
export async function ExpiringSoonAlert({ companyId, diasUmbral = 90 }: { companyId: string; diasUmbral?: number }) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .rpc("get_products_expiring_soon", { p_company_id: companyId, p_dias_umbral: diasUmbral })

  if (error) return null // función no desplegada aún (008/009 no ejecutados) — no romper el dashboard

  const batches = (data || []) as ExpiringBatch[]

  if (batches.length === 0) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: ESA_CSS }} />
        <div className="esa">
          <div className="esa-hd ok">
            <div className="esa-hd-icon ok"><CheckCircle2 /></div>
            <p className="esa-hd-title ok">Alertas de vencimiento</p>
          </div>
          <div className="esa-ok-body">
            <div className="esa-ok-icon"><PackageSearch /></div>
            <p className="esa-ok-title">Todo en orden</p>
            <p className="esa-ok-sub">Ningún lote vence en los próximos {diasUmbral} días</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: ESA_CSS }} />
      <div className="esa">
        <div className="esa-hd alert">
          <div className="esa-hd-icon alert"><CalendarClock /></div>
          <p className="esa-hd-title alert">Alertas de vencimiento</p>
          <span className="esa-count">{batches.length} lote{batches.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="esa-list">
          {batches.map(b => {
            const isCritical = b.dias_para_vencer <= 30
            return (
              <div key={b.batch_id} className={`esa-item${isCritical ? " esa-critical" : ""}`}>
                <div className="esa-item-icon"><CalendarClock /></div>
                <div className="esa-item-info">
                  <p className="esa-item-name">{b.product_name}</p>
                  <p className="esa-item-sub">
                    Vence <strong>{fmtDate(b.fecha_vencimiento)}</strong>
                    {" · "}{b.remaining_quantity} uds
                    {b.numero_lote_fabricante ? ` · Lote ${b.numero_lote_fabricante}` : ""}
                  </p>
                </div>
                <span className="esa-chip">
                  {b.dias_para_vencer <= 0 ? "Vencido" : `${b.dias_para_vencer} días`}
                </span>
              </div>
            )
          })}
        </div>

        <div className="esa-footer">
          <span className="esa-footer-txt">
            {batches.filter(b => b.dias_para_vencer <= 30).length > 0
              ? `${batches.filter(b => b.dias_para_vencer <= 30).length} críticos (≤30 días)`
              : "Planifica su rotación o liquidación"
            }
          </span>
          <span className="esa-footer-num">{batches.length}</span>
        </div>
      </div>
    </>
  )
}
