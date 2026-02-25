"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { useCompany } from "@/contexts/CompanyContext"
import { getCompanyInitials } from "@/lib/theme"
import {
  LayoutDashboard, Package, ShoppingCart, Users, TrendingUp, Receipt,CreditCard,
  Settings, Truck, FolderTree, DollarSign, PiggyBank, BarChart2, X, Menu,
} from "lucide-react"

const SIDEBAR_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

  .sb-root {
    --sb-p:      var(--primary, #984ca8);
    --sb-p10:    rgba(var(--primary-rgb, 152,76,168), 0.10);
    --sb-p20:    rgba(var(--primary-rgb, 152,76,168), 0.20);
    --sb-txt:    #1a1a18;
    --sb-muted:  rgba(26,26,24,0.45);
    --sb-faint:  rgba(26,26,24,0.28);
    --sb-border: rgba(26,26,24,0.08);
    font-family: 'DM Sans', sans-serif;
    position: fixed;
    top: 0; left: 0; bottom: 0;
    width: 248px;
    background: #fff;
    display: flex;
    flex-direction: column;
    z-index: 300;
    border-right: 1px solid var(--sb-border);
    overflow: hidden;
    /* ⚠️ SIN transition aquí — lo ponemos en style inline para que no haya
       conflicto con la rehidratación de Next.js */
  }

  /* Línea de acento derecha */
  .sb-root::after {
    content: '';
    position: absolute;
    top: 0; right: 0; bottom: 0; width: 2px;
    background: linear-gradient(180deg, transparent 0%, var(--sb-p) 20%, var(--sb-p) 80%, transparent 100%);
    opacity: 0.2;
    pointer-events: none;
  }

  /* Overlay */
  .sb-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.4);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
    z-index: 299;
    cursor: pointer;
  }
  @keyframes overlayIn { from{opacity:0} to{opacity:1} }
  .sb-overlay { animation: overlayIn 0.2s ease forwards; }

  /* Hamburguesa */
  .sb-burger {
    display: flex;
    align-items: center; justify-content: center;
    position: fixed;
    top: 10px; left: 10px;
    z-index: 200;
    width: 36px; height: 36px;
    background: #fff;
    border: 1px solid rgba(26,26,24,0.10);
    box-shadow: 0 1px 8px rgba(0,0,0,0.08);
    cursor: pointer;
    color: rgba(26,26,24,0.55);
  }
  /* Ocultar en desktop */
  @media (min-width: 769px) { .sb-burger { display: none; } }

  /* ── Header sidebar ──────────────────────────────────────────────────────── */
  .sb-hd {
    padding: 20px 18px 18px;
    border-bottom: 2px solid var(--sb-p10);
    flex-shrink: 0; position: relative;
  }
  .sb-logo-link { display: flex; align-items: center; gap: 12px; text-decoration: none; }
  .sb-logo-mark {
    width: 32px; height: 32px;
    background: var(--sb-p);
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
  }
  .sb-serif { font-family: 'Cormorant Garamond', Georgia, serif; }
  .sb-co-name {
    font-size: 16px; font-weight: 400; line-height: 1.15;
    color: var(--sb-txt); margin: 0;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .sb-co-em { font-style: italic; color: var(--sb-p); margin-left: 4px; }
  .sb-co-sub {
    font-size: 8px; letter-spacing: 0.22em; text-transform: uppercase;
    color: var(--sb-faint); margin: 3px 0 0;
  }
  .sb-close-btn {
    position: absolute; top: 16px; right: 14px;
    background: none; border: none; cursor: pointer;
    color: var(--sb-muted); padding: 4px;
    display: none; align-items: center; justify-content: center;
  }
  @media (max-width: 768px) { .sb-close-btn { display: flex; } }

  /* ── Nav ──────────────────────────────────────────────────────────────────── */
  .sb-nav {
    flex: 1; overflow-y: auto;
    padding: 14px 12px;
    display: flex; flex-direction: column; gap: 2px;
    -webkit-overflow-scrolling: touch;
  }
  .sb-nav::-webkit-scrollbar { width: 2px; }
  .sb-nav::-webkit-scrollbar-thumb { background: var(--sb-p20); }

  .sb-section-label {
    font-size: 8px; letter-spacing: 0.3em; text-transform: uppercase;
    color: var(--sb-p); font-weight: 600; opacity: 0.6;
    padding: 14px 10px 5px; user-select: none;
  }
  .sb-item {
    display: flex; align-items: center; gap: 11px;
    padding: 10px 10px; text-decoration: none;
    font-size: 13px; font-weight: 400; letter-spacing: 0.01em;
    color: var(--sb-muted);
    border-left: 2px solid transparent;
    min-height: 44px;
    transition: color 0.15s, background 0.15s, border-color 0.15s;
  }
  .sb-item:hover { color: var(--sb-txt); background: var(--sb-p10); border-left-color: var(--sb-p20); }
  .sb-item.active { color: var(--sb-p); background: var(--sb-p10); border-left-color: var(--sb-p); font-weight: 500; }
  .sb-item.active .sb-icon { color: var(--sb-p); }
  .sb-icon { width: 14px; height: 14px; flex-shrink: 0; color: var(--sb-faint); transition: color 0.15s; }
  .sb-item:hover .sb-icon { color: var(--sb-p); opacity: 0.7; }
  .sb-sep { height: 1px; background: var(--sb-border); margin: 6px 10px; }

  /* ── Footer ──────────────────────────────────────────────────────────────── */
  .sb-ft { padding: 12px 18px; border-top: 1px solid var(--sb-border); flex-shrink: 0; }
  .sb-ft-txt { font-size: 8px; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(26,26,24,0.18); margin: 0; }
`

interface UserPermissions {
  ventas: boolean; 
  productos: boolean; 
  categorias: boolean; 
  inventario: boolean;
  rentabilidad: boolean; 
  clientes: boolean; 
  proveedores: boolean;
  gastos: boolean; 
  creditos : boolean;
  configuracion: boolean; 
  [key: string]: boolean
}

const mainNav = [
  { name: "Panel General",  href: "/dashboard",         icon: LayoutDashboard, key: null },
  { name: "Punto de Venta", href: "/dashboard/pos",     icon: ShoppingCart,    key: "ventas" },
  { name: "Ventas",         href: "/dashboard/sales",   icon: Receipt,         key: "ventas" },
  { name: "Reportes",       href: "/dashboard/reports", icon: BarChart2,       key: "reportes" },
]
const catalogNav = [
  { name: "Productos",   href: "/dashboard/products",   icon: Package,    key: "productos" },
  { name: "Categorías",  href: "/dashboard/categories", icon: FolderTree, key: "categorias" },
  { name: "Inventario",  href: "/dashboard/inventory",  icon: TrendingUp, key: "inventario" },
  { name: "Proveedores", href: "/dashboard/suppliers",  icon: Truck,      key: "proveedores" },
]
const mgmtNav = [
  { name: "Rentabilidad", href: "/dashboard/profits",  icon: PiggyBank,  key: "rentabilidad" },
  { name: "Clientes",     href: "/dashboard/clients",  icon: Users,      key: "clientes" },
  { name: "Gastos",       href: "/dashboard/expenses", icon: DollarSign, key: "gastos" },
  { name: "Creditos",     href: "/dashboard/debts", icon: CreditCard, key: "creditos" },
  { name: "Configuración",href: "/dashboard/settings", icon: Settings,   key: "configuracion" },
]

export function DashboardSidebar() {
  const pathname        = usePathname()
  const { companyName } = useCompany()
  const [perms, setPerms]     = useState<UserPermissions | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  // ── Estado open: controla visibilidad en móvil ────────────────────────────
  // Iniciamos como FALSE siempre — el sidebar empieza oculto en móvil
  const [open, setOpen] = useState(false)
  // isMobile: lo detectamos en cliente para evitar mismatch SSR/CSR
  const [isMobile, setIsMobile] = useState(false)

  // Detectar mobile en cliente
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  // Cerrar al navegar
  useEffect(() => { setOpen(false) }, [pathname])

  // Bloquear scroll del body cuando el drawer está abierto
  useEffect(() => {
    if (!isMobile) return
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open, isMobile])

  // Cerrar con Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const supabase = createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) return
        const [{ data: permData }, { data: coData }] = await Promise.all([
          supabase.from("user_permissions").select("permissions").eq("user_id", user.id).single(),
          supabase.from("user_companies").select("companies(logo_url)").eq("user_id", user.id).single(),
        ])
        if (permData?.permissions) setPerms(permData.permissions as UserPermissions)
        const co = Array.isArray(coData?.companies) ? coData.companies[0] : coData?.companies
        if (co?.logo_url) setLogoUrl(co.logo_url)
      } catch (e) { console.error("Sidebar error:", e) }
      finally { setLoading(false) }
    })()
  }, [])

  const can = (key: string | null) => {
    if (loading) return false
    if (!key) return true
    return perms?.[key] === true
  }

  const close = useCallback(() => setOpen(false), [])

  const words  = companyName?.trim().split(/\s+/) ?? []
  const first  = words[0] ?? "Sistema"
  const rest   = words.slice(1).join(" ")
  const initials = companyName ? getCompanyInitials(companyName) : "G"

  // ─────────────────────────────────────────────────────────────────────────
  // CLAVE DEL FIX MÓVIL:
  // Calculamos el transform directamente como style prop.
  // En desktop: siempre translateX(0)
  // En móvil: translateX(-100%) cuando cerrado, translateX(0) cuando abierto
  // Al ser un style inline React lo aplica SINCRÓNICAMENTE — sin esperar CSS.
  // ─────────────────────────────────────────────────────────────────────────
  const sidebarTransform = isMobile
    ? open ? "translateX(0)" : "translateX(-100%)"
    : "translateX(0)"

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SIDEBAR_CSS }} />

      {/* Hamburguesa — solo visible en móvil via CSS */}
      <button
        className="sb-burger"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        aria-expanded={open}
      >
        <Menu size={16} strokeWidth={1.5} />
      </button>

      {/* Overlay — solo en DOM cuando abierto en móvil */}
      {isMobile && open && (
        <div className="sb-overlay" onClick={close} aria-hidden="true" />
      )}

      {/* Sidebar */}
      <aside
        className="sb-root"
        style={{
          transform: sidebarTransform,
          transition: isMobile ? "transform 0.28s cubic-bezier(0.25,0.46,0.45,0.94)" : "none",
          boxShadow: isMobile && open ? "8px 0 32px rgba(0,0,0,0.12)" : "none",
        }}
        aria-label="Menú de navegación"
      >
        {/* Header */}
        <div className="sb-hd">
          <Link href="/dashboard" className="sb-logo-link" onClick={close}>
            <div className="sb-logo-mark" aria-hidden="true">
              {logoUrl ? (
                <Image src={logoUrl} alt={companyName || "Logo"} width={32} height={32}
                  style={{ objectFit: "cover", width: "100%", height: "100%" }}
                  onError={() => setLogoUrl(null)} />
              ) : (
                <span style={{ color: "white", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em" }}>
                  {initials}
                </span>
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <p className="sb-serif sb-co-name">
                {first}
                {rest && <em className="sb-co-em">{rest}</em>}
              </p>
              <p className="sb-co-sub">Gestión empresarial</p>
            </div>
          </Link>
          <button className="sb-close-btn" onClick={close} aria-label="Cerrar menú">
            <X size={15} strokeWidth={1.4} />
          </button>
        </div>

        {/* Nav */}
        <nav className="sb-nav" aria-label="Navegación principal">
          <p className="sb-section-label">Principal</p>
          {mainNav.map(item => {
            if (!can(item.key)) return null
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}
                className={cn("sb-item", isActive && "active")}
                onClick={close}
                aria-current={isActive ? "page" : undefined}>
                <item.icon className="sb-icon" strokeWidth={1.4} aria-hidden="true" />
                {item.name}
              </Link>
            )
          })}

          {catalogNav.some(i => can(i.key)) && <>
            <div className="sb-sep" />
            <p className="sb-section-label">Catálogo</p>
            {catalogNav.map(item => {
              if (!can(item.key)) return null
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}
                  className={cn("sb-item", isActive && "active")}
                  onClick={close}
                  aria-current={isActive ? "page" : undefined}>
                  <item.icon className="sb-icon" strokeWidth={1.4} aria-hidden="true" />
                  {item.name}
                </Link>
              )
            })}
          </>}

          {mgmtNav.some(i => can(i.key)) && <>
            <div className="sb-sep" />
            <p className="sb-section-label">Gestión</p>
            {mgmtNav.map(item => {
              if (!can(item.key)) return null
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}
                  className={cn("sb-item", isActive && "active")}
                  onClick={close}
                  aria-current={isActive ? "page" : undefined}>
                  <item.icon className="sb-icon" strokeWidth={1.4} aria-hidden="true" />
                  {item.name}
                </Link>
              )
            })}
          </>}
        </nav>

        <div className="sb-ft">
          <p className="sb-ft-txt">Plataforma multiempresa · {new Date().getFullYear()}</p>
        </div>
      </aside>
    </>
  )
}
