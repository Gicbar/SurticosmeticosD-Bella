"use client"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Barcode, Plus, Minus, Trash2, ShoppingCart, Search,
  CreditCard, Receipt, ChevronsUpDown, Check, Package,
  Clock, Layers,                  // Layers = icono kit
} from "lucide-react"
import { useRouter } from "next/navigation"
import { showSuccess, showError, showWarning, showInput } from "@/lib/sweetalert"

// ── CSS del POS ───────────────────────────────────────────────────────────────
const POS_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

  .pos-root {
    font-family: 'DM Sans', sans-serif;
    --pos-p:      var(--primary, #984ca8);
    --pos-p10:    rgba(var(--primary-rgb, 152,76,168), 0.10);
    --pos-p20:    rgba(var(--primary-rgb, 152,76,168), 0.20);
    --pos-txt:    #1a1a18;
    --pos-muted:  rgba(26,26,24,0.45);
    --pos-border: rgba(26,26,24,0.08);
    --pos-hover:  rgba(26,26,24,0.03);
    /* Crédito — ámbar */
    --pos-credit:    #b45309;
    --pos-credit-bg: rgba(180,83,9,0.07);
    --pos-credit-br: rgba(180,83,9,0.30);
  }

  .pos-grid { display: grid; gap: 16px; grid-template-columns: 1fr; }
  @media (min-width: 1024px) {
    .pos-grid { grid-template-columns: 1fr 340px; align-items: start; }
  }

  .pos-left  { display: flex; flex-direction: column; gap: 16px; }
  .pos-right { display: flex; flex-direction: column; gap: 16px; }

  /* ── Card ── */
  .pos-card { background: #fff; border: 1px solid var(--pos-border); overflow: hidden; }
  .pos-card-hd {
    padding: 14px 18px 12px; border-bottom: 1px solid var(--pos-border);
    display: flex; align-items: center; gap: 8px;
  }
  .pos-card-hd-icon {
    width: 26px; height: 26px; background: var(--pos-p10);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .pos-card-hd-icon svg { color: var(--pos-p); width: 13px; height: 13px; }
  .pos-card-title {
    font-size: 11px; font-weight: 600; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--pos-txt); margin: 0;
  }
  .pos-card-body { padding: 16px 18px; }

  /* ── Inputs ── */
  .pos-label {
    display: block; font-size: 9px; font-weight: 600;
    letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--pos-muted); margin-bottom: 6px;
  }
  .pos-input-wrap { position: relative; display: flex; align-items: center; }
  .pos-input-icon {
    position: absolute; left: 12px; z-index: 1;
    color: var(--pos-muted); pointer-events: none; display: flex; align-items: center;
  }
  .pos-input {
    width: 100%; height: 44px; padding: 0 14px 0 40px;
    border: 1px solid var(--pos-border); background: #fff;
    font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--pos-txt);
    outline: none; transition: border-color 0.15s; -webkit-appearance: none;
  }
  .pos-input:focus { border-color: var(--pos-p); }
  .pos-input.barcode { height: 54px; font-size: 15px; }

  .pos-add-btn {
    height: 54px; padding: 0 20px; background: var(--pos-p);
    border: none; cursor: pointer; color: #fff;
    font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600;
    letter-spacing: 0.06em; text-transform: uppercase; white-space: nowrap;
    display: flex; align-items: center; gap: 6px; flex-shrink: 0; transition: opacity 0.15s;
  }
  .pos-add-btn:hover  { opacity: 0.88; }
  .pos-add-btn:active { opacity: 0.75; }
  .pos-barcode-row { display: flex; gap: 8px; align-items: flex-end; }
  .pos-barcode-row .pos-input-wrap { flex: 1; }

  .pos-search-results {
    border: 1px solid var(--pos-border); background: #fff;
    max-height: 200px; overflow-y: auto;
    box-shadow: 0 8px 24px rgba(26,26,24,0.08); -webkit-overflow-scrolling: touch;
  }
  .pos-search-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 11px 14px; border-bottom: 1px solid var(--pos-border);
    background: none; border-left: none; border-right: none; border-top: none;
    width: 100%; cursor: pointer; text-align: left; transition: background 0.12s; min-height: 44px;
  }
  .pos-search-item:hover { background: var(--pos-p10); }
  .pos-search-item:last-child { border-bottom: none; }
  .pos-search-name  { font-size: 13px; font-weight: 400; color: var(--pos-txt); }
  .pos-search-price { font-size: 15px; font-weight: 600; color: var(--pos-p); font-family: 'Cormorant Garamond', Georgia, serif; }

  /* ── Carrito ── */
  .pos-cart-empty {
    padding: 40px 20px; text-align: center;
    display: flex; flex-direction: column; align-items: center; gap: 12px;
  }
  .pos-cart-empty-icon {
    width: 52px; height: 52px; background: var(--pos-p10);
    display: flex; align-items: center; justify-content: center; border-radius: 50%;
  }
  .pos-cart-empty-icon svg { color: var(--pos-p); opacity: 0.5; width: 22px; height: 22px; }
  .pos-cart-empty-title { font-size: 13px; font-weight: 500; color: var(--pos-txt); margin: 0; }
  .pos-cart-empty-sub   { font-size: 11px; color: var(--pos-muted); margin: 0; }

  .pos-cart-list { display: flex; flex-direction: column; gap: 0; }
  .pos-cart-item {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 18px; border-bottom: 1px solid var(--pos-border);
  }
  .pos-cart-item:last-child { border-bottom: none; }
  .pos-cart-info { flex: 1; min-width: 0; }
  .pos-cart-name { font-size: 13px; font-weight: 500; color: var(--pos-txt); margin: 0 0 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pos-cart-unit { font-size: 11px; color: var(--pos-muted); margin: 0; }

  .pos-qty-row { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
  .pos-qty-btn {
    width: 28px; height: 28px; border: 1px solid var(--pos-border);
    background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
    color: var(--pos-muted); transition: border-color 0.12s, color 0.12s, background 0.12s;
  }
  .pos-qty-btn:hover       { border-color: var(--pos-p);  color: var(--pos-p);  background: var(--pos-p10); }
  .pos-qty-btn.danger:hover{ border-color: #dc2626; color: #dc2626; background: rgba(220,38,38,0.05); }
  .pos-qty-num { font-size: 13px; font-weight: 700; color: var(--pos-txt); width: 24px; text-align: center; }
  .pos-cart-subtotal {
    font-size: 14px; font-weight: 600; color: var(--pos-p);
    font-family: 'Cormorant Garamond', Georgia, serif;
    min-width: 72px; text-align: right; flex-shrink: 0;
  }
  .pos-cart-remove {
    width: 28px; height: 28px; border: none; background: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: rgba(26,26,24,0.22); transition: color 0.12s; flex-shrink: 0;
  }
  .pos-cart-remove:hover { color: #dc2626; }

  @media (max-width: 480px) {
    .pos-cart-subtotal { min-width: 60px; font-size: 13px; }
    .pos-cart-item { padding: 10px 14px; gap: 8px; }
  }

  /* ── Panel derecho ── */
  .pos-select-trigger {
    width: 100%; height: 44px; border: 1px solid var(--pos-border); background: #fff;
    padding: 0 14px; font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--pos-txt);
    display: flex; align-items: center; justify-content: space-between;
    cursor: pointer; outline: none; transition: border-color 0.15s;
  }
  .pos-select-trigger:focus,
  .pos-select-trigger[data-open="true"] { border-color: var(--pos-p); }
  .pos-select-dropdown {
    border: 1px solid var(--pos-border); background: #fff;
    box-shadow: 0 8px 24px rgba(26,26,24,0.08);
    max-height: 240px; overflow-y: auto; z-index: 10000; -webkit-overflow-scrolling: touch;
  }
  .pos-select-search {
    width: 100%; padding: 10px 14px; border: none;
    border-bottom: 1px solid var(--pos-border);
    font-family: 'DM Sans', sans-serif; font-size: 12px; outline: none; background: #fff; color: var(--pos-txt);
  }
  .pos-select-option {
    padding: 11px 14px; cursor: pointer; font-size: 13px; color: var(--pos-txt);
    display: flex; align-items: center; justify-content: space-between;
    min-height: 44px; transition: background 0.12s;
  }
  .pos-select-option:hover { background: var(--pos-p10); }
  .pos-select-empty { padding: 16px 14px; font-size: 12px; color: var(--pos-muted); text-align: center; }

  .pos-payment-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .pos-payment-btn {
    padding: 10px 8px; border: 1.5px solid var(--pos-border); background: #fff; cursor: pointer;
    display: flex; flex-direction: column; align-items: center; gap: 5px;
    transition: border-color 0.15s, background 0.15s; min-height: 64px; justify-content: center;
  }
  .pos-payment-btn:hover    { border-color: var(--pos-p20); background: var(--pos-p10); }
  .pos-payment-btn.selected { border-color: var(--pos-p);   background: var(--pos-p10); }
  .pos-payment-btn svg { color: var(--pos-muted); width: 16px; height: 16px; }
  .pos-payment-btn.selected svg { color: var(--pos-p); }
  .pos-payment-label { font-size: 10px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: var(--pos-muted); }
  .pos-payment-btn.selected .pos-payment-label { color: var(--pos-p); }

  /* ═══ TOGGLE CRÉDITO ═══════════════════════════════════════════════════════ */
  .pos-credit-row {
    display: flex; align-items: stretch; gap: 0;
    border: 1.5px solid var(--pos-border);
    overflow: hidden; cursor: pointer;
    transition: border-color 0.18s;
    user-select: none;
  }
  .pos-credit-row:hover { border-color: var(--pos-credit-br); }
  .pos-credit-row.on    { border-color: var(--pos-credit); }

  /* Franja izquierda de color */
  .pos-credit-stripe {
    width: 4px; flex-shrink: 0;
    background: var(--pos-border);
    transition: background 0.18s;
  }
  .pos-credit-row.on .pos-credit-stripe { background: var(--pos-credit); }

  /* Cuerpo */
  .pos-credit-body {
    flex: 1; display: flex; align-items: center; gap: 12px;
    padding: 12px 14px; background: #fff; transition: background 0.18s;
  }
  .pos-credit-row.on .pos-credit-body { background: var(--pos-credit-bg); }

  /* Checkbox visual */
  .pos-credit-check {
    width: 18px; height: 18px; flex-shrink: 0;
    border: 1.5px solid var(--pos-border);
    display: flex; align-items: center; justify-content: center;
    transition: border-color 0.18s, background 0.18s; background: #fff;
  }
  .pos-credit-row.on .pos-credit-check {
    border-color: var(--pos-credit); background: var(--pos-credit);
  }
  .pos-credit-check svg { color: #fff; }

  /* Texto */
  .pos-credit-texts { flex: 1; min-width: 0; }
  .pos-credit-lbl {
    font-size: 12px; font-weight: 600; color: var(--pos-txt); margin: 0 0 1px;
    transition: color 0.18s;
  }
  .pos-credit-row.on .pos-credit-lbl { color: var(--pos-credit); }
  .pos-credit-hint { font-size: 10px; color: var(--pos-muted); margin: 0; }

  /* Icono derecho */
  .pos-credit-icon svg { color: var(--pos-muted); transition: color 0.18s; }
  .pos-credit-row.on .pos-credit-icon svg { color: var(--pos-credit); }

  /* ── Banner informativo cuando crédito está activo ── */
  .pos-credit-banner {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 14px; background: var(--pos-credit-bg);
    border-left: 3px solid var(--pos-credit);
  }
  .pos-credit-banner-txt {
    font-size: 11px; color: var(--pos-credit); font-weight: 500; margin: 0;
    line-height: 1.4;
  }

  /* ── Separador / totales ── */
  .pos-sep { height: 1px; background: var(--pos-border); margin: 4px 0; }

  .pos-totals { display: flex; flex-direction: column; gap: 8px; padding: 14px 0 4px; }
  .pos-total-row { display: flex; justify-content: space-between; align-items: baseline; }
  .pos-total-label { font-size: 11px; color: var(--pos-muted); text-transform: uppercase; letter-spacing: 0.1em; }
  .pos-total-val   { font-size: 13px; font-weight: 500; color: var(--pos-txt); }
  .pos-total-row.main .pos-total-label { font-size: 12px; font-weight: 600; color: var(--pos-txt); }
  .pos-total-row.main .pos-total-val {
    font-size: 22px; font-weight: 500; color: var(--pos-p);
    font-family: 'Cormorant Garamond', Georgia, serif;
  }
  .pos-total-row.main.credit .pos-total-val { color: var(--pos-credit); }

  /* ── Botón checkout ── */
  .pos-checkout-btn {
    width: 100%; height: 52px; background: var(--pos-p);
    border: none; cursor: pointer; color: #fff;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
    letter-spacing: 0.1em; text-transform: uppercase;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: opacity 0.15s, background 0.18s; margin-top: 8px;
  }
  .pos-checkout-btn.credit { background: var(--pos-credit); }
  .pos-checkout-btn:hover:not(:disabled) { opacity: 0.88; }
  .pos-checkout-btn:disabled { opacity: 0.45; cursor: not-allowed; }


  /* ── Kit badge en carrito ── */
  .pos-kit-badge {
    display:inline-flex; align-items:center; gap:4px;
    padding:1px 7px; font-size:9px; font-weight:700; letter-spacing:.08em;
    text-transform:uppercase; margin-left:6px;
    background:rgba(var(--primary-rgb,152,76,168),.10);
    color:var(--pos-p);
  }
  .pos-kit-badge svg { width:9px; height:9px; }

  /* ── Kit en resultados búsqueda barcode ── */
  .pos-kit-item {
    display:flex; align-items:center; justify-content:space-between;
    padding:11px 14px; background:var(--pos-p10);
    border-bottom:1px solid var(--pos-border); gap:10px;
  }
  .pos-kit-info { flex:1; min-width:0; }
  .pos-kit-name { font-size:13px; font-weight:600; color:var(--pos-p); margin:0 0 3px; }
  .pos-kit-detail { font-size:10px; color:var(--pos-muted); margin:0; }
  .pos-kit-load-btn {
    height:38px; padding:0 14px; background:var(--pos-p); border:none; cursor:pointer;
    font-family:'DM Sans',sans-serif; font-size:11px; font-weight:600;
    letter-spacing:.06em; text-transform:uppercase; color:#fff;
    display:flex; align-items:center; gap:5px; flex-shrink:0; transition:opacity .15s;
  }
  .pos-kit-load-btn:hover { opacity:.88; }
  .pos-kit-load-btn svg { width:11px; height:11px; }

  .pos-spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3); border-top-color: white;
    border-radius: 50%; animation: pos-spin 0.7s linear infinite;
  }
  @keyframes pos-spin { to { transform: rotate(360deg); } }

  /* Badge en header carrito */
  .pos-hd-badge {
    font-size: 10px; font-weight: 700; padding: 2px 8px; letter-spacing: 0.06em;
  }
`

// ── Tipos ─────────────────────────────────────────────────────────────────────
type CartItem = {
  product_id: string; name: string; barcode: string | null
  quantity: number; unit_price: number; subtotal: number
  fromKit?: string   // nombre del kit del que proviene (opcional)
}
type Product = { id: string; name: string; barcode: string | null; sale_price: number }
type KitPreview = {
  id: string; code: number; name: string
  items: { product_id: string; name: string; quantity: number; unit_price_in_kit: number }[]
  // Datos extras de pedidos del catálogo
  is_catalog_order?: boolean
  catalog_status?: "PENDIENTE" | "RECLAMADO" | "EXPIRADO" | null
  client_name?: string | null
  client_phone?: string | null
  expires_at?: string | null
  reclaimed_at?: string | null
  cancellation_reason?: string | null
}
type Client  = { id: string; name: string }

// ── ClientCombobox ────────────────────────────────────────────────────────────
function ClientCombobox({ clients, value, onChange }: {
  clients: Client[]; value: string; onChange: (v: string) => void
}) {
  const [open, setOpen]   = useState(false)
  const [search, setSearch] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", fn)
    return () => document.removeEventListener("mousedown", fn)
  }, [])

  const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
  const selected = clients.find(c => c.id === value)

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button type="button" className="pos-select-trigger"
        onClick={() => setOpen(o => !o)} data-open={open} aria-expanded={open}>
        <span style={{ color: selected ? "var(--pos-txt)" : "var(--pos-muted)" }}>
          {selected?.name ?? "Selecciona un cliente"}
        </span>
        <ChevronsUpDown size={13} style={{ color: "rgba(26,26,24,0.3)", flexShrink: 0 }} />
      </button>
      {open && (
        <div className="pos-select-dropdown" style={{ position: "absolute", top: "100%", left: 0, right: 0 }}>
          <input autoFocus className="pos-select-search" placeholder="Buscar cliente..."
            value={search} onChange={e => setSearch(e.target.value)} />
          {filtered.length === 0
            ? <div className="pos-select-empty">No se encontró el cliente</div>
            : filtered.map(c => (
              <div key={c.id} className="pos-select-option"
                onClick={() => { onChange(c.id); setOpen(false); setSearch("") }}>
                {c.name}
                {value === c.id && <Check size={12} style={{ color: "var(--pos-p)" }} />}
              </div>
            ))
          }
        </div>
      )}
    </div>
  )
}

// ── POSInterface ──────────────────────────────────────────────────────────────
interface POSInterfaceProps { companyId: string }

export function POSInterface({ companyId }: POSInterfaceProps) {
  const router = useRouter()
  const barcodeRef = useRef<HTMLInputElement>(null)

  const [cart, setCart]                         = useState<CartItem[]>([])
  const [barcodeInput, setBarcodeInput]         = useState("")
  const [nameSearch, setNameSearch]             = useState("")
  const [selectedClient, setSelectedClient]     = useState("")
  const [paymentMethod, setPaymentMethod]       = useState("efectivo")
  const [isCredit, setIsCredit]                 = useState(false)    // ← NUEVO
  const [isProcessing, setIsProcessing]         = useState(false)
  const [products, setProducts]                 = useState<Product[]>([])
  const [clients, setClients]                   = useState<Client[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [kitPreview, setKitPreview]             = useState<KitPreview | null>(null)
  const [loadingKit, setLoadingKit]             = useState(false)
  // Si el carrito proviene de un pedido del catálogo, lo marcamos como RECLAMADO al cobrar
  const [activeCatalogOrderId, setActiveCatalogOrderId] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      const supabase = createClient()
      const [{ data: prod }, { data: cli }] = await Promise.all([
        supabase.from("products").select("id, name, barcode, sale_price").eq("company_id", companyId),
        supabase.from("clients").select("id, name").eq("company_id", companyId),
      ])
      setProducts(prod || [])
      setClients(cli || [])
    })()
  }, [companyId])

  useEffect(() => {
    if (nameSearch.trim())
      setFilteredProducts(products.filter(p => p.name.toLowerCase().includes(nameSearch.toLowerCase())).slice(0, 10))
    else setFilteredProducts([])
  }, [nameSearch, products])

  useEffect(() => { barcodeRef.current?.focus() }, [cart])

  const fmt = (v: number) =>
    v.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })

  const checkStock = async (items: CartItem[]) => {
    const supabase = createClient()
    for (const item of items) {
      const { data: batches } = await supabase.from("purchase_batches")
        .select("remaining_quantity").eq("product_id", item.product_id)
        .eq("company_id", companyId).gt("remaining_quantity", 0)
      const avail = batches?.reduce((s, b) => s + (b.remaining_quantity || 0), 0) || 0
      if (avail < item.quantity) return `Stock insuficiente para ${item.name} (disponible: ${avail})`
    }
    return null
  }

  // Buscar kit por código numérico — incluye también pedidos del catálogo
  const lookupKit = async (codeStr: string) => {
    const codeNum = parseInt(codeStr)
    if (isNaN(codeNum) || codeNum <= 0) return null
    const supabase = createClient()
    const { data } = await supabase
      .from("product_kits")
      .select(`
        id, code, name, is_active,
        is_catalog_order, catalog_status, client_name, client_phone,
        expires_at, reclaimed_at, cancellation_reason,
        product_kit_items (
          product_id, quantity, unit_price_in_kit,
          products ( name )
        )
      `)
      .eq("company_id", companyId)
      .eq("code", codeNum)
      .single()
    if (!data) return null
    // Para kits "del negocio", respetamos el flag is_active
    if (!data.is_catalog_order && !data.is_active) return null
    return {
      id:               data.id,
      code:             data.code,
      name:             data.name,
      is_catalog_order:    data.is_catalog_order,
      catalog_status:      data.catalog_status,
      client_name:         data.client_name,
      client_phone:        data.client_phone,
      expires_at:          data.expires_at,
      reclaimed_at:        data.reclaimed_at,
      cancellation_reason: data.cancellation_reason,
      items: data.product_kit_items.map((i: any) => ({
        product_id:        i.product_id,
        name:              i.products?.name ?? "—",
        quantity:          i.quantity,
        unit_price_in_kit: Number(i.unit_price_in_kit),
      })),
    } as KitPreview
  }

  const handleBarcode = async (e: React.FormEvent) => {
    e.preventDefault()
    const raw = barcodeInput.trim()
    if (!raw) return

    // 1) Intentar como código de barras de producto primero
    const product = products.find(p => p.barcode === raw)
    if (product) { addToCart(product); setBarcodeInput(""); return }

    // 2) Si es numérico puro, buscar como código de kit (o pedido del catálogo)
    if (/^\d+$/.test(raw)) {
      setLoadingKit(true)
      const kit = await lookupKit(raw)
      setLoadingKit(false)
      if (kit) {
        // Validar estados de pedidos del catálogo antes de mostrarlo
        if (kit.is_catalog_order) {
          if (kit.catalog_status === "RECLAMADO") {
            const f = kit.reclaimed_at
              ? new Date(kit.reclaimed_at).toLocaleString("es-CO", { timeZone: "America/Bogota" })
              : ""
            showError("Pedido ya cobrado", `Este pedido del catálogo fue cobrado el ${f}.`)
            setBarcodeInput("")
            return
          }
          // Pedido invalidado por cancelación de campaña → bloquear con mensaje específico
          if (kit.catalog_status === "EXPIRADO" && kit.cancellation_reason) {
            showError(
              "Pedido no válido",
              `${kit.cancellation_reason}. El cliente debe generar un nuevo pedido en el catálogo.`
            )
            setBarcodeInput("")
            return
          }
          // Vencimiento normal por fecha
          if (kit.catalog_status === "EXPIRADO" ||
              (kit.expires_at && new Date(kit.expires_at) < new Date())) {
            const f = kit.expires_at
              ? new Date(kit.expires_at).toLocaleString("es-CO", { timeZone: "America/Bogota" })
              : ""
            showWarning(
              "Pedido vencido",
              `Este pedido venció el ${f}. Puedes cargarlo igualmente; revisa con el cliente si aceptan precios actuales.`
            )
            // Permitimos cargarlo: el cajero decide
          }
        }
        setKitPreview(kit)
        setBarcodeInput("")
        return
      }
    }

    showWarning("No encontrado", "No existe producto ni kit con ese código")
    setBarcodeInput("")
  }

  const addKitToCart = (kit: KitPreview) => {
    setCart(prev => {
      let next = [...prev]
      for (const item of kit.items) {
        const ex = next.find(i => i.product_id === item.product_id)
        if (ex) {
          next = next.map(i => i.product_id === item.product_id
            ? { ...i,
                quantity: i.quantity + item.quantity,
                subtotal: (i.quantity + item.quantity) * i.unit_price }
            : i)
        } else {
          next.push({
            product_id: item.product_id,
            name:       item.name,
            barcode:    null,
            quantity:   item.quantity,
            unit_price: item.unit_price_in_kit,
            subtotal:   item.unit_price_in_kit * item.quantity,
            fromKit:    kit.name,
          } as any)
        }
      }
      return next
    })
    // Si es un pedido del catálogo PENDIENTE, lo marcamos como activo para
    // que al completar la venta se actualice catalog_status='RECLAMADO'.
    if (kit.is_catalog_order && kit.catalog_status === "PENDIENTE") {
      setActiveCatalogOrderId(kit.id)
    }
    setKitPreview(null)
  }

  const addToCart = (product: Product) => {
    setCart(prev => {
      const ex = prev.find(i => i.product_id === product.id)
      if (ex) return prev.map(i => i.product_id === product.id
        ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unit_price } : i)
      return [...prev, {
        product_id: product.id, name: product.name, barcode: product.barcode,
        quantity: 1, unit_price: Number(product.sale_price), subtotal: Number(product.sale_price),
      }]
    })
    setNameSearch("")
  }

  const updateQty = (id: string, delta: number) =>
    setCart(prev => prev
      .map(i => i.product_id === id
        ? { ...i, quantity: i.quantity + delta, subtotal: (i.quantity + delta) * i.unit_price }
        : i)
      .filter(i => i.quantity > 0))

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.product_id !== id))
  const total = cart.reduce((s, i) => s + i.subtotal, 0)

  // Toggle crédito — si activa crédito, el método de pago no aplica
  const toggleCredit = () => setIsCredit(v => !v)

  const handleCheckout = async () => {
    if (!cart.length)      return showWarning("El carrito está vacío", "")
    if (!selectedClient)   return showWarning("Selecciona un cliente", "")

    let amountGiven = 0, change = 0
    // Si no es crédito y pagan en efectivo → pedir monto
    if (!isCredit && paymentMethod === "efectivo") {
      const input = await showInput("Pago en Efectivo", `Total: ${fmt(total)} — Ingresa el monto recibido`, "number")
      if (input === null) return
      amountGiven = parseFloat(input)
      if (isNaN(amountGiven) || amountGiven < total) return showError("Monto insuficiente", "")
      change = amountGiven - total
    }

    const stockError = await checkStock(cart)
    if (stockError) return showWarning("Stock insuficiente", stockError)

    setIsProcessing(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No autenticado")

      // ── Insertar venta (con is_credit) ────────────────────────────────────
      const { data: sale, error: saleErr } = await supabase.from("sales")
        .insert({
          client_id:      selectedClient,
          total,
          payment_method: isCredit ? "credito" : paymentMethod,
          is_credit:      isCredit,
          created_by:     user.id,
          company_id:     companyId,
        })
        .select().single()
      if (saleErr) throw saleErr

      // ── Descontar stock y registrar movimientos ───────────────────────────
      let totalCost = 0
      for (const item of cart) {
        const { data: batches } = await supabase.from("purchase_batches")
          .select("*").eq("product_id", item.product_id).eq("company_id", companyId)
          .gt("remaining_quantity", 0).order("purchase_date", { ascending: true })
        if (!batches?.length) throw new Error(`Sin stock: ${item.name}`)

        let remaining = item.quantity
        for (const batch of batches) {
          if (remaining <= 0) break
          const qty = Math.min(batch.remaining_quantity, remaining)
          await supabase.from("purchase_batches")
            .update({ remaining_quantity: batch.remaining_quantity - qty })
            .eq("id", batch.id).eq("company_id", companyId)
          await supabase.from("sale_items").insert({
            sale_id: sale.id, product_id: item.product_id, batch_id: batch.id,
            quantity: qty, unit_price: item.unit_price, subtotal: qty * item.unit_price,
            company_id: companyId,
          })
          totalCost += qty * Number(batch.purchase_price)
          remaining -= qty
        }
        if (remaining > 0) throw new Error(`Stock insuficiente: ${item.name}`)
        await supabase.from("inventory_movements").insert({
          product_id: item.product_id, movement_type: "salida",
          quantity: item.quantity, reason: `Venta #${sale.id}`,
          created_by: user.id, company_id: companyId,
        })
      }

      // ── Rentabilidad ──────────────────────────────────────────────────────
      const profit = total - totalCost
      await supabase.from("sales_profit").insert({
        sale_id: sale.id, total_cost: totalCost, total_sale: total, profit,
        profit_margin: total > 0 ? (profit / total) * 100 : 0, company_id: companyId,
      })

      // ── Si es crédito → crear deuda ───────────────────────────────────────
      if (isCredit) {
        const { error: debtErr } = await supabase.from("customer_debts").insert({
          company_id:      companyId,
          sale_id:         sale.id,
          client_id:       selectedClient,
          original_amount: total,
          status:          "pending",
          created_by:      user.id,
        })
        if (debtErr) throw debtErr
      }

      // ── Si la venta venía de un pedido del catálogo, marcarlo como RECLAMADO
      if (activeCatalogOrderId) {
        const { error: claimErr } = await supabase.rpc("rpc_marcar_pedido_reclamado", {
          p_kit_id:  activeCatalogOrderId,
          p_sale_id: sale.id,
        })
        if (claimErr) {
          // No bloqueamos la venta si esto falla — solo lo registramos
          console.error("No se pudo marcar el pedido como reclamado:", claimErr)
        }
      }

      // ── Reset y feedback ──────────────────────────────────────────────────
      setCart([])
      setSelectedClient("")
      setPaymentMethod("efectivo")
      setIsCredit(false)
      setActiveCatalogOrderId(null)

      const msg = isCredit
        ? `Deuda de ${fmt(total)} registrada para el cliente`
        : change > 0
          ? `Total: ${fmt(total)} | Cambio: ${fmt(change)}`
          : `Total: ${fmt(total)}`
      const title = isCredit ? "Venta a crédito registrada" : "¡Venta completada!"

      await showSuccess(msg, title)
      router.refresh()
    } catch (err) {
      showError(err instanceof Error ? err.message : "Error al procesar", "Error")
    } finally { setIsProcessing(false) }
  }

  const payMethods = [
    { key: "efectivo",      label: "Efectivo",      icon: <Receipt size={16} /> },
    { key: "tarjeta",       label: "Tarjeta",        icon: <CreditCard size={16} /> },
    { key: "transferencia", label: "Transferencia",  icon: <Receipt size={16} /> },
  ]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: POS_CSS }} />
      <div className="pos-root">
        <div className="pos-grid">

          {/* ── Columna izquierda ─────────────────────────────────────────── */}
          <div className="pos-left">

            {/* Escáner */}
            <div className="pos-card">
              <div className="pos-card-hd">
                <div className="pos-card-hd-icon"><Barcode /></div>
                <p className="pos-card-title">Escáner de productos</p>
              </div>
              <div className="pos-card-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label className="pos-label">Código de barras</label>
                  <form onSubmit={handleBarcode}>
                    <div className="pos-barcode-row">
                      <div className="pos-input-wrap">
                        <span className="pos-input-icon"><Barcode size={15} /></span>
                        <input ref={barcodeRef} className="pos-input barcode"
                          placeholder="Escanea o ingresa código..."
                          value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)}
                          autoComplete="off" />
                      </div>
                      <button type="submit" className="pos-add-btn" disabled={loadingKit}>
                        {loadingKit
                          ? <><div className="pos-spinner" style={{width:12,height:12}} />Buscando…</>
                          : <><Plus size={14} />Agregar</>
                        }
                      </button>
                    </div>
                  </form>
                </div>

                {/* Kit preview — aparece cuando se detecta un kit por código */}
                {kitPreview && (
                  <div className="pos-kit-item" style={{
                    marginTop: 4,
                    flexWrap: kitPreview.is_catalog_order ? "wrap" : undefined,
                    background: kitPreview.is_catalog_order
                      ? "rgba(22,163,74,.07)" : "var(--pos-p10)",
                  }}>
                    <div className="pos-kit-info">
                      <p className="pos-kit-name" style={{
                        color: kitPreview.is_catalog_order ? "#16a34a" : undefined,
                      }}>
                        <Layers size={12} style={{verticalAlign:"middle",marginRight:5}} aria-hidden />
                        {kitPreview.is_catalog_order
                          ? `Pedido del catálogo #${kitPreview.code}`
                          : `Kit #${kitPreview.code} — ${kitPreview.name}`}
                      </p>
                      <p className="pos-kit-detail">
                        {kitPreview.items.map(i =>
                          `${i.name} ×${i.quantity}`
                        ).join(" · ")}
                      </p>
                      {kitPreview.is_catalog_order && (
                        <p className="pos-kit-detail" style={{ marginTop: 4, color: "#16a34a", fontWeight: 600 }}>
                          {kitPreview.client_name || kitPreview.client_phone
                            ? `Cliente: ${[kitPreview.client_name, kitPreview.client_phone].filter(Boolean).join(" · ")} · `
                            : ""}
                          {kitPreview.expires_at && (
                            <>Vence: {new Date(kitPreview.expires_at).toLocaleDateString("es-CO", { timeZone: "America/Bogota" })}</>
                          )}
                          {kitPreview.catalog_status && kitPreview.catalog_status !== "PENDIENTE" && (
                            <> · Estado: {kitPreview.catalog_status}</>
                          )}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      className="pos-kit-load-btn"
                      onClick={() => addKitToCart(kitPreview)}
                      style={kitPreview.is_catalog_order
                        ? { background: "#16a34a" }
                        : undefined}
                    >
                      <Plus size={11} aria-hidden />
                      {kitPreview.is_catalog_order ? "Cargar pedido" : "Cargar kit"}
                    </button>
                    <button
                      type="button"
                      style={{
                        border:"none", background:"none", cursor:"pointer",
                        color:"rgba(26,26,24,.35)", padding:"0 4px", fontSize:18, lineHeight:1,
                      }}
                      onClick={() => setKitPreview(null)}
                      aria-label="Cerrar"
                    >×</button>
                  </div>
                )}

                <div>
                  <label className="pos-label">Buscar por nombre</label>
                  <div className="pos-input-wrap">
                    <span className="pos-input-icon"><Search size={14} /></span>
                    <input className="pos-input" placeholder="Escribe para buscar productos..."
                      value={nameSearch} onChange={e => setNameSearch(e.target.value)}
                      autoComplete="off" />
                  </div>
                  {filteredProducts.length > 0 && (
                    <div className="pos-search-results" style={{ marginTop: 4 }}>
                      {filteredProducts.map(p => (
                        <button key={p.id} type="button" className="pos-search-item" onClick={() => addToCart(p)}>
                          <span className="pos-search-name">{p.name}</span>
                          <span className="pos-search-price">{fmt(Number(p.sale_price))}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Carrito */}
            <div className="pos-card">
              <div className="pos-card-hd">
                <div className="pos-card-hd-icon"><ShoppingCart /></div>
                <p className="pos-card-title">Carrito</p>
                {cart.length > 0 && (
                  <span className="pos-hd-badge" style={{ marginLeft: "auto", background: "var(--pos-p)", color: "white" }}>
                    {cart.length} {cart.length === 1 ? "ítem" : "ítems"}
                  </span>
                )}
                {/* Badge crédito activo */}
                {isCredit && (
                  <span className="pos-hd-badge" style={{
                    background: "var(--pos-credit-bg)", color: "var(--pos-credit)",
                    border: "1px solid var(--pos-credit-br)",
                    marginLeft: cart.length > 0 ? 6 : "auto",
                  }}>
                    A crédito
                  </span>
                )}
                {/* Badge pedido del catálogo activo */}
                {activeCatalogOrderId && (
                  <span className="pos-hd-badge" style={{
                    background: "rgba(22,163,74,.10)", color: "#16a34a",
                    border: "1px solid rgba(22,163,74,.25)",
                    marginLeft: 6,
                  }}>
                    Pedido catálogo
                  </span>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="pos-cart-empty">
                  <div className="pos-cart-empty-icon"><ShoppingCart /></div>
                  <p className="pos-cart-empty-title">El carrito está vacío</p>
                  <p className="pos-cart-empty-sub">Escanea o busca un producto para comenzar</p>
                </div>
              ) : (
                <div className="pos-cart-list">
                  {cart.map(item => (
                    <div key={item.product_id} className="pos-cart-item">
                      <div className="pos-cart-info">
                        <p className="pos-cart-name">
                          {item.name}
                          {(item as any).fromKit && (
                            <span className="pos-kit-badge">
                              <Layers aria-hidden />{(item as any).fromKit}
                            </span>
                          )}
                        </p>
                        <p className="pos-cart-unit">{fmt(item.unit_price)} c/u</p>
                      </div>
                      <div className="pos-qty-row">
                        <button className="pos-qty-btn danger" onClick={() => updateQty(item.product_id, -1)} aria-label="Reducir">
                          <Minus size={11} />
                        </button>
                        <span className="pos-qty-num">{item.quantity}</span>
                        <button className="pos-qty-btn" onClick={() => updateQty(item.product_id, 1)} aria-label="Aumentar">
                          <Plus size={11} />
                        </button>
                      </div>
                      <span className="pos-cart-subtotal">{fmt(item.subtotal)}</span>
                      <button className="pos-cart-remove" onClick={() => removeFromCart(item.product_id)} aria-label="Eliminar">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Columna derecha ───────────────────────────────────────────── */}
          <div className="pos-right">
            <div className="pos-card">
              <div className="pos-card-hd">
                <div className="pos-card-hd-icon"><Package /></div>
                <p className="pos-card-title">Detalles de venta</p>
              </div>
              <div className="pos-card-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Cliente */}
                <div>
                  <label className="pos-label">Cliente *</label>
                  <ClientCombobox clients={clients} value={selectedClient} onChange={setSelectedClient} />
                </div>

                {/* ═══ TOGGLE CRÉDITO ═══════════════════════════════════════ */}
                <div>
                  <label className="pos-label">Modalidad de pago</label>
                  <div
                    role="checkbox"
                    aria-checked={isCredit}
                    tabIndex={0}
                    className={`pos-credit-row${isCredit ? " on" : ""}`}
                    onClick={toggleCredit}
                    onKeyDown={e => (e.key === " " || e.key === "Enter") && toggleCredit()}
                  >
                    <div className="pos-credit-stripe" />
                    <div className="pos-credit-body">
                      <div className="pos-credit-check">
                        {isCredit && <Check size={11} strokeWidth={2.5} />}
                      </div>
                      <div className="pos-credit-texts">
                        <p className="pos-credit-lbl">
                          {isCredit ? "Venta a crédito" : "Pago al contado"}
                        </p>
                        <p className="pos-credit-hint">
                          {isCredit
                            ? "Se registra como deuda pendiente"
                            : "Activar si el cliente paga después"}
                        </p>
                      </div>
                      <div className="pos-credit-icon"><Clock size={14} /></div>
                    </div>
                  </div>

                  {/* Banner informativo cuando crédito activo */}
                  {isCredit && (
                    <div className="pos-credit-banner" style={{ marginTop: 8 }}>
                      <Clock size={13} style={{ color: "var(--pos-credit)", flexShrink: 0 }} />
                      <p className="pos-credit-banner-txt">
                        Esta venta se registrará como deuda pendiente de cobro.
                        Podrás gestionarla en <strong>Deudas de clientes</strong>.
                      </p>
                    </div>
                  )}
                </div>

                {/* Método de pago — se oculta si es crédito */}
                {!isCredit && (
                  <div>
                    <label className="pos-label">Método de pago *</label>
                    <div className="pos-payment-grid">
                      {payMethods.map(m => (
                        <button key={m.key} type="button"
                          className={`pos-payment-btn${paymentMethod === m.key ? " selected" : ""}`}
                          onClick={() => setPaymentMethod(m.key)}>
                          {m.icon}
                          <span className="pos-payment-label">{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pos-sep" />

                {/* Totales */}
                <div className="pos-totals">
                  <div className="pos-total-row">
                    <span className="pos-total-label">Subtotal</span>
                    <span className="pos-total-val">{fmt(total)}</span>
                  </div>
                  <div className={`pos-total-row main${isCredit ? " credit" : ""}`}>
                    <span className="pos-total-label">{isCredit ? "Deuda a registrar" : "Total"}</span>
                    <span className="pos-total-val">{fmt(total)}</span>
                  </div>
                </div>

                {/* Checkout */}
                <button
                  className={`pos-checkout-btn${isCredit ? " credit" : ""}`}
                  onClick={handleCheckout}
                  disabled={isProcessing || cart.length === 0}
                >
                  {isProcessing
                    ? <><div className="pos-spinner" />Procesando...</>
                    : isCredit
                      ? <><Clock size={15} />Registrar deuda</>
                      : <>Completar venta</>
                  }
                </button>

              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
