import { createClient } from "@/lib/supabase/server"
import { AlertTriangle, Package, CheckCircle2 } from "lucide-react"

// ── CSS ───────────────────────────────────────────────────────────────────────
const LSA_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  .lsa {
    font-family: 'DM Sans', sans-serif;
    --lsa-p:       var(--primary, #984ca8);
    --lsa-p10:     rgba(var(--primary-rgb, 152,76,168), 0.10);
    --lsa-border:  rgba(26,26,24,0.08);
    --lsa-txt:     #1a1a18;
    --lsa-muted:   rgba(26,26,24,0.45);
    --lsa-danger:  #dc2626;
    --lsa-d10:     rgba(220,38,38,0.08);
    --lsa-d20:     rgba(220,38,38,0.18);
    --lsa-ok:      #16a34a;
    --lsa-ok10:    rgba(22,163,74,0.08);
    background: #fff;
    border: 1px solid var(--lsa-border);
    overflow: hidden;
  }

  /* ── Header ── */
  .lsa-hd {
    padding: 14px 18px 12px;
    border-bottom: 1px solid var(--lsa-border);
    display: flex; align-items: center; gap: 9px;
  }
  .lsa-hd.alert  { border-bottom-color: var(--lsa-d20); }
  .lsa-hd.ok     { border-bottom-color: rgba(22,163,74,0.15); }

  .lsa-hd-icon {
    width: 26px; height: 26px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .lsa-hd-icon.alert { background: var(--lsa-d10); }
  .lsa-hd-icon.ok    { background: var(--lsa-ok10); }
  .lsa-hd-icon.alert svg { color: var(--lsa-danger); width: 13px; height: 13px; }
  .lsa-hd-icon.ok    svg { color: var(--lsa-ok);     width: 13px; height: 13px; }

  .lsa-hd-title {
    font-size: 11px; font-weight: 600; letter-spacing: 0.12em;
    text-transform: uppercase; margin: 0;
  }
  .lsa-hd-title.alert { color: var(--lsa-danger); }
  .lsa-hd-title.ok    { color: var(--lsa-ok); }

  /* Contador de productos */
  .lsa-count {
    margin-left: auto; flex-shrink: 0;
    font-size: 9px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
    padding: 3px 9px; background: var(--lsa-d10); color: var(--lsa-danger);
  }

  /* ── Estado OK (vacío) ── */
  .lsa-ok-body {
    padding: 36px 20px; text-align: center;
    display: flex; flex-direction: column; align-items: center; gap: 10px;
  }
  .lsa-ok-icon {
    width: 48px; height: 48px; background: var(--lsa-ok10);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
  }
  .lsa-ok-icon svg { color: var(--lsa-ok); width: 20px; height: 20px; }
  .lsa-ok-title { font-size: 13px; font-weight: 500; color: var(--lsa-txt); margin: 0; }
  .lsa-ok-sub   { font-size: 11px; color: var(--lsa-muted); margin: 0; }

  /* ── Lista de productos ── */
  .lsa-list { display: flex; flex-direction: column; }

  .lsa-item {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 18px;
    border-bottom: 1px solid var(--lsa-border);
    transition: background 0.12s;
  }
  .lsa-item:last-child { border-bottom: none; }
  .lsa-item:hover { background: var(--lsa-d10); }

  /* Ícono del producto */
  .lsa-item-icon {
    width: 32px; height: 32px; flex-shrink: 0;
    background: var(--lsa-d10);
    display: flex; align-items: center; justify-content: center;
  }
  .lsa-item-icon svg { color: var(--lsa-danger); width: 14px; height: 14px; }

  /* Info */
  .lsa-item-info { flex: 1; min-width: 0; }
  .lsa-item-name {
    font-size: 13px; font-weight: 500; color: var(--lsa-txt);
    margin: 0 0 2px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .lsa-item-stock {
    font-size: 11px; color: var(--lsa-muted); margin: 0;
  }
  .lsa-item-stock strong { color: var(--lsa-danger); font-weight: 600; }

  /* Barra de stock */
  .lsa-bar-wrap { flex-shrink: 0; width: 60px; }
  @media (max-width: 400px) { .lsa-bar-wrap { display: none; } }
  .lsa-bar {
    height: 3px; background: var(--lsa-border); overflow: hidden; margin-bottom: 3px;
  }
  .lsa-bar-fill { height: 100%; background: var(--lsa-danger); transition: width 0.3s; }
  .lsa-bar-pct  { font-size: 9px; color: var(--lsa-muted); text-align: right; display: block; }

  /* Chip reabastecer */
  .lsa-chip {
    flex-shrink: 0;
    font-size: 9px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
    padding: 4px 9px; background: var(--lsa-d10); color: var(--lsa-danger);
  }
  @media (max-width: 480px) { .lsa-chip { display: none; } }

  /* ── Número crítico ── */
  .lsa-critical .lsa-item-icon { background: rgba(220,38,38,0.15); }
  .lsa-critical .lsa-item-name { color: var(--lsa-danger); }

  /* ── Footer con total ── */
  .lsa-footer {
    padding: 9px 18px;
    border-top: 1px solid var(--lsa-d20);
    background: var(--lsa-d10);
    display: flex; align-items: center; justify-content: space-between;
  }
  .lsa-footer-txt {
    font-size: 10px; color: var(--lsa-danger); font-weight: 500;
    letter-spacing: 0.06em;
  }
  .lsa-footer-num {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 18px; font-weight: 400; color: var(--lsa-danger); line-height: 1;
  }
`

// ── Tipos ─────────────────────────────────────────────────────────────────────
type LowStockProduct = {
  id: string
  name: string
  current_stock: number
  min_stock: number
}

// ── Componente ────────────────────────────────────────────────────────────────
export async function LowStockAlert({ companyId }: { companyId: string }) {
  const supabase = await createClient()

  let lowStockProducts: LowStockProduct[] | null = null

  const { data: rpcData, error: rpcError } = await supabase
    .rpc("get_low_stock_products", { p_company_id: companyId })

  if (rpcError) {
    // Fallback: query directa
    const { data: fallbackData } = await supabase
      .from("products")
      .select(`id, name, min_stock, purchase_batches(remaining_quantity)`)
      .eq("company_id", companyId)
      .gt("min_stock", 0)

    if (fallbackData) {
      lowStockProducts = fallbackData
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          min_stock: p.min_stock,
          current_stock: (p.purchase_batches as any[]).reduce(
            (sum: number, b: any) => sum + (b.remaining_quantity || 0), 0
          ),
        }))
        .filter(p => p.current_stock <= p.min_stock)
        .sort((a, b) => a.current_stock - b.current_stock)
    }
  } else {
    lowStockProducts = rpcData
  }

  // ── Estado OK ─────────────────────────────────────────────────────────────
  if (!lowStockProducts || lowStockProducts.length === 0) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: LSA_CSS }} />
        <div className="lsa">
          <div className="lsa-hd ok">
            <div className="lsa-hd-icon ok"><CheckCircle2 /></div>
            <p className="lsa-hd-title ok">Alertas de stock</p>
          </div>
          <div className="lsa-ok-body">
            <div className="lsa-ok-icon"><Package /></div>
            <p className="lsa-ok-title">Todo en orden</p>
            <p className="lsa-ok-sub">No hay productos con stock bajo en este momento</p>
          </div>
        </div>
      </>
    )
  }

  // ── Con alertas ───────────────────────────────────────────────────────────
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: LSA_CSS }} />
      <div className="lsa">

        {/* Header */}
        <div className="lsa-hd alert">
          <div className="lsa-hd-icon alert"><AlertTriangle /></div>
          <p className="lsa-hd-title alert">Alertas de stock</p>
          <span className="lsa-count">{lowStockProducts.length} producto{lowStockProducts.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Lista */}
        <div className="lsa-list">
          {lowStockProducts.map(product => {
            // Porcentaje de stock respecto al mínimo (>100% = bien, <100% = problema)
            const pct = product.min_stock > 0
              ? Math.min(100, Math.round((product.current_stock / product.min_stock) * 100))
              : 0
            const isCritical = product.current_stock === 0

            return (
              <div
                key={product.id}
                className={`lsa-item${isCritical ? " lsa-critical" : ""}`}
              >
                {/* Ícono */}
                <div className="lsa-item-icon"><Package /></div>

                {/* Info */}
                <div className="lsa-item-info">
                  <p className="lsa-item-name">{product.name}</p>
                  <p className="lsa-item-stock">
                    Stock actual:{" "}
                    <strong>
                      {isCritical ? "Sin stock" : `${product.current_stock} uds`}
                    </strong>
                    {" · "}Mín: {product.min_stock}
                  </p>
                </div>

                {/* Barra visual */}
                <div className="lsa-bar-wrap">
                  <div className="lsa-bar">
                    <div className="lsa-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="lsa-bar-pct">{pct}%</span>
                </div>

                {/* Chip */}
                <span className="lsa-chip">Reabastecer</span>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="lsa-footer">
          <span className="lsa-footer-txt">
            {lowStockProducts.filter(p => p.current_stock === 0).length > 0
              ? `${lowStockProducts.filter(p => p.current_stock === 0).length} sin stock · atención inmediata`
              : "Requieren reabastecimiento pronto"
            }
          </span>
          <span className="lsa-footer-num">{lowStockProducts.length}</span>
        </div>

      </div>
    </>
  )
}
