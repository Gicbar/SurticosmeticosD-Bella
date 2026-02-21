"use client"
import { useState, useEffect } from "react"
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Sparkles, TrendingUp, Star, X, ShoppingBag, Plus, Minus } from "lucide-react"

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
  return amount.toLocaleString("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 })
}

// ─── Estilos reutilizables con CSS variables ──────────────────────────────────
// En vez de clases Tailwind violet/pink, usamos style={{ }} con var(--primary)
// Esto respeta el theme inyectado por el <style> del page.tsx

const S = {
  // Fondo principal: tinte muy suave del primary
  pageBg: {
    background: "linear-gradient(135deg, color-mix(in oklch, var(--primary) 6%, white) 0%, white 50%, color-mix(in oklch, var(--secondary) 20%, white) 100%)",
    minHeight: "100vh",
  } as React.CSSProperties,

  // Header
  headerBg: {
    background: "color-mix(in oklch, white 92%, var(--primary) 8%)",
    borderBottom: "1px solid color-mix(in oklch, var(--primary) 15%, transparent)",
  } as React.CSSProperties,

  // Logo container
  logoBg: {
    background: "linear-gradient(135deg, var(--primary), color-mix(in oklch, var(--primary) 70%, black))",
  } as React.CSSProperties,

  // Texto primary
  textPrimary: { color: "var(--primary)" } as React.CSSProperties,

  // Badge contador productos
  pillBg: {
    background: "color-mix(in oklch, var(--primary) 12%, transparent)",
    color: "var(--primary)",
  } as React.CSSProperties,

  // Botón carrito outline
  cartBtn: {
    border: "1px solid color-mix(in oklch, var(--primary) 30%, transparent)",
    color: "var(--primary)",
  } as React.CSSProperties,

  // Badge cantidad items
  badgeQty: {
    background: "var(--primary)",
  } as React.CSSProperties,

  // Cart sidebar
  cartSidebar: {
    border: "1px solid color-mix(in oklch, var(--primary) 20%, transparent)",
  } as React.CSSProperties,

  // Cart item row
  cartItemRow: {
    background: "color-mix(in oklch, var(--primary) 4%, transparent)",
    border: "1px solid color-mix(in oklch, var(--primary) 10%, transparent)",
  } as React.CSSProperties,

  // Cart item image border
  cartImgBorder: {
    border: "1px solid color-mix(in oklch, var(--primary) 20%, transparent)",
  } as React.CSSProperties,

  // Precio en carrito
  priceText: {
    background: "linear-gradient(90deg, var(--primary), color-mix(in oklch, var(--primary) 70%, var(--accent)))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  } as React.CSSProperties,

  // Título gradiente
  gradientTitle: {
    background: "linear-gradient(90deg, var(--primary), color-mix(in oklch, var(--primary) 60%, var(--accent)))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  } as React.CSSProperties,

  // Botón principal (agregar, WhatsApp, etc.)
  primaryBtn: {
    background: "linear-gradient(135deg, var(--primary), color-mix(in oklch, var(--primary) 70%, black))",
    color: "white",
    border: "none",
  } as React.CSSProperties,

  // Badge categoría sobre imagen
  categoryBadge: {
    background: "color-mix(in oklch, var(--primary) 90%, black)",
    color: "white",
  } as React.CSSProperties,

  // Badge últimas unidades
  stockBadge: {
    background: "color-mix(in oklch, var(--accent) 80%, black)",
    color: "white",
  } as React.CSSProperties,

  // Fondo imagen producto
  productImgBg: {
    background: "linear-gradient(135deg, color-mix(in oklch, var(--primary) 6%, white), color-mix(in oklch, var(--secondary) 15%, white))",
  } as React.CSSProperties,

  // Card hover border
  cardBorder: {
    border: "1px solid color-mix(in oklch, var(--primary) 12%, transparent)",
  } as React.CSSProperties,

  // Input border
  inputBorder: {
    border: "1px solid color-mix(in oklch, var(--primary) 25%, transparent)",
  } as React.CSSProperties,

  // Hero pill
  heroPill: {
    background: "color-mix(in oklch, var(--primary) 10%, transparent)",
    color: "var(--primary)",
  } as React.CSSProperties,

  // Skeleton
  skeleton: {
    background: "color-mix(in oklch, var(--primary) 8%, #f3f4f6)",
  } as React.CSSProperties,
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PublicCatalogPage({ products, categories, company }: PublicCatalogPageProps) {
  const searchParams = useSearchParams()
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<any[]>([])
  const [showCart, setShowCart] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [showProductModal, setShowProductModal] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const productId = searchParams.get('productId')
    if (productId && products) {
      const product = products.find((p) => p.id == productId)
      if (product) {
        setSelectedProduct(product)
        setShowProductModal(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }, [searchParams, products])

  const handleImageError = (id: string) => setImageErrors((p) => ({ ...p, [id]: true }))

  const addToCart = (product: any) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.id === product.id)
      if (ex) return prev.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { ...product, quantity: 1 }]
    })
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
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = selectedCategory === "all" || p.category_name === selectedCategory
    return matchSearch && matchCategory
  })

  const initials = getInitials(company.name)

  const closeModal = () => {
    setShowProductModal(false)
    const url = new URL(window.location.href)
    url.searchParams.delete('productId')
    window.history.pushState({}, '', url)
  }

  // ─── WhatsApp link ──────────────────────────────────────────────────────────
  const whatsappHref = `https://wa.me/${company.phone || ""}?text=${encodeURIComponent(
    `Hola, me interesa hacer un pedido en *${company.name}*:\n\n` +
    cart.map((i) => `• ${i.name} x${i.quantity} — ${formatCOP(i.sale_price * i.quantity)}`).join("\n") +
    `\n\n*Total: ${formatCOP(getTotalPrice())}*`
  )}`

  return (
    <div style={S.pageBg}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl shadow-sm" style={S.headerBg}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">

          {/* Logo + nombre */}
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-full overflow-hidden p-1 shadow-md flex-shrink-0" style={S.logoBg}>
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.name}
                  className="w-full h-full object-contain rounded-full bg-white"
                  onError={(e) => {
                    const t = e.target as HTMLImageElement
                    t.style.display = "none"
                    if (t.parentElement) {
                      t.parentElement.innerHTML = `<div class="w-full h-full bg-white rounded-full flex items-center justify-center text-xs font-black" style="color:var(--primary)">${initials}</div>`
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-xs font-black" style={S.textPrimary}>
                  {initials}
                </div>
              )}
            </div>

            <div>
              <h1 className="text-xl font-black tracking-tight" style={S.gradientTitle}>
                {company.name}
              </h1>
              <p className="text-xs font-medium opacity-60" style={S.textPrimary}>
                Catálogo oficial
              </p>
            </div>
          </div>

          {/* Contador + carrito */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium" style={S.pillBg}>
              <TrendingUp className="w-3 h-3" />
              <span>{products.length} productos</span>
            </div>

            <button
              className="relative h-9 px-3 rounded-lg flex items-center gap-1 text-sm font-medium transition-all hover:opacity-80"
              style={S.cartBtn}
              onClick={() => setShowCart(!showCart)}
            >
              <ShoppingBag className="w-4 h-4" />
              {getTotalItems() > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white rounded-full border-2 border-white"
                  style={S.badgeQty}
                >
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Cart Sidebar ────────────────────────────────────────────────────── */}
      {showCart && (
        <div
          className="fixed right-4 top-20 z-50 w-80 sm:w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-h-[80vh] overflow-hidden flex flex-col animate-in slide-in-from-right-2"
          style={S.cartSidebar}
        >
          {/* Header carrito */}
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "color-mix(in oklch, var(--primary) 12%, transparent)" }}>
            <h3 className="font-semibold flex items-center gap-2 text-sm" style={S.textPrimary}>
              <ShoppingBag className="w-4 h-4" />
              Tu Pedido
            </h3>
            <button
              className="h-7 w-7 flex items-center justify-center rounded-lg opacity-50 hover:opacity-100 transition-opacity"
              style={S.textPrimary}
              onClick={() => setShowCart(false)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-20" style={S.textPrimary} />
                <p className="text-sm text-gray-500">Tu carrito está vacío</p>
                <p className="text-xs text-gray-400 mt-1">¡Agrega productos para empezar!</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex gap-3 p-3 rounded-xl transition-colors" style={S.cartItemRow}>
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-white shadow-sm flex-shrink-0" style={S.cartImgBorder}>
                    {item.image_url && !imageErrors[item.id] ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" onError={() => handleImageError(item.id)} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={S.productImgBg}>
                        <Sparkles className="w-5 h-5 opacity-30" style={S.textPrimary} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 line-clamp-2">{item.name}</p>
                    <p className="text-xs font-bold mt-0.5" style={S.textPrimary}>{formatCOP(item.sale_price)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <button
                        className="h-5 w-5 flex items-center justify-center rounded opacity-60 hover:opacity-100 transition-opacity"
                        style={S.textPrimary}
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-medium w-4 text-center">{item.quantity}</span>
                      <button
                        className="h-5 w-5 flex items-center justify-center rounded opacity-60 hover:opacity-100 transition-opacity"
                        style={S.textPrimary}
                        onClick={() => addToCart(item)}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer carrito */}
          {cart.length > 0 && (
            <div className="p-4 space-y-3" style={{ borderTop: "1px solid color-mix(in oklch, var(--primary) 10%, transparent)" }}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total:</span>
                <span className="text-base font-bold" style={S.textPrimary}>{formatCOP(getTotalPrice())}</span>
              </div>
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="block w-full">
                <button
                  className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                  style={{ background: "#25D366" }}
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Pedir por WhatsApp
                </button>
              </a>
            </div>
          )}
        </div>
      )}

      {/* ── Hero + filtros ──────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-4" style={S.heroPill}>
            <Star className="w-3 h-3 fill-current" />
            Catálogo Oficial · {company.name}
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Descubre nuestra{" "}
            <span style={S.gradientTitle}>colección</span>
          </h2>
          <p className="text-gray-500 text-sm">{filtered.length} productos disponibles</p>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" style={S.textPrimary} />
            <input
              placeholder="Buscar productos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none bg-white/80 transition-all"
              style={S.inputBorder}
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-48 px-3 py-2.5 rounded-xl text-sm outline-none bg-white/80"
            style={S.inputBorder}
          >
            <option value="all">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
          {(search || selectedCategory !== "all") && (
            <button
              onClick={() => { setSearch(""); setSelectedCategory("all") }}
              className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition-opacity hover:opacity-70"
              style={{ ...S.inputBorder, ...S.textPrimary }}
            >
              <X className="w-4 h-4" /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* ── Grid de productos ───────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="rounded-2xl animate-pulse aspect-[4/5]" style={S.skeleton} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filtered.map((product) => (
              <div
                key={product.id}
                className="group cursor-pointer rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all duration-300"
                style={S.cardBorder}
                onClick={() => { setSelectedProduct(product); setShowProductModal(true) }}
              >
                {/* Imagen */}
                <div className="aspect-[4/5] w-full overflow-hidden relative" style={S.productImgBg}>
                  {product.image_url && !imageErrors[product.id] ? (
                    <img
                      src={product.image_url}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      alt={product.name}
                      loading="lazy"
                      onError={() => handleImageError(product.id)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Sparkles className="w-12 h-12 opacity-30" style={S.textPrimary} />
                    </div>
                  )}
                  {/* Badge categoría */}
                  {product.category_name && (
                    <span
                      className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-semibold backdrop-blur-sm"
                      style={S.categoryBadge}
                    >
                      {product.category_name}
                    </span>
                  )}
                  {/* Badge stock bajo */}
                  {product.total_inventario <= 3 && product.total_inventario > 0 && (
                    <span
                      className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-semibold animate-pulse"
                      style={S.stockBadge}
                    >
                      ¡Últimos {product.total_inventario}!
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-2.5 space-y-1">
                  <h3 className="text-xs font-medium leading-tight line-clamp-2 text-gray-800 group-hover:opacity-80 transition-colors">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-[11px] text-gray-400 line-clamp-1">{product.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-sm font-bold" style={S.gradientTitle}>
                      {formatCOP(product.sale_price)}
                    </span>
                    <button
                      className="h-6 w-6 rounded-lg flex items-center justify-center text-white transition-all hover:opacity-80 hover:scale-110"
                      style={S.primaryBtn}
                      onClick={(e) => { e.stopPropagation(); addToCart(product) }}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filtered.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={S.pillBg}>
              <Search className="w-8 h-8 opacity-50" style={S.textPrimary} />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-1">No encontramos resultados</h3>
            <p className="text-sm text-gray-500">Intenta con otros términos o categorías</p>
          </div>
        )}
      </div>

      {/* ── Modal detalle producto ───────────────────────────────────────────── */}
      {showProductModal && selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in-0"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md mx-auto bg-white/98 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden"
            style={{ border: "1px solid color-mix(in oklch, var(--primary) 15%, transparent)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Imagen modal */}
            <div className="relative aspect-square w-full overflow-hidden" style={S.productImgBg}>
              {selectedProduct.image_url && !imageErrors[selectedProduct.id] ? (
                <img
                  src={selectedProduct.image_url}
                  className="w-full h-full object-cover"
                  alt={selectedProduct.name}
                  onError={() => handleImageError(selectedProduct.id)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Sparkles className="w-16 h-16 opacity-20" style={S.textPrimary} />
                </div>
              )}
              {selectedProduct.category_name && (
                <span className="absolute top-3 left-3 px-3 py-1 rounded-lg text-xs font-semibold backdrop-blur-sm" style={S.categoryBadge}>
                  {selectedProduct.category_name}
                </span>
              )}
            </div>

            {/* Info modal */}
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-3">
                  <h3 className="text-lg font-bold text-gray-900">{selectedProduct.name}</h3>
                  {selectedProduct.description && (
                    <p className="text-sm text-gray-500 mt-1">{selectedProduct.description}</p>
                  )}
                </div>
                <button
                  className="h-8 w-8 flex items-center justify-center rounded-lg opacity-40 hover:opacity-80 transition-opacity flex-shrink-0"
                  style={S.textPrimary}
                  onClick={closeModal}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xl font-bold" style={S.gradientTitle}>
                  {formatCOP(selectedProduct.sale_price)}
                </span>
                <button
                  className="h-10 px-5 rounded-xl text-sm font-semibold text-white flex items-center gap-2 transition-opacity hover:opacity-90"
                  style={S.primaryBtn}
                  onClick={() => { addToCart(selectedProduct); closeModal() }}
                >
                  <Plus className="w-4 h-4" />
                  Agregar al carrito
                </button>
              </div>

              {selectedProduct.total_inventario && (
                <div className="pt-2 border-t" style={{ borderColor: "color-mix(in oklch, var(--primary) 10%, transparent)" }}>
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold" style={S.textPrimary}>Stock disponible: </span>
                    {selectedProduct.total_inventario} unidades
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
