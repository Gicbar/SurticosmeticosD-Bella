import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Receipt, User, CreditCard, ShoppingCart } from "lucide-react"

export async function RecentSales() {
  const supabase = await createClient()

  const { data: recentSales } = await supabase
    .from("sales")
    .select("*, clients(name)")
    .order("sale_date", { ascending: false })
    .limit(5)

  if (!recentSales || recentSales.length === 0) {
    return (
      <Card className="card h-full">
        <CardHeader className="card-header">
          <CardTitle className="card-title text-muted-foreground">
            <Receipt className="h-5 w-5" />
            Ventas Recientes
          </CardTitle>
        </CardHeader>
        <CardContent className="card-content">
          <div className="empty-state-box">
            <ShoppingCart className="empty-state-icon" />
            <p className="empty-state-title">No hay ventas recientes</p>
            <p className="empty-state-desc">Las transacciones aparecerán aquí</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="card h-full">
      <CardHeader className="card-header">
        <CardTitle className="card-title text-chart-2">
          <Receipt className="h-5 w-5" />
          Ventas Recientes
        </CardTitle>
      </CardHeader>
      <CardContent className="card-content p-0">
        <div className="divide-y divide-border/40">
          {recentSales.map((sale) => (
            <div
              key={sale.id}
              className="group flex items-center justify-between py-4 px-6 hover:bg-primary/5 transition-all duration-200"
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <p className="font-medium text-sm text-foreground">
                    {sale.clients?.name || "Cliente General"}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 pl-6">
                  <CreditCard className="h-3 w-3" />
                  <span className="capitalize">{sale.payment_method}</span>
                  <span className="text-border mx-1">|</span>
                  <span>{new Date(sale.sale_date).toLocaleDateString("es-CO", { day: 'numeric', month: 'short' })}</span>
                </div>
              </div>
              <span className="text-sm font-bold text-chart-2 group-hover:scale-105 transition-transform">
                {Number(sale.total).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}