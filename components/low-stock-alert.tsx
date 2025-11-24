import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Package, CheckCircle } from "lucide-react"

export async function LowStockAlert() {
  const supabase = await createClient()

  const { data: lowStockProducts } = await supabase.rpc("get_low_stock_products").limit(5)

  // Card base para ambos estados
  const baseCardClass = "card-dashboard border-2 transition-all duration-300"
  
  if (!lowStockProducts || lowStockProducts.length === 0) {
    return (
      <Card className={`${baseCardClass} border-success/20 bg-card/50`}>
        <CardHeader className="card-header-dashboard border-b border-success/10">
          <CardTitle className="card-title-dashboard flex items-center gap-2 text-success">
            <CheckCircle className="h-5 w-5 text-success" />
            Alertas de Stock Bajo
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 flex items-center justify-center">
          <div className="text-center">
            <Package className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              Todo en orden 🎉
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              No hay productos con stock bajo
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`${baseCardClass} border-destructive/30 bg-card/70`}>
      <CardHeader className="card-header-dashboard border-b border-destructive/20">
        <CardTitle className="card-title-dashboard flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Alertas de Stock Bajo
        </CardTitle>
      </CardHeader>

      <CardContent className="divide-y divide-border">
        {lowStockProducts.map((product) => (
          <div
            key={product.id}
            className="flex items-center justify-between py-3 hover:bg-destructive/5 transition-colors rounded-md px-2"
          >
            <div className="flex items-center gap-3">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm text-foreground">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  Stock: <span className="font-semibold text-destructive">{product.current_stock} unids</span> / Mín.: {product.min_stock}
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-destructive bg-destructive/10 px-2 py-1 rounded-md">
              Reabastecer
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}