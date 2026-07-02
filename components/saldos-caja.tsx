"use client"
import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Wallet, Landmark, Info } from "lucide-react"

// ── Utilidades (mismas reglas que el Cierre de Mes) ──────────────────────────
const COP = (n: number) =>
  n.toLocaleString("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 })

// Colombia = UTC-5 sin DST.
const COL_MS = 5 * 60 * 60 * 1000
const nowCol = () => new Date(Date.now() - COL_MS)

/** Límites del mes en hora Colombia, como ISO UTC. month = 1..12 */
function monthBoundsISO(year: number, month: number) {
  const firstDay = new Date(Date.UTC(year, month - 1, 1, 5, 0, 0)).toISOString()
  const lastDay  = new Date(Date.UTC(year, month, 1, 5, 0, 0) - 1).toISOString()
  return { firstDay, lastDay }
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
  .sc-card {
    font-family:'DM Sans',sans-serif;
    background:#fff; border:1px solid rgba(26,26,24,0.08);
    padding:18px 20px; margin-bottom:28px; position:relative; overflow:hidden;
  }
  .sc-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:var(--primary,#984ca8); opacity:.7; }
  .sc-head { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:16px; }
  .sc-title { display:flex; align-items:center; gap:8px; font-size:10px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:rgba(26,26,24,.45); }
  .sc-title .sc-dot { width:7px; height:7px; background:var(--primary,#984ca8); flex-shrink:0; }
  .sc-month { font-family:'Cormorant Garamond',Georgia,serif; font-size:15px; color:#1a1a18; text-transform:capitalize; }
  .sc-body { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  @media (max-width:560px){ .sc-body{ grid-template-columns:1fr; } }
  .sc-item { display:flex; align-items:center; gap:13px; padding:14px 16px; border:1px solid rgba(26,26,24,.06); }
  .sc-item.ef { background:rgba(21,128,61,.06); border-color:rgba(21,128,61,.18); }
  .sc-item.bk { background:rgba(var(--primary-rgb,152,76,168),.06); border-color:rgba(var(--primary-rgb,152,76,168),.20); }
  .sc-ico { width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .sc-item.ef .sc-ico { background:rgba(21,128,61,.14); } .sc-item.ef .sc-ico svg { color:#15803d; }
  .sc-item.bk .sc-ico { background:rgba(var(--primary-rgb,152,76,168),.14); } .sc-item.bk .sc-ico svg { color:var(--primary,#984ca8); }
  .sc-ico svg { width:19px; height:19px; }
  .sc-lbl { font-size:11px; color:rgba(26,26,24,.5); margin:0 0 2px; }
  .sc-val { font-family:'Cormorant Garamond',Georgia,serif; font-size:24px; font-weight:600; line-height:1; margin:0; white-space:nowrap; }
  .sc-item.ef .sc-val { color:#15803d; }
  .sc-item.bk .sc-val { color:var(--primary,#984ca8); }
  .sc-val.neg { color:#dc2626 !important; }
  .sc-total { display:flex; align-items:center; justify-content:space-between; margin-top:14px; padding-top:13px; border-top:1px solid rgba(26,26,24,.08); }
  .sc-total-lbl { font-size:11px; font-weight:600; letter-spacing:.04em; text-transform:uppercase; color:rgba(26,26,24,.5); }
  .sc-total-val { font-family:'Cormorant Garamond',Georgia,serif; font-size:22px; font-weight:600; color:#1a1a18; }
  .sc-total-val.neg { color:#dc2626; }
  .sc-note { display:flex; align-items:center; gap:6px; font-size:10px; color:rgba(26,26,24,.4); margin:10px 0 0; }
  .sc-note svg { width:12px; height:12px; flex-shrink:0; }
  .sc-loading { padding:40px 20px; text-align:center; font-size:12px; color:rgba(26,26,24,.4); }
`

type Cierre = { saldo_final_efectivo: number; saldo_final_banco: number } | null

/**
 * Tarjeta informativa: cuánto dinero hay HOY en el negocio (efectivo) y en el
 * banco (transferencia + tarjeta), calculado con las mismas reglas del Cierre de
 * Mes para el mes en curso. Si el mes ya está cerrado, muestra los valores
 * congelados del cierre; si no, calcula en vivo (saldo del cierre anterior +
 * movimientos del mes). Solo lectura, visible para cualquier usuario.
 */
export function SaldosCaja({ companyId }: { companyId: string }) {
  const supabase = useMemo(() => createClient(), [])
  const [loading, setLoading] = useState(true)
  const [ef, setEf] = useState(0)
  const [banco, setBanco] = useState(0)

  const today = nowCol()
  const year  = today.getUTCFullYear()
  const month = today.getUTCMonth() + 1

  useEffect(() => {
    let cancel = false
    ;(async () => {
      setLoading(true)
      const { firstDay, lastDay } = monthBoundsISO(year, month)
      const prevY = month === 1 ? year - 1 : year
      const prevM = month === 1 ? 12 : month - 1

      const [
        { data: ventas },
        { data: abonos },
        { data: gastos },
        { data: movs },
        { data: cierreActual },
        { data: cierrePrev },
      ] = await Promise.all([
        supabase.from("sales").select("total, payment_method")
          .eq("company_id", companyId).eq("is_credit", false)
          .gte("sale_date", firstDay).lte("sale_date", lastDay),
        supabase.from("debt_payments").select("amount, forma_pago")
          .eq("company_id", companyId)
          .gte("created_at", firstDay).lte("created_at", lastDay),
        supabase.from("expenses").select("amount, forma_pago")
          .eq("company_id", companyId)
          .gte("date", firstDay).lte("date", lastDay),
        supabase.from("movimientos_caja").select("tipo, monto, forma_pago")
          .eq("company_id", companyId).eq("anio", year).eq("mes", month),
        supabase.from("cierres_mensuales").select("saldo_final_efectivo, saldo_final_banco")
          .eq("company_id", companyId).eq("anio", year).eq("mes", month).maybeSingle(),
        supabase.from("cierres_mensuales").select("saldo_final_efectivo, saldo_final_banco")
          .eq("company_id", companyId).eq("anio", prevY).eq("mes", prevM).maybeSingle(),
      ])

      if (cancel) return

      // Si el mes ya está cerrado, usamos los valores congelados del cierre.
      const actual = cierreActual as Cierre
      if (actual) {
        setEf(Number(actual.saldo_final_efectivo))
        setBanco(Number(actual.saldo_final_banco))
        setLoading(false)
        return
      }

      // En vivo: saldo del cierre anterior + movimientos del mes en curso.
      const prev = cierrePrev as Cierre
      const iniEf    = prev ? Number(prev.saldo_final_efectivo) : 0
      const iniBanco = prev ? Number(prev.saldo_final_banco) : 0

      const ventasEf = (ventas ?? [])
        .filter(v => v.payment_method === "efectivo")
        .reduce((s, v) => s + Number(v.total || 0), 0)
      const ventasBanco = (ventas ?? [])
        .filter(v => v.payment_method === "transferencia" || v.payment_method === "tarjeta")
        .reduce((s, v) => s + Number(v.total || 0), 0)

      const sumBolsa = (rows: any[] | null, campo: string, bolsa: string) =>
        (rows ?? []).filter(r => (r.forma_pago ?? "efectivo") === bolsa)
          .reduce((s, r) => s + Number(r[campo] || 0), 0)

      const recaudoEf    = sumBolsa(abonos, "amount", "efectivo")
      const recaudoBanco = sumBolsa(abonos, "amount", "banco")
      const gastosEf     = sumBolsa(gastos, "amount", "efectivo")
      const gastosBanco  = sumBolsa(gastos, "amount", "banco")

      const sumMov = (tipo: string, bolsa: string) =>
        (movs ?? []).filter(m => m.tipo === tipo && (m.forma_pago ?? "efectivo") === bolsa)
          .reduce((s, m) => s + Number(m.monto || 0), 0)
      const ajustesEf    = sumMov("APORTE", "efectivo") - sumMov("RETIRO", "efectivo")
      const ajustesBanco = sumMov("APORTE", "banco")    - sumMov("RETIRO", "banco")

      setEf(iniEf + ventasEf + recaudoEf - gastosEf + ajustesEf)
      setBanco(iniBanco + ventasBanco + recaudoBanco - gastosBanco + ajustesBanco)
      setLoading(false)
    })()
    return () => { cancel = true }
  }, [supabase, companyId, year, month])

  const total = ef + banco

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="sc-card">
        <div className="sc-head">
          <span className="sc-title"><span className="sc-dot" aria-hidden />Caja disponible</span>
          <span className="sc-month">{MESES[month - 1]} {year}</span>
        </div>

        {loading ? (
          <div className="sc-loading">Cargando…</div>
        ) : (
          <>
            <div className="sc-body">
              <div className="sc-item ef">
                <div className="sc-ico"><Wallet /></div>
                <div>
                  <p className="sc-lbl">En el negocio (efectivo)</p>
                  <p className={`sc-val ${ef < 0 ? "neg" : ""}`}>{COP(ef)}</p>
                </div>
              </div>
              <div className="sc-item bk">
                <div className="sc-ico"><Landmark /></div>
                <div>
                  <p className="sc-lbl">En el banco (transf. + tarjeta)</p>
                  <p className={`sc-val ${banco < 0 ? "neg" : ""}`}>{COP(banco)}</p>
                </div>
              </div>
            </div>

            <div className="sc-total">
              <span className="sc-total-lbl">Total disponible</span>
              <span className={`sc-total-val ${total < 0 ? "neg" : ""}`}>{COP(total)}</span>
            </div>

            <p className="sc-note">
              <Info />
              Informativo · se actualiza con las ventas, gastos y el cierre de mes
            </p>
          </>
        )}
      </div>
    </>
  )
}
