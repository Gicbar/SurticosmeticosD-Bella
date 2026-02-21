"use client"

import { useState, useMemo } from "react"
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts"
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package,
  AlertTriangle, Calendar, BarChart2, PieChart as PieIcon,
  Clock, Zap, ArrowUpRight, ArrowDownRight, Filter, Download,
  ChevronRight, Tag, RotateCcw
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Sale { id: string; total: number; payment_method: string; sale_date: string; client_id: string | null; clients: { name: string } | null }
interface SaleItem { id: string; sale_id: string; product_id: string; quantity: number; unit_price: number; subtotal: number; products: { name: string; category_id: string | null; categories: { name: string } | null } | null }
interface Profit { sale_id: string; total_cost: number; total_sale: number; profit: number; profit_margin: number; created_at: string }
interface Expense { id: string; description: string; amount: number; date: string; categories_expense: { name: string } | null }
interface Product { id: string; name: string; sale_price: number; min_stock: number; category_id: string | null; categories: { name: string } | null }
interface Batch { id: string; product_id: string; quantity: number; purchase_price: number; purchase_date: string; remaining_quantity: number; products: { name: string } | null }

interface Props {
  sales: Sale[]
  saleItems: SaleItem[]
  profits: Profit[]
  expenses: Expense[]
  products: Product[]
  batches: Batch[]
  companyId: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COP = (n: number) => n.toLocaleString("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 })
const PCT = (n: number) => `${n.toFixed(1)}%`
const SHORT = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : `${n}`

const PERIOD_OPTIONS = [
  { label: "7 días",   days: 7 },
  { label: "30 días",  days: 30 },
  { label: "90 días",  days: 90 },
  { label: "6 meses",  days: 180 },
  { label: "1 año",    days: 365 },
]

// Colores usando CSS variables del tema
const CHART_COLORS = [
  "var(--primary)",
  "var(--accent)",
  "oklch(0.65 0.12 180)",
  "oklch(0.70 0.15 60)",
  "oklch(0.60 0.10 280)",
  "oklch(0.70 0.15 10)",
]

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function KpiCard({ title, value, sub, trend, icon: Icon, good = true }: {
  title: string; value: string; sub?: string; trend?: number; icon: any; good?: boolean
}) {
  const hasTrend = trend !== undefined
  const isUp = trend && trend >= 0
  return (
    <Card className="card relative overflow-hidden group hover:shadow-md transition-all duration-300">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: "linear-gradient(135deg, color-mix(in oklch, var(--primary) 4%, transparent), transparent)" }} />
      <CardContent className="p-5 relative z-10">
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs uppercase tracking-widest font-bold text-muted-foreground">{title}</span>
          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "color-mix(in oklch, var(--primary) 12%, transparent)" }}>
            <Icon className="h-4 w-4" style={{ color: "var(--primary)" }} />
          </div>
        </div>
        <div className="text-2xl font-black tracking-tight mb-1" style={{
          background: "linear-gradient(90deg, var(--foreground), var(--primary))",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text"
        }}>{value}</div>
        {(sub || hasTrend) && (
          <div className="flex items-center gap-2 mt-2">
            {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
            {hasTrend && (
              <span className={`flex items-center gap-0.5 text-xs font-semibold ${isUp ? (good ? "text-emerald-500" : "text-red-500") : (good ? "text-red-500" : "text-emerald-500")}`}>
                {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(trend!).toFixed(1)}%
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-9 w-9 rounded-xl flex items-center justify-center shadow-sm" style={{ background: "color-mix(in oklch, var(--primary) 15%, transparent)" }}>
        <Icon className="h-5 w-5" style={{ color: "var(--primary)" }} />
      </div>
      <div>
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card/95 backdrop-blur-md border border-border/50 rounded-xl p-3 shadow-xl text-xs">
      {label && <p className="font-bold text-foreground mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {typeof p.value === "number" && p.value > 1000 ? COP(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function ReportsDashboard({ sales, saleItems, profits, expenses, products, batches }: Props) {
  const [periodDays, setPeriodDays] = useState(30)
  const [activeTab, setActiveTab] = useState<"ventas" | "rentabilidad" | "inventario" | "decisiones">("ventas")

  // ── Filtrar por período ───────────────────────────────────────────────────
  const cutoff = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - periodDays)
    return d
  }, [periodDays])

  const prevCutoff = useMemo(() => {
    const d = new Date(cutoff)
    d.setDate(d.getDate() - periodDays)
    return d
  }, [cutoff, periodDays])

  const filteredSales = useMemo(() => sales.filter(s => new Date(s.sale_date) >= cutoff), [sales, cutoff])
  const prevSales     = useMemo(() => sales.filter(s => new Date(s.sale_date) >= prevCutoff && new Date(s.sale_date) < cutoff), [sales, cutoff, prevCutoff])
  const filteredItems = useMemo(() => {
    const ids = new Set(filteredSales.map(s => s.id))
    return saleItems.filter(i => ids.has(i.sale_id))
  }, [filteredSales, saleItems])
  const filteredProfits = useMemo(() => {
    const ids = new Set(filteredSales.map(s => s.id))
    return profits.filter(p => ids.has(p.sale_id))
  }, [filteredSales, profits])
  const filteredExpenses = useMemo(() => expenses.filter(e => new Date(e.date) >= cutoff), [expenses, cutoff])

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalRevenue  = filteredSales.reduce((s, v) => s + Number(v.total), 0)
  const prevRevenue   = prevSales.reduce((s, v) => s + Number(v.total), 0)
  const revTrend      = prevRevenue ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0
  const totalProfit   = filteredProfits.reduce((s, p) => s + Number(p.profit), 0)
  const prevIds       = new Set(prevSales.map(s => s.id))
  const prevProfit    = profits.filter(p => prevIds.has(p.sale_id)).reduce((s, p) => s + Number(p.profit), 0)
  const profitTrend   = prevProfit ? ((totalProfit - prevProfit) / prevProfit) * 100 : 0
  const avgMargin     = filteredProfits.length ? filteredProfits.reduce((s, p) => s + Number(p.profit_margin), 0) / filteredProfits.length : 0
  const totalExpenses = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0)
  const totalQty      = filteredItems.reduce((s, i) => s + i.quantity, 0)
  const ticketAvg     = filteredSales.length ? totalRevenue / filteredSales.length : 0

  // ── Ventas por día ────────────────────────────────────────────────────────
  const salesByDay = useMemo(() => {
    const map: Record<string, { revenue: number; profit: number; qty: number }> = {}
    filteredSales.forEach(s => {
      const d = s.sale_date.slice(0, 10)
      if (!map[d]) map[d] = { revenue: 0, profit: 0, qty: 0 }
      map[d].revenue += Number(s.total)
      map[d].qty += 1
    })
    filteredProfits.forEach(p => {
      const sale = filteredSales.find(s => s.id === p.sale_id)
      if (!sale) return
      const d = sale.sale_date.slice(0, 10)
      if (map[d]) map[d].profit += Number(p.profit)
    })
    return Object.entries(map).sort().map(([date, v]) => ({
      date: new Date(date).toLocaleDateString("es-CO", { month: "short", day: "numeric" }),
      "Ingresos": v.revenue,
      "Ganancia": v.profit,
      "# Ventas": v.qty,
    }))
  }, [filteredSales, filteredProfits])

  // ── Top productos ─────────────────────────────────────────────────────────
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number }> = {}
    filteredItems.forEach(i => {
      const name = i.products?.name || "Sin nombre"
      if (!map[name]) map[name] = { name, qty: 0, revenue: 0 }
      map[name].qty += i.quantity
      map[name].revenue += Number(i.subtotal)
    })
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 8)
  }, [filteredItems])

  // ── Ventas por método de pago ─────────────────────────────────────────────
  const byPayment = useMemo(() => {
    const map: Record<string, number> = {}
    filteredSales.forEach(s => { map[s.payment_method] = (map[s.payment_method] || 0) + Number(s.total) })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [filteredSales])

  // ── Gastos por categoría ──────────────────────────────────────────────────
  const expensesByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    filteredExpenses.forEach(e => {
      const cat = e.categories_expense?.name || "Sin categoría"
      map[cat] = (map[cat] || 0) + Number(e.amount)
    })
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [filteredExpenses])

  // ── Margen por producto ───────────────────────────────────────────────────
  const marginByProduct = useMemo(() => {
    const map: Record<string, { name: string; revenue: number; cost: number }> = {}
    filteredItems.forEach(i => {
      const name = i.products?.name || "Desconocido"
      if (!map[name]) map[name] = { name, revenue: 0, cost: 0 }
      map[name].revenue += Number(i.subtotal)
    })
    filteredProfits.forEach(p => {
      const sale = filteredSales.find(s => s.id === p.sale_id)
      if (!sale) return
      // Distribuir costo proporcional (simplificado)
    })
    return Object.values(map).filter(v => v.revenue > 0).map(v => ({
      ...v,
      margin: v.revenue > 0 ? ((v.revenue - v.cost) / v.revenue) * 100 : 0
    })).sort((a, b) => b.revenue - a.revenue).slice(0, 6)
  }, [filteredItems, filteredProfits, filteredSales])

  // ── INVENTARIO: Lotes más antiguos (rotación) ─────────────────────────────
  const staleInventory = useMemo(() => {
    const today = new Date()
    return batches
      .filter(b => b.remaining_quantity > 0)
      .map(b => {
        const purchaseDate = new Date(b.purchase_date)
        const daysSincePurchase = Math.floor((today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24))
        const immobilizedValue = b.remaining_quantity * Number(b.purchase_price)
        const product = products.find(p => p.id === b.product_id)
        return {
          name: b.products?.name || "Desconocido",
          days: daysSincePurchase,
          remaining: b.remaining_quantity,
          value: immobilizedValue,
          salePrice: product?.sale_price || 0,
          potential: b.remaining_quantity * (product?.sale_price || 0),
          purchaseDate: purchaseDate.toLocaleDateString("es-CO"),
          urgency: daysSincePurchase > 90 ? "alta" : daysSincePurchase > 45 ? "media" : "baja",
        }
      })
      .sort((a, b) => b.days - a.days)
  }, [batches, products])

  // ── INVENTARIO: Productos sin movimiento en el período ────────────────────
  const soldIds = useMemo(() => new Set(filteredItems.map(i => i.product_id)), [filteredItems])
  const noMovement = useMemo(() => {
    return products.filter(p => {
      const hasStock = batches.some(b => b.product_id === p.id && b.remaining_quantity > 0)
      return hasStock && !soldIds.has(p.id)
    }).map(p => {
      const stock = batches.filter(b => b.product_id === p.id).reduce((s, b) => s + b.remaining_quantity, 0)
      const value = stock * Number(p.sale_price)
      return { ...p, stock, value }
    }).sort((a, b) => b.value - a.value).slice(0, 10)
  }, [products, batches, soldIds])

  // ── Resumen de flujo de caja ──────────────────────────────────────────────
  const cashflow = useMemo(() => {
    const netProfit = totalProfit - totalExpenses
    const roi = totalExpenses > 0 ? (netProfit / totalExpenses) * 100 : 0
    return { netProfit, roi }
  }, [totalProfit, totalExpenses])

  // ─── TABS ─────────────────────────────────────────────────────────────────

  const tabs = [
    { key: "ventas",       label: "Ventas",        icon: BarChart2 },
    { key: "rentabilidad", label: "Rentabilidad",   icon: TrendingUp },
    { key: "inventario",   label: "Inventario",     icon: Package },
    { key: "decisiones",   label: "Decisiones",     icon: Zap },
  ] as const

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="dashboard-page-container space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="dashboard-toolbar">
        <div className="dashboard-header">
          <h1 className="dashboard-title">
            <BarChart2 className="dashboard-title-icon" />
            Centro de Reportes
          </h1>
          <p className="dashboard-subtitle">
            Análisis gerencial · {filteredSales.length} ventas en los últimos {periodDays} días
          </p>
        </div>

        {/* Selector de período */}
        <div className="flex items-center gap-2 flex-wrap">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.days}
              onClick={() => setPeriodDays(opt.days)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                periodDays === opt.days
                  ? "text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground border border-border hover:border-primary/40"
              }`}
              style={periodDays === opt.days ? {
                background: "linear-gradient(135deg, var(--primary), color-mix(in oklch, var(--primary) 70%, black))"
              } : {}}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPIs principales ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard title="Ingresos"      value={`$${SHORT(totalRevenue)}`}  sub={COP(totalRevenue)}  trend={revTrend}    icon={DollarSign}    />
        <KpiCard title="Ganancia neta" value={`$${SHORT(totalProfit)}`}   sub={COP(totalProfit)}   trend={profitTrend} icon={TrendingUp}    />
        <KpiCard title="Margen prom."  value={PCT(avgMargin)}             sub="sobre ingresos"                         icon={PieIcon}       />
        <KpiCard title="# Ventas"      value={`${filteredSales.length}`}  sub={`${totalQty} unds`}                     icon={ShoppingCart}  />
        <KpiCard title="Ticket prom."  value={`$${SHORT(ticketAvg)}`}     sub={COP(ticketAvg)}                         icon={Tag}           />
        <KpiCard title="Gastos"        value={`$${SHORT(totalExpenses)}`} sub={COP(totalExpenses)}                     icon={TrendingDown} good={false} />
      </div>

      {/* ── Tabs de navegación ───────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted/50 border border-border/50 w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === t.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TAB: VENTAS                                                         */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "ventas" && (
        <div className="space-y-5 animate-fadeIn">

          {/* Ventas por día — área */}
          <Card className="card">
            <CardHeader className="card-header">
              <SectionTitle icon={BarChart2} title="Ingresos y Ganancia por día" subtitle="Evolución temporal del período seleccionado" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {salesByDay.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                  Sin datos en este período
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={salesByDay} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={v => `$${SHORT(v)}`} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area type="monotone" dataKey="Ingresos" stroke="var(--primary)" fill="url(#gradRevenue)" strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="Ganancia" stroke="var(--accent)" fill="url(#gradProfit)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Top productos por ingreso */}
            <Card className="card">
              <CardHeader className="card-header">
                <SectionTitle icon={TrendingUp} title="Top productos" subtitle="Por ingresos generados" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={topProducts} layout="vertical" margin={{ left: 0, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} horizontal={false} />
                    <XAxis type="number" tickFormatter={v => `$${SHORT(v)}`} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="revenue" name="Ingresos" radius={[0, 4, 4, 0]}>
                      {topProducts.map((_, i) => (
                        <Cell key={i} fill={`color-mix(in oklch, var(--primary) ${100 - i * 10}%, var(--secondary))`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Método de pago */}
            <Card className="card">
              <CardHeader className="card-header">
                <SectionTitle icon={PieIcon} title="Métodos de pago" subtitle="Distribución de ingresos" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {byPayment.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Sin datos</div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={byPayment} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3} dataKey="value" nameKey="name">
                        {byPayment.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => COP(v)} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TAB: RENTABILIDAD                                                   */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "rentabilidad" && (
        <div className="space-y-5 animate-fadeIn">

          {/* Flujo de caja neto */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="card col-span-1 p-5">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 font-bold">Flujo neto</p>
              <p className={`text-3xl font-black mb-1 ${cashflow.netProfit >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {COP(cashflow.netProfit)}
              </p>
              <p className="text-xs text-muted-foreground">Ganancia − Gastos operativos</p>
              <div className="mt-3 pt-3 border-t border-border/40">
                <p className="text-xs text-muted-foreground">ROI operativo</p>
                <p className="text-xl font-bold" style={{ color: "var(--primary)" }}>{PCT(cashflow.roi)}</p>
              </div>
            </Card>

            <Card className="card col-span-2 p-5">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-bold">Ingresos vs Costos</p>
              <div className="space-y-3">
                {[
                  { label: "Ingresos brutos",  value: totalRevenue,   color: "var(--primary)",     pct: 100 },
                  { label: "Costo de ventas",   value: totalRevenue - totalProfit, color: "oklch(0.60 0.20 20)", pct: totalRevenue ? ((totalRevenue - totalProfit) / totalRevenue) * 100 : 0 },
                  { label: "Ganancia bruta",    value: totalProfit,    color: "oklch(0.65 0.12 150)", pct: totalRevenue ? (totalProfit / totalRevenue) * 100 : 0 },
                  { label: "Gastos operativos", value: totalExpenses,  color: "oklch(0.60 0.15 60)", pct: totalRevenue ? (totalExpenses / totalRevenue) * 100 : 0 },
                ].map(r => (
                  <div key={r.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground font-medium">{r.label}</span>
                      <span className="font-bold text-foreground">{COP(r.value)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(r.pct, 100)}%`, background: r.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Evolución de margen */}
          <Card className="card">
            <CardHeader className="card-header">
              <SectionTitle icon={TrendingUp} title="Evolución del margen de ganancia" subtitle="% de ganancia sobre cada venta en el tiempo" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {filteredProfits.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Sin datos de rentabilidad</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart
                    data={filteredProfits
                      .map(p => ({ date: p.created_at.slice(0, 10), margin: Number(p.profit_margin) }))
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map(p => ({ ...p, date: new Date(p.date).toLocaleDateString("es-CO", { month: "short", day: "numeric" }) }))
                    }
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={v => `${v.toFixed(0)}%`} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="margin" name="Margen %" stroke="var(--primary)" fill="url(#gradRevenue)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Gastos por categoría */}
          <div className="grid md:grid-cols-2 gap-5">
            <Card className="card">
              <CardHeader className="card-header">
                <SectionTitle icon={PieIcon} title="Gastos por categoría" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {expensesByCategory.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Sin gastos registrados</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={expensesByCategory} cx="50%" cy="50%" outerRadius={85} dataKey="value" nameKey="name" paddingAngle={3}>
                        {expensesByCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => COP(v)} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="card">
              <CardHeader className="card-header">
                <SectionTitle icon={DollarSign} title="Detalle de gastos" />
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/40 max-h-[240px] overflow-y-auto">
                  {expensesByCategory.map((cat, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="text-sm font-medium">{cat.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold">{COP(cat.value)}</span>
                        <p className="text-xs text-muted-foreground">{totalExpenses ? PCT((cat.value / totalExpenses) * 100) : "0%"}</p>
                      </div>
                    </div>
                  ))}
                  {expensesByCategory.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-8">Sin gastos en este período</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TAB: INVENTARIO                                                     */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "inventario" && (
        <div className="space-y-5 animate-fadeIn">

          {/* Alertas de rotación */}
          <div className="grid md:grid-cols-3 gap-4">
            <KpiCard title="Lotes críticos (+90 días)" value={`${staleInventory.filter(b => b.urgency === "alta").length}`} sub="requieren acción inmediata" icon={AlertTriangle} good={false} />
            <KpiCard title="Capital inmovilizado"       value={`$${SHORT(staleInventory.reduce((s, b) => s + b.value, 0))}`} sub="en inventario sin rotar" icon={DollarSign} good={false} />
            <KpiCard title="Potencial de venta"         value={`$${SHORT(staleInventory.reduce((s, b) => s + b.potential, 0))}`} sub="si se vende al precio lista" icon={TrendingUp} />
          </div>

          {/* Tabla de inventario antiguo */}
          <Card className="card">
            <CardHeader className="card-header">
              <SectionTitle icon={Clock} title="Inventario por antigüedad" subtitle="Lotes activos ordenados por días desde su compra — los más viejos primero" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30">
                      {["Producto", "Fecha compra", "Días stock", "Unidades", "Valor costo", "Valor venta", "Urgencia"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {staleInventory.slice(0, 20).map((b, i) => (
                      <tr key={i} className={`hover:bg-muted/20 transition-colors ${b.urgency === "alta" ? "bg-red-50/30 dark:bg-red-900/10" : ""}`}>
                        <td className="px-4 py-3 font-medium text-foreground">{b.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{b.purchaseDate}</td>
                        <td className="px-4 py-3">
                          <span className="font-bold" style={{ color: b.urgency === "alta" ? "oklch(0.60 0.20 20)" : b.urgency === "media" ? "oklch(0.65 0.15 60)" : "var(--primary)" }}>
                            {b.days} días
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{b.remaining} uds</td>
                        <td className="px-4 py-3 text-muted-foreground">{COP(b.value)}</td>
                        <td className="px-4 py-3 font-semibold" style={{ color: "var(--primary)" }}>{COP(b.potential)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={b.urgency === "alta" ? "destructive" : "outline"} className="text-[10px]">
                            {b.urgency === "alta" ? "🔴 Crítico" : b.urgency === "media" ? "🟡 Medio" : "🟢 Normal"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {staleInventory.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No hay lotes activos</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Productos sin movimiento */}
          <Card className="card">
            <CardHeader className="card-header">
              <SectionTitle icon={RotateCcw} title={`Productos sin venta en ${periodDays} días`} subtitle="Con stock disponible pero sin rotación en el período" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {noMovement.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                  <TrendingUp className="h-8 w-8 opacity-30" style={{ color: "var(--primary)" }} />
                  <p>¡Todos los productos con stock tuvieron movimiento!</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {noMovement.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.categories?.name || "Sin categoría"} · {p.stock} uds</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: "var(--primary)" }}>{COP(p.value)}</p>
                        <p className="text-xs text-muted-foreground">en stock</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TAB: DECISIONES                                                     */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "decisiones" && (
        <div className="space-y-5 animate-fadeIn">

          {/* Oportunidades automáticas */}
          <Card className="card">
            <CardHeader className="card-header">
              <SectionTitle icon={Zap} title="Recomendaciones para el negocio" subtitle="Generadas automáticamente con los datos del período" />
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">

              {/* Productos para promoción */}
              {staleInventory.filter(b => b.urgency === "alta").length > 0 && (
                <div className="p-4 rounded-xl border-l-4 bg-red-50/50 dark:bg-red-900/10" style={{ borderLeftColor: "oklch(0.60 0.20 20)" }}>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: "oklch(0.60 0.20 20)" }} />
                    <div>
                      <p className="font-bold text-sm text-foreground mb-1">🔥 Activar promociones urgentes</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        {staleInventory.filter(b => b.urgency === "alta").length} productos llevan más de 90 días en inventario.
                        Capital inmovilizado: <strong>{COP(staleInventory.filter(b => b.urgency === "alta").reduce((s, b) => s + b.value, 0))}</strong>
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {staleInventory.filter(b => b.urgency === "alta").slice(0, 5).map((b, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                            {b.name} ({b.remaining} uds)
                          </span>
                        ))}
                      </div>
                      <p className="text-xs font-semibold mt-2" style={{ color: "oklch(0.60 0.20 20)" }}>
                        → Sugerencia: descuento del 15-25% para liquidar antes de que pierdan valor
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Potenciar top productos */}
              {topProducts.length > 0 && (
                <div className="p-4 rounded-xl border-l-4 bg-emerald-50/50 dark:bg-emerald-900/10" style={{ borderLeftColor: "oklch(0.65 0.12 150)" }}>
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: "oklch(0.65 0.12 150)" }} />
                    <div>
                      <p className="font-bold text-sm text-foreground mb-1">📈 Potenciar los más vendidos</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        Estos productos generaron el mayor ingreso en el período. Verifica que tengan stock suficiente.
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {topProducts.slice(0, 3).map((p, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                            {p.name}: {COP(p.revenue)}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs font-semibold mt-2" style={{ color: "oklch(0.65 0.12 150)" }}>
                        → Sugerencia: mantener inventario de al menos 30 días de estos productos
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Margen bajo */}
              {avgMargin < 20 && filteredProfits.length > 0 && (
                <div className="p-4 rounded-xl border-l-4 bg-amber-50/50 dark:bg-amber-900/10" style={{ borderLeftColor: "oklch(0.65 0.15 60)" }}>
                  <div className="flex items-start gap-3">
                    <TrendingDown className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: "oklch(0.65 0.15 60)" }} />
                    <div>
                      <p className="font-bold text-sm text-foreground mb-1">⚠️ Margen por debajo del 20%</p>
                      <p className="text-xs text-muted-foreground">
                        El margen promedio de <strong>{PCT(avgMargin)}</strong> está por debajo del mínimo saludable.
                      </p>
                      <p className="text-xs font-semibold mt-2" style={{ color: "oklch(0.65 0.15 60)" }}>
                        → Revisar precios de venta o negociar mejores precios con proveedores
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Sin movimiento */}
              {noMovement.length > 0 && (
                <div className="p-4 rounded-xl border-l-4" style={{ borderLeft: "4px solid var(--primary)", background: "color-mix(in oklch, var(--primary) 5%, transparent)" }}>
                  <div className="flex items-start gap-3">
                    <RotateCcw className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: "var(--primary)" }} />
                    <div>
                      <p className="font-bold text-sm text-foreground mb-1">🔄 Productos sin rotación en {periodDays} días</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        {noMovement.length} productos tienen stock pero no registraron ventas. Capital dormido: <strong>{COP(noMovement.reduce((s, p) => s + p.value, 0))}</strong>
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {noMovement.slice(0, 4).map((p, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md text-xs font-medium" style={{ background: "color-mix(in oklch, var(--primary) 12%, transparent)", color: "var(--primary)" }}>
                            {p.name}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs font-semibold mt-2" style={{ color: "var(--primary)" }}>
                        → Sugerencia: incluirlos en combos, destacarlos en catálogo o hacer oferta puntual
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Flujo negativo */}
              {cashflow.netProfit < 0 && (
                <div className="p-4 rounded-xl border-l-4 bg-red-50/50 dark:bg-red-900/10" style={{ borderLeftColor: "oklch(0.60 0.20 20)" }}>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: "oklch(0.60 0.20 20)" }} />
                    <div>
                      <p className="font-bold text-sm text-foreground mb-1">🚨 Flujo de caja negativo</p>
                      <p className="text-xs text-muted-foreground">
                        Los gastos operativos superaron la ganancia bruta en <strong>{COP(Math.abs(cashflow.netProfit))}</strong>.
                      </p>
                      <p className="text-xs font-semibold mt-2" style={{ color: "oklch(0.60 0.20 20)" }}>
                        → Revisar estructura de gastos y aumentar volumen de ventas
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mensaje positivo si todo está bien */}
              {staleInventory.filter(b => b.urgency === "alta").length === 0 &&
               avgMargin >= 20 &&
               noMovement.length === 0 &&
               cashflow.netProfit >= 0 && (
                <div className="p-4 rounded-xl border" style={{ background: "color-mix(in oklch, var(--primary) 5%, transparent)", borderColor: "color-mix(in oklch, var(--primary) 20%, transparent)" }}>
                  <p className="font-bold text-sm text-foreground mb-1">✅ El negocio está en buen estado</p>
                  <p className="text-xs text-muted-foreground">
                    Margen saludable, inventario con rotación y flujo positivo. Continúa monitoreando periódicamente.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabla resumen ejecutivo */}
          <Card className="card">
            <CardHeader className="card-header">
              <SectionTitle icon={ChevronRight} title="Resumen ejecutivo del período" subtitle={`Últimos ${periodDays} días`} />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                {[
                  { label: "Ventas totales",            value: COP(totalRevenue),       note: `${filteredSales.length} transacciones` },
                  { label: "Costo de mercancía vendida", value: COP(totalRevenue - totalProfit), note: `${PCT(totalRevenue ? ((totalRevenue - totalProfit)/totalRevenue)*100 : 0)} del ingreso` },
                  { label: "Ganancia bruta",             value: COP(totalProfit),        note: `Margen: ${PCT(avgMargin)}` },
                  { label: "Gastos operativos",          value: COP(totalExpenses),      note: `${PCT(totalRevenue ? (totalExpenses/totalRevenue)*100 : 0)} del ingreso` },
                  { label: "Resultado neto",             value: COP(cashflow.netProfit), note: `ROI: ${PCT(cashflow.roi)}` },
                  { label: "Unidades vendidas",          value: `${totalQty} uds`,       note: `Ticket promedio: ${COP(ticketAvg)}` },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-start py-3 border-b border-border/30 last:border-0">
                    <div>
                      <p className="font-medium text-foreground">{row.label}</p>
                      <p className="text-xs text-muted-foreground">{row.note}</p>
                    </div>
                    <p className="font-bold text-right" style={{ color: "var(--primary)" }}>{row.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
