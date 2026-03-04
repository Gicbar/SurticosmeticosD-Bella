// app/dashboard/inventory/page.tsx
import { getUserPermissions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { InventoryTable } from "@/components/inventory-table"
import { PurchaseBatchDialog } from "@/components/purchase-batch-dialog"
import { Plus, Package, Box, DollarSign, Layers } from "lucide-react"
import { redirect } from "next/navigation"

const COP = (n: number) =>
  n.toLocaleString("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 })

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
.inv-page {
  font-family:'DM Sans',sans-serif;
  --p:    var(--primary,#984ca8);
  --p10:  rgba(var(--primary-rgb,152,76,168),.10);
  --txt:  #1a1a18;
  --muted:#1a1a18;
  --border:rgba(26,26,24,.08);
}
.inv-hd { display:flex; flex-direction:column; gap:14px; padding-bottom:20px; border-bottom:1px solid var(--border); margin-bottom:22px; }
@media(min-width:640px){ .inv-hd{ flex-direction:row; align-items:center; justify-content:space-between; } }
.inv-title { font-family:'Cormorant Garamond',Georgia,serif; font-size:22px; font-weight:400; color:var(--txt); margin:0; display:flex; align-items:center; gap:10px; }
.inv-dot  { width:8px; height:8px; background:var(--p); flex-shrink:0; }
.inv-sub  { font-size:12px; color:var(--muted); margin:3px 0 0; }
.inv-btn-new {
  display:inline-flex; align-items:center; gap:7px;
  height:38px; padding:0 18px; background:var(--p); border:none; cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600;
  letter-spacing:.06em; text-transform:uppercase; color:#fff;
  transition:opacity .15s; white-space:nowrap; flex-shrink:0;
}
.inv-btn-new:hover { opacity:.88; }
.inv-kpi-grid { display:grid; gap:10px; margin-bottom:20px; grid-template-columns:repeat(2,1fr); }
@media(min-width:640px){ .inv-kpi-grid{ grid-template-columns:repeat(4,1fr); } }
.inv-kpi { background:#fff; border:1px solid var(--border); padding:15px 14px; position:relative; overflow:hidden; transition:box-shadow .18s,transform .18s; }
.inv-kpi:hover { box-shadow:0 4px 18px var(--p10); transform:translateY(-1px); }
.inv-kpi::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:var(--p); opacity:0; transition:opacity .18s; }
.inv-kpi:hover::before { opacity:1; }
.inv-kpi-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; }
.inv-kpi-lbl { font-size:8px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:var(--muted); }
.inv-kpi-ico { width:26px; height:26px; background:var(--p10); display:flex; align-items:center; justify-content:center; }
.inv-kpi-ico svg { color:var(--p); width:12px; height:12px; }
.inv-kpi-val { font-family:'Cormorant Garamond',Georgia,serif; font-size:20px; font-weight:500; color:var(--txt); margin:0; line-height:1; }
.inv-kpi-sub { font-size:10px; color:var(--muted); margin:4px 0 0; }
.inv-table-wrap { background:#fff; border:1px solid var(--border); overflow:hidden; }
`

function KpiCard({ title, value, sub, icon: Icon }: { title:string; value:string|number; sub?:string; icon:any }) {
  return (
    <div className="inv-kpi">
      <div className="inv-kpi-top">
        <span className="inv-kpi-lbl">{title}</span>
        <div className="inv-kpi-ico" aria-hidden><Icon /></div>
      </div>
      <p className="inv-kpi-val">{value}</p>
      {sub && <p className="inv-kpi-sub">{sub}</p>}
    </div>
  )
}

export default async function InventoryPage() {
  const permissions = await getUserPermissions()
  if (!permissions?.permissions?.inventario) redirect("/dashboard")

  const companyId = permissions.company_id
  if (!companyId) redirect("/auth/sin-empresa")

  const supabase = await createClient()
  const { data: allBatches } = await supabase
    .from("purchase_batches")
    .select("*, products(name, barcode, min_stock), suppliers(name)")
    .eq("company_id", companyId)
    .order("purchase_date", { ascending: false })

  const active         = allBatches?.filter(b => b.remaining_quantity > 0) || []
  const totalLotes     = active.length
  const uniqueProducts = new Set(active.map(b => b.products?.name)).size
  const totalValue     = active.reduce((s, b) => s + b.remaining_quantity * b.purchase_price, 0)
  const totalStock     = active.reduce((s, b) => s + b.remaining_quantity, 0)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="inv-page">
        <div className="inv-hd">
          <div>
            <h1 className="inv-title"><span className="inv-dot" aria-hidden />Inventario</h1>
            <p className="inv-sub">{totalLotes} lotes activos · {uniqueProducts} productos únicos</p>
          </div>
          <PurchaseBatchDialog companyId={companyId}>
            <button className="inv-btn-new"><Plus size={13} aria-hidden />Nueva compra</button>
          </PurchaseBatchDialog>
        </div>

        <div className="inv-kpi-grid">
          <KpiCard title="Lotes activos"    value={totalLotes}      sub="Con stock"           icon={Package}    />
          <KpiCard title="Productos únicos" value={uniqueProducts}  sub="En inventario"        icon={Box}        />
          <KpiCard title="Valor inventario" value={COP(totalValue)} sub="En stock actual"      icon={DollarSign} />
          <KpiCard title="Total stock"      value={totalStock}      sub="Unidades disponibles" icon={Layers}     />
        </div>

        <div className="inv-table-wrap">
          <InventoryTable batches={allBatches || []} companyId={companyId} />
        </div>
      </div>
    </>
  )
}
