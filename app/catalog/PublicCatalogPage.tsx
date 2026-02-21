"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import {
  Search, X, ShoppingBag, Plus, Minus, ChevronDown,
  Sparkles, ArrowRight, Package
} from "lucide-react"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type CompanyInfo = {
  id: string
  name: string
  slug: string
  domain: string | null
  phone?: string | null
  logo_url?: string | null
  theme?: Record<string, string> | null
}

interface PublicCatalogPageProps {
  products: any[]
  categories: { name: string }[]
  company: CompanyInfo
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2)
}

function formatCOP(amount: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// ─── CSS Global inyectado una sola vez ───────────────────────────────────────

const CATALOG_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  .cat-root {
    font-family: 'DM Sans', sans-serif;
    background: #FAFAF8;
    min-height: 100vh;
    color: #1a1a18;
  }

  .cat-serif { font-family: 'Cormorant Garamond', Georgia, serif; }

  /* ── Header ─────────────────────────────────────────────────────── */
  .cat-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(250,250,248,0.92);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(26,26,24,0.08);
  }
  /* Inner: flex, gap controlado, altura reducida en móvil */
  .cat-header-inner {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 54px;
    gap: 12px;
  }
  @media (min-width: 640px) {
    .cat-header-inner { padding: 0 24px; height: 64px; }
  }
  /* Lado izquierdo: logo + nombre con truncate */
  .cat-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }
  .cat-logo {
    width: 32px; height: 32px;
    flex-shrink: 0;
    overflow: hidden;
    background: var(--primary);
    display: flex; align-items: center; justify-content: center;
  }
  .cat-company-name {
    font-size: 16px;
    font-weight: 400;
    line-height: 1;
    letter-spacing: 0.02em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: min(160px, 38vw);
  }
  @media (min-width: 480px) { .cat-company-name { max-width: 220px; font-size: 19px; } }
  .cat-company-sub {
    font-size: 8px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: rgba(26,26,24,0.45);
    margin-top: 2px;
  }
  /* Lado derecho */
  .cat-header-right {
    display: flex; align-items: center; gap: 14px; flex-shrink: 0;
  }
  .cat-ref-count {
    font-size: 11px; letter-spacing: 0.06em; color: rgba(26,26,24,0.45);
  }
  @media (max-width: 420px) { .cat-ref-count { display: none; } }
  /* Botón carrito — área táctil amplia */
  .cat-cart-btn {
    position: relative;
    background: none; border: none; cursor: pointer;
    padding: 8px;
    display: flex; align-items: center; justify-content: center;
    -webkit-tap-highlight-color: transparent;
  }
  .cat-cart-badge {
    position: absolute; top: 0; right: 0;
    background: var(--primary); color: white;
    font-size: 9px; font-weight: 700;
    width: 16px; height: 16px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 50%;
  }

  /* ── Card de producto ────────────────────────────────────────────── */
  .cat-card {
    position: relative;
    cursor: pointer;
    background: white;
    overflow: hidden;
    transition: transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94),
                box-shadow 0.4s ease;
    outline: 1px solid rgba(26,26,24,0.06);
    -webkit-tap-highlight-color: transparent;
  }
  /* Efectos hover sólo en dispositivos con puntero fino (desktop) */
  @media (hover: hover) and (pointer: fine) {
    .cat-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 16px 48px rgba(26,26,24,0.09);
      outline-color: transparent;
    }
    .cat-card:hover .cat-card-img { transform: scale(1.05); }
    .cat-card:hover .cat-card-info { background: color-mix(in oklch, var(--primary) 4%, white); }
    .cat-card:hover .cat-card-accent { opacity: 1; transform: scaleY(1); }
    .cat-card:hover .cat-add-btn-desktop { transform: translateY(0); }
  }

  .cat-card-img {
    transition: transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94);
    width: 100%; height: 100%; object-fit: cover;
  }

  .cat-card-accent {
    position: absolute; left: 0; top: 0; bottom: 0;
    width: 3px;
    background: var(--primary);
    opacity: 0; transform: scaleY(0.3); transform-origin: bottom;
    transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
    z-index: 2;
  }

  .cat-card-info {
    background: white;
    transition: background 0.35s ease;
    position: relative;
    padding: 10px 11px 12px;
  }
  @media (min-width: 640px) { .cat-card-info { padding: 12px 14px 14px; } }

  /* ── Botón añadir ───────────────────────────────────────────────── */
  /* DESKTOP: slide-up en hover */
  .cat-add-btn-desktop {
    position: absolute; bottom: 0; left: 0; right: 0;
    transform: translateY(100%);
    transition: transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94);
    background: var(--primary); color: white;
    display: none; /* oculto en móvil */
    align-items: center; justify-content: center; gap: 6px;
    padding: 10px; font-size: 11px; font-weight: 500;
    letter-spacing: 0.12em; text-transform: uppercase;
    cursor: pointer; border: none; width: 100%;
  }
  @media (hover: hover) and (pointer: fine) {
    .cat-add-btn-desktop { display: flex; }
  }

  /* MÓVIL: botón circular flotante siempre visible */
  .cat-add-btn-mobile {
    position: absolute; bottom: 8px; right: 8px;
    width: 34px; height: 34px; border-radius: 50%;
    background: var(--primary); color: white;
    display: flex; align-items: center; justify-content: center;
    border: none; cursor: pointer;
    box-shadow: 0 3px 12px rgba(0,0,0,0.18);
    transition: transform 0.15s ease, background 0.2s;
    -webkit-tap-highlight-color: transparent;
    z-index: 3;
  }
  .cat-add-btn-mobile:active { transform: scale(0.9); }
  /* Ocultar en desktop con hover */
  @media (hover: hover) and (pointer: fine) {
    .cat-add-btn-mobile { display: none; }
  }

  /* ── Chips de categoría ──────────────────────────────────────────── */
  .cat-chip {
    display: inline-block; flex-shrink: 0;
    font-size: 9px; font-weight: 500;
    letter-spacing: 0.18em; text-transform: uppercase;
    padding: 5px 10px;
    border: 1px solid rgba(26,26,24,0.15);
    color: rgba(26,26,24,0.55); background: white;
    cursor: pointer; white-space: nowrap;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.2s, color 0.2s, border-color 0.2s;
  }
  .cat-chip-active {
    background: var(--primary); border-color: var(--primary); color: white;
  }

  /* ── Filtros sticky ──────────────────────────────────────────────── */
  .cat-filters {
    border-top: 1px solid rgba(26,26,24,0.07);
    border-bottom: 1px solid rgba(26,26,24,0.07);
    background: rgba(250,250,248,0.97);
    position: sticky; top: 54px; z-index: 50;
    backdrop-filter: blur(16px);
  }
  @media (min-width: 640px) { .cat-filters { top: 64px; } }

  .cat-filters-inner {
    max-width: 1400px; margin: 0 auto; padding: 0 16px;
  }
  @media (min-width: 640px) { .cat-filters-inner { padding: 0 24px; } }

  /* Fila buscador */
  .cat-search-row {
    position: relative;
    display: flex; align-items: center;
    padding: 10px 0 8px;
    border-bottom: 1px solid rgba(26,26,24,0.06);
  }
  /* Fila chips: scroll horizontal sin barra */
  .cat-chips-row {
    display: flex; gap: 6px;
    padding: 8px 0; overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .cat-chips-row::-webkit-scrollbar { display: none; }

  /* Input búsqueda */
  .cat-input {
    width: 100%; background: transparent; border: none;
    border-bottom: 1px solid rgba(26,26,24,0.18);
    padding: 6px 28px 6px 26px;
    font-size: 13px; font-family: 'DM Sans', sans-serif;
    color: #1a1a18; outline: none;
    transition: border-color 0.2s;
    -webkit-appearance: none;
  }
  .cat-input:focus { border-bottom-color: var(--primary); }
  .cat-input::placeholder { color: rgba(26,26,24,0.35); letter-spacing: 0.04em; }

  /* ── Grid de productos ───────────────────────────────────────────── */
  /* 2 columnas en móvil, escala en pantallas más grandes */
  .cat-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 2px;
  }
  @media (min-width: 540px)  { .cat-grid { grid-template-columns: repeat(3, 1fr); } }
  @media (min-width: 768px)  { .cat-grid { grid-template-columns: repeat(4, 1fr); } }
  @media (min-width: 1024px) { .cat-grid { grid-template-columns: repeat(5, 1fr); } }
  @media (min-width: 1280px) { .cat-grid { grid-template-columns: repeat(6, 1fr); } }

  /* ── Badge stock ─────────────────────────────────────────────────── */
  .cat-stock-badge {
    position: absolute; top: 8px; right: 8px;
    background: white; color: #c0392b;
    font-size: 8px; font-weight: 600;
    letter-spacing: 0.08em; padding: 2px 6px;
    border: 1px solid #fecdd3;
  }

  /* ── Línea decorativa ────────────────────────────────────────────── */
  .cat-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(26,26,24,0.12), transparent);
  }

  /* ── Scrollbar refinado ──────────────────────────────────────────── */
  .cat-scroll::-webkit-scrollbar { width: 3px; }
  .cat-scroll::-webkit-scrollbar-track { background: transparent; }
  .cat-scroll::-webkit-scrollbar-thumb { background: var(--primary); opacity: 0.4; }

  /* ── WhatsApp button ─────────────────────────────────────────────── */
  .cat-wa-btn {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; padding: 16px 14px;
    background: #1a1a18; color: white;
    font-size: 12px; font-weight: 500;
    letter-spacing: 0.14em; text-transform: uppercase;
    cursor: pointer; border: none; transition: background 0.2s;
    text-decoration: none;
    -webkit-tap-highlight-color: transparent;
  }
  .cat-wa-btn:hover, .cat-wa-btn:active { background: var(--primary); }

  /* ── Skeleton ────────────────────────────────────────────────────── */
  .cat-skeleton {
    background: linear-gradient(
      90deg,
      color-mix(in oklch, var(--primary) 4%, #f0efec) 25%,
      color-mix(in oklch, var(--primary) 7%, #e8e6e1) 50%,
      color-mix(in oklch, var(--primary) 4%, #f0efec) 75%
    );
    background-size: 200% 100%;
    animation: catShimmer 1.6s infinite;
  }

  /* ── Cart drawer ─────────────────────────────────────────────────── */
  .cat-cart-overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(26,26,24,0.35);
    backdrop-filter: blur(4px);
    animation: catFadeIn 0.25s ease;
  }
  .cat-cart-drawer {
    position: absolute; top: 0; right: 0; bottom: 0;
    width: min(420px, 100vw);
    background: #FAFAF8;
    display: flex; flex-direction: column;
    animation: catSlideIn 0.35s cubic-bezier(0.25,0.46,0.45,0.94);
  }

  /* ── Modal — bottom sheet en móvil, centrado en desktop ──────────── */
  .cat-modal-overlay {
    position: fixed; inset: 0; z-index: 300;
    background: rgba(26,26,24,0.55);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: flex-end;   /* sheet desde abajo en móvil */
    justify-content: center;
    padding: 0;
    animation: catFadeIn 0.2s ease;
  }
  @media (min-width: 600px) {
    .cat-modal-overlay { align-items: center; padding: 16px; }
  }
  .cat-modal {
    background: white; width: 100%;
    max-width: 480px; max-height: 92vh; overflow-y: auto;
    border-radius: 16px 16px 0 0; /* sheet style móvil */
    animation: catSheetIn 0.32s cubic-bezier(0.34,1.56,0.64,1);
  }
  @media (min-width: 600px) {
    .cat-modal { border-radius: 0; animation: catModalIn 0.3s cubic-bezier(0.34,1.56,0.64,1); }
  }
  /* Handle bar visible sólo en móvil */
  .cat-modal-handle {
    display: block; width: 36px; height: 4px;
    background: rgba(26,26,24,0.12); border-radius: 2px;
    margin: 12px auto 0;
  }
  @media (min-width: 600px) { .cat-modal-handle { display: none; } }
  /* Padding del contenido del modal */
  .cat-modal-body { padding: 18px 18px 24px; }
  @media (min-width: 600px) { .cat-modal-body { padding: 24px 28px 28px; } }

  /* ── Keyframes ───────────────────────────────────────────────────── */
  @keyframes catFadeIn  { from { opacity: 0 } to { opacity: 1 } }
  @keyframes catSlideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
  @keyframes catSheetIn { from { transform: translateY(100%) } to { transform: translateY(0) } }
  @keyframes catModalIn {
    from { opacity: 0; transform: scale(0.94) translateY(10px) }
    to   { opacity: 1; transform: scale(1) translateY(0) }
  }
  @keyframes catCardIn {
    from { opacity: 0; transform: translateY(16px) }
    to   { opacity: 1; transform: translateY(0) }
  }
  .cat-card-anim { animation: catCardIn 0.45s ease both; }
  @keyframes catShimmer {
    from { background-position: 200% 0 }
    to   { background-position: -200% 0 }
  }
`

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PublicCatalogPage({ products, categories, company }: PublicCatalogPageProps) {
  const searchParams = useSearchParams()
  const [search, setSearch]                     = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [imageErrors, setImageErrors]           = useState<Record<string, boolean>>({})
  const [loading, setLoading]                   = useState(true)
  const [cart, setCart]                         = useState<any[]>([])
  const [showCart, setShowCart]                 = useState(false)
  const [selectedProduct, setSelectedProduct]   = useState<any>(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [addedId, setAddedId]                   = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const productId = searchParams.get("productId")
    if (productId && products) {
      const p = products.find((p) => p.id == productId)
      if (p) { setSelectedProduct(p); setShowProductModal(true) }
    }
  }, [searchParams, products])

  // Bloquear scroll cuando hay modal/drawer abierto
  useEffect(() => {
    document.body.style.overflow = (showCart || showProductModal) ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [showCart, showProductModal])

  const handleImageError = (id: string) => setImageErrors((p) => ({ ...p, [id]: true }))

  const addToCart = (product: any, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setCart((prev) => {
      const ex = prev.find((i) => i.id === product.id)
      if (ex) return prev.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { ...product, quantity: 1 }]
    })
    // Feedback visual
    setAddedId(product.id)
    setTimeout(() => setAddedId(null), 800)
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.id === productId)
      if (ex && ex.quantity > 1) return prev.map((i) => i.id === productId ? { ...i, quantity: i.quantity - 1 } : i)
      return prev.filter((i) => i.id !== productId)
    })
  }

  const getTotalItems = () => cart.reduce((s, i) => s + i.quantity, 0)
  const getTotalPrice = () => cart.reduce((s, i) => s + i.sale_price * i.quantity, 0)

  const filtered = products.filter((p) => {
    const matchSearch   = p.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = selectedCategory === "all" || p.category_name === selectedCategory
    return matchSearch && matchCategory
  })

  const closeModal = () => {
    setShowProductModal(false)
    const url = new URL(window.location.href)
    url.searchParams.delete("productId")
    window.history.pushState({}, "", url)
  }

  const initials = getInitials(company.name)

  const whatsappMsg = encodeURIComponent(
    `Hola, me interesa hacer un pedido en *${company.name}*:\n\n` +
    cart.map((i) => `• ${i.name} × ${i.quantity} — ${formatCOP(i.sale_price * i.quantity)}`).join("\n") +
    `\n\n*Total: ${formatCOP(getTotalPrice())}*`
  )
  const whatsappHref = `https://wa.me/${company.phone || ""}?text=${whatsappMsg}`

  // ─── RENDER ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* CSS del catálogo */}
      <style dangerouslySetInnerHTML={{ __html: CATALOG_CSS }} />

      <div className="cat-root">

        {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
        <header className="cat-header">
          <div className="cat-header-inner">

            {/* Logo + nombre con truncate */}
            <div className="cat-brand">
              <div className="cat-logo">
                {company.logo_url ? (
                  <img src={company.logo_url} alt={company.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                  />
                ) : (
                  <span style={{ color: "white", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em" }}>
                    {initials}
                  </span>
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <p className="cat-serif cat-company-name">{company.name}</p>
                <p className="cat-company-sub">Tienda oficial</p>
              </div>
            </div>

            {/* Derecha */}
            <div className="cat-header-right">
              <span className="cat-ref-count">{products.length} refs.</span>
              <button className="cat-cart-btn" onClick={() => setShowCart(true)} aria-label="Ver carrito">
                <ShoppingBag size={20} strokeWidth={1.5} color="#1a1a18" />
                {getTotalItems() > 0 && (
                  <span className="cat-cart-badge">{getTotalItems()}</span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* ══ INTRO TIPOGRÁFICO ════════════════════════════════════════════════ */}
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 16px 24px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <p style={{ fontSize: 10, letterSpacing: "0.26em", textTransform: "uppercase", color: "var(--primary)", marginBottom: 10, fontWeight: 500 }}>
                Colección completa
              </p>
              <h1 className="cat-serif" style={{ fontSize: "clamp(24px, 5vw, 52px)", fontWeight: 300, lineHeight: 1.15, color: "#1a1a18", margin: 0 }}>
                Belleza que{" "}
                <em style={{ fontStyle: "italic", color: "rgba(26,26,24,0.55)" }}>transforma</em>
              </h1>
            </div>
            {/* Stat numérico — oculto en móvil muy pequeño via CSS si es necesario */}
            <div style={{ textAlign: "right", flexShrink: 0, paddingBottom: 4 }}>
              <p className="cat-serif" style={{ fontSize: "clamp(28px, 6vw, 40px)", fontWeight: 300, lineHeight: 1, color: "rgba(26,26,24,0.12)" }}>
                {String(products.length).padStart(2, "0")}
              </p>
              <p style={{ fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(26,26,24,0.35)", marginTop: 4 }}>
                referencias
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 24 }}>
            <div style={{ width: 28, height: 1.5, background: "var(--primary)", opacity: 0.6, flexShrink: 0 }} />
            <div style={{ flex: 1, height: 1, background: "rgba(26,26,24,0.08)" }} />
          </div>
        </div>

        {/* ══ FILTROS ══════════════════════════════════════════════════════════ */}
        <div className="cat-filters">
          <div className="cat-filters-inner">

            {/* Fila 1: buscador ancho completo */}
            <div className="cat-search-row">
              <Search size={13} strokeWidth={1.5} style={{
                position: "absolute", left: 0,
                color: "rgba(26,26,24,0.35)", pointerEvents: "none",
              }} />
              <input
                ref={searchRef}
                className="cat-input"
                placeholder="Buscar producto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch("")} style={{
                  position: "absolute", right: 0, background: "none", border: "none",
                  cursor: "pointer", padding: 4, color: "rgba(26,26,24,0.4)",
                }}>
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Fila 2: chips con scroll horizontal invisible */}
            <div className="cat-chips-row">
              <button
                className={`cat-chip ${selectedCategory === "all" ? "cat-chip-active" : ""}`}
                onClick={() => setSelectedCategory("all")}
              >
                Todo
              </button>
              {categories.map((c) => (
                <button
                  key={c.name}
                  className={`cat-chip ${selectedCategory === c.name ? "cat-chip-active" : ""}`}
                  onClick={() => setSelectedCategory(c.name)}
                >
                  {c.name}
                </button>
              ))}
              {(search || selectedCategory !== "all") && (
                <button
                  onClick={() => { setSearch(""); setSelectedCategory("all") }}
                  style={{
                    flexShrink: 0, background: "none", border: "none",
                    display: "flex", alignItems: "center", gap: 4,
                    fontSize: 10, color: "rgba(26,26,24,0.5)", cursor: "pointer",
                    letterSpacing: "0.06em", padding: "5px 6px",
                  }}
                >
                  <X size={11} /> Limpiar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ══ GRID DE PRODUCTOS ═══════════════════════════════════════════════ */}
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "16px 16px 80px" }}>

          {/* Contador */}
          {!loading && (
            <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
              <p style={{ fontSize: 10, letterSpacing: "0.08em", color: "rgba(26,26,24,0.45)", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                {filtered.length} {filtered.length === 1 ? "producto" : "productos"}
              </p>
              <div className="cat-divider" style={{ flex: 1, margin: "0 16px" }} />
            </div>
          )}

          {/* Skeletons — grid responsive */}
          {loading && (
            <div className="cat-grid">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="cat-skeleton" style={{ aspectRatio: "3/4" }} />
              ))}
            </div>
          )}

          {/* Grid de productos */}
          {!loading && filtered.length > 0 && (
            <div className="cat-grid">
              {filtered.map((product, idx) => (
                <div
                  key={product.id}
                  className="cat-card cat-card-anim"
                  style={{ animationDelay: `${Math.min(idx * 40, 400)}ms` }}
                  onClick={() => { setSelectedProduct(product); setShowProductModal(true) }}
                >
                  {/* Imagen */}
                  <div style={{ aspectRatio: "3/4", overflow: "hidden", position: "relative", background: "#F5F4F0" }}>
                    {product.image_url && !imageErrors[product.id] ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="cat-card-img"
                        loading="lazy"
                        onError={() => handleImageError(product.id)}
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "color-mix(in oklch, var(--primary) 5%, #F5F4F0)" }}>
                        <Package size={28} strokeWidth={1} style={{ color: "color-mix(in oklch, var(--primary) 40%, rgba(26,26,24,0.15))" }} />
                      </div>
                    )}

                    {product.total_inventario > 0 && product.total_inventario <= 1 && (
                      <div className="cat-stock-badge">Últimas {product.total_inventario}</div>
                    )}

                    {/* Desktop: slide-up en hover */}
                    <button
                      className="cat-add-btn-desktop"
                      onClick={(e) => { e.stopPropagation(); addToCart(product, e) }}
                    >
                      {addedId === product.id ? (
                        <span style={{ letterSpacing: "0.1em" }}>✓ Añadido</span>
                      ) : (
                        <><Plus size={12} strokeWidth={2} /> Añadir</>
                      )}
                    </button>

                    {/* Móvil: botón circular siempre visible */}
                    <button
                      className="cat-add-btn-mobile"
                      onClick={(e) => { e.stopPropagation(); addToCart(product, e) }}
                      aria-label={`Añadir ${product.name}`}
                    >
                      {addedId === product.id
                        ? <span style={{ fontSize: 14 }}>✓</span>
                        : <Plus size={14} strokeWidth={2.5} />
                      }
                    </button>
                  </div>

                  {/* Info */}
                  <div className="cat-card-info">
                    <div className="cat-card-accent" />
                    {product.category_name && (
                      <p style={{ fontSize: 8, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--primary)", marginBottom: 4, fontWeight: 500 }}>
                        {product.category_name}
                      </p>
                    )}
                    <h3 className="cat-serif" style={{
                      fontSize: 13, fontWeight: 400, lineHeight: 1.3,
                      color: "#1a1a18", marginBottom: 6,
                      display: "-webkit-box", WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {product.name}
                    </h3>
                    <p style={{ fontSize: 12, fontWeight: 500, color: "#1a1a18", letterSpacing: "0.02em" }}>
                      {formatCOP(product.sale_price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sin resultados */}
          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div style={{
                width: 64, height: 64, margin: "0 auto 20px",
                border: "1px solid rgba(26,26,24,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Search size={20} strokeWidth={1} style={{ color: "rgba(26,26,24,0.3)" }} />
              </div>
              <p className="cat-serif" style={{ fontSize: 22, fontWeight: 300, marginBottom: 8 }}>
                Sin resultados
              </p>
              <p style={{ fontSize: 13, color: "rgba(26,26,24,0.5)", marginBottom: 20 }}>
                Prueba con otros términos o categorías
              </p>
              <button
                onClick={() => { setSearch(""); setSelectedCategory("all") }}
                style={{
                  background: "none", border: "1px solid rgba(26,26,24,0.2)",
                  padding: "8px 20px", fontSize: 11, letterSpacing: "0.12em",
                  textTransform: "uppercase", cursor: "pointer", color: "#1a1a18",
                }}
              >
                Ver todo
              </button>
            </div>
          )}
        </div>

        {/* ══ FOOTER STRIP ════════════════════════════════════════════════════ */}
        <div className="cat-divider" />
        <div style={{ textAlign: "center", padding: "24px", background: "#FAFAF8" }}>
          <p style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(26,26,24,0.35)" }}>
            {company.name} · Catálogo oficial
          </p>
        </div>

        {/* ══ CART DRAWER ══════════════════════════════════════════════════════ */}
        {showCart && (
          <div className="cat-cart-overlay" onClick={() => setShowCart(false)}>
            <div className="cat-cart-drawer" onClick={(e) => e.stopPropagation()}>

              {/* Header drawer */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "20px 24px",
                borderBottom: "1px solid rgba(26,26,24,0.08)",
                flexShrink: 0,
              }}>
                <div>
                  <p className="cat-serif" style={{ fontSize: 20, fontWeight: 400 }}>Tu selección</p>
                  <p style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(26,26,24,0.45)", marginTop: 2 }}>
                    {getTotalItems()} {getTotalItems() === 1 ? "artículo" : "artículos"}
                  </p>
                </div>
                <button
                  onClick={() => setShowCart(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
                >
                  <X size={18} strokeWidth={1.5} style={{ color: "rgba(26,26,24,0.5)" }} />
                </button>
              </div>

              {/* Items */}
              <div className="cat-scroll" style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
                {cart.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 0" }}>
                    <ShoppingBag size={36} strokeWidth={1} style={{ color: "rgba(26,26,24,0.2)", margin: "0 auto 16px" }} />
                    <p className="cat-serif" style={{ fontSize: 18, fontWeight: 300, color: "rgba(26,26,24,0.5)" }}>
                      Tu selección está vacía
                    </p>
                    <p style={{ fontSize: 12, color: "rgba(26,26,24,0.35)", marginTop: 8 }}>
                      Explora el catálogo y elige tus favoritos
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {cart.map((item, idx) => (
                      <div key={item.id}>
                        <div style={{ display: "flex", gap: 14, padding: "16px 0" }}>
                          {/* Miniatura */}
                          <div style={{
                            width: 70, height: 88, flexShrink: 0, overflow: "hidden",
                            background: "#F5F4F0",
                          }}>
                            {item.image_url && !imageErrors[item.id] ? (
                              <img src={item.image_url} alt={item.name}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                onError={() => handleImageError(item.id)}
                              />
                            ) : (
                              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Package size={20} strokeWidth={1} style={{ color: "rgba(26,26,24,0.2)" }} />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {item.category_name && (
                              <p style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--primary)", marginBottom: 3 }}>
                                {item.category_name}
                              </p>
                            )}
                            <p className="cat-serif" style={{ fontSize: 14, fontWeight: 400, lineHeight: 1.3, marginBottom: 8 }}>
                              {item.name}
                            </p>
                            <p style={{ fontSize: 12, fontWeight: 500, marginBottom: 10 }}>
                              {formatCOP(item.sale_price)}
                            </p>
                            {/* Qty controls */}
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <button onClick={() => removeFromCart(item.id)}
                                style={{ background: "none", border: "1px solid rgba(26,26,24,0.15)", width: 24, height: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Minus size={10} />
                              </button>
                              <span style={{ fontSize: 13, fontWeight: 500, minWidth: 16, textAlign: "center" }}>{item.quantity}</span>
                              <button onClick={() => addToCart(item)}
                                style={{ background: "var(--primary)", border: "none", width: 24, height: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Plus size={10} style={{ color: "white" }} />
                              </button>
                              <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 500, color: "rgba(26,26,24,0.6)" }}>
                                {formatCOP(item.sale_price * item.quantity)}
                              </span>
                            </div>
                          </div>
                        </div>
                        {idx < cart.length - 1 && <div className="cat-divider" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer drawer */}
              {cart.length > 0 && (
                <div style={{ borderTop: "1px solid rgba(26,26,24,0.08)", flexShrink: 0 }}>
                  <div style={{ padding: "16px 24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
                      <span style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(26,26,24,0.55)" }}>Total</span>
                      <span className="cat-serif" style={{ fontSize: 24, fontWeight: 400 }}>{formatCOP(getTotalPrice())}</span>
                    </div>
                    <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="cat-wa-btn">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Solicitar por WhatsApp
                      <ArrowRight size={13} strokeWidth={1.5} />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ MODAL DETALLE — bottom sheet en móvil ═══════════════════════════ */}
        {showProductModal && selectedProduct && (
          <div className="cat-modal-overlay" onClick={closeModal}>
            <div className="cat-modal" onClick={(e) => e.stopPropagation()}>

              {/* Handle visible solo en móvil */}
              <span className="cat-modal-handle" />

              {/* Imagen */}
              <div style={{ position: "relative", aspectRatio: "1/1", background: "#F5F4F0", overflow: "hidden" }}>
                {selectedProduct.image_url && !imageErrors[selectedProduct.id] ? (
                  <img
                    src={selectedProduct.image_url}
                    alt={selectedProduct.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={() => handleImageError(selectedProduct.id)}
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Package size={48} strokeWidth={1} style={{ color: "rgba(26,26,24,0.15)" }} />
                  </div>
                )}

                {/* Cerrar */}
                <button onClick={closeModal} style={{
                  position: "absolute", top: 12, right: 12,
                  background: "white", border: "none", width: 34, height: 34,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", boxShadow: "0 2px 12px rgba(0,0,0,0.12)", borderRadius: 2,
                }}>
                  <X size={14} strokeWidth={1.5} />
                </button>

                {selectedProduct.total_inventario > 0 && selectedProduct.total_inventario <= 3 && (
                  <div className="cat-stock-badge">
                    Últimas {selectedProduct.total_inventario} unidades
                  </div>
                )}
              </div>

              {/* Info — padding adaptado por clase CSS */}
              <div className="cat-modal-body">
                {selectedProduct.category_name && (
                  <p style={{ fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--primary)", marginBottom: 10, fontWeight: 500 }}>
                    {selectedProduct.category_name}
                  </p>
                )}

                <h2 className="cat-serif" style={{ fontSize: "clamp(20px, 5vw, 26px)", fontWeight: 400, lineHeight: 1.2, marginBottom: 10 }}>
                  {selectedProduct.name}
                </h2>

                {selectedProduct.description && (
                  <p style={{ fontSize: 13, color: "rgba(26,26,24,0.6)", lineHeight: 1.65, marginBottom: 18 }}>
                    {selectedProduct.description}
                  </p>
                )}

                <div className="cat-divider" style={{ marginBottom: 18 }} />

                {/* Precio + CTA — en móvil pueden ir uno sobre otro si no caben */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
                  <div>
                    <p style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(26,26,24,0.45)", marginBottom: 4 }}>
                      Precio
                    </p>
                    <p className="cat-serif" style={{ fontSize: "clamp(22px, 5vw, 28px)", fontWeight: 400, letterSpacing: "-0.01em" }}>
                      {formatCOP(selectedProduct.sale_price)}
                    </p>
                  </div>

                  <button
                    style={{
                      background: "var(--primary)", color: "white", border: "none",
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "14px 20px", fontSize: 11, fontWeight: 500,
                      letterSpacing: "0.12em", textTransform: "uppercase",
                      cursor: "pointer", flexShrink: 0,
                    }}
                    onClick={() => { addToCart(selectedProduct); closeModal(); setShowCart(true) }}
                  >
                    <Plus size={13} strokeWidth={2} />
                    Añadir al pedido
                  </button>
                </div>

                {selectedProduct.total_inventario > 3 && (
                  <p style={{ fontSize: 11, color: "rgba(26,26,24,0.4)", marginTop: 14, letterSpacing: "0.04em" }}>
                    {selectedProduct.total_inventario} unidades disponibles
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}
