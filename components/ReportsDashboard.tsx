"use client"

import { useState, useMemo } from "react"
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package,
  AlertTriangle, BarChart2, PieChart as PieIcon, Clock, Zap,
  ArrowUpRight, ArrowDownRight, Tag, RotateCcw, ChevronRight, Banknote,
} from "lucide-react"

// ─── CSS — mismo token system que dashboard, POS, Ventas ─────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

.rd {
  font-family: 'DM Sans', sans-serif;
  --p:      var(--primary, #984ca8);
  --p06:    rgba(var(--primary-rgb,152,76,168),.06);
  --p10:    rgba(var(--primary-rgb,152,76,168),.10);
  --p20:    rgba(var(--primary-rgb,152,76,168),.20);
  --p40:    rgba(var(--primary-rgb,152,76,168),.40);
  --txt:    #1a1a18;
  --muted:  rgba(26,26,24,.45);
  --faint:  rgba(26,26,24,.22);
  --border: rgba(26,26,24,.08);
  --ok:     #16a34a;
  --warn:   #d97706;
  --danger: #dc2626;
}

/* ── Página header ─────────────────────────────────────────────────────── */
.rd-page-hd {
  display:flex; flex-direction:column; gap:14px;
  padding-bottom:20px; border-bottom:1px solid var(--border); margin-bottom:22px;
}
@media(min-width:640px){ .rd-page-hd{ flex-direction:row; align-items:center; justify-content:space-between; } }

.rd-title {
  font-family:'Cormorant Garamond',Georgia,serif;
  font-size:22px; font-weight:400; color:var(--txt); margin:0;
  display:flex; align-items:center; gap:10px;
}
.rd-dot { width:8px; height:8px; background:var(--p); flex-shrink:0; }
.rd-sub  { font-size:12px; color:var(--muted); margin:3px 0 0; }

/* Período */
.rd-period { display:flex; flex-wrap:wrap; gap:5px; }
.rd-pbtn {
  padding:5px 12px; border:1px solid var(--border); background:#fff;
  font-family:'DM Sans',sans-serif; font-size:11px; font-weight:500;
  color:var(--muted); cursor:pointer; letter-spacing:.04em;
  transition:border-color .15s, color .15s, background .15s;
}
.rd-pbtn:hover { border-color:var(--p20); color:var(--txt); }
.rd-pbtn.on { background:var(--p); border-color:var(--p); color:#fff; }

/* ── KPI grid ─────────────────────────────────────────────────────────── */
.rd-kpi-grid {
  display:grid; gap:10px; grid-template-columns:repeat(2,1fr); margin-bottom:20px;
}
@media(min-width:640px)  { .rd-kpi-grid{ grid-template-columns:repeat(3,1fr); } }
@media(min-width:1024px) { .rd-kpi-grid{ grid-template-columns:repeat(6,1fr); } }

.rd-kpi {
  background:#fff; border:1px solid var(--border);
  padding:15px 14px; position:relative; overflow:hidden;
  transition:box-shadow .18s, transform .18s;
}
.rd-kpi:hover { box-shadow:0 4px 18px var(--p10); transform:translateY(-1px); }
.rd-kpi::before {
  content:''; position:absolute; top:0; left:0; right:0; height:2px;
  background:var(--p); opacity:0; transition:opacity .18s;
}
.rd-kpi:hover::before { opacity:1; }
.rd-kpi-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; }
.rd-kpi-lbl { font-size:8px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:var(--muted); }
.rd-kpi-ico { width:26px; height:26px; background:var(--p10); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.rd-kpi-ico svg { color:var(--p); width:12px; height:12px; }
.rd-kpi-val {
  font-family:'Cormorant Garamond',Georgia,serif;
  font-size:21px; font-weight:500; color:var(--txt); margin:0; line-height:1;
}
.rd-kpi-sub  { font-size:10px; color:var(--muted); margin:4px 0 0; }
.rd-trend    { display:inline-flex; align-items:center; gap:2px; font-size:9px; font-weight:600; margin-top:5px; }
.rd-trend.up   { color:var(--ok); }
.rd-trend.down { color:var(--danger); }

/* ── Tabs ─────────────────────────────────────────────────────────────── */
.rd-tabs { display:flex; flex-wrap:wrap; border-bottom:2px solid var(--border); margin-bottom:20px; gap:0; }
.rd-tab {
  display:flex; align-items:center; gap:7px; padding:10px 14px;
  border:none; background:none; cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:12px; font-weight:400;
  color:var(--muted); border-bottom:2px solid transparent; margin-bottom:-2px;
  transition:color .14s, border-color .14s; white-space:nowrap;
}
@media(max-width:500px){ .rd-tab{ padding:8px 10px; font-size:11px; } .rd-tab span.lbl{ display:none; } }
.rd-tab:hover { color:var(--txt); }
.rd-tab.on { color:var(--p); border-bottom-color:var(--p); font-weight:500; }
.rd-tab svg { width:13px; height:13px; flex-shrink:0; }

/* ── Card ─────────────────────────────────────────────────────────────── */
.rd-card { background:#fff; border:1px solid var(--border); overflow:hidden; margin-bottom:14px; }
.rd-card-hd { padding:13px 16px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:8px; }
.rd-card-ico { width:24px; height:24px; background:var(--p10); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.rd-card-ico svg { color:var(--p); width:12px; height:12px; }
.rd-card-title { font-size:10px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--txt); margin:0; }
.rd-card-sub   { font-size:10px; color:var(--muted); margin:1px 0 0; }
.rd-card-body  { padding:16px; }

/* ── Grids de contenido ──────────────────────────────────────────────── */
.rd-g2 { display:grid; gap:14px; grid-template-columns:1fr; }
@media(min-width:768px){ .rd-g2{ grid-template-columns:1fr 1fr; } }
.rd-g3 { display:grid; gap:10px; grid-template-columns:1fr; }
@media(min-width:768px){ .rd-g3{ grid-template-columns:repeat(3,1fr); } }

/* Panel cashflow expandido */
.rd-cashflow { display:grid; gap:14px; grid-template-columns:1fr; margin-bottom:14px; }
@media(min-width:768px){ .rd-cashflow{ grid-template-columns:220px 1fr; } }
.rd-net { background:#fff; border:1px solid var(--border); padding:18px; display:flex; flex-direction:column; }
.rd-net-lbl { font-size:8px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:var(--muted); margin:0 0 5px; }
.rd-net-val { font-family:'Cormorant Garamond',Georgia,serif; font-size:26px; font-weight:500; margin:0; line-height:1; }
.rd-net-val.pos { color:var(--ok); }
.rd-net-val.neg { color:var(--danger); }
.rd-net-note { font-size:10px; color:var(--muted); margin:3px 0 0; }
.rd-net-sep  { height:1px; background:var(--border); margin:12px 0; }
.rd-net-roi-lbl { font-size:8px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:var(--muted); margin:0 0 3px; }
.rd-net-roi { font-family:'Cormorant Garamond',Georgia,serif; font-size:20px; font-weight:500; color:var(--p); margin:0; }

/* Cartera breakdown */
.rd-cartera-row {
  display:flex; justify-content:space-between; align-items:flex-start;
  padding:10px 0; border-bottom:1px solid var(--border); gap:10px;
}
.rd-cartera-row:last-child { border-bottom:none; }
.rd-cartera-rl { display:flex; align-items:flex-start; gap:8px; }
.rd-cartera-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; margin-top:3px; }
.rd-cartera-lbl { font-size:11px; font-weight:500; color:var(--txt); margin:0; }
.rd-cartera-sub { font-size:10px; color:var(--muted); margin:2px 0 0; }
.rd-cartera-val { font-family:'Cormorant Garamond',Georgia,serif; font-size:15px; font-weight:500; white-space:nowrap; flex-shrink:0; }
.rd-cartera-val.pos  { color:var(--ok); }
.rd-cartera-val.warn { color:var(--warn); }
.rd-cartera-val.neg  { color:var(--danger); }
.rd-cartera-val.muted { color:var(--muted); }

/* Barra progreso efectivo */
.rd-eff-bar { margin-top:10px; }
.rd-eff-bar-hd { display:flex; justify-content:space-between; font-size:9px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--muted); margin-bottom:5px; }
.rd-eff-track { height:6px; background:var(--border); display:flex; overflow:hidden; }
.rd-eff-seg-ok   { height:100%; background:var(--ok);   transition:width .4s; }
.rd-eff-seg-warn { height:100%; background:var(--warn); transition:width .4s; }
.rd-eff-seg-red  { height:100%; background:var(--danger); transition:width .4s; }


/* Barra progreso */
.rd-bar-row { margin-bottom:12px; }
.rd-bar-header { display:flex; justify-content:space-between; margin-bottom:4px; }
.rd-bar-name { font-size:11px; color:var(--muted); }
.rd-bar-amt  { font-size:11px; font-weight:600; color:var(--txt); }
.rd-bar-track { height:4px; background:var(--border); overflow:hidden; }
.rd-bar-fill  { height:100%; background:var(--p); transition:width .6s ease; }
.rd-bar-fill.ok     { background:var(--ok); }
.rd-bar-fill.warn   { background:var(--warn); }
.rd-bar-fill.danger { background:var(--danger); }

/* ── Tabla inventario ─────────────────────────────────────────────────── */
.rd-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; }
.rd-table  { width:100%; border-collapse:collapse; min-width:540px; }
.rd-table thead tr { border-bottom:2px solid var(--border); background:rgba(26,26,24,.02); }
.rd-table th {
  padding:9px 13px; font-size:8px; font-weight:700;
  letter-spacing:.2em; text-transform:uppercase; color:var(--muted); text-align:left; white-space:nowrap;
}
.rd-table tbody tr { border-bottom:1px solid var(--border); transition:background .1s; }
.rd-table tbody tr:last-child { border-bottom:none; }
.rd-table tbody tr:hover { background:rgba(26,26,24,.02); }
.rd-table td { padding:10px 13px; font-size:12px; color:var(--txt); }
.rd-table td.muted { color:var(--muted); }

/* Badge urgencia */
.rd-badge { display:inline-flex; align-items:center; padding:2px 8px; font-size:9px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }
.rd-badge.ok     { background:rgba(22,163,74,.08);   color:var(--ok); }
.rd-badge.warn   { background:rgba(217,119,6,.08);   color:var(--warn); }
.rd-badge.danger { background:rgba(220,38,38,.08);   color:var(--danger); }

/* Moneda serif */
.rd-money { font-family:'Cormorant Garamond',Georgia,serif; font-size:14px; font-weight:500; color:var(--p); }

/* ── Alertas recomendaciones ─────────────────────────────────────────── */
.rd-alert { padding:13px 15px; border-left:3px solid var(--p); background:var(--p06); margin-bottom:9px; display:flex; gap:11px; align-items:flex-start; }
.rd-alert.ok     { border-left-color:var(--ok);     background:rgba(22,163,74,.05); }
.rd-alert.warn   { border-left-color:var(--warn);   background:rgba(217,119,6,.05); }
.rd-alert.danger { border-left-color:var(--danger); background:rgba(220,38,38,.05); }
.rd-alert svg { flex-shrink:0; margin-top:1px; }
.rd-alert-title { font-size:12px; font-weight:600; color:var(--txt); margin:0 0 3px; }
.rd-alert-body  { font-size:11px; color:var(--muted); margin:0; line-height:1.5; }
.rd-alert-hint  { font-size:10px; font-weight:600; color:var(--p); margin:5px 0 0; }
.rd-alert.ok .rd-alert-hint     { color:var(--ok); }
.rd-alert.warn .rd-alert-hint   { color:var(--warn); }
.rd-alert.danger .rd-alert-hint { color:var(--danger); }

/* Tags */
.rd-tags { display:flex; flex-wrap:wrap; gap:5px; margin-top:7px; }
.rd-tag  { padding:2px 8px; font-size:10px; font-weight:500; background:var(--p10); color:var(--p); }
.rd-tag.ok     { background:rgba(22,163,74,.08);   color:var(--ok); }
.rd-tag.danger { background:rgba(220,38,38,.08);   color:var(--danger); }

/* Sin movimiento grid */
.rd-nm-grid { display:grid; gap:8px; grid-template-columns:1fr; }
@media(min-width:540px){ .rd-nm-grid{ grid-template-columns:1fr 1fr; } }
.rd-nm-item {
  display:flex; justify-content:space-between; align-items:center;
  padding:10px 13px; border:1px solid var(--border); transition:border-color .14s;
}
.rd-nm-item:hover { border-color:var(--p20); }
.rd-nm-name { font-size:12px; font-weight:500; color:var(--txt); margin:0 0 2px; }
.rd-nm-meta { font-size:10px; color:var(--muted); margin:0; }

/* Resumen ejecutivo */
.rd-exec-grid { display:grid; gap:0 20px; grid-template-columns:1fr; }
@media(min-width:640px){ .rd-exec-grid{ grid-template-columns:1fr 1fr; } }
.rd-exec-row { display:flex; justify-content:space-between; align-items:flex-start; padding:11px 0; border-bottom:1px solid var(--border); }
.rd-exec-row:last-child { border-bottom:none; }
.rd-exec-lbl  { font-size:12px; font-weight:500; color:var(--txt); margin:0 0 2px; }
.rd-exec-note { font-size:10px; color:var(--muted); margin:0; }
.rd-exec-val  { font-family:'Cormorant Garamond',Georgia,serif; font-size:15px; font-weight:500; color:var(--p); text-align:right; }

/* Gastos detalle scroll */
.rd-exp-item {
  display:flex; justify-content:space-between; align-items:center;
  padding:10px 16px; border-bottom:1px solid var(--border);
}
.rd-exp-item:last-child { border-bottom:none; }
.rd-exp-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }

/* Tooltip */
.rd-tt { background:#fff; border:1px solid var(--border); padding:9px 13px; font-family:'DM Sans',sans-serif; font-size:11px; box-shadow:0 4px 20px rgba(0,0,0,.07); }
.rd-tt-lbl  { font-weight:600; color:var(--txt); margin:0 0 4px; }
.rd-tt-item { margin:2px 0; font-weight:500; }

/* Toggles de serie en la gráfica consolidada */
.rd-series-toggles { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:14px; }
.rd-stoggle {
  display:inline-flex; align-items:center; gap:6px; padding:4px 12px;
  border:1px solid var(--border); background:#fff; cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:11px; font-weight:500; color:var(--muted);
  transition:all .15s; user-select:none;
}
.rd-stoggle:hover { border-color:var(--p20); color:var(--txt); }
.rd-stoggle.on  { color:#fff; border-color:transparent; }
.rd-stoggle-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }

/* Card resumen totalizado */
.rd-resumen {
  display:grid; gap:0; border:1px solid var(--border); background:#fff; margin-bottom:14px; overflow:hidden;
}
.rd-res-row {
  display:flex; justify-content:space-between; align-items:center;
  padding:13px 18px; border-bottom:1px solid var(--border);
}
.rd-res-row:last-child { border-bottom:none; }
.rd-res-row.total { background:rgba(26,26,24,.02); }
.rd-res-left  { display:flex; align-items:center; gap:10px; }
.rd-res-dot   { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
.rd-res-lbl   { font-size:12px; font-weight:500; color:var(--txt); margin:0; }
.rd-res-note  { font-size:10px; color:var(--muted); margin:2px 0 0; }
.rd-res-val   { font-family:'Cormorant Garamond',Georgia,serif; font-size:17px; font-weight:500; }
.rd-res-val.pos { color:var(--ok); }
.rd-res-val.neg { color:var(--danger); }
.rd-res-val.neu { color:var(--p); }
.rd-res-val.exp { color:var(--warn); }
`

// ─── Timezone Colombia (UTC-5, sin DST) ───────────────────────────────────────
// El servidor corre en UTC. Colombia siempre es UTC-5.
// Convertimos restando 5h antes de cualquier comparación o agrupación por fecha.
const COL_MS = 5 * 60 * 60 * 1000

/** Desplaza un Date UTC a la hora Colombia equivalente */
const toCol = (d: Date) => new Date(d.getTime() - COL_MS)

/** Devuelve "YYYY-MM-DD" en hora Colombia dado un ISO string */
const colDateStr = (iso: string) => toCol(new Date(iso)).toISOString().slice(0, 10)

/** Medianoche de hoy en Colombia, expresada como Date (comparable con otros Date) */
function colombiaMidnight(daysBack = 0): Date {
  const nowCol = toCol(new Date())
  nowCol.setUTCHours(0, 0, 0, 0)
  nowCol.setUTCDate(nowCol.getUTCDate() - daysBack)
  return nowCol
}

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Sale {
  id: string; total: number; payment_method: string; sale_date: string; client_id: string | null
  is_credit: boolean
  clients: { name: string } | null
  customer_debts?: {
    status: string; original_amount?: number
    debt_payments?: { amount: number }[]
  }[] | null
}
interface SaleItem { id: string; sale_id: string; product_id: string; quantity: number; unit_price: number; subtotal: number; products: { name: string; category_id: string | null; categories: { name: string } | null } | null }
interface Profit { sale_id: string; total_cost: number; total_sale: number; profit: number; profit_margin: number; created_at: string }
interface Expense { id: string; description: string; amount: number; date: string; categories_expense: { name: string } | null }
interface Product { id: string; name: string; sale_price: number; min_stock: number; category_id: string | null; categories: { name: string } | null }
interface Batch { id: string; product_id: string; quantity: number; purchase_price: number; purchase_date: string; remaining_quantity: number; products: { name: string } | null }
interface Props { sales: Sale[]; saleItems: SaleItem[]; profits: Profit[]; expenses: Expense[]; products: Product[]; batches: Batch[]; companyId: string }

// ─── Helpers ──────────────────────────────────────────────────────────────────
const COP   = (n: number) => n.toLocaleString("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 })
const PCT   = (n: number) => `${n.toFixed(1)}%`
const SHORT = (n: number) => n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n/1_000).toFixed(0)}K` : `${n}`

// Paleta de gráficas — derivada del primario + complementos neutros
// Recharts no puede leer var() en atributos SVG nativos, usamos hex consistentes
// El color primario lo asignamos directamente al primer slot
const C = ["#984ca8","#c48fd4","#7b3d95","#ddb8e8","#5e2f73","#b870d8"]
// Colores fijos para las 3 series de la gráfica consolidada
const S = { Ventas: "#984ca8", Ganancia: "#16a34a", Gastos: "#dc2626" }
const PERIOD = [
  { label:"7 días", days:7 }, { label:"30 días", days:30 },
  { label:"90 días", days:90 }, { label:"6 meses", days:180 }, { label:"1 año", days:365 },
]
const TABS = [
  { key:"ventas",       label:"Ventas",       icon:BarChart2  },
  { key:"rentabilidad", label:"Rentabilidad",  icon:TrendingUp },
  { key:"inventario",   label:"Inventario",    icon:Package    },
  { key:"decisiones",   label:"Decisiones",    icon:Zap        },
] as const

// ─── Sub-componentes ──────────────────────────────────────────────────────────
function Tt({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rd-tt">
      {label && <p className="rd-tt-lbl">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="rd-tt-item" style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" && p.value > 1000 ? COP(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

function Kpi({ title, value, sub, trend, icon: Icon, inv = false }: {
  title: string; value: string; sub?: string; trend?: number; icon: any; inv?: boolean
}) {
  const isUp = trend !== undefined && trend >= 0
  const good = inv ? !isUp : isUp
  return (
    <div className="rd-kpi">
      <div className="rd-kpi-top">
        <span className="rd-kpi-lbl">{title}</span>
        <div className="rd-kpi-ico" aria-hidden><Icon /></div>
      </div>
      <p className="rd-kpi-val">{value}</p>
      {sub && <p className="rd-kpi-sub">{sub}</p>}
      {trend !== undefined && (
        <span className={`rd-trend ${good ? "up" : "down"}`}>
          {isUp ? <ArrowUpRight size={9}/> : <ArrowDownRight size={9}/>}
          {Math.abs(trend).toFixed(1)}%
        </span>
      )}
    </div>
  )
}

function CardHd({ icon: Icon, title, sub }: { icon: any; title: string; sub?: string }) {
  return (
    <div className="rd-card-hd">
      <div className="rd-card-ico" aria-hidden><Icon /></div>
      <div>
        <p className="rd-card-title">{title}</p>
        {sub && <p className="rd-card-sub">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function ReportsDashboard({ sales, saleItems, profits, expenses, products, batches }: Props) {
  const [days, setDays]   = useState(30)
  const [tab, setTab]     = useState<"ventas"|"rentabilidad"|"inventario"|"decisiones">("ventas")
  const [vis, setVis]     = useState({ Ventas: true, Ganancia: true, Gastos: true })

  /* ── Filtros de período (hora Colombia) ─────────────────────────────────── */
  // colombiaMidnight() devuelve medianoche de HOY en Colombia.
  // Comparamos con toCol(new Date(iso)) para que la fecha sea la local Colombia.
  const cutoff     = useMemo(() => colombiaMidnight(days),       [days])
  const prevCutoff = useMemo(() => colombiaMidnight(days * 2),   [days])

  // Filtrar ventas comparando la FECHA COLOMBIA de sale_date con el cutoff Colombia
  const fSales    = useMemo(() => sales.filter(s => toCol(new Date(s.sale_date)) >= cutoff), [sales, cutoff])
  const prevSales = useMemo(() => sales.filter(s => {
    const d = toCol(new Date(s.sale_date))
    return d >= prevCutoff && d < cutoff
  }), [sales, cutoff, prevCutoff])
  const fItems    = useMemo(() => { const ids = new Set(fSales.map(s => s.id)); return saleItems.filter(i => ids.has(i.sale_id)) }, [fSales, saleItems])
  const fProfits  = useMemo(() => { const ids = new Set(fSales.map(s => s.id)); return profits.filter(p => ids.has(p.sale_id)) }, [fSales, profits])
  // Gastos: e.date puede venir como "YYYY-MM-DD" (tipo date) o
  // como "YYYY-MM-DDT00:00:00+00:00" (tipo timestamptz).
  // Normalizamos siempre con .slice(0,10) antes de parsear.
  const fExp = useMemo(() => expenses.filter(e => {
    const d = new Date(e.date.slice(0, 10) + "T12:00:00")
    return d >= cutoff
  }), [expenses, cutoff])

  /* ── KPIs ───────────────────────────────────────────────────────────────── */
  const rev     = fSales.reduce((s, v) => s + Number(v.total), 0)
  const prevRev = prevSales.reduce((s, v) => s + Number(v.total), 0)
  const revT    = prevRev ? ((rev - prevRev)/prevRev)*100 : 0
  const profit  = fProfits.reduce((s, p) => s + Number(p.profit), 0)
  const prevPIDs = new Set(prevSales.map(s => s.id))
  const prevP   = profits.filter(p => prevPIDs.has(p.sale_id)).reduce((s, p) => s + Number(p.profit), 0)
  const profT   = prevP ? ((profit - prevP)/prevP)*100 : 0
  const margin  = fProfits.length ? fProfits.reduce((s, p) => s + Number(p.profit_margin), 0)/fProfits.length : 0
  const expT    = fExp.reduce((s, e) => s + Number(e.amount), 0)
  const qty     = fItems.reduce((s, i) => s + i.quantity, 0)
  const ticket  = fSales.length ? rev/fSales.length : 0

  /* ── Datos gráfica consolidada (Ventas + Ganancia + Gastos por día) ──────── */
  const byDay = useMemo(() => {
    const m: Record<string, { Ventas: number; Ganancia: number; Gastos: number }> = {}

    // Ventas agrupadas por fecha Colombia
    fSales.forEach(s => {
      const d = colDateStr(s.sale_date)
      if (!m[d]) m[d] = { Ventas: 0, Ganancia: 0, Gastos: 0 }
      m[d].Ventas += Number(s.total)
    })

    // Ganancia del mismo día Colombia
    fProfits.forEach(p => {
      const sale = fSales.find(s => s.id === p.sale_id)
      if (!sale) return
      const d = colDateStr(sale.sale_date)
      if (!m[d]) m[d] = { Ventas: 0, Ganancia: 0, Gastos: 0 }
      m[d].Ganancia += Number(p.profit)
    })

    // Gastos por fecha (e.date = YYYY-MM-DD sin hora, ya es hora local)
    fExp.forEach(e => {
      const d = e.date.slice(0, 10)
      if (!m[d]) m[d] = { Ventas: 0, Ganancia: 0, Gastos: 0 }
      m[d].Gastos += Number(e.amount)
    })

    return Object.entries(m).sort().map(([date, v]) => ({
      // Mostrar como "10 mar." — parseamos con T12:00 para evitar drift UTC
      date: new Date(date + "T12:00:00").toLocaleDateString("es-CO", { month: "short", day: "numeric" }),
      ...v,
    }))
  }, [fSales, fProfits, fExp])

  const topProds = useMemo(() => {
    const m: Record<string, { name: string; qty: number; revenue: number }> = {}
    fItems.forEach(i => {
      const n = i.products?.name || "Sin nombre"
      if (!m[n]) m[n] = { name:n, qty:0, revenue:0 }
      m[n].qty += i.quantity; m[n].revenue += Number(i.subtotal)
    })
    return Object.values(m).sort((a,b) => b.revenue - a.revenue).slice(0, 8)
  }, [fItems])

  const byPay = useMemo(() => {
    const m: Record<string, number> = {}
    fSales.forEach(s => { m[s.payment_method] = (m[s.payment_method]||0) + Number(s.total) })
    return Object.entries(m).map(([name, value]) => ({ name, value }))
  }, [fSales])

  const byCat = useMemo(() => {
    const m: Record<string, number> = {}
    fExp.forEach(e => { const c = e.categories_expense?.name||"Sin categoría"; m[c] = (m[c]||0) + Number(e.amount) })
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a,b) => b.value-a.value)
  }, [fExp])

  const stale = useMemo(() => {
    const today = new Date()
    return batches.filter(b => b.remaining_quantity > 0).map(b => {
      const d = new Date(b.purchase_date)
      const age = Math.floor((today.getTime()-d.getTime())/86400000)
      const prod = products.find(p => p.id === b.product_id)
      return {
        name: b.products?.name||"Desconocido", days: age,
        remaining: b.remaining_quantity,
        value: b.remaining_quantity * Number(b.purchase_price),
        potential: b.remaining_quantity * (prod?.sale_price||0),
        purchaseDate: d.toLocaleDateString("es-CO"),
        urgency: age > 90 ? "alta" : age > 45 ? "media" : "baja" as const,
      }
    }).sort((a,b) => b.days-a.days)
  }, [batches, products])

  const soldIds = useMemo(() => new Set(fItems.map(i => i.product_id)), [fItems])
  const noMov   = useMemo(() => products.filter(p => {
    const hasStock = batches.some(b => b.product_id===p.id && b.remaining_quantity>0)
    return hasStock && !soldIds.has(p.id)
  }).map(p => {
    const stock = batches.filter(b => b.product_id===p.id).reduce((s,b) => s+b.remaining_quantity, 0)
    return { ...p, stock, value: stock * Number(p.sale_price) }
  }).sort((a,b) => b.value-a.value).slice(0,10), [products, batches, soldIds])

  const cashflow = useMemo(() => {
    const net = profit - expT
    return { net, roi: expT > 0 ? (net/expT)*100 : 0 }
  }, [profit, expT])

  /* ── Desglose cartera: efectivo vs crédito ──────────────────────────────── */
  const cartera = useMemo(() => {
    const sumaAbonos = (debt: any) =>
      ((debt?.debt_payments ?? []) as any[]).reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0)

    // Ventas contado: todo el total ya cobrado
    const contado = fSales.filter(s => !s.is_credit)
    const totalContado = contado.reduce((s, v) => s + Number(v.total), 0)

    // Créditos saldados: también ya cobrado en su totalidad
    const creditosPagados = fSales.filter(s => s.is_credit && s.customer_debts?.[0]?.status === "paid")
    const totalCreditosPagados = creditosPagados.reduce((s, v) => s + Number(v.total), 0)

    // Créditos abiertos: separar lo abonado (ya cobrado) del saldo pendiente
    const creditosAbiertos = fSales.filter(s =>
      s.is_credit && (s.customer_debts?.[0]?.status === "pending" || s.customer_debts?.[0]?.status === "partial")
    )
    const totalAbonosRecibidos = creditosAbiertos.reduce((s, v) => s + sumaAbonos(v.customer_debts?.[0]), 0)
    const totalBrutoAbierto    = creditosAbiertos.reduce((s, v) =>
      s + Number(v.customer_debts?.[0]?.original_amount ?? v.total), 0
    )
    const totalPendiente = Math.max(0, totalBrutoAbierto - totalAbonosRecibidos)

    // Ingresos reales cobrados = contado + créditos saldados + abonos de abiertos
    const revCobrado = totalContado + totalCreditosPagados + totalAbonosRecibidos

    // Ganancia proporcional cobrada: (revCobrado / rev) * profit
    // Solo calculamos si hay rev para evitar NaN
    const pctCobrado     = rev > 0 ? revCobrado / rev : 1
    const gananciaCobrada = profit * pctCobrado

    // Flujo neto REAL (solo sobre lo cobrado) vs flujo total (incluye crédito pendiente)
    const flujoReal  = gananciaCobrada - expT
    const flujoTotal = profit - expT   // = cashflow.net

    return {
      totalContado,
      totalCreditosPagados,
      totalAbonosRecibidos,
      totalBrutoAbierto,
      totalPendiente,
      revCobrado,
      revPendiente: totalPendiente,
      gananciaCobrada,
      flujoReal,
      flujoTotal,
      cuentasPendientes: creditosAbiertos.filter(s => s.customer_debts?.[0]?.status === "pending").length,
      cuentasAbonadas:   creditosAbiertos.filter(s => s.customer_debts?.[0]?.status === "partial").length,
      creditosTotal:     fSales.filter(s => s.is_credit).length,
    }
  }, [fSales, profit, rev, expT])

  /* ── Resumen totalizado ─────────────────────────────────────────────────── */
  // Ganancia real = ganancia bruta (de ventas) - gastos operativos del período
  const gananciaReal = profit - expT
  // Saldo = ingresos cobrados - costo de ventas - gastos operativos
  const costoVentas  = rev - profit
  const saldo        = rev - costoVentas - expT  // = gananciaReal

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="rd">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="rd-page-hd">
          <div>
            <h1 className="rd-title"><span className="rd-dot" aria-hidden />Centro de Reportes</h1>
            <p className="rd-sub">Análisis gerencial · {fSales.length} ventas en los últimos {days} días</p>
          </div>
          <div className="rd-period">
            {PERIOD.map(o => (
              <button key={o.days} className={`rd-pbtn${days===o.days?" on":""}`} onClick={() => setDays(o.days)}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── KPIs ────────────────────────────────────────────────────────── */}
        <div className="rd-kpi-grid">
          <Kpi title="Ingresos"     value={`$${SHORT(rev)}`}    sub={COP(rev)}    trend={revT}  icon={DollarSign}   />
          <Kpi title="Ganancia"     value={`$${SHORT(profit)}`} sub={COP(profit)} trend={profT} icon={TrendingUp}   />
          <Kpi title="Margen prom." value={PCT(margin)}         sub="sobre ingr."              icon={PieIcon}      />
          <Kpi title="# Ventas"     value={`${fSales.length}`}  sub={`${qty} uds`}             icon={ShoppingCart} />
          <Kpi title="Ticket prom." value={`$${SHORT(ticket)}`} sub={COP(ticket)}              icon={Tag}          />
          <Kpi title="Gastos"       value={`$${SHORT(expT)}`}   sub={COP(expT)}                icon={TrendingDown} inv />
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <div className="rd-tabs" role="tablist">
          {TABS.map(t => (
            <button key={t.key} className={`rd-tab${tab===t.key?" on":""}`}
              onClick={() => setTab(t.key)} role="tab" aria-selected={tab===t.key}>
              <t.icon aria-hidden="true" />
              <span className="lbl">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ════════════ TAB VENTAS ════════════════════════════════════════ */}
        {tab === "ventas" && (
          <div>

            {/* ── Card resumen totalizado ──────────────────────────────── */}
            <div className="rd-resumen">
              {[
                { dot: S.Ventas,   lbl: "Total ventas",       note: `${fSales.length} transacciones · ${qty} uds`,          val: COP(rev),           cls: "neu" },
                { dot: S.Ganancia, lbl: "Ganancia bruta",      note: `Margen promedio: ${PCT(margin)}`,                       val: COP(profit),        cls: profit >= 0 ? "pos" : "neg" },
                { dot: S.Gastos,   lbl: "Gastos operativos",   note: `${PCT(rev ? (expT/rev)*100 : 0)} sobre ingresos`,       val: COP(expT),          cls: "exp" },
                { dot: gananciaReal >= 0 ? "#16a34a" : "#dc2626",
                                   lbl: "Ganancia real",       note: "Ganancia bruta − Gastos operativos",                    val: COP(gananciaReal),  cls: gananciaReal >= 0 ? "pos" : "neg" },
                { dot: saldo >= 0 ? "#16a34a" : "#dc2626",
                                   lbl: "Saldo neto",          note: `Ingresos − Costos (${COP(costoVentas)}) − Gastos`,     val: COP(saldo),         cls: saldo >= 0 ? "pos" : "neg" },
              ].map((r, i) => (
                <div key={i} className={`rd-res-row${i >= 3 ? " total" : ""}`}>
                  <div className="rd-res-left">
                    <span className="rd-res-dot" style={{ background: r.dot }} aria-hidden />
                    <div>
                      <p className="rd-res-lbl">{r.lbl}</p>
                      <p className="rd-res-note">{r.note}</p>
                    </div>
                  </div>
                  <span className={`rd-res-val ${r.cls}`}>{r.val}</span>
                </div>
              ))}
            </div>

            {/* ── Gráfica consolidada ──────────────────────────────────── */}
            <div className="rd-card">
              <CardHd icon={BarChart2} title="Consolidado por día" sub="Ventas · Ganancia · Gastos — selecciona qué ver" />
              <div className="rd-card-body">
                {/* Toggles de serie */}
                <div className="rd-series-toggles">
                  {(["Ventas", "Ganancia", "Gastos"] as const).map(key => (
                    <button
                      key={key}
                      className={`rd-stoggle${vis[key] ? " on" : ""}`}
                      style={vis[key] ? { background: S[key], borderColor: S[key] } : {}}
                      onClick={() => setVis(v => ({ ...v, [key]: !v[key] }))}
                    >
                      <span className="rd-stoggle-dot" style={{ background: vis[key] ? "#fff" : S[key] }} aria-hidden />
                      {key}
                    </button>
                  ))}
                </div>

                {byDay.length === 0 ? (
                  <div className="rd-empty">
                    <div className="rd-empty-ico"><BarChart2 /></div>
                    <p className="rd-empty-t">Sin datos en este período</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={byDay} margin={{ top: 5, right: 8, left: 0, bottom: 5 }}>
                      <defs>
                        {(["Ventas", "Ganancia", "Gastos"] as const).map(k => (
                          <linearGradient key={k} id={`g${k}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={S[k]} stopOpacity={.20} />
                            <stop offset="95%" stopColor={S[k]} stopOpacity={0}   />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,26,24,.06)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgba(26,26,24,.4)" }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={v => `$${SHORT(v)}`} tick={{ fontSize: 10, fill: "rgba(26,26,24,.4)" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<Tt />} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {vis.Ventas   && <Area type="monotone" dataKey="Ventas"   stroke={S.Ventas}   fill={`url(#gVentas)`}   strokeWidth={2} dot={false} />}
                      {vis.Ganancia && <Area type="monotone" dataKey="Ganancia" stroke={S.Ganancia} fill={`url(#gGanancia)`} strokeWidth={2} dot={false} />}
                      {vis.Gastos   && <Area type="monotone" dataKey="Gastos"   stroke={S.Gastos}   fill={`url(#gGastos)`}   strokeWidth={2} dot={false} />}
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="rd-g2">
              <div className="rd-card" style={{ margin: 0 }}>
                <CardHd icon={TrendingUp} title="Top productos" sub="Por ingresos generados" />
                <div className="rd-card-body">
                  {topProds.length === 0 ? (
                    <div className="rd-empty"><div className="rd-empty-ico"><Package /></div><p className="rd-empty-t">Sin datos</p></div>
                  ) : (
                    <ResponsiveContainer width="100%" height={230}>
                      <BarChart data={topProds} layout="vertical" margin={{ left: 0, right: 14 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,26,24,.06)" horizontal={false} />
                        <XAxis type="number" tickFormatter={v => `$${SHORT(v)}`} tick={{ fontSize: 10, fill: "rgba(26,26,24,.4)" }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" width={96} tick={{ fontSize: 10, fill: "rgba(26,26,24,.4)" }} axisLine={false} tickLine={false} />
                        <Tooltip content={<Tt />} />
                        <Bar dataKey="revenue" name="Ingresos" radius={[0, 2, 2, 0]}>
                          {topProds.map((_, i) => <Cell key={i} fill={C[i % C.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="rd-card" style={{ margin: 0 }}>
                <CardHd icon={PieIcon} title="Métodos de pago" sub="Distribución de ingresos" />
                <div className="rd-card-body">
                  {byPay.length === 0 ? (
                    <div className="rd-empty"><div className="rd-empty-ico"><PieIcon /></div><p className="rd-empty-t">Sin datos</p></div>
                  ) : (
                    <ResponsiveContainer width="100%" height={230}>
                      <PieChart>
                        <Pie data={byPay} cx="50%" cy="50%" innerRadius={52} outerRadius={86} paddingAngle={3} dataKey="value" nameKey="name">
                          {byPay.map((_, i) => <Cell key={i} fill={C[i % C.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => COP(v)} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════ TAB RENTABILIDAD ══════════════════════════════════ */}
        {tab === "rentabilidad" && (
          <div>
            <div className="rd-cashflow">

              {/* ── Panel izquierdo: Flujo neto ─────────────────────────── */}
              <div className="rd-net">
                <p className="rd-net-lbl">Flujo neto en efectivo</p>
                <p className={`rd-net-val${cartera.flujoReal >= 0 ? " pos" : " neg"}`}>
                  {COP(cartera.flujoReal)}
                </p>
                <p className="rd-net-note">Ganancia cobrada − Gastos</p>
                <div className="rd-net-sep"/>
                <p className="rd-net-roi-lbl">Flujo total (incl. cartera)</p>
                <p className="rd-net-roi">{COP(cartera.flujoTotal)}</p>
                <div className="rd-net-sep"/>
                <p className="rd-net-roi-lbl">ROI operativo</p>
                <p className="rd-net-roi">{PCT(cashflow.roi)}</p>
              </div>

              {/* ── Panel derecho: Efectivo vs Cartera + Ingresos vs Costos */}
              <div className="rd-card" style={{ margin: 0 }}>
                <CardHd icon={Banknote} title="Efectivo vs Cartera" sub="Dinero real en caja vs pendiente de cobro" />
                <div className="rd-card-body">

                  {/* Cobrado */}
                  <div className="rd-cartera-row">
                    <div className="rd-cartera-rl">
                      <span className="rd-cartera-dot" style={{ background: "var(--ok)" }} aria-hidden />
                      <div>
                        <p className="rd-cartera-lbl">Cobrado — en efectivo</p>
                        <p className="rd-cartera-sub">
                          Contado: {COP(cartera.totalContado)}
                          {cartera.totalCreditosPagados > 0 && ` · Crédito saldado: ${COP(cartera.totalCreditosPagados)}`}
                          {cartera.totalAbonosRecibidos > 0 && ` · Abonos: ${COP(cartera.totalAbonosRecibidos)}`}
                        </p>
                      </div>
                    </div>
                    <span className="rd-cartera-val pos">{COP(cartera.revCobrado)}</span>
                  </div>

                  {/* Cartera pendiente */}
                  <div className="rd-cartera-row">
                    <div className="rd-cartera-rl">
                      <span className="rd-cartera-dot" style={{ background: "var(--warn)" }} aria-hidden />
                      <div>
                        <p className="rd-cartera-lbl">Cartera pendiente — por cobrar</p>
                        <p className="rd-cartera-sub">
                          {cartera.cuentasPendientes > 0 && `${cartera.cuentasPendientes} sin abono`}
                          {cartera.cuentasAbonadas > 0 && ` · ${cartera.cuentasAbonadas} con abono parcial`}
                          {cartera.totalBrutoAbierto > 0 && ` · original: ${COP(cartera.totalBrutoAbierto)}`}
                          {(cartera.cuentasPendientes === 0 && cartera.cuentasAbonadas === 0) && "Sin créditos abiertos"}
                        </p>
                      </div>
                    </div>
                    <span className={`rd-cartera-val ${cartera.totalPendiente > 0 ? "warn" : "muted"}`}>
                      {COP(cartera.totalPendiente)}
                    </span>
                  </div>

                  {/* Barra cobrado vs pendiente */}
                  {rev > 0 && (
                    <div className="rd-eff-bar">
                      <div className="rd-eff-bar-hd">
                        <span>Cobrado {PCT(cartera.revCobrado / rev * 100)}</span>
                        <span>Pendiente {PCT(cartera.totalPendiente / rev * 100)}</span>
                      </div>
                      <div className="rd-eff-track">
                        <div className="rd-eff-seg-ok"   style={{ width: `${(cartera.revCobrado / rev) * 100}%` }} />
                        <div className="rd-eff-seg-warn" style={{ width: `${(cartera.totalPendiente / rev) * 100}%` }} />
                      </div>
                    </div>
                  )}

                  <div style={{ height: 1, background: "var(--border)", margin: "14px 0 12px" }} />

                  {/* Ingresos vs Costos */}
                  {[
                    { label: "Ingresos brutos",    value: rev,           pct: 100,                               cls: "" },
                    { label: "Costo de ventas",     value: rev - profit,  pct: rev ? ((rev-profit)/rev)*100 : 0,  cls: "danger" },
                    { label: "Ganancia bruta",       value: profit,        pct: rev ? (profit/rev)*100 : 0,        cls: "ok" },
                    { label: "Gastos operativos",    value: expT,          pct: rev ? (expT/rev)*100 : 0,          cls: "warn" },
                  ].map(r => (
                    <div key={r.label} className="rd-bar-row">
                      <div className="rd-bar-header">
                        <span className="rd-bar-name">{r.label}</span>
                        <span className="rd-bar-amt">{COP(r.value)}</span>
                      </div>
                      <div className="rd-bar-track">
                        <div className={`rd-bar-fill ${r.cls}`} style={{ width: `${Math.min(r.pct, 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Evolución margen */}
            <div className="rd-card">
              <CardHd icon={TrendingUp} title="Evolución del margen" sub="% de ganancia por venta en el tiempo"/>
              <div className="rd-card-body">
                {fProfits.length === 0 ? (
                  <div className="rd-empty"><div className="rd-empty-ico"><TrendingUp/></div><p className="rd-empty-t">Sin datos de rentabilidad</p></div>
                ) : (
                  <ResponsiveContainer width="100%" height={210}>
                    <AreaChart data={fProfits
                      .map(p => ({ date: new Date(p.created_at.slice(0,10)).toLocaleDateString("es-CO", { month:"short", day:"numeric" }), margin: Number(p.profit_margin) }))
                      .sort((a,b) => a.date.localeCompare(b.date))}>
                      <defs>
                        <linearGradient id="gM" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={C[0]} stopOpacity={.18}/>
                          <stop offset="95%" stopColor={C[0]} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,26,24,.06)"/>
                      <XAxis dataKey="date" tick={{ fontSize:10, fill:"rgba(26,26,24,.4)" }} axisLine={false} tickLine={false}/>
                      <YAxis tickFormatter={v => `${v.toFixed(0)}%`} tick={{ fontSize:10, fill:"rgba(26,26,24,.4)" }} axisLine={false} tickLine={false}/>
                      <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} content={<Tt/>}/>
                      <Area type="monotone" dataKey="margin" name="Margen %" stroke={C[0]} fill="url(#gM)" strokeWidth={2} dot={false}/>
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Gastos */}
            <div className="rd-g2">
              <div className="rd-card" style={{ margin:0 }}>
                <CardHd icon={PieIcon} title="Gastos por categoría"/>
                <div className="rd-card-body">
                  {byCat.length === 0 ? (
                    <div className="rd-empty"><div className="rd-empty-ico"><PieIcon/></div><p className="rd-empty-t">Sin gastos registrados</p></div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={byCat} cx="50%" cy="50%" outerRadius={78} dataKey="value" nameKey="name" paddingAngle={3}>
                          {byCat.map((_,i) => <Cell key={i} fill={C[i % C.length]}/>)}
                        </Pie>
                        <Tooltip formatter={(v: number) => COP(v)}/>
                        <Legend wrapperStyle={{ fontSize:11 }}/>
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="rd-card" style={{ margin:0 }}>
                <CardHd icon={DollarSign} title="Detalle de gastos"/>
                <div style={{ maxHeight:220, overflowY:"auto" }}>
                  {byCat.length === 0 ? (
                    <div className="rd-empty"><p className="rd-empty-t">Sin gastos en este período</p></div>
                  ) : byCat.map((cat, i) => (
                    <div key={i} className="rd-exp-item">
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span className="rd-exp-dot" style={{ background: C[i % C.length] }}/>
                        <span style={{ fontSize:12, color:"#1a1a18" }}>{cat.name}</span>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <span className="rd-money">{COP(cat.value)}</span>
                        <p style={{ fontSize:10, color:"rgba(26,26,24,.45)", margin:0 }}>{expT ? PCT((cat.value/expT)*100) : "0%"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════ TAB INVENTARIO ════════════════════════════════════ */}
        {tab === "inventario" && (
          <div>
            <div className="rd-g3" style={{ marginBottom:14 }}>
              <Kpi title="Lotes críticos (+90d)" value={`${stale.filter(b => b.urgency==="alta").length}`} sub="requieren acción" icon={AlertTriangle} inv/>
              <Kpi title="Capital inmovilizado"   value={`$${SHORT(stale.reduce((s,b) => s+b.value,0))}`} sub="sin rotar" icon={DollarSign} inv/>
              <Kpi title="Potencial de venta"     value={`$${SHORT(stale.reduce((s,b) => s+b.potential,0))}`} sub="al precio lista" icon={TrendingUp}/>
            </div>

            <div className="rd-card">
              <CardHd icon={Clock} title="Inventario por antigüedad" sub="Lotes activos — más viejos primero"/>
              <div className="rd-scroll">
                <table className="rd-table">
                  <thead>
                    <tr>{["Producto","Fecha compra","Días","Unidades","Valor costo","Valor venta","Urgencia"].map(h => <th key={h}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {stale.length === 0 ? (
                      <tr><td colSpan={7} style={{ padding:36, textAlign:"center", color:"rgba(26,26,24,.4)", fontSize:12 }}>No hay lotes activos</td></tr>
                    ) : stale.slice(0,20).map((b,i) => (
                      <tr key={i} style={b.urgency==="alta" ? { background:"rgba(220,38,38,.025)" } : {}}>
                        <td style={{ fontWeight:500 }}>{b.name}</td>
                        <td className="muted">{b.purchaseDate}</td>
                        <td style={{ fontWeight:700, color: b.urgency==="alta"?"#dc2626":b.urgency==="media"?"#d97706":"#984ca8" }}>{b.days}d</td>
                        <td className="muted">{b.remaining} uds</td>
                        <td className="muted">{COP(b.value)}</td>
                        <td><span className="rd-money">{COP(b.potential)}</span></td>
                        <td>
                          <span className={`rd-badge ${b.urgency==="alta"?"danger":b.urgency==="media"?"warn":"ok"}`}>
                            {b.urgency==="alta"?"Crítico":b.urgency==="media"?"Medio":"Normal"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rd-card">
              <CardHd icon={RotateCcw} title={`Sin venta en ${days} días`} sub="Con stock pero sin rotación en el período"/>
              <div className="rd-card-body">
                {noMov.length === 0 ? (
                  <div className="rd-empty">
                    <div className="rd-empty-ico"><TrendingUp/></div>
                    <p className="rd-empty-t">¡Todos los productos rotaron!</p>
                    <p className="rd-empty-s">Todos los artículos con stock tuvieron al menos una venta</p>
                  </div>
                ) : (
                  <div className="rd-nm-grid">
                    {noMov.map((p,i) => (
                      <div key={i} className="rd-nm-item">
                        <div>
                          <p className="rd-nm-name">{p.name}</p>
                          <p className="rd-nm-meta">{p.categories?.name||"Sin categoría"} · {p.stock} uds</p>
                        </div>
                        <span className="rd-money">{COP(p.value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════════ TAB DECISIONES ════════════════════════════════════ */}
        {tab === "decisiones" && (
          <div>
            <div className="rd-card">
              <CardHd icon={Zap} title="Recomendaciones para el negocio" sub="Generadas automáticamente con los datos del período"/>
              <div className="rd-card-body">

                {stale.filter(b => b.urgency==="alta").length > 0 && (
                  <div className="rd-alert danger">
                    <AlertTriangle size={15} style={{ color:"#dc2626" }}/>
                    <div>
                      <p className="rd-alert-title">🔥 Activar promociones urgentes</p>
                      <p className="rd-alert-body">{stale.filter(b => b.urgency==="alta").length} productos llevan +90 días. Capital: <strong>{COP(stale.filter(b => b.urgency==="alta").reduce((s,b) => s+b.value,0))}</strong></p>
                      <div className="rd-tags">{stale.filter(b => b.urgency==="alta").slice(0,5).map((b,i) => <span key={i} className="rd-tag danger">{b.name} ({b.remaining}u)</span>)}</div>
                      <p className="rd-alert-hint">→ Descuento del 15-25% para liquidar antes de que pierdan valor</p>
                    </div>
                  </div>
                )}

                {topProds.length > 0 && (
                  <div className="rd-alert ok">
                    <TrendingUp size={15} style={{ color:"#16a34a" }}/>
                    <div>
                      <p className="rd-alert-title">📈 Potenciar los más vendidos</p>
                      <p className="rd-alert-body">Verifica stock suficiente para al menos 30 días en los top productos.</p>
                      <div className="rd-tags">{topProds.slice(0,3).map((p,i) => <span key={i} className="rd-tag ok">{p.name}: {COP(p.revenue)}</span>)}</div>
                      <p className="rd-alert-hint">→ Mantener inventario de al menos 30 días en estos productos</p>
                    </div>
                  </div>
                )}

                {margin < 20 && fProfits.length > 0 && (
                  <div className="rd-alert warn">
                    <TrendingDown size={15} style={{ color:"#d97706" }}/>
                    <div>
                      <p className="rd-alert-title">⚠️ Margen por debajo del 20%</p>
                      <p className="rd-alert-body">El margen promedio de <strong>{PCT(margin)}</strong> está por debajo del mínimo saludable.</p>
                      <p className="rd-alert-hint">→ Revisar precios o negociar mejores condiciones con proveedores</p>
                    </div>
                  </div>
                )}

                {noMov.length > 0 && (
                  <div className="rd-alert">
                    <RotateCcw size={15} style={{ color:"var(--p)" }}/>
                    <div>
                      <p className="rd-alert-title">🔄 {noMov.length} productos sin rotación en {days} días</p>
                      <p className="rd-alert-body">Capital dormido: <strong>{COP(noMov.reduce((s,p) => s+p.value,0))}</strong></p>
                      <div className="rd-tags">{noMov.slice(0,4).map((p,i) => <span key={i} className="rd-tag">{p.name}</span>)}</div>
                      <p className="rd-alert-hint">→ Combos, destacar en catálogo o hacer oferta puntual</p>
                    </div>
                  </div>
                )}

                {cashflow.net < 0 && (
                  <div className="rd-alert danger">
                    <AlertTriangle size={15} style={{ color:"#dc2626" }}/>
                    <div>
                      <p className="rd-alert-title">🚨 Flujo de caja negativo</p>
                      <p className="rd-alert-body">Los gastos superaron la ganancia bruta en <strong>{COP(Math.abs(cashflow.net))}</strong>.</p>
                      <p className="rd-alert-hint">→ Revisar estructura de gastos y aumentar volumen de ventas</p>
                    </div>
                  </div>
                )}

                {stale.filter(b => b.urgency==="alta").length===0 && margin>=20 && noMov.length===0 && cashflow.net>=0 && (
                  <div className="rd-alert ok">
                    <TrendingUp size={15} style={{ color:"#16a34a" }}/>
                    <div>
                      <p className="rd-alert-title">✅ El negocio está en buen estado</p>
                      <p className="rd-alert-body">Margen saludable, inventario con rotación y flujo positivo. Sigue monitoreando.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Resumen ejecutivo */}
            <div className="rd-card">
              <CardHd icon={ChevronRight} title="Resumen ejecutivo" sub={`Últimos ${days} días`}/>
              <div className="rd-card-body">
                <div className="rd-exec-grid">
                  {[
                    { label:"Ventas totales",             value:COP(rev),             note:`${fSales.length} transacciones` },
                    { label:"Costo de mercancía vendida", value:COP(rev - profit),    note:`${PCT(rev ? ((rev-profit)/rev)*100 : 0)} del ingreso` },
                    { label:"Ganancia bruta",             value:COP(profit),          note:`Margen: ${PCT(margin)}` },
                    { label:"Gastos operativos",          value:COP(expT),            note:`${PCT(rev ? (expT/rev)*100 : 0)} del ingreso` },
                    { label:"Resultado neto",             value:COP(cashflow.net),    note:`ROI: ${PCT(cashflow.roi)}` },
                    { label:"Unidades vendidas",          value:`${qty} uds`,         note:`Ticket promedio: ${COP(ticket)}` },
                  ].map((r,i) => (
                    <div key={i} className="rd-exec-row">
                      <div><p className="rd-exec-lbl">{r.label}</p><p className="rd-exec-note">{r.note}</p></div>
                      <p className="rd-exec-val">{r.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}
