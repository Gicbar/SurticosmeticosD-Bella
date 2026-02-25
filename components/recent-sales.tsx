import { createClient } from "@/lib/supabase/server"
import { Receipt, User, ShoppingCart, Banknote, CreditCard, ArrowLeftRight } from "lucide-react"

// ── CSS ───────────────────────────────────────────────────────────────────────
const RS_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  .rs {
    font-family: 'DM Sans', sans-serif;
    --rs-p:      var(--primary, #984ca8);
    --rs-p10:    rgba(var(--primary-rgb,152,76,168), 0.10);
    --rs-txt:    #1a1a18;
    --rs-muted:  rgba(26,26,24,0.45);
    --rs-border: rgba(26,26,24,0.08);
    background: #fff;
    border: 1px solid var(--rs-border);
    overflow: hidden;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  /* ── Header ── */
  .rs-hd {
    padding: 14px 18px 12px;
    border-bottom: 1px solid var(--rs-border);
    display: flex; align-items: center; gap: 9px;
    flex-shrink: 0;
  }
  .rs-hd-icon {
    width: 26px; height: 26px; flex-shrink: 0;
    background: var(--rs-p10);
    display: flex; align-items: center; justify-content: center;
  }
  .rs-hd-icon svg { color: var(--rs-p); width: 13px; height: 13px; }
  .rs-hd-title {
    font-size: 11px; font-weight: 600; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--rs-txt); margin: 0;
  }
  .rs-hd-count {
    margin-left: auto; font-size: 9px; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase;
    padding: 3px 9px;
    background: var(--rs-p10); color: var(--rs-p);
  }

  /* ── Empty ── */
  .rs-empty {
    flex: 1; padding: 40px 20px;
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 10px; text-align: center;
  }
  .rs-empty-icon {
    width: 48px; height: 48px; background: var(--rs-p10);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
  }
  .rs-empty-icon svg { color: var(--rs-p); opacity: 0.4; width: 20px; height: 20px; }
  .rs-empty-title { font-size: 13px; font-weight: 500; color: var(--rs-txt); margin: 0; }
  .rs-empty-sub   { font-size: 11px; color: var(--rs-muted); margin: 0; }

  /* ── Lista ── */
  .rs-list { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

  .rs-item {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 18px;
    border-bottom: 1px solid var(--rs-border);
    transition: background 0.12s;
  }
  .rs-item:last-child { border-bottom: none; }
  .rs-item:hover { background: var(--rs-p10); }

  /* Icono del método de pago */
  .rs-pay-icon {
    width: 30px; height: 30px; flex-shrink: 0;
    background: var(--rs-p10);
    display: flex; align-items: center; justify-content: center;
  }
  .rs-pay-icon svg { color: var(--rs-p); width: 13px; height: 13px; }

  /* Info */
  .rs-info { flex: 1; min-width: 0; }
  .rs-client {
    font-size: 13px; font-weight: 500; color: var(--rs-txt);
    margin: 0 0 2px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .rs-meta {
    display: flex; align-items: center; gap: 6px;
    font-size: 10px; color: var(--rs-muted); margin: 0;
  }
  .rs-meta-sep { width: 3px; height: 3px; border-radius: 50%; background: var(--rs-border); flex-shrink: 0; }
  .rs-method {
    text-transform: capitalize; letter-spacing: 0.04em;
  }

  /* Monto */
  .rs-amount {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 16px; font-weight: 400; color: var(--rs-p);
    white-space: nowrap; flex-shrink: 0;
    transition: transform 0.15s;
  }
  .rs-item:hover .rs-amount { transform: scale(1.04); }

  /* ── Footer totalizador ── */
  .rs-footer {
    padding: 10px 18px;
    border-top: 1px solid var(--rs-border);
    background: rgba(26,26,24,0.015);
    display: flex; align-items: center; justify-content: space-between;
    flex-shrink: 0;
  }
  .rs-footer-lbl {
    font-size: 8px; font-weight: 600; letter-spacing: 0.2em;
    text-transform: uppercase; color: var(--rs-muted);
  }
  .rs-footer-val {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 18px; font-weight: 400; color: var(--rs-p); line-height: 1;
  }
`

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (v: number) =>
  v.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short" })

function PayIcon({ method }: { method: string }) {
  const m = (method ?? "").toLowerCase()
  if (m === "tarjeta")       return <CreditCard />
  if (m === "transferencia") return <ArrowLeftRight />
  if (m === "credito")       return <Receipt />
  return <Banknote />   // efectivo por defecto
}

// ── Componente ────────────────────────────────────────────────────────────────
export async function RecentSales({ companyId }: { companyId: string }) {
  const supabase = await createClient()

  const { data: sales } = await supabase
    .from("sales")
    .select("*, clients(name)")
    .eq("company_id", companyId)
    .order("sale_date", { ascending: false })
    .limit(5)

  const total = sales?.reduce((s, v) => s + Number(v.total), 0) ?? 0

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: RS_CSS }} />
      <div className="rs">

        {/* Header */}
        <div className="rs-hd">
          <div className="rs-hd-icon"><Receipt /></div>
          <p className="rs-hd-title">Ventas recientes</p>
          {sales && sales.length > 0 && (
            <span className="rs-hd-count">{sales.length}</span>
          )}
        </div>

        {/* Contenido */}
        {!sales || sales.length === 0 ? (
          <div className="rs-empty">
            <div className="rs-empty-icon"><ShoppingCart /></div>
            <p className="rs-empty-title">Sin ventas recientes</p>
            <p className="rs-empty-sub">Las últimas transacciones aparecerán aquí</p>
          </div>
        ) : (
          <>
            <div className="rs-list">
              {sales.map(sale => (
                <div key={sale.id} className="rs-item">

                  {/* Ícono según método de pago */}
                  <div className="rs-pay-icon">
                    <PayIcon method={sale.payment_method} />
                  </div>

                  {/* Info */}
                  <div className="rs-info">
                    <p className="rs-client">
                      {(sale.clients as any)?.name || "Cliente general"}
                    </p>
                    <p className="rs-meta">
                      <span className="rs-method">{sale.payment_method}</span>
                      <span className="rs-meta-sep" aria-hidden />
                      <span>{fmtDate(sale.sale_date)}</span>
                    </p>
                  </div>

                  {/* Monto */}
                  <span className="rs-amount">{fmt(Number(sale.total))}</span>
                </div>
              ))}
            </div>

            {/* Footer con total */}
            <div className="rs-footer">
              <span className="rs-footer-lbl">Total últimas {sales.length} ventas</span>
              <span className="rs-footer-val">{fmt(total)}</span>
            </div>
          </>
        )}
      </div>
    </>
  )
}
