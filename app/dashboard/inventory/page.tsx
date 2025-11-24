import { requireAuth,getUserPermissions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Plus, TrendingUp, Package, Box, DollarSign, Layers } from "lucide-react"
import { InventoryTable } from "@/components/inventory-table"
import { PurchaseBatchDialog } from "@/components/purchase-batch-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { redirect } from "next/navigation" 

function formatCurrency(amount: number): string {
  return amount.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}


function StatCard({ 
  title, 
  value, 
  icon, 
  variant = "default",
  subtitle = null
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  variant?: "default" | "primary" | "accent"
  subtitle?: string | null
}) {
  const variants = {
    default: "icon-inventory",
    primary: "text-primary",
    accent: "text-chart-4",
  }
  
  return (
    <Card className="card-dashboard group">
      <CardHeader className="card-header-dashboard flex flex-row items-center justify-between pb-2">
        <CardTitle className="card-title-dashboard text-xs uppercase tracking-wide">
          {title}
        </CardTitle>
        <div className={`${variants[variant]} group-hover:scale-110 transition-transform duration-200`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="card-value-dashboard text-xl md:text-2xl font-bold">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}

// ✅ PÁGINA PRINCIPAL - STATS SOLO STOCK > 0, TABLA TODOS LOS LOTES
export default async function InventoryPage() {
  // ✅ VALIDAR PERMISOS AL INICIO
  const permissions = await getUserPermissions()
    // Verificar si existe el permiso rentabilidad y es true
  if (!permissions?.permissions?.inventario) {
    redirect("/dashboard") // Redirige si no tiene permiso
  }

  const user = await requireAuth()
  const supabase = await createClient()

  // 🔥 OBTENER TODOS LOS LOTES (para la tabla)
  const { data: allBatches } = await supabase
    .from("purchase_batches")
    .select("*, products(name, barcode, min_stock), suppliers(name)")
    .order("purchase_date", { ascending: false })

  // 🔥 FILTRAR PARA ESTADÍSTICAS: Solo lotes con stock > 0
  const activeBatches = allBatches?.filter(batch => batch.remaining_quantity > 0) || []

  // 🔥 ESTADÍSTICAS BASADAS SOLO EN LOTES ACTIVOS
  const totalLotes = activeBatches.length
  const uniqueProducts = new Set(activeBatches.map(b => b.products?.name)).size
  const totalValue = activeBatches.reduce((sum, b) => sum + (b.remaining_quantity * b.purchase_price), 0)
  const totalStock = activeBatches.reduce((sum, b) => sum + b.remaining_quantity, 0)

  return (
    <div className="flex-1 flex flex-col bg-card/70 backdrop-blur-md p-4 md:p-6 rounded-2xl shadow-inner border border-border/20">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 group">
            <TrendingUp className="h-6 w-6 icon-inventory group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h1 className="dashboard-title">Inventario</h1>
            <p className="dashboard-subtitle mt-1">
              {totalLotes} lotes activos con stock disponible
            </p>
          </div>
        </div>
        <PurchaseBatchDialog>
          <Button className="group w-full md:w-auto bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary transition-all duration-300 shadow-md">
            <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
            Nueva Compra
          </Button>
        </PurchaseBatchDialog>
      </div>

      {/* Stats Cards - SOLO LOTES CON STOCK */}
      <div className="grid gap-4 md:gap-5 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard 
          title="Lotes Activos" 
          value={totalLotes} 
          icon={<Package />} 
          variant="primary"
          subtitle="Con stock disponible"
        />
        <StatCard 
          title="Productos Únicos" 
          value={uniqueProducts} 
          icon={<Box />} 
        />
        <StatCard 
          title="Valor del Inventario" 
          value={formatCurrency(totalValue)} 
          icon={<DollarSign />} 
          subtitle="En stock actual"
        />
        <StatCard 
          title="Total Stock" 
          value={totalStock} 
          icon={<Layers />} 
          variant="accent"
        />
      </div>

      {/* Tabla Container - MUESTRA TODOS LOS LOTES */}
      <div className="card-dashboard p-0 overflow-hidden">
        {/* 🔥 PASAMOS TODOS LOS LOTES, NO SOLO LOS ACTIVOS */}
        <InventoryTable batches={allBatches || []} />
      </div>
    </div>
  )
}