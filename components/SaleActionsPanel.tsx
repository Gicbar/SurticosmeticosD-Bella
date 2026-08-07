"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { showError, showSuccess } from "@/lib/sweetalert"
import { Undo2, FileMinus2, X, Package, ChevronDown, Check } from "lucide-react"

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

.sap-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
.sap-btn {
  display: flex; align-items: center; gap: 7px;
  height: 38px; padding: 0 16px; border: 1px solid rgba(26,26,24,.08); background: #fff; cursor: pointer;
  font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; color: #1a1a18;
  transition: border-color .14s, color .14s;
}
.sap-btn:hover { border-color: var(--primary,#984ca8); color: var(--primary,#984ca8); }
.sap-btn svg { width: 14px; height: 14px; }

.sap-bdrop { position:fixed; inset:0; z-index:1000; background:rgba(0,0,0,.35); backdrop-filter:blur(3px); display:flex; align-items:center; justify-content:center; padding:16px; }
@keyframes sapIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
.sap-modal { background:#fff; width:100%; max-width:600px; max-height:92vh; overflow-y:auto; font-family:'DM Sans',sans-serif; animation:sapIn .2s ease forwards; position:relative; }
.sap-modal::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:var(--primary,#984ca8); z-index:1; }
.sap-hd { position:sticky; top:0; background:#fff; z-index:2; padding:16px 18px 13px; border-bottom:1px solid rgba(26,26,24,.08); display:flex; align-items:center; justify-content:space-between; }
.sap-title { font-size:14px; font-weight:600; color:#1a1a18; margin:0; display:flex; align-items:center; gap:8px; }
.sap-title svg { color:var(--primary,#984ca8); width:14px; height:14px; }
.sap-close { width:28px; height:28px; border:none; background:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:rgba(26,26,24,.4); }
.sap-close:hover { color:#1a1a18; }
.sap-body { padding:18px; display:flex; flex-direction:column; gap:16px; }
.sap-lbl { display:block; font-size:9px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:rgba(26,26,24,.45); margin-bottom:5px; }
.sap-inp, .sap-textarea {
  width:100%; padding:0 13px; height:42px; border:1px solid rgba(26,26,24,.08); background:#fff;
  font-family:'DM Sans',sans-serif; font-size:13px; color:#1a1a18; outline:none; transition:border-color .14s;
}
.sap-textarea { height:auto; min-height:76px; padding:11px 13px; resize:vertical; }
.sap-inp:focus, .sap-textarea:focus { border-color:var(--primary,#984ca8); }
.sap-g2 { display:grid; gap:12px; grid-template-columns:1fr 1fr; }
@media(max-width:480px) { .sap-g2 { grid-template-columns:1fr; } }

.sap-item-row { display:flex; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid rgba(26,26,24,.06); }
.sap-item-row:last-child { border-bottom:none; }
.sap-item-info { flex:1; min-width:0; }
.sap-item-name { font-size:13px; font-weight:500; color:#1a1a18; margin:0; }
.sap-item-sub { font-size:11px; color:rgba(26,26,24,.45); margin:2px 0 0; }
.sap-item-qty { width:80px; height:36px; padding:0 10px; border:1px solid rgba(26,26,24,.08); font-family:'DM Sans',sans-serif; font-size:13px; text-align:center; }
.sap-item-qty:focus { border-color:var(--primary,#984ca8); outline:none; }

.sap-check-row { display:flex; align-items:center; gap:9px; padding:9px 12px; border:1.5px solid rgba(26,26,24,.08); cursor:pointer; transition:border-color .14s, background .14s; }
.sap-check-row.on { border-color:var(--primary,#984ca8); background:rgba(var(--primary-rgb,152,76,168),.05); }
.sap-check-box { width:17px; height:17px; flex-shrink:0; border:1.5px solid rgba(26,26,24,.2); display:flex; align-items:center; justify-content:center; }
.sap-check-row.on .sap-check-box { background:var(--primary,#984ca8); border-color:var(--primary,#984ca8); }
.sap-check-box svg { width:10px; height:10px; color:#fff; }
.sap-check-txt { font-size:12px; color:#1a1a18; }

.sap-sel-wrap { position:relative; }
.sap-sel-btn { width:100%; height:42px; padding:0 36px 0 13px; border:1px solid rgba(26,26,24,.08); background:#fff; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:13px; color:#1a1a18; display:flex; align-items:center; }
.sap-sel-chev { position:absolute; right:11px; top:50%; transform:translateY(-50%); color:rgba(26,26,24,.4); pointer-events:none; width:13px; height:13px; }
.sap-sel-dd { position:absolute; top:calc(100% + 3px); left:0; right:0; background:#fff; border:1px solid rgba(26,26,24,.08); box-shadow:0 8px 24px rgba(26,26,24,.10); z-index:700; }
.sap-sel-opt { padding:10px 13px; font-size:13px; color:#1a1a18; cursor:pointer; display:flex; align-items:center; justify-content:space-between; }
.sap-sel-opt:hover { background:rgba(var(--primary-rgb,152,76,168),.08); }

.sap-foot { padding:13px 18px; border-top:1px solid rgba(26,26,24,.08); display:flex; gap:8px; justify-content:flex-end; position:sticky; bottom:0; background:#fff; z-index:2; }
.sap-btn-cancel { height:38px; padding:0 16px; border:1px solid rgba(26,26,24,.08); background:#fff; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:12px; color:rgba(26,26,24,.5); }
.sap-btn-cancel:hover { border-color:#1a1a18; color:#1a1a18; }
.sap-btn-save { height:38px; padding:0 22px; border:none; background:var(--primary,#984ca8); cursor:pointer; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:#fff; display:flex; align-items:center; gap:6px; }
.sap-btn-save:disabled { opacity:.4; cursor:not-allowed; }
.sap-spin { width:13px; height:13px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:sapSpin .7s linear infinite; }
@keyframes sapSpin { to{ transform:rotate(360deg); } }
`

type SaleItem = {
  id: string
  product_id: string
  batch_id: string | null
  quantity: number
  unit_price: number
  products?: { name: string } | null
}

interface Props {
  companyId: string
  saleId: string
  clientId: string | null
  items: SaleItem[]
}

function SimpleSelect({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: { id: string; name: string }[]
}) {
  const [open, setOpen] = useState(false)
  const sel = options.find(o => o.id === value)
  return (
    <div className="sap-sel-wrap">
      <button type="button" className="sap-sel-btn" onClick={() => setOpen(o => !o)}>
        {sel?.name ?? "Selecciona"}
      </button>
      <ChevronDown className="sap-sel-chev" aria-hidden />
      {open && (
        <div className="sap-sel-dd" role="listbox">
          {options.map(o => (
            <div key={o.id} className="sap-sel-opt" onClick={() => { onChange(o.id); setOpen(false) }}>
              {o.name}{value === o.id && <Check size={11} aria-hidden />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function SaleActionsPanel({ companyId, saleId, clientId, items }: Props) {
  const router = useRouter()
  const [showDevolucion, setShowDevolucion] = useState(false)
  const [showNota, setShowNota] = useState(false)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="sap-actions">
        <button className="sap-btn" onClick={() => setShowDevolucion(true)}>
          <Undo2 aria-hidden />Registrar devolución
        </button>
        <button className="sap-btn" onClick={() => setShowNota(true)}>
          <FileMinus2 aria-hidden />Nota crédito / débito
        </button>
      </div>

      {showDevolucion && (
        <DevolucionDialog
          companyId={companyId} saleId={saleId} items={items}
          onClose={() => setShowDevolucion(false)}
          onSaved={() => { setShowDevolucion(false); router.refresh() }}
        />
      )}

      {showNota && (
        <NotaDialog
          companyId={companyId} saleId={saleId} clientId={clientId}
          onClose={() => setShowNota(false)}
          onSaved={() => { setShowNota(false); router.refresh() }}
        />
      )}
    </>
  )
}

// ── Diálogo: registrar devolución/garantía ────────────────────────────────────
function DevolucionDialog({ companyId, saleId, items, onClose, onSaved }: {
  companyId: string; saleId: string; items: SaleItem[]
  onClose: () => void; onSaved: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [alreadyReturned, setAlreadyReturned] = useState<Record<string, number>>({})
  const [qtys, setQtys] = useState<Record<string, string>>({})
  const [tipo, setTipo] = useState<"devolucion" | "garantia">("devolucion")
  const [motivo, setMotivo] = useState("")
  const [reintegra, setReintegra] = useState(true)

  useEffect(() => {
    ;(async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("devolucion_items")
        .select("item_venta_id, cantidad")
        .in("item_venta_id", items.map(i => i.id))
      const acc: Record<string, number> = {}
      for (const row of data || []) {
        acc[row.item_venta_id] = (acc[row.item_venta_id] || 0) + row.cantidad
      }
      setAlreadyReturned(acc)
    })()
  }, [items])

  const availableFor = (item: SaleItem) => item.quantity - (alreadyReturned[item.id] || 0)

  const selectedItems = useMemo(() => {
    return items
      .map(item => ({ item, qty: parseInt(qtys[item.id] || "0") || 0 }))
      .filter(x => x.qty > 0)
  }, [items, qtys])

  const total = selectedItems.reduce((s, x) => s + x.qty * Number(x.item.unit_price), 0)

  const handleSubmit = async () => {
    if (selectedItems.length === 0) { showError("Indica la cantidad a devolver de al menos un producto"); return }
    if (!motivo.trim()) { showError("Indica el motivo de la devolución"); return }
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.rpc("rpc_registrar_devolucion", {
        p_company_id: companyId,
        p_sale_id: saleId,
        p_tipo: tipo,
        p_motivo: motivo.trim(),
        p_reintegra_inventario: reintegra,
        p_items: selectedItems.map(x => ({
          sale_item_id: x.item.id,
          product_id: x.item.product_id,
          batch_id: x.item.batch_id,
          quantity: x.qty,
          unit_price: x.item.unit_price,
        })),
      })
      if (error) throw error
      await showSuccess("Devolución registrada correctamente")
      onSaved()
    } catch (err: any) {
      showError(err.message || "Error al registrar la devolución")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="sap-bdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }} role="dialog" aria-modal="true">
      <div className="sap-modal">
        <div className="sap-hd">
          <p className="sap-title"><Undo2 aria-hidden />Registrar devolución</p>
          <button className="sap-close" onClick={onClose} disabled={loading}><X size={13} /></button>
        </div>
        <div className="sap-body">
          <div>
            <span className="sap-lbl">Productos de la venta</span>
            {items.map(item => {
              const max = availableFor(item)
              return (
                <div key={item.id} className="sap-item-row">
                  <div className="sap-item-info">
                    <p className="sap-item-name">{item.products?.name ?? "Producto"}</p>
                    <p className="sap-item-sub">Vendido: {item.quantity} · Disponible para devolver: {max}</p>
                  </div>
                  <input
                    className="sap-item-qty" type="number" min={0} max={max}
                    value={qtys[item.id] || ""} disabled={loading || max <= 0}
                    placeholder="0"
                    onChange={e => setQtys(q => ({ ...q, [item.id]: e.target.value }))}
                  />
                </div>
              )
            })}
          </div>

          <div className="sap-g2">
            <div>
              <span className="sap-lbl">Tipo</span>
              <SimpleSelect value={tipo} onChange={v => setTipo(v as any)}
                options={[{ id: "devolucion", name: "Devolución" }, { id: "garantia", name: "Garantía" }]} />
            </div>
            <div>
              <span className="sap-lbl">Total a reversar</span>
              <div style={{ height: 42, display: "flex", alignItems: "center", fontFamily: "'Cormorant Garamond',serif", fontSize: 18 }}>
                {total.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>

          <div>
            <label className="sap-lbl" htmlFor="sap-motivo">Motivo *</label>
            <textarea id="sap-motivo" className="sap-textarea" value={motivo} disabled={loading}
              onChange={e => setMotivo(e.target.value)} placeholder="Ej: producto defectuoso, cliente se arrepintió..." />
          </div>

          <div
            role="checkbox" aria-checked={reintegra} tabIndex={0}
            className={`sap-check-row${reintegra ? " on" : ""}`}
            onClick={() => !loading && setReintegra(v => !v)}
            onKeyDown={e => { if ((e.key === " " || e.key === "Enter") && !loading) setReintegra(v => !v) }}
          >
            <div className="sap-check-box">{reintegra && <Check aria-hidden />}</div>
            <span className="sap-check-txt">Reintegrar al inventario (desmarcar si el producto está dañado/vencido)</span>
          </div>
        </div>
        <div className="sap-foot">
          <button className="sap-btn-cancel" onClick={onClose} disabled={loading}>Cancelar</button>
          <button className="sap-btn-save" onClick={handleSubmit} disabled={loading}>
            {loading ? <><div className="sap-spin" />Guardando…</> : "Registrar devolución"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Diálogo: nota crédito/débito (interna, no DIAN) ───────────────────────────
function NotaDialog({ companyId, saleId, clientId, onClose, onSaved }: {
  companyId: string; saleId: string; clientId: string | null
  onClose: () => void; onSaved: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [tipo, setTipo] = useState<"credito" | "debito">("credito")
  const [valor, setValor] = useState("")
  const [concepto, setConcepto] = useState("")

  const handleSubmit = async () => {
    const monto = parseFloat(valor)
    if (isNaN(monto) || monto <= 0) { showError("Ingresa un valor válido"); return }
    if (!concepto.trim()) { showError("Indica el concepto de la nota"); return }
    setLoading(true)
    try {
      const supabase = createClient()
      const table = tipo === "credito" ? "notas_credito" : "notas_debito"
      const payload: Record<string, unknown> = {
        empresa_id: companyId,
        venta_id: saleId,
        concepto: concepto.trim(),
        valor: monto,
      }
      if (tipo === "debito") payload.cliente_id = clientId
      const { error } = await supabase.from(table).insert(payload)
      if (error) throw error
      await showSuccess(`Nota ${tipo === "credito" ? "crédito" : "débito"} registrada`)
      onSaved()
    } catch (err: any) {
      showError(err.message || "Error al registrar la nota")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="sap-bdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }} role="dialog" aria-modal="true">
      <div className="sap-modal" style={{ maxWidth: 460 }}>
        <div className="sap-hd">
          <p className="sap-title"><FileMinus2 aria-hidden />Nota crédito / débito</p>
          <button className="sap-close" onClick={onClose} disabled={loading}><X size={13} /></button>
        </div>
        <div className="sap-body">
          <p style={{ fontSize: 11, color: "rgba(26,26,24,.5)", margin: 0, lineHeight: 1.5 }}>
            Nota interna de ajuste contable — no es un documento electrónico DIAN.
          </p>
          <div>
            <span className="sap-lbl">Tipo</span>
            <SimpleSelect value={tipo} onChange={v => setTipo(v as any)}
              options={[{ id: "credito", name: "Nota crédito (a favor del cliente)" }, { id: "debito", name: "Nota débito (en contra del cliente)" }]} />
          </div>
          <div>
            <label className="sap-lbl" htmlFor="sap-valor">Valor *</label>
            <input id="sap-valor" className="sap-inp" type="number" step="0.01" min="0"
              value={valor} disabled={loading} onChange={e => setValor(e.target.value)} placeholder="0" />
          </div>
          <div>
            <label className="sap-lbl" htmlFor="sap-concepto">Concepto *</label>
            <textarea id="sap-concepto" className="sap-textarea" value={concepto} disabled={loading}
              onChange={e => setConcepto(e.target.value)} placeholder="Motivo del ajuste" />
          </div>
        </div>
        <div className="sap-foot">
          <button className="sap-btn-cancel" onClick={onClose} disabled={loading}>Cancelar</button>
          <button className="sap-btn-save" onClick={handleSubmit} disabled={loading}>
            {loading ? <><div className="sap-spin" />Guardando…</> : "Registrar nota"}
          </button>
        </div>
      </div>
    </div>
  )
}
