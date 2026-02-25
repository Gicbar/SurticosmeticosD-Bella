// ════════════════════════════════════════════════════════════════════════════
// app/dashboard/profits/page.tsx
// ════════════════════════════════════════════════════════════════════════════
import { getUserPermissions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { ProfitsTable } from "@/components/profits-table"
import { ExportProfitsButton } from "@/components/export-profits-button"
import { PiggyBank, TrendingUp, ShoppingCart, DollarSign, Percent } from "lucide-react"
import { redirect } from "next/navigation"

const COP = (n: number) =>
  n.toLocaleString("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 })

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
.prf-page {
  font-family:'DM Sans',sans-serif;
  --p:    var(--primary,#984ca8);
  --p10:  rgba(var(--primary-rgb,152,76,168),.10);
  --txt:  #1a1a18;
  --muted:rgba(26,26,24,.45);
  --border:rgba(26,26,24,.08);
}
.prf-hd { display:flex; flex-direction:column; gap:14px; padding-bottom:20px; border-bottom:1px solid var(--border); margin-bottom:22px; }
@media(min-width:640px){ .prf-hd{ flex-direction:row; align-items:center; justify-content:space-between; } }
.prf-title { font-family:'Cormorant Garamond',Georgia,serif; font-size:22px; font-weight:400; color:var(--txt); margin:0; display:flex; align-items:center; gap:10px; }
.prf-dot   { width:8px; height:8px; background:var(--p); flex-shrink:0; }
.prf-sub   { font-size:12px; color:var(--muted); margin:3px 0 0; }
.prf-sub strong { color:var(--p); }
.prf-kpi-grid { display:grid; gap:10px; margin-bottom:20px; grid-template-columns:repeat(2,1fr); }
@media(min-width:640px){ .prf-kpi-grid{ grid-template-columns:repeat(4,1fr); } }
.prf-kpi { background:#fff; border:1px solid var(--border); padding:15px 14px; position:relative; overflow:hidden; transition:box-shadow .18s,transform .18s; }
.prf-kpi:hover { box-shadow:0 4px 18px var(--p10); transform:translateY(-1px); }
.prf-kpi::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:var(--p); opacity:0; transition:opacity .18s; }
.prf-kpi:hover::before { opacity:1; }
.prf-kpi-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; }
.prf-kpi-lbl { font-size:8px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:var(--muted); }
.prf-kpi-ico { width:26px; height:26px; background:var(--p10); display:flex; align-items:center; justify-content:center; }
.prf-kpi-ico svg { color:var(--p); width:12px; height:12px; }
.prf-kpi-val { font-family:'Cormorant Garamond',Georgia,serif; font-size:20px; font-weight:500; color:var(--txt); margin:0; line-height:1; }
.prf-kpi-sub { font-size:10px; color:var(--muted); margin:4px 0 0; }
.prf-table-wrap { background:#fff; border:1px solid var(--border); overflow:hidden; }
`

function KpiCard({ title, value, sub, icon: Icon }: { title:string; value:string|number; sub?:string; icon:any }) {
  return (
    <div className="prf-kpi">
      <div className="prf-kpi-top">
        <span className="prf-kpi-lbl">{title}</span>
        <div className="prf-kpi-ico" aria-hidden><Icon /></div>
      </div>
      <p className="prf-kpi-val">{value}</p>
      {sub && <p className="prf-kpi-sub">{sub}</p>}
    </div>
  )
}

export default async function ProfitsPage() {
  const permissions = await getUserPermissions()
  if (!permissions?.permissions?.rentabilidad) redirect("/dashboard")
  const companyId = permissions.company_id
  if (!companyId) redirect("/auth/sin-empresa")

  const now = new Date()
  const firstDay  = new Date(now.getFullYear(), now.getMonth(), 1)
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const monthLabel = now.toLocaleDateString("es-CO", { month: "long", year: "numeric" })

  const supabase = await createClient()
  const { data: profits } = await supabase
    .from("sales_profit")
    .select("*, sales!inner(id, sale_date, payment_method, clients(name))")
    .eq("company_id", companyId)
    .gte("sales.sale_date", firstDay.toISOString())
    .lt("sales.sale_date", nextMonth.toISOString())
    .order("created_at", { ascending: false })

  const totalSales  = profits?.reduce((s, p) => s + Number(p.total_sale  || 0), 0) || 0
  const totalCost   = profits?.reduce((s, p) => s + Number(p.total_cost  || 0), 0) || 0
  const totalProfit = profits?.reduce((s, p) => s + Number(p.profit      || 0), 0) || 0
  const avgMargin   = profits?.length
    ? profits.reduce((s, p) => s + Number(p.profit_margin || 0), 0) / profits.length
    : 0

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="prf-page">
        <div className="prf-hd">
          <div>
            <h1 className="prf-title"><span className="prf-dot" aria-hidden />Rentabilidad</h1>
            <p className="prf-sub">
              {profits?.length || 0} ventas · {monthLabel} · Margen promedio{" "}
              <strong>{avgMargin.toFixed(1)}%</strong>
            </p>
          </div>
          <ExportProfitsButton profits={profits || []} />
        </div>

        <div className="prf-kpi-grid">
          <KpiCard title="Ventas totales" value={COP(totalSales)}  sub={`${profits?.length||0} transacciones`} icon={ShoppingCart} />
          <KpiCard title="Costo total"    value={COP(totalCost)}   sub="Inversión en productos"                icon={DollarSign}  />
          <KpiCard title="Ganancia neta"  value={COP(totalProfit)} sub="Utilidad después de costos"            icon={TrendingUp}  />
          <KpiCard title="Margen prom."   value={`${avgMargin.toFixed(1)}%`} sub="Rentabilidad media"         icon={Percent}     />
        </div>

        <div className="prf-table-wrap">
          <ProfitsTable profits={profits || []} />
        </div>
      </div>
    </>
  )
}
