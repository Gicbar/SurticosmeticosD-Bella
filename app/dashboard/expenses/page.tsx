// app/dashboard/expenses/page.tsx
import { getUserPermissions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { ExpensesTable } from "@/components/expenses-table"
import { ExpenseDialog } from "@/components/expense-dialog"
import { Plus, DollarSign, TrendingUp, Calendar, Receipt } from "lucide-react"
import { redirect } from "next/navigation"

function COP(n: number) {
  return n.toLocaleString("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 })
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
.ex-page {
  font-family:'DM Sans',sans-serif;
  --p:    var(--primary,#984ca8);
  --p10:  rgba(var(--primary-rgb,152,76,168),.10);
  --txt:  #1a1a18;
  --muted:rgba(26,26,24,.45);
  --border:rgba(26,26,24,.08);
  --danger:#dc2626;
}
.ex-hd { display:flex; flex-direction:column; gap:14px; padding-bottom:20px; border-bottom:1px solid var(--border); margin-bottom:22px; }
@media(min-width:640px){ .ex-hd{ flex-direction:row; align-items:center; justify-content:space-between; } }
.ex-title { font-family:'Cormorant Garamond',Georgia,serif; font-size:22px; font-weight:400; color:var(--txt); margin:0; display:flex; align-items:center; gap:10px; }
.ex-dot   { width:8px; height:8px; background:var(--p); flex-shrink:0; }
.ex-sub   { font-size:12px; color:var(--muted); margin:3px 0 0; }
.ex-sub strong { color:var(--danger); }
.ex-btn-new {
  display:inline-flex; align-items:center; gap:7px;
  height:38px; padding:0 18px; background:var(--p); border:none; cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600;
  letter-spacing:.06em; text-transform:uppercase; color:#fff;
  transition:opacity .15s; white-space:nowrap; flex-shrink:0;
}
.ex-btn-new:hover { opacity:.88; }
.ex-btn-new svg { width:13px; height:13px; }
.ex-kpi-grid { display:grid; gap:10px; margin-bottom:20px; grid-template-columns:repeat(2,1fr); }
@media(min-width:640px){ .ex-kpi-grid{ grid-template-columns:repeat(4,1fr); } }
.ex-kpi { background:#fff; border:1px solid var(--border); padding:15px 14px; position:relative; overflow:hidden; transition:box-shadow .18s,transform .18s; }
.ex-kpi:hover { box-shadow:0 4px 18px var(--p10); transform:translateY(-1px); }
.ex-kpi::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:var(--danger); opacity:0; transition:opacity .18s; }
.ex-kpi:hover::before { opacity:1; }
.ex-kpi-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; }
.ex-kpi-lbl { font-size:8px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:var(--muted); }
.ex-kpi-ico { width:26px; height:26px; background:rgba(220,38,38,.08); display:flex; align-items:center; justify-content:center; }
.ex-kpi-ico svg { color:var(--danger); width:12px; height:12px; }
.ex-kpi-val { font-family:'Cormorant Garamond',Georgia,serif; font-size:20px; font-weight:500; color:var(--txt); margin:0; line-height:1; }
.ex-kpi-sub { font-size:10px; color:var(--muted); margin:4px 0 0; }
.ex-table-wrap { background:#fff; border:1px solid var(--border); overflow:hidden; }
.ex-empty { display:flex; flex-direction:column; align-items:center; gap:14px; padding:64px 20px; text-align:center; }
.ex-empty-ico { width:56px; height:56px; background:rgba(220,38,38,.07); display:flex; align-items:center; justify-content:center; border-radius:50%; }
.ex-empty-ico svg { color:var(--danger); opacity:.3; width:24px; height:24px; }
.ex-empty-t { font-size:14px; font-weight:500; color:var(--txt); margin:0; }
.ex-empty-s { font-size:12px; color:var(--muted); margin:0; }
`

function KpiCard({ title, value, sub, icon: Icon }: { title:string; value:string|number; sub?:string; icon:any }) {
  return (
    <div className="ex-kpi">
      <div className="ex-kpi-top">
        <span className="ex-kpi-lbl">{title}</span>
        <div className="ex-kpi-ico" aria-hidden><Icon /></div>
      </div>
      <p className="ex-kpi-val">{value}</p>
      {sub && <p className="ex-kpi-sub">{sub}</p>}
    </div>
  )
}

export default async function ExpensesPage() {
  const permissions = await getUserPermissions()
  if (!permissions?.permissions?.gastos) redirect("/dashboard")
  const companyId = permissions.company_id
  if (!companyId) redirect("/auth/sin-empresa")

  const now = new Date()
  const firstDay  = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastDay   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()
  const monthLabel = now.toLocaleDateString("es-CO", { month: "long", year: "numeric" })

  const supabase = await createClient()
  const [{ data: expenses }, { data: monthExpenses }] = await Promise.all([
    supabase.from("expenses").select("*").eq("company_id", companyId).order("date", { ascending: false }),
    supabase.from("expenses").select("amount, category").eq("company_id", companyId).gte("date", firstDay).lte("date", lastDay),
  ])

  const totalMonth       = monthExpenses?.reduce((s, e) => s + Number(e.amount), 0) || 0
  const gastosOperativos = monthExpenses?.filter(e => e.category === "operativos").reduce((s, e) => s + Number(e.amount), 0) || 0
  const gastosGenerales  = monthExpenses?.filter(e => e.category === "generales").reduce((s, e) => s + Number(e.amount), 0) || 0
  const promedioDiario   = now.getDate() > 0 ? totalMonth / now.getDate() : 0

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="ex-page">
        <div className="ex-hd">
          <div>
            <h1 className="ex-title"><span className="ex-dot" aria-hidden />Gastos</h1>
            <p className="ex-sub">
              {expenses?.length || 0} registros · Mes actual: <strong>{COP(totalMonth)}</strong>
            </p>
          </div>
          <ExpenseDialog companyId={companyId}>
            <button className="ex-btn-new"><Plus size={13} aria-hidden />Nuevo gasto</button>
          </ExpenseDialog>
        </div>

        <div className="ex-kpi-grid">
          <KpiCard title="Gastos del mes"    value={COP(totalMonth)}       sub={monthLabel}              icon={DollarSign} />
          <KpiCard title="Operativos"        value={COP(gastosOperativos)} sub="Operación diaria"        icon={TrendingUp} />
          <KpiCard title="Generales"         value={COP(gastosGenerales)}  sub="Administrativos y otros" icon={Receipt}    />
          <KpiCard title="Promedio diario"   value={COP(promedioDiario)}   sub={`${now.getDate()} días`} icon={Calendar}   />
        </div>

        <div className="ex-table-wrap">
          {expenses && expenses.length > 0
            ? <ExpensesTable expenses={expenses} companyId={companyId} />
            : (
              <div className="ex-empty">
                <div className="ex-empty-ico"><Receipt /></div>
                <p className="ex-empty-t">No hay gastos registrados</p>
                <p className="ex-empty-s">Registra tus gastos para controlar el flujo de caja</p>
              </div>
            )
          }
        </div>
      </div>
    </>
  )
}
