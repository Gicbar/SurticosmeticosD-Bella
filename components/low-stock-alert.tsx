import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Package, CheckCircle } from "lucide-react"

// ── Tipos ─────────────────────────────────────────────────────────────────────

type LowStockProduct = {
  id: string
  name: string
  current_stock: number
  min_stock: number
}

// ── Componente ────────────────────────────────────────────────────────────────

export async function LowStockAlert({ companyId }: { companyId: string }) {
  const supabase = await createClient()

  // Intentar con RPC que acepta company_id.
  // Si el RPC no acepta parámetro, usamos query directa como fallback.
  let lowStockProducts: LowStockProduct[] | null = null

  const { data: rpcData, error: rpcError } = await supabase
    .rpc("get_low_stock_products", { p_company_id: companyId })

  if (rpcError) {
    // Fallback: query directa si el RPC no acepta p_company_id todavía
    // Calcula el stock sumando remaining_quantity de purchase_batches
    const { data: fallbackData } = await supabase
      .from("products")
      .select(`
        id,
        name,
        min_stock,
        purchase_batches(remaining_quantity)
      `)
      .eq("company_id", companyId)           // ← FILTRO MULTIEMPRESA
      .gt("min_stock", 0)

    if (fallbackData) {
      lowStockProducts = fallbackData
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          min_stock: p.min_stock,
          current_stock: (p.purchase_batches as any[]).reduce(
            (sum: number, b: any) => sum + (b.remaining_quantity || 0), 0
          ),
        }))
        .filter((p) => p.current_stock <= p.min_stock)
        .sort((a, b) => a.current_stock - b.current_stock)
    }
  } else {
    lowStockProducts = rpcData
  }

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
          <span className="ml-auto text-xs font-normal bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
            {lowStockProducts.length} productos
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="divide-y divide-border p-0">
        {lowStockProducts.map((product) => (
          <div
            key={product.id}
            className="flex items-center justify-between py-3 px-4 hover:bg-destructive/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <Package className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground leading-tight">
                  {product.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Stock actual:{" "}
                  <span className="font-semibold text-destructive">
                    {product.current_stock} uds
                  </span>
                  {" "}/ Mín: {product.min_stock}
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-destructive bg-destructive/10 px-2 py-1 rounded-md flex-shrink-0">
              Reabastecer
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
