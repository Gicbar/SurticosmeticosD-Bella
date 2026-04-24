"use client"

import { Fragment, useState, useMemo } from "react"
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package,
  AlertTriangle, BarChart2, PieChart as PieIcon, Clock, Zap,
  ArrowUpRight, ArrowDownRight, Tag, RotateCcw, ChevronRight, ChevronDown, Banknote,
  Truck, ClipboardList, Download, ShoppingBag,
} from "lucide-react"
import * as XLSX from "xlsx"

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
.rd-period { display:flex; flex-direction:column; gap:8px; align-items:flex-start; }
@media(min-width:900px){ .rd-period{ flex-direction:row; align-items:center; } }
.rd-period-presets { display:flex; flex-wrap:wrap; gap:5px; }
.rd-period-range {
  display:flex; flex-wrap:wrap; align-items:center; gap:6px;
  font-size:10px; color:var(--muted); letter-spacing:.04em;
}
.rd-period-range label { font-size:9px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; }
.rd-period-range input[type="date"] {
  font-family:'DM Sans',sans-serif; font-size:11px; color:var(--txt);
  padding:4px 8px; border:1px solid var(--border); background:#fff; outline:none;
  transition:border-color .14s;
}
.rd-period-range input[type="date"]:focus,
.rd-period-range input[type="date"]:hover { border-color:var(--p40); }
.rd-pbtn {
  padding:5px 12px; border:1px solid var(--border); background:#fff;
  font-family:'DM Sans',sans-serif; font-size:11px; font-weight:500;
  color:var(--muted); cursor:pointer; letter-spacing:.04em;
  transition:border-color .15s, color .15s, background .15s;
}
.rd-pbtn:hover { border-color:var(--p20); color:var(--txt); }
.rd-pbtn:disabled { opacity:.5; cursor:not-allowed; }
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

/* ── Reposición: tags, matriz ABC×XYZ, explicación ───────────────────── */
.rd-repo-tag {
  display:inline-flex; align-items:center; padding:2px 8px;
  font-size:10px; font-weight:500; background:var(--p06); color:var(--txt);
  border:1px solid var(--border); white-space:nowrap;
}
.rd-repo-tag.up   { background:rgba(22,163,74,.08);  color:var(--ok);     border-color:rgba(22,163,74,.15); }
.rd-repo-tag.down { background:rgba(220,38,38,.08);  color:var(--danger); border-color:rgba(220,38,38,.15); }

.rd-explain {
  font-size:12px; color:var(--txt); margin:0; line-height:1.6; font-style:italic;
}

.rd-matrix {
  display:grid; grid-template-columns:110px repeat(3,1fr); gap:2px;
  background:var(--border); padding:2px; margin-bottom:14px;
}
.rd-matrix-hd {
  background:#fff; padding:10px 8px;
  font-size:9px; font-weight:700; letter-spacing:.1em; text-transform:uppercase;
  color:var(--muted); text-align:center;
  display:flex; align-items:center; justify-content:center;
}
.rd-matrix-cell {
  background:#fff; padding:14px 8px; text-align:center;
  transition:background .15s;
}
.rd-matrix-cell:hover { background:var(--p06); }
.rd-matrix-cnt {
  font-family:'Cormorant Garamond',Georgia,serif;
  font-size:22px; font-weight:500; color:var(--txt); line-height:1;
}
.rd-matrix-pct { font-size:10px; color:var(--muted); margin-top:4px; }
.rd-matrix-legend {
  display:grid; grid-template-columns:repeat(2,1fr); gap:10px 20px;
  font-size:11px; color:var(--muted); margin-top:12px;
}
.rd-matrix-legend strong { color:var(--txt); font-weight:600; }

.rd-repo-section-title {
  font-family:'Cormorant Garamond',Georgia,serif;
  font-size:16px; font-weight:500; color:var(--txt); margin:4px 0 12px;
  display:flex; align-items:center; gap:8px;
}
.rd-repo-section-title .num {
  width:22px; height:22px; background:var(--p); color:#fff;
  display:inline-flex; align-items:center; justify-content:center;
  font-size:11px; font-weight:700; border-radius:50%;
}
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

/** "YYYY-MM-DD" → Date medianoche Colombia (comparable con otros Date) */
function ymdToCol(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number)
  const date = new Date(Date.UTC(y, (m || 1) - 1, d || 1))
  return date
}

/** Date Colombia → "YYYY-MM-DD" para value de input[type=date] */
function colToYmd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Diferencia en días (incl. ambos extremos) entre dos fechas Colombia */
function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86400000) + 1
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
interface Product { id: string; name: string; sale_price: number; min_stock: number; category_id: string | null; supplier_id?: string | null; categories: { name: string } | null; suppliers?: { id: string; name: string } | null }
interface Batch { id: string; product_id: string; quantity: number; purchase_price: number; purchase_date: string; remaining_quantity: number; supplier_id?: string | null; products: { name: string } | null; suppliers?: { id: string; name: string } | null }
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
/** Presets rápidos: calculan [from, to] dinámicamente al hacer clic */
const PRESETS: { label: string; range: () => [Date, Date] }[] = [
  { label: "Hoy",        range: () => [colombiaMidnight(0),   colombiaMidnight(0)] },
  { label: "7 días",     range: () => [colombiaMidnight(6),   colombiaMidnight(0)] },
  { label: "30 días",    range: () => [colombiaMidnight(29),  colombiaMidnight(0)] },
  { label: "90 días",    range: () => [colombiaMidnight(89),  colombiaMidnight(0)] },
  { label: "Este mes",   range: () => {
    const t = colombiaMidnight(0)
    const from = new Date(t); from.setUTCDate(1)
    return [from, t]
  }},
  { label: "Mes pasado", range: () => {
    const t = colombiaMidnight(0)
    const from = new Date(t); from.setUTCDate(1); from.setUTCMonth(from.getUTCMonth() - 1)
    const to   = new Date(t); to.setUTCDate(1); to.setUTCDate(0) // último día mes anterior
    return [from, to]
  }},
  { label: "Este año",   range: () => {
    const t = colombiaMidnight(0)
    const from = new Date(t); from.setUTCMonth(0, 1)
    return [from, t]
  }},
]
const TABS = [
  { key:"ventas",       label:"Ventas",       icon:BarChart2     },
  { key:"rentabilidad", label:"Rentabilidad",  icon:TrendingUp    },
  { key:"inventario",   label:"Inventario",    icon:Package       },
  { key:"reposicion",   label:"Reposición",    icon:Truck         },
  { key:"decisiones",   label:"Decisiones",    icon:Zap           },
] as const

// ── Parámetros Reposición (modelo analítico) ─────────────────────────────────
// Defaults basados en prácticas estándar de gestión de inventario:
// · Cobertura más corta para productos Clave (se revisan seguido), más larga para Marginales
// · Nivel de servicio más alto para Clave (Z=2.05 ≈ 98%), más bajo para Marginal (Z=1.28 ≈ 90%)
const REPO_CFG = {
  leadDias:                    5,                    // días hábiles promedio del proveedor
  cobertura:                   { A: 30, B: 45, C: 60 } as const,
  Z:                           { A: 2.05, B: 1.65, C: 1.28 } as const,
  sobrestockDiasCobertura:     90,
  sobrestockDiasSinVenta:      60,
  minHistoriaSimple:           14,                   // < este umbral: solo promedio plano, sin tendencia/CV
}

type Clase     = "A" | "B" | "C"
type Patron    = "X" | "Y" | "Z"
type Tendencia = "up" | "flat" | "down"
type Estado    = "AGOTADO" | "CRITICO" | "BAJO" | "OK" | "DORMIDO"

const CLASE_LABEL:     Record<Clase,     string> = { A: "⭐ Clave",    B: "◼ Normal",   C: "· Marginal" }
const PATRON_LABEL:    Record<Patron,    string> = { X: "📈 Estable",  Y: "📊 Variable", Z: "⚡ Errático" }
const TENDENCIA_LABEL: Record<Tendencia, string> = { up: "↗ Subiendo", flat: "→ Estable", down: "↘ Bajando" }

function explicarSugerencia(f: {
  name: string; stock: number; demandaDiaria: number; diasRestantes: number;
  clase: Clase; cobertura: number; SS: number; sugerido: number;
}): string {
  const vel    = f.demandaDiaria
  const dr     = isFinite(f.diasRestantes) ? Math.floor(f.diasRestantes) : null
  const claseT = f.clase === "A" ? "Clave" : f.clase === "B" ? "Normal" : "Marginal"
  const nivel  = f.clase === "A" ? "98%"   : f.clase === "B" ? "95%"    : "90%"
  const ss     = Math.round(f.SS)
  const estadoStock = f.stock === 0
    ? "ya está agotado"
    : dr !== null
      ? `se acaba en ~${dr} día${dr === 1 ? "" : "s"}`
      : "no tiene ventas recientes"
  return `Vendes ~${vel.toFixed(1)} uds/día, tienes ${f.stock} en stock → ${estadoStock}. El proveedor tarda ${REPO_CFG.leadDias} días. Como es un producto ${claseT.toLowerCase()}, se busca ${f.cobertura} días de cobertura con nivel de servicio ${nivel}. Compra sugerida: ${f.sugerido} uds (cubre demora + ${f.cobertura} días${ss > 0 ? ` + ${ss} uds de seguridad por variabilidad` : ""}).`
}

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
  const [dateFrom, setDateFrom] = useState<Date>(() => colombiaMidnight(29))
  const [dateTo,   setDateTo]   = useState<Date>(() => colombiaMidnight(0))
  const [tab, setTab]     = useState<"ventas"|"rentabilidad"|"inventario"|"reposicion"|"decisiones">("ventas")
  const [vis, setVis]     = useState({ Ventas: true, Ganancia: true, Gastos: true })
  const [filaExpandida, setFilaExpandida] = useState<string | null>(null)

  /* ── Rango derivado ─────────────────────────────────────────────────────── */
  // `days` = span del rango (inclusivo); se usa para velocidades y labels
  const days = useMemo(() => Math.max(1, daysBetween(dateFrom, dateTo)), [dateFrom, dateTo])

  // Fin del día Colombia del rango (23:59:59.999) para incluir ventas del último día completo.
  // dateTo sigue siendo medianoche (se usa como etiqueta/min-max del input); dateToEnd es solo para filtrar.
  const dateToEnd = useMemo(() => { const d = new Date(dateTo); d.setUTCHours(23, 59, 59, 999); return d }, [dateTo])

  // Ventana previa del mismo tamaño inmediatamente anterior (comparativa)
  const prevFrom = useMemo(() => { const d = new Date(dateFrom); d.setUTCDate(d.getUTCDate() - days); return d }, [dateFrom, days])
  const prevTo   = useMemo(() => { const d = new Date(dateFrom); d.setUTCDate(d.getUTCDate() - 1); d.setUTCHours(23, 59, 59, 999); return d }, [dateFrom])

  const inRange = (d: Date, from: Date, to: Date) => d >= from && d <= to

  /* ── Filtros de período (hora Colombia) ─────────────────────────────────── */
  const fSales    = useMemo(() => sales.filter(s => inRange(toCol(new Date(s.sale_date)), dateFrom, dateToEnd)), [sales, dateFrom, dateToEnd])
  const prevSales = useMemo(() => sales.filter(s => inRange(toCol(new Date(s.sale_date)), prevFrom, prevTo)), [sales, prevFrom, prevTo])
  const fItems    = useMemo(() => { const ids = new Set(fSales.map(s => s.id)); return saleItems.filter(i => ids.has(i.sale_id)) }, [fSales, saleItems])
  const fProfits  = useMemo(() => { const ids = new Set(fSales.map(s => s.id)); return profits.filter(p => ids.has(p.sale_id)) }, [fSales, profits])
  // Gastos: e.date puede venir como "YYYY-MM-DD" (date) o timestamptz.
  // Normalizamos a medianoche Colombia (fecha local) para consistencia.
  const fExp = useMemo(() => expenses.filter(e => inRange(ymdToCol(e.date.slice(0, 10)), dateFrom, dateTo)), [expenses, dateFrom, dateTo])

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

  /* ── Reposición: modelo analítico ABC/XYZ ───────────────────────────────── */
  // Capas:
  //  1) ABC por margen acumulado (Pareto 80/15/5)
  //  2) XYZ por CV de ventas semanales
  //  3) Pronóstico = media móvil ponderada 4 semanas × (1 + tendencia acotada)
  //  4) Stock seguridad = Z × σ × √leadTime
  //  5) Sugerencia = demanda × (lead + cobertura_clase) + SS − stock
  //  6) Priorización por margen en riesgo (no por unidades)
  //  7) Ventas perdidas estimadas + detección de sobrestock
  const reposicion = useMemo(() => {
    // Mapa sale_id → fecha Colombia (evita scan O(N²))
    const saleDate: Record<string, string> = {}
    fSales.forEach(s => { saleDate[s.id] = colDateStr(s.sale_date) })

    // Arreglo de fechas YYYY-MM-DD en orden dentro del rango
    const rangeDates: string[] = []
    for (let i = 0; i < days; i++) {
      const d = new Date(dateFrom); d.setUTCDate(d.getUTCDate() + i)
      rangeDates.push(colToYmd(d))
    }

    // Serie de ventas por producto (diaria + agregados + última venta)
    type Serie = { vendidas: number; ingreso: number; diario: Record<string, number>; ultimaVenta: string | null }
    const porProd: Record<string, Serie> = {}
    fItems.forEach(i => {
      const d = saleDate[i.sale_id]
      if (!d) return
      if (!porProd[i.product_id]) porProd[i.product_id] = { vendidas: 0, ingreso: 0, diario: {}, ultimaVenta: null }
      const s = porProd[i.product_id]
      s.vendidas += i.quantity
      s.ingreso  += Number(i.subtotal)
      s.diario[d] = (s.diario[d] || 0) + i.quantity
      if (!s.ultimaVenta || d > s.ultimaVenta) s.ultimaVenta = d
    })

    // Stock, último costo y proveedor por producto
    const stockPorProd:       Record<string, number> = {}
    const ultimoCostoPorProd: Record<string, number> = {}
    const proveedorPorProd:   Record<string, { id: string; name: string } | null> = {}
    batches.forEach(b => {
      if (b.remaining_quantity > 0) stockPorProd[b.product_id] = (stockPorProd[b.product_id] || 0) + b.remaining_quantity
      if (ultimoCostoPorProd[b.product_id] === undefined) ultimoCostoPorProd[b.product_id] = Number(b.purchase_price)
      if (proveedorPorProd[b.product_id] === undefined) {
        proveedorPorProd[b.product_id] = b.suppliers ? { id: b.suppliers.id, name: b.suppliers.name } : null
      }
    })

    // Desv. estándar poblacional (suficiente para CV — evita NaN si n<2)
    const stddev = (arr: number[]): number => {
      if (arr.length < 2) return 0
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length
      const v    = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length
      return Math.sqrt(v)
    }
    // Pendiente relativa (slope / ȳ) — proporción de cambio por periodo
    const slopePct = (arr: number[]): number => {
      if (arr.length < 2) return 0
      const n    = arr.length
      const xBar = (n - 1) / 2
      const yBar = arr.reduce((a, b) => a + b, 0) / n
      if (yBar === 0) return 0
      let num = 0, den = 0
      for (let i = 0; i < n; i++) { num += (i - xBar) * (arr[i] - yBar); den += (i - xBar) ** 2 }
      if (den === 0) return 0
      return (num / den) / yBar
    }

    // Procesar cada producto (métricas independientes de clase)
    const base = products.map(p => {
      const serie    = porProd[p.id]
      const stock    = stockPorProd[p.id] || 0
      const costoUnit = ultimoCostoPorProd[p.id] ?? 0

      const vendidas   = serie?.vendidas || 0
      const ingreso    = serie?.ingreso  || 0
      const precioProm = vendidas > 0 ? ingreso / vendidas : Number(p.sale_price || 0)
      const margenUnit = Math.max(0, precioProm - costoUnit)
      const margenTotal = margenUnit * vendidas

      // Serie diaria completa (0s incluidos) y agregados semanales
      const serieDiaria = rangeDates.map(d => serie?.diario[d] || 0)
      const sigmaDiaria = stddev(serieDiaria)
      const meanDiario  = vendidas / days

      const semanas: number[] = []
      for (let i = 0; i < serieDiaria.length; i += 7) {
        semanas.push(serieDiaria.slice(i, i + 7).reduce((a, b) => a + b, 0))
      }
      const cv    = meanDiario > 0 ? sigmaDiaria / meanDiario : 0
      const slope = semanas.length >= 2 ? slopePct(semanas) : 0
      const slopeClamp = Math.max(-0.30, Math.min(0.30, slope))

      // Media móvil ponderada (4/3/2/1) sobre últimas 4 semanas, /7 → uds/día
      const last4 = semanas.slice(-4)
      const pesos = [1, 2, 3, 4].slice(-last4.length)
      let demBase = meanDiario
      if (last4.length >= 1) {
        const num = last4.reduce((a, b, i) => a + b * pesos[i], 0)
        const den = pesos.reduce((a, b) => a + b, 0)
        demBase = (num / den) / 7
      }
      // Tendencia solo si hay historia suficiente
      const demandaDiaria = days >= REPO_CFG.minHistoriaSimple ? demBase * (1 + slopeClamp) : meanDiario

      // Patrón XYZ
      let patron: Patron
      if (days < REPO_CFG.minHistoriaSimple || vendidas < 3) patron = "Y"  // historia insuficiente → neutral
      else if (cv < 0.5) patron = "X"
      else if (cv < 1)   patron = "Y"
      else               patron = "Z"

      const tendencia: Tendencia = slope > 0.10 ? "up" : slope < -0.10 ? "down" : "flat"
      const diasRestantes = demandaDiaria > 0 ? stock / demandaDiaria : Infinity

      // Ventas perdidas (heurística conservadora): si stock=0 y hubo ventas,
      // aproximamos "días sin stock" como días desde la última venta hasta dateTo
      let diasSinStock = 0
      if (stock === 0 && serie?.ultimaVenta) {
        diasSinStock = Math.max(0, daysBetween(ymdToCol(serie.ultimaVenta), dateTo) - 1)
      }
      const velPrevia         = (days - diasSinStock) > 0 ? vendidas / Math.max(1, days - diasSinStock) : 0
      const ventasPerdidasUds = Math.round(diasSinStock * velPrevia)
      const dineroPerdido     = ventasPerdidasUds * margenUnit

      return {
        id: p.id,
        name: p.name,
        categoria: p.categories?.name || "Sin categoría",
        stock, vendidas, ingreso,
        margenUnit, margenTotal,
        demandaDiaria, demandaBase: demBase,
        sigmaDiaria, cv, slope,
        patron, tendencia,
        diasRestantes,
        costoUnit, precioProm,
        proveedor: p.suppliers
          ? { id: p.suppliers.id, name: p.suppliers.name }
          : proveedorPorProd[p.id] || null,
        diasSinStock, ventasPerdidasUds, dineroPerdido,
        tieneHistoria: vendidas > 0,
      }
    })

    // ABC por margen acumulado (Pareto 80/15/5)
    const conMargen = base.filter(f => f.margenTotal > 0).sort((a, b) => b.margenTotal - a.margenTotal)
    const margenTotalGlobal = conMargen.reduce((s, f) => s + f.margenTotal, 0)
    const claseMap: Record<string, Clase> = {}
    let acum = 0
    conMargen.forEach(f => {
      acum += f.margenTotal
      const pct = margenTotalGlobal > 0 ? acum / margenTotalGlobal : 1
      claseMap[f.id] = pct <= 0.80 ? "A" : pct <= 0.95 ? "B" : "C"
    })

    // Capa dependiente de clase: cobertura, SS, ROP, sugerencia y estado
    const completas = base.map(f => {
      const clase: Clase = f.tieneHistoria ? (claseMap[f.id] || "C") : "C"
      const cobertura    = REPO_CFG.cobertura[clase]
      const Z            = REPO_CFG.Z[clase]
      const SS           = Math.max(0, Z * f.sigmaDiaria * Math.sqrt(REPO_CFG.leadDias))
      const ROP          = f.demandaDiaria * REPO_CFG.leadDias + SS
      const sugerido     = Math.max(0, Math.ceil(f.demandaDiaria * (REPO_CFG.leadDias + cobertura) + SS - f.stock))
      const costoEst     = sugerido * f.costoUnit
      const margenEnRiesgoDiario = f.margenUnit * f.demandaDiaria

      // Detección de sobrestock (dormido)
      const sinVentaDias = f.tieneHistoria ? 0 : days
      const sobrestock   = f.diasRestantes > REPO_CFG.sobrestockDiasCobertura
                        || (sinVentaDias >= REPO_CFG.sobrestockDiasSinVenta && f.stock > 0)

      let estado: Estado
      if (sobrestock)                                         estado = "DORMIDO"
      else if (f.stock === 0 && f.tieneHistoria)              estado = "AGOTADO"
      else if (f.diasRestantes <= REPO_CFG.leadDias + 2)      estado = "CRITICO"
      else if (f.diasRestantes <= cobertura / 2)              estado = "BAJO"
      else                                                    estado = "OK"

      return { ...f, clase, cobertura, SS, ROP, sugerido, costoEst, margenEnRiesgoDiario, estado }
    })

    // Bloques ordenados
    const agotados = completas.filter(f => f.estado === "AGOTADO").sort((a, b) => b.margenEnRiesgoDiario - a.margenEnRiesgoDiario)
    const criticos = completas.filter(f => f.estado === "CRITICO").sort((a, b) => a.diasRestantes - b.diasRestantes)
    const bajos    = completas.filter(f => f.estado === "BAJO").sort((a, b) => a.diasRestantes - b.diasRestantes)
    const dormidos = completas
      .filter(f => f.estado === "DORMIDO" && f.stock > 0)
      .map(f => ({ ...f, capitalDormido: f.stock * f.costoUnit }))
      .sort((a, b) => b.capitalDormido - a.capitalDormido)
    const ventasPerdidas = completas
      .filter(f => f.ventasPerdidasUds > 0)
      .sort((a, b) => b.dineroPerdido - a.dineroPerdido)

    // Orden de compra agrupada por proveedor (priorizada por margen en riesgo)
    const conSugerencia = completas.filter(f => f.sugerido > 0 && f.estado !== "DORMIDO")
    const porProveedor: Record<string, { provId: string | null; provName: string; items: typeof completas; subtotal: number }> = {}
    conSugerencia.forEach(f => {
      const key = f.proveedor?.id || "SIN_PROV"
      if (!porProveedor[key]) {
        porProveedor[key] = {
          provId:   f.proveedor?.id || null,
          provName: f.proveedor?.name || "Sin proveedor",
          items:    [],
          subtotal: 0,
        }
      }
      porProveedor[key].items.push(f)
      porProveedor[key].subtotal += f.costoEst
    })
    const ordenGrupos = Object.values(porProveedor)
      .map(g => ({ ...g, items: g.items.sort((a, b) => b.margenEnRiesgoDiario - a.margenEnRiesgoDiario) }))
      .sort((a, b) => b.subtotal - a.subtotal)

    const totalOrden   = ordenGrupos.reduce((s, g) => s + g.subtotal, 0)
    const unidadesOrden = conSugerencia.reduce((s, f) => s + f.sugerido, 0)

    // Matriz ABC × XYZ (solo productos con historia)
    const matriz: Record<Clase, Record<Patron, { count: number; margen: number }>> = {
      A: { X: { count: 0, margen: 0 }, Y: { count: 0, margen: 0 }, Z: { count: 0, margen: 0 } },
      B: { X: { count: 0, margen: 0 }, Y: { count: 0, margen: 0 }, Z: { count: 0, margen: 0 } },
      C: { X: { count: 0, margen: 0 }, Y: { count: 0, margen: 0 }, Z: { count: 0, margen: 0 } },
    }
    completas.forEach(f => {
      if (!f.tieneHistoria) return
      matriz[f.clase][f.patron].count++
      matriz[f.clase][f.patron].margen += f.margenTotal
    })

    // Histograma de cobertura (SKUs con stock y con historia)
    const bucketsLbl = ["0-7d", "8-15d", "16-30d", "31-60d", "61-90d", ">90d"]
    const histograma = bucketsLbl.map(l => ({ bucket: l, count: 0 }))
    completas.forEach(f => {
      if (!f.tieneHistoria || f.stock === 0) return
      const d = f.diasRestantes
      if (!isFinite(d)) return
      if      (d <=  7) histograma[0].count++
      else if (d <= 15) histograma[1].count++
      else if (d <= 30) histograma[2].count++
      else if (d <= 60) histograma[3].count++
      else if (d <= 90) histograma[4].count++
      else              histograma[5].count++
    })

    // KPIs agregados
    const dineroEnRiesgo = agotados.reduce((s, f) => s + f.dineroPerdido, 0)
      + criticos.reduce((s, f) => s + f.margenUnit * Math.max(0, REPO_CFG.leadDias - f.diasRestantes) * f.demandaDiaria, 0)
    const capitalDormidoTotal = dormidos.reduce((s, f) => s + f.capitalDormido, 0)

    return {
      agotados, criticos, bajos, dormidos, ventasPerdidas,
      ordenGrupos, totalOrden, unidadesOrden,
      matriz, histograma, margenTotalGlobal,
      dineroEnRiesgo, capitalDormidoTotal,
      completas,
    }
  }, [products, batches, fItems, fSales, days, dateFrom, dateTo])

  const descargarOrdenExcel = () => {
    // Hoja 1 — "Orden": limpia, para enviar/imprimir
    const rowsOrden: any[] = []
    reposicion.ordenGrupos.forEach(g => {
      g.items.forEach(it => {
        rowsOrden.push({
          Proveedor: g.provName,
          Producto: it.name,
          "Cantidad sugerida": it.sugerido,
          "Costo unit.": it.costoUnit,
          "Costo total": it.costoEst,
        })
      })
      rowsOrden.push({
        Proveedor: `Subtotal ${g.provName}`,
        Producto: "",
        "Cantidad sugerida": g.items.reduce((s, i) => s + i.sugerido, 0),
        "Costo unit.": "",
        "Costo total": g.subtotal,
      })
      rowsOrden.push({})
    })
    rowsOrden.push({
      Proveedor: "TOTAL ORDEN",
      Producto: "",
      "Cantidad sugerida": reposicion.unidadesOrden,
      "Costo unit.": "",
      "Costo total": reposicion.totalOrden,
    })

    // Hoja 2 — "Análisis": técnica, con todas las variables del modelo
    const rowsAnalisis = reposicion.completas
      .filter(f => f.sugerido > 0)
      .sort((a, b) => b.margenEnRiesgoDiario - a.margenEnRiesgoDiario)
      .map(f => ({
        Producto:              f.name,
        Categoría:             f.categoria,
        Proveedor:             f.proveedor?.name || "Sin proveedor",
        Clase:                 `${f.clase} · ${f.clase === "A" ? "Clave" : f.clase === "B" ? "Normal" : "Marginal"}`,
        Patrón:                `${f.patron} · ${f.patron === "X" ? "Estable" : f.patron === "Y" ? "Variable" : "Errático"}`,
        Tendencia:             f.tendencia === "up" ? "Subiendo" : f.tendencia === "down" ? "Bajando" : "Estable",
        Estado:                f.estado,
        "Stock actual":        f.stock,
        "Vendidas (período)":  f.vendidas,
        "Velocidad (uds/día)": Number(f.demandaDiaria.toFixed(2)),
        "Días restantes":      isFinite(f.diasRestantes) ? Math.floor(f.diasRestantes) : "∞",
        "Cobertura objetivo":  f.cobertura,
        "Stock seguridad":     Math.round(f.SS),
        "Punto reorden":       Math.round(f.ROP),
        "Cantidad sugerida":   f.sugerido,
        "Costo unit.":         f.costoUnit,
        "Costo total":         f.costoEst,
        "Margen unit.":        Number(f.margenUnit.toFixed(0)),
        "Margen en riesgo/día": Number(f.margenEnRiesgoDiario.toFixed(0)),
      }))

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rowsOrden),    "Orden")
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rowsAnalisis), "Análisis")
    const hoy = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `orden-compra-${hoy}.xlsx`)
  }

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
  const costoVentas  = rev - profit

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="rd">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="rd-page-hd">
          <div>
            <h1 className="rd-title"><span className="rd-dot" aria-hidden />Centro de Reportes</h1>
            <p className="rd-sub">
              {fSales.length} ventas · {dateFrom.toLocaleDateString("es-CO", { day:"numeric", month:"short", timeZone:"UTC" })} → {dateTo.toLocaleDateString("es-CO", { day:"numeric", month:"short", year:"numeric", timeZone:"UTC" })} ({days} {days===1?"día":"días"})
            </p>
          </div>
          <div className="rd-period">
            <div className="rd-period-presets">
              {PRESETS.map(p => (
                <button key={p.label} className="rd-pbtn" onClick={() => { const [f, t] = p.range(); setDateFrom(f); setDateTo(t) }}>
                  {p.label}
                </button>
              ))}
            </div>
            <div className="rd-period-range">
              <label>Desde</label>
              <input
                type="date"
                value={colToYmd(dateFrom)}
                max={colToYmd(dateTo)}
                onChange={e => { if (e.target.value) setDateFrom(ymdToCol(e.target.value)) }}
              />
              <label>Hasta</label>
              <input
                type="date"
                value={colToYmd(dateTo)}
                min={colToYmd(dateFrom)}
                max={colToYmd(colombiaMidnight(0))}
                onChange={e => { if (e.target.value) setDateTo(ymdToCol(e.target.value)) }}
              />
            </div>
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
                                   lbl: "Ganancia real",       note: `Ganancia bruta − Gastos · Costo vendido: ${COP(costoVentas)}`, val: COP(gananciaReal),  cls: gananciaReal >= 0 ? "pos" : "neg" },
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

                  {/* Composición de ingresos (% sobre ingresos brutos) */}
                  {[
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
                    <AreaChart data={[...fProfits]
                      .sort((a,b) => a.created_at.localeCompare(b.created_at))
                      .map(p => ({ date: new Date(colDateStr(p.created_at) + "T12:00:00").toLocaleDateString("es-CO", { month:"short", day:"numeric" }), margin: Number(p.profit_margin) }))}>
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

        {/* ════════════ TAB REPOSICIÓN ════════════════════════════════════ */}
        {tab === "reposicion" && (
          <div>
            {/* ═══ SECCIÓN 1 — Acción inmediata ═══════════════════════════ */}
            <h3 className="rd-repo-section-title"><span className="num">1</span>Acción inmediata</h3>
            <div className="rd-g3" style={{ marginBottom: 14 }}>
              <Kpi
                title="Productos agotados"
                value={`${reposicion.agotados.length}`}
                sub="se venden y están en 0"
                icon={AlertTriangle} inv
              />
              <Kpi
                title="En riesgo esta semana"
                value={`${reposicion.criticos.length}`}
                sub={`llegarán tarde · lead ${REPO_CFG.leadDias}d`}
                icon={Clock} inv
              />
              <Kpi
                title="Dinero en riesgo"
                value={`$${SHORT(reposicion.dineroEnRiesgo)}`}
                sub="margen que dejas de ganar"
                icon={TrendingDown} inv
              />
            </div>

            <div className="rd-card">
              <CardHd
                icon={AlertTriangle}
                title="Comprar YA"
                sub="Priorizado por dinero en riesgo · clic en una fila para ver por qué"
              />
              <div className="rd-scroll">
                <table className="rd-table">
                  <thead>
                    <tr>
                      {["Producto", "Clase", "Patrón", "Tendencia", "Stock", "Vendido", "Sugerido", "Costo est.", "Proveedor", ""].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reposicion.agotados.length === 0 && reposicion.criticos.length === 0 ? (
                      <tr><td colSpan={10} style={{ padding: 36, textAlign: "center", color: "rgba(26,26,24,.4)", fontSize: 12 }}>Nada urgente: sin agotados ni críticos.</td></tr>
                    ) : [...reposicion.agotados, ...reposicion.criticos].map((f) => {
                      const exp    = filaExpandida === f.id
                      const esAgot = f.estado === "AGOTADO"
                      const rowBg  = esAgot ? "rgba(220,38,38,.025)" : "rgba(217,119,6,.025)"
                      return (
                        <Fragment key={f.id}>
                          <tr
                            style={{ background: rowBg, cursor: "pointer" }}
                            onClick={() => setFilaExpandida(exp ? null : f.id)}
                          >
                            <td style={{ fontWeight: 500 }}>
                              <span className={`rd-badge ${esAgot ? "danger" : "warn"}`} style={{ marginRight: 6 }}>
                                {esAgot ? "Agotado" : "Crítico"}
                              </span>
                              {f.name}
                            </td>
                            <td><span className="rd-repo-tag">{CLASE_LABEL[f.clase]}</span></td>
                            <td><span className="rd-repo-tag">{PATRON_LABEL[f.patron]}</span></td>
                            <td>
                              <span className={`rd-repo-tag ${f.tendencia === "up" ? "up" : f.tendencia === "down" ? "down" : ""}`}>
                                {TENDENCIA_LABEL[f.tendencia]}
                              </span>
                            </td>
                            <td className="muted">{f.stock}</td>
                            <td className="muted">{f.vendidas} uds</td>
                            <td style={{ fontWeight: 700 }}>{f.sugerido}</td>
                            <td><span className="rd-money">{COP(f.costoEst)}</span></td>
                            <td className="muted">{f.proveedor?.name || "—"}</td>
                            <td>{exp ? <ChevronDown size={12} /> : <ChevronRight size={12} />}</td>
                          </tr>
                          {exp && (
                            <tr>
                              <td colSpan={10} style={{ background: "rgba(26,26,24,.02)", padding: "12px 16px" }}>
                                <p className="rd-explain">{explicarSugerencia(f)}</p>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ═══ SECCIÓN 2 — Orden de compra ═══════════════════════════ */}
            <h3 className="rd-repo-section-title" style={{ marginTop: 24 }}>
              <span className="num">2</span>Orden de compra sugerida
            </h3>
            <div className="rd-card">
              <div className="rd-card-hd" style={{ justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div className="rd-card-ico" aria-hidden><ClipboardList /></div>
                  <div>
                    <p className="rd-card-title">Agrupada por proveedor</p>
                    <p className="rd-card-sub">
                      Cobertura por clase · {CLASE_LABEL.A}: {REPO_CFG.cobertura.A}d · {CLASE_LABEL.B}: {REPO_CFG.cobertura.B}d · {CLASE_LABEL.C}: {REPO_CFG.cobertura.C}d · + lead {REPO_CFG.leadDias}d
                    </p>
                  </div>
                </div>
                <button
                  className="rd-pbtn on"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                  onClick={descargarOrdenExcel}
                  disabled={reposicion.ordenGrupos.length === 0}
                >
                  <Download size={12} /> Descargar Excel
                </button>
              </div>
              <div className="rd-card-body">
                {reposicion.ordenGrupos.length === 0 ? (
                  <div className="rd-empty">
                    <div className="rd-empty-ico"><ShoppingBag /></div>
                    <p className="rd-empty-t">No hay productos que reponer</p>
                    <p className="rd-empty-s">Todo el inventario tiene cobertura suficiente</p>
                  </div>
                ) : reposicion.ordenGrupos.map((g, gi) => (
                  <div key={gi} style={{ marginBottom: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Truck size={14} style={{ color: "var(--p)" }} />
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{g.provName}</span>
                        <span style={{ fontSize: 10, color: "var(--muted)" }}>
                          {g.items.length} productos · {g.items.reduce((s, i) => s + i.sugerido, 0)} uds
                        </span>
                      </div>
                      <span className="rd-money" style={{ fontWeight: 600 }}>{COP(g.subtotal)}</span>
                    </div>
                    <div className="rd-scroll">
                      <table className="rd-table">
                        <thead>
                          <tr>{["Producto", "Clase", "Stock", "Vendidas", "Días rest.", "Sugerido", "Costo unit.", "Costo est."].map(h => <th key={h}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                          {g.items.map((it, ii) => (
                            <tr key={ii}>
                              <td style={{ fontWeight: 500 }}>{it.name}</td>
                              <td><span className="rd-repo-tag">{CLASE_LABEL[it.clase]}</span></td>
                              <td className="muted">{it.stock}</td>
                              <td className="muted">{it.vendidas}</td>
                              <td className="muted">{isFinite(it.diasRestantes) ? `${Math.floor(it.diasRestantes)}d` : "—"}</td>
                              <td style={{ fontWeight: 700 }}>{it.sugerido}</td>
                              <td className="muted">{it.costoUnit > 0 ? COP(it.costoUnit) : "—"}</td>
                              <td><span className="rd-money">{COP(it.costoEst)}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}

                {reposicion.ordenGrupos.length > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0", borderTop: "2px solid var(--border)", marginTop: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>TOTAL ORDEN ({reposicion.unidadesOrden} uds)</span>
                    <span className="rd-money" style={{ fontSize: 16, fontWeight: 700, color: "var(--p)" }}>{COP(reposicion.totalOrden)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ═══ SECCIÓN 3 — Diagnóstico de portafolio ═════════════════ */}
            <h3 className="rd-repo-section-title" style={{ marginTop: 24 }}>
              <span className="num">3</span>Diagnóstico de portafolio
            </h3>

            <div className="rd-card">
              <CardHd
                icon={BarChart2}
                title="Matriz ABC × Patrón de demanda"
                sub="Cada celda: # productos · % del margen que generan"
              />
              <div className="rd-card-body">
                <div className="rd-matrix">
                  <div className="rd-matrix-hd" />
                  <div className="rd-matrix-hd">{PATRON_LABEL.X}</div>
                  <div className="rd-matrix-hd">{PATRON_LABEL.Y}</div>
                  <div className="rd-matrix-hd">{PATRON_LABEL.Z}</div>
                  {(["A", "B", "C"] as Clase[]).flatMap(c => [
                    <div className="rd-matrix-hd" key={`h-${c}`}>{CLASE_LABEL[c]}</div>,
                    ...(["X", "Y", "Z"] as Patron[]).map(p => {
                      const cell = reposicion.matriz[c][p]
                      const pct  = reposicion.margenTotalGlobal > 0 ? (cell.margen / reposicion.margenTotalGlobal) * 100 : 0
                      return (
                        <div className="rd-matrix-cell" key={`${c}-${p}`}>
                          <div className="rd-matrix-cnt">{cell.count}</div>
                          <div className="rd-matrix-pct">{pct.toFixed(0)}% margen</div>
                        </div>
                      )
                    }),
                  ])}
                </div>
                <div className="rd-matrix-legend">
                  <div><strong>{CLASE_LABEL.A}</strong> · 80% del margen · cobertura {REPO_CFG.cobertura.A}d · servicio 98%</div>
                  <div><strong>{PATRON_LABEL.X}</strong> · demanda predecible · menor stock de seguridad</div>
                  <div><strong>{CLASE_LABEL.B}</strong> · 15% del margen · cobertura {REPO_CFG.cobertura.B}d · servicio 95%</div>
                  <div><strong>{PATRON_LABEL.Y}</strong> · variabilidad moderada</div>
                  <div><strong>{CLASE_LABEL.C}</strong> · 5% del margen · cobertura {REPO_CFG.cobertura.C}d · servicio 90%</div>
                  <div><strong>{PATRON_LABEL.Z}</strong> · demanda errática · pedir poquito y seguido</div>
                </div>
              </div>
            </div>

            <div className="rd-g2">
              <div className="rd-card" style={{ margin: 0 }}>
                <CardHd icon={AlertTriangle} title="Ventas perdidas" sub="Dinero que se escapó por agotarse" />
                <div className="rd-card-body">
                  {reposicion.ventasPerdidas.length === 0 ? (
                    <div className="rd-empty"><p className="rd-empty-t">Sin ventas perdidas detectadas</p></div>
                  ) : (
                    <>
                      <p style={{ margin: "0 0 10px", fontSize: 12 }}>
                        Total estimado: <strong className="rd-money">{COP(reposicion.ventasPerdidas.reduce((s, f) => s + f.dineroPerdido, 0))}</strong>
                      </p>
                      <div className="rd-nm-grid">
                        {reposicion.ventasPerdidas.slice(0, 10).map((f, i) => (
                          <div key={i} className="rd-nm-item">
                            <div>
                              <p className="rd-nm-name">{f.name}</p>
                              <p className="rd-nm-meta">{f.diasSinStock}d sin stock · {f.ventasPerdidasUds} uds perdidas</p>
                            </div>
                            <span className="rd-money">{COP(f.dineroPerdido)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="rd-card" style={{ margin: 0 }}>
                <CardHd icon={Package} title="Capital dormido" sub="Sobrestock o sin venta en 60+ días" />
                <div className="rd-card-body">
                  {reposicion.dormidos.length === 0 ? (
                    <div className="rd-empty"><p className="rd-empty-t">Sin capital dormido</p></div>
                  ) : (
                    <>
                      <p style={{ margin: "0 0 10px", fontSize: 12 }}>
                        Total inmovilizado: <strong className="rd-money">{COP(reposicion.capitalDormidoTotal)}</strong>
                      </p>
                      <div className="rd-nm-grid">
                        {reposicion.dormidos.slice(0, 10).map((f, i) => (
                          <div key={i} className="rd-nm-item">
                            <div>
                              <p className="rd-nm-name">{f.name}</p>
                              <p className="rd-nm-meta">
                                {f.stock} uds · {isFinite(f.diasRestantes) ? `${Math.floor(f.diasRestantes)}d cobertura` : "sin venta en el periodo"}
                              </p>
                            </div>
                            <span className="rd-money">{COP(f.capitalDormido)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="rd-card">
              <CardHd icon={BarChart2} title="Distribución de cobertura" sub="Cuántos productos te duran X días de stock" />
              <div className="rd-card-body">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={reposicion.histograma}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,26,24,.06)" />
                    <XAxis dataKey="bucket" tick={{ fontSize: 10, fill: "rgba(26,26,24,.4)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "rgba(26,26,24,.4)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<Tt />} />
                    <Bar dataKey="count" name="Productos" radius={[2, 2, 0, 0]}>
                      {reposicion.histograma.map((_, i) => (
                        <Cell key={i} fill={i <= 1 ? "#dc2626" : i === 2 ? "#d97706" : i <= 4 ? "#16a34a" : "#9ca3af"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 8 }}>
                  Ideal: concentración en 16–60 días. Mucho en 0–7 = subabastecido · mucho en +90 = sobrestock.
                </p>
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

                {reposicion.agotados.length > 0 && (
                  <div className="rd-alert danger">
                    <ShoppingBag size={15} style={{ color:"#dc2626" }}/>
                    <div>
                      <p className="rd-alert-title">🛒 Productos vendidos sin stock</p>
                      <p className="rd-alert-body">
                        {reposicion.agotados.length} productos que vendiste en el rango seleccionado ({days} días) están agotados. Costo estimado de reposición: <strong>{COP(reposicion.agotados.reduce((s,f) => s+f.costoEst, 0))}</strong>
                      </p>
                      <div className="rd-tags">
                        {reposicion.agotados.slice(0,5).map((f,i) => (
                          <span key={i} className="rd-tag danger">{f.name} ({f.vendidas}u vendidas)</span>
                        ))}
                      </div>
                      <p className="rd-alert-hint">
                        → Revisa la pestaña <button style={{ background:"none", border:"none", color:"var(--p)", cursor:"pointer", padding:0, fontWeight:600, fontSize:"inherit", fontFamily:"inherit" }} onClick={() => setTab("reposicion")}>Reposición</button> para ver la orden de compra sugerida
                      </p>
                    </div>
                  </div>
                )}

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
