import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Receipt, User, CreditCard, CheckCircle, ShoppingCart } from "lucide-react"

export async function RecentSales() {
  const supabase = await createClient()

  const { data: recentSales } = await supabase
    .from("sales")
    .select("*, clients(name)")
    .order("sale_date", { ascending: false })
    .limit(5)

  // Card base para ambos estados
  const baseCardClass = "card-dashboard border-2 transition-all duration-300"

  if (!recentSales || recentSales.length === 0) {
    return (
      <Card className={`${baseCardClass} border-success/20 bg-card/50 hover:border-success/30`}>
        <CardHeader className="card-header-dashboard border-b border-success/10">
          <CardTitle className="card-title-dashboard flex items-center gap-2 text-success">
            <CheckCircle className="h-5 w-5 icon-success" />
            Ventas Recientes
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 flex items-center justify-center">
          <div className="text-center max-w-xs">
            <ShoppingCart className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              No hay ventas registradas aún
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Las primeras ventas aparecerán aquí
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`${baseCardClass} border-chart-2/20 bg-card/70 hover:border-chart-2/40`}>
      <CardHeader className="card-header-dashboard border-b border-chart-2/15">
        <CardTitle className="card-title-dashboard flex items-center gap-2 text-chart-2">
          <Receipt className="h-5 w-5 icon-sales" />
          Ventas Recientes
        </CardTitle>
      </CardHeader>

      <CardContent className="divide-y divide-border">
        {recentSales.map((sale) => (
          <div
            key={sale.id}
            className="group flex items-center justify-between py-3 px-2 rounded-md
                       hover:bg-primary/5 hover:translate-x-1 transition-all duration-200"
          >
            <div className="flex flex-col group-hover:pl-2 transition-all">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground group-hover:text-chart-5 transition-colors" />
                <p className="font-medium text-sm text-foreground">
                  {sale.clients?.name || "Cliente General"}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 pl-6">
                <CreditCard className="h-3 w-3" />
                <span className="capitalize">{sale.payment_method}</span>
                <span className="text-muted-foreground/50">•</span>
                <span>{new Date(sale.sale_date).toLocaleDateString("es-CO")}</span>
              </div>
            </div>
            <span className="text-sm font-bold text-chart-3 transform group-hover:scale-110 transition-transform">
              {Number(sale.total).toLocaleString("es-CO", {
                style: "currency",
                currency: "COP",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}