import { requireAuth } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign, 
  Users, 
  LayoutDashboard, 
  CalendarDays,
  ArrowUpRight
} from "lucide-react"
import { LowStockAlert } from "@/components/low-stock-alert"
import { RecentSales } from "@/components/recent-sales"
import { cn } from "@/lib/utils"

// Definimos la interfaz de permisos
interface UserPermissions {
  ventas: boolean
  productos: boolean
  categorias: boolean
  inventario: boolean
  rentabilidad: boolean
  clientes: boolean
  proveedores: boolean
  gastos: boolean
  configuracion: boolean
  [key: string]: boolean
}

export default async function DashboardPage() {
  const user = await requireAuth()
  const supabase = await createClient()

  // 1. Obtener permisos del usuario primero
  const { data: permData } = await supabase
    .from("user_permissions")
    .select("permissions")
    .eq("user_id", user.id)
    .single()

  // Fallback seguro si no hay permisos definidos
  const perms: UserPermissions = permData?.permissions || {
    ventas: false, products: false, inventario: false, rentabilidad: false, clientes: false
  }

  // 2. Preparar promesas de datos (Solo se ejecutan si hay permiso)
  // Usamos promesas condicionales para no gastar recursos en datos que no se mostrarán
  
  const productsQuery = perms.productos 
    ? supabase.from("products").select("*", { count: "exact", head: true }) 
    : Promise.resolve({ count: 0 })

  const salesQuery = perms.ventas
    ? supabase.from("sales").select("*", { count: "exact", head: true }).gte("sale_date", new Date(new Date().setDate(new Date().getDate() - 30)).toISOString())
    : Promise.resolve({ count: 0 })

  // Ingresos (Requiere permiso de Rentabilidad o Ventas, prefiriendo Rentabilidad para ver montos)
  const revenueQuery = perms.rentabilidad
    ? supabase.from("sales").select("total").gte("sale_date", new Date(new Date().setDate(new Date().getDate() - 30)).toISOString())
    : Promise.resolve({ data: [] })

  // Ganancia (Estrictamente permiso de Rentabilidad)
  const profitQuery = perms.rentabilidad
    ? supabase.from("sales_profit").select("profit").gte("created_at", new Date(new Date().setDate(new Date().getDate() - 30)).toISOString())
    : Promise.resolve({ data: [] })

  const lowStockQuery = perms.inventario
    ? supabase.rpc("get_low_stock_products", {}, { count: "exact", head: true })
    : Promise.resolve({ count: 0 })

  const clientsQuery = perms.clientes
    ? supabase.from("clients").select("*", { count: "exact", head: true })
    : Promise.resolve({ count: 0 })

  // 3. Ejecutar consultas en paralelo
  const [
    { count: productsCount },
    { count: salesCount },
    { data: salesTotal },
    { data: profitData },
    { count: lowStockCount },
    { count: clientsCount }
  ] = await Promise.all([
    productsQuery,
    salesQuery,
    revenueQuery,
    profitQuery,
    lowStockQuery,
    clientsQuery
  ])

  // Calcular totales
  const totalRevenue = salesTotal?.reduce((sum: number, sale: any) => sum + Number(sale.total), 0) || 0
  const totalProfit = profitData?.reduce((sum: number, item: any) => sum + Number(item.profit), 0) || 0

  // Formateador de moneda
  const formatCurrency = (value: number) => 
    value.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })

  return (
    <div className="flex-1 flex flex-col space-y-6">
      
      {/* Header del Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            Panel de Control
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bienvenido de nuevo, aquí tienes el resumen de <span className="font-semibold text-primary">D'Bella</span>.
          </p>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/50 dark:bg-white/5 border border-white/20 shadow-sm backdrop-blur-md">
          <CalendarDays className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Hoy:</span>
          <span className="text-sm font-semibold text-foreground">
            {new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>
      </div>

      {/* Grid de Estadísticas */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        
        {/* 1. Productos */}
        {perms.productos && (
          <StatCard 
            title="Productos Activos"
            value={productsCount || 0}
            subtitle="Referencias en catálogo"
            icon={Package}
            trend="catálogo"
            colorClass="text-blue-500"
            bgClass="bg-blue-500/10"
          />
        )}

        {/* 2. Ventas */}
        {perms.ventas && (
          <StatCard 
            title="Ventas del Mes"
            value={salesCount || 0}
            subtitle="Transacciones completadas"
            icon={ShoppingCart}
            trend="+4.5%" // Esto podría calcularse real
            colorClass="text-primary"
            bgClass="bg-primary/10"
          />
        )}

        {/* 3. Ingresos (Rentabilidad) */}
        {perms.rentabilidad && (
          <StatCard 
            title="Ingresos Totales"
            value={formatCurrency(totalRevenue)}
            subtitle="Facturación (30 días)"
            icon={DollarSign}
            colorClass="text-emerald-500"
            bgClass="bg-emerald-500/10"
          />
        )}

        {/* 4. Ganancia (Rentabilidad) */}
        {perms.rentabilidad && (
          <StatCard 
            title="Ganancia Neta"
            value={formatCurrency(totalProfit)}
            subtitle="Utilidad real"
            icon={TrendingUp}
            trend="Neto"
            colorClass="text-indigo-500"
            bgClass="bg-indigo-500/10"
          />
        )}

        {/* 5. Stock Bajo (Inventario) */}
        {perms.inventario && (
          <StatCard 
            title="Alertas de Stock"
            value={lowStockCount || 0}
            subtitle="Productos por agotarse"
            icon={AlertTriangle}
            colorClass="text-rose-500"
            bgClass="bg-rose-500/10"
            alert={Number(lowStockCount) > 0}
          />
        )}

        {/* 6. Clientes */}
        {perms.clientes && (
          <StatCard 
            title="Clientes Totales"
            value={clientsCount || 0}
            subtitle="Base de datos activa"
            icon={Users}
            colorClass="text-orange-500"
            bgClass="bg-orange-500/10"
          />
        )}
      </div>

      {/* Grilla Inferior - Tablas y Alertas */}
      <div className="grid gap-6 md:grid-cols-7 mt-4">
        
        {/* Alertas de Stock - Ocupa 3 columnas */}
        {perms.inventario && (
          <div className="md:col-span-3 flex flex-col">
            <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm flex-1 overflow-hidden">
               <LowStockAlert />
            </div>
          </div>
        )}

        {/* Ventas Recientes - Ocupa 4 columnas (o 7 si no hay inventario) */}
        {perms.ventas && (
          <div className={cn(
            "flex flex-col",
            perms.inventario ? "md:col-span-4" : "md:col-span-7"
          )}>
            <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm flex-1 overflow-hidden">
              <RecentSales />
            </div>
          </div>
        )}
      </div>
      
      {/* Mensaje si no hay permisos para nada */}
      {!Object.values(perms).some(Boolean) && (
        <div className="flex flex-col items-center justify-center h-64 text-center p-8 rounded-2xl border border-dashed border-border/50 bg-secondary/20">
          <div className="bg-secondary/50 p-4 rounded-full mb-4">
             <LayoutDashboard className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Vista Limitada</h3>
          <p className="text-muted-foreground max-w-sm mt-2">
            Tu cuenta no tiene permisos habilitados para ver las estadísticas del dashboard. Contacta al administrador.
          </p>
        </div>
      )}

    </div>
  )
}

// --- COMPONENTE DE TARJETA REUTILIZABLE CON ESTILO PREMIUM ---

interface StatCardProps {
  title: string
  value: string | number
  subtitle: string
  icon: any
  trend?: string
  colorClass: string
  bgClass: string
  alert?: boolean
}

function StatCard({ title, value, subtitle, icon: Icon, trend, colorClass, bgClass, alert }: StatCardProps) {
  return (
    <Card className={cn(
      "relative overflow-hidden border border-white/10 dark:border-white/5 bg-white/60 dark:bg-card/30 backdrop-blur-xl shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 group",
      alert && "border-rose-500/30 bg-rose-50/50 dark:bg-rose-900/10"
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground tracking-wide">
          {title}
        </CardTitle>
        <div className={cn("p-2 rounded-xl transition-transform group-hover:scale-110", bgClass)}>
          <Icon className={cn("h-4 w-4", colorClass)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <div className={cn(
              "text-2xl font-bold tracking-tight",
              colorClass === "text-primary" ? "text-foreground" : "" // Mantener números legibles
            )}>
              {value}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              {subtitle}
            </p>
          </div>
          
          {trend && (
            <div className="flex items-center text-[10px] font-bold px-2 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 mb-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              {trend}
            </div>
          )}
        </div>
        
        {/* Efecto de brillo sutil en el fondo */}
        <div className={cn(
          "absolute -right-6 -bottom-6 h-24 w-24 rounded-full opacity-10 blur-2xl pointer-events-none transition-opacity group-hover:opacity-20",
          bgClass.replace("/10", "") // Usamos el color base para el blur
        )} />
      </CardContent>
    </Card>
  )
}