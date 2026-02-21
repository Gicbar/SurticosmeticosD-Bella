// app/dashboard/reports/page.tsx
import { getUserPermissions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ReportsDashboard } from "@/components/ReportsDashboard"

export default async function ReportsPage() {
  // ── 1. Permisos + company_id ──────────────────────────────────────────────
  const permissions = await getUserPermissions()
  if (!permissions?.permissions?.rentabilidad) redirect("/dashboard")

  const companyId = permissions.company_id
  if (!companyId) redirect("/auth/sin-empresa")

  const supabase = await createClient()

  // ── 2. Cargar todos los datos necesarios en paralelo ──────────────────────
  const [
    { data: sales },
    { data: saleItems },
    { data: profits },
    { data: expenses },
    { data: products },
    { data: batches },
  ] = await Promise.all([
    // Ventas con cliente
    supabase
      .from("sales")
      .select("id, total, payment_method, sale_date, client_id, clients(name)")
      .eq("company_id", companyId)
      .order("sale_date", { ascending: true }),

    // Items de venta con producto
    supabase
      .from("sale_items")
      .select("id, sale_id, product_id, quantity, unit_price, subtotal, products(name, category_id, categories(name))")
      .eq("company_id", companyId),

    // Rentabilidad por venta
    supabase
      .from("sales_profit")
      .select("sale_id, total_cost, total_sale, profit, profit_margin, created_at")
      .eq("company_id", companyId),

    // Gastos
    supabase
      .from("expenses")
      .select("id, description, amount, date, categories_expense(name)")
      .eq("company_id", companyId)
      .order("date", { ascending: true }),

    // Productos con stock
    supabase
      .from("products")
      .select("id, name, sale_price, min_stock, category_id, categories(name)")
      .eq("company_id", companyId),

    // Lotes de compra (para antigüedad de inventario)
    supabase
      .from("purchase_batches")
      .select("id, product_id, quantity, purchase_price, purchase_date, remaining_quantity, products(name)")
      .eq("company_id", companyId)
      .gt("remaining_quantity", 0)   // solo lotes con stock activo
      .order("purchase_date", { ascending: true }),
  ])

  return (
    <ReportsDashboard
      sales={sales || []}
      saleItems={saleItems || []}
      profits={profits || []}
      expenses={expenses || []}
      products={products || []}
      batches={batches || []}
      companyId={companyId}
    />
  )
}
