// app/dashboard/reports/page.tsx
import { getUserPermissions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ReportsDashboard } from "@/components/ReportsDashboard"

const PAGE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');
.rp-wrap {
  font-family:'DM Sans',sans-serif;
}
`

export default async function ReportsPage() {
  const permissions = await getUserPermissions()
  if (!permissions?.permissions?.reportes) redirect("/dashboard")

  const companyId = permissions.company_id
  if (!companyId) redirect("/auth/sin-empresa")

  const supabase = await createClient()

  const [
    { data: sales },
    { data: saleItems },
    { data: profits },
    { data: expenses },
    { data: products },
    { data: batches },
  ] = await Promise.all([
    supabase
      .from("sales")
      .select("id, total, payment_method, sale_date, client_id, clients(name)")
      .eq("company_id", companyId)
      .order("sale_date", { ascending: true }),

    supabase
      .from("sale_items")
      .select("id, sale_id, product_id, quantity, unit_price, subtotal, products(name, category_id, categories(name))")
      .eq("company_id", companyId),

    supabase
      .from("sales_profit")
      .select("sale_id, total_cost, total_sale, profit, profit_margin, created_at")
      .eq("company_id", companyId),

    supabase
      .from("expenses")
      .select("id, description, amount, date, categories_expense(name)")
      .eq("company_id", companyId)
      .order("date", { ascending: true }),

    supabase
      .from("products")
      .select("id, name, sale_price, min_stock, category_id, categories(name)")
      .eq("company_id", companyId),

    supabase
      .from("purchase_batches")
      .select("id, product_id, quantity, purchase_price, purchase_date, remaining_quantity, products(name)")
      .eq("company_id", companyId)
      .gt("remaining_quantity", 0)
      .order("purchase_date", { ascending: true }),
  ])
  
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <div className="rp-wrap">
        <ReportsDashboard
          sales={sales || []}
          saleItems={saleItems || []}
          profits={profits || []}
          expenses={expenses || []}
          products={products || []}
          batches={batches || []}
          companyId={companyId}
        />
      </div>
    </>
  )
}
