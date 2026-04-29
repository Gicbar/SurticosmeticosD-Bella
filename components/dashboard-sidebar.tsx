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
  LayoutDashboard, Package, ShoppingCart, Users, TrendingUp, Receipt, CreditCard,
  Settings, Truck, FolderTree, DollarSign, PiggyBank, BarChart2, X, Menu,Megaphone,Layers,
  ClipboardList,
} from "lucide-react"

const SIDEBAR_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

  .sb-root {
    --sb-p:      var(--primary, #984ca8);
    --sb-p08:    rgba(var(--primary-rgb,152,76,168), 0.08);
    --sb-p12:    rgba(var(--primary-rgb,152,76,168), 0.12);
    --sb-p20:    rgba(var(--primary-rgb,152,76,168), 0.90);
    --sb-p30:    rgba(var(--primary-rgb,152,76,168), 0.90);
    --sb-p60:    rgba(var(--primary-rgb,152,76,168), 0.60);
    --sb-txt:    #1a1a18;
    --sb-muted:  rgba(5, 5, 5, 5.5);
    --sb-faint:  rgba(26,26,24,0.30);
    --sb-border: rgba(26,26,24,0.07);

    font-family: 'DM Sans', sans-serif;
    position: fixed;
    top: 0; left: 0; bottom: 0;
    width: 248px;
    display: flex;
    flex-direction: column;
    z-index: 400;
    overflow: hidden;

    /* Fondo 100% opaco — sin transparencias que dejen ver el contenido */
    background: #fff;

    /* Borde derecho neutro — sin color para evitar el corte visual */
    border-right: 1px solid rgba(26,26,24,0.08);
  }

  /* Overlay móvil */
  .sb-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.42);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
    z-index: 399; cursor: pointer;
  }
  @keyframes overlayIn { from{opacity:0} to{opacity:1} }
  .sb-overlay { animation: overlayIn 0.2s ease forwards; }

  /* Hamburguesa */
  .sb-burger {
    display: flex; align-items: center; justify-content: center;
    position: fixed; top: 10px; left: 10px; z-index: 200;
    width: 36px; height: 36px;
    background: #fff;
    border: 1px solid rgba(26,26,24,0.10);
    box-shadow: 0 1px 8px rgba(0,0,0,0.08);
    cursor: pointer;
    color: rgba(26,26,24,0.55);
  }
  @media (min-width: 769px) { .sb-burger { display: none; } }

  /* ── Header ────────────────────────────────────────────────────────── */
  .sb-hd {
    height: 72px;
    padding: 0 18px;
    display: flex; align-items: center;
    flex-shrink: 0; position: relative;

    /* Color sólido del tema — 100% opaco */
    background: var(--secondary, #f3edf7);
    border-bottom: 1px solid rgba(var(--primary-rgb,152,76,168), 0.20);
  }

  /* Franja de 3px en el top — única decoración en el borde */
  .sb-hd::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 3px;
    background: var(--sb-p);
    opacity: 0.65;
  }

  .sb-logo-link { display: flex; align-items: center; gap: 14px; text-decoration: none; }

  /* Logo — mismo estilo que el catálogo público (bordes redondos + sombras suaves) */
  .sb-logo-mark {
    width: 44px; height: 44px;
    background: var(--sb-p);
    border-radius: 11px;
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
    position: relative;
    box-shadow:
      0 4px 14px rgba(var(--primary-rgb,152,76,168), 0.28),
      0 0 0 1px rgba(var(--primary-rgb,152,76,168), 0.15),
      inset 0 1px 0 rgba(255,255,255,0.18);
  }

  .sb-serif { font-family: 'Cormorant Garamond', Georgia, serif; }

  .sb-co-name {
    font-size: 17px; font-weight: 400; line-height: 1.2;
    color: var(--sb-txt); margin: 0;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .sb-co-em { font-style: italic; color: var(--sb-p); margin-left: 4px; }

  .sb-co-sub {
    font-size: 8px; letter-spacing: 0.24em; text-transform: uppercase;
    color: var(--sb-p60); margin: 3px 0 0; font-weight: 500;
  }

  .sb-close-btn {
    position: absolute; top: 50%; right: 14px;
    transform: translateY(-50%);
    background: none; border: none; cursor: pointer;
    color: var(--sb-muted); padding: 4px;
    display: none; align-items: center; justify-content: center;
  }
  @media (max-width: 768px) { .sb-close-btn { display: flex; } }

  /* ── Nav ──────────────────────────────────────────────────────────── */
  .sb-nav {
    flex: 1; overflow-y: auto;
    padding: 14px 10px;
    display: flex; flex-direction: column; gap: 1px;
    -webkit-overflow-scrolling: touch;
  }
  .sb-nav::-webkit-scrollbar { width: 2px; }
  .sb-nav::-webkit-scrollbar-thumb { background: var(--sb-p20); }

  /* Labels de sección más coloreados */
  .sb-section-label {
    font-size: 8px; letter-spacing: 0.32em; text-transform: uppercase;
    color: var(--sb-p); font-weight: 700; opacity: 0.75;
    padding: 14px 10px 5px; user-select: none;
    display: flex; align-items: center; gap: 7px;
  }
  .sb-section-label::after {
    content: '';
    flex: 1; height: 1px;
    background: linear-gradient(90deg, var(--sb-p20), transparent);
  }

  /* Items de navegación */
  .sb-item {
    display: flex; align-items: center; gap: 11px;
    padding: 9px 10px; text-decoration: none;
    font-size: 13px; font-weight: 400; letter-spacing: 0.01em;
    color: var(--sb-muted);
    border-left: 2px solid transparent;
    border-radius: 0 4px 4px 0;
    min-height: 44px;
    transition: color 0.14s, background 0.14s, border-color 0.14s;
  }
  .sb-item:hover {
    color: var(--sb-txt);
    background: var(--sb-p08);
    border-left-color: var(--sb-p20);
  }
  .sb-item.active {
    color: var(--sb-p);
    background: var(--sb-p12);
    border-left-color: var(--sb-p);
    font-weight: 500;
  }
  .sb-item.active .sb-icon { color: var(--sb-p); }

  .sb-icon {
    width: 15px; height: 15px; flex-shrink: 0;
    color: var(--sb-faint); transition: color 0.14s;
  }
  .sb-item:hover .sb-icon { color: var(--sb-p); opacity: 0.75; }

  /* Separador con color */
  .sb-sep {
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--sb-p20) 30%, var(--sb-p20) 70%, transparent);
    margin: 6px 8px;
  }

  /* ── Footer ──────────────────────────────────────────────────────── */
  .sb-ft {
    padding: 12px 18px;
    border-top: 1px solid var(--sb-border);
    flex-shrink: 0;
    background: rgba(var(--primary-rgb,152,76,168), 0.03);
  }
  .sb-ft-txt {
    font-size: 8px; letter-spacing: 0.18em; text-transform: uppercase;
    color: rgba(26,26,24,0.20); margin: 0;
  }
`

interface UserPermissions {
  ventas: boolean; productos: boolean; categorias: boolean; inventario: boolean;
  rentabilidad: boolean; clientes: boolean; proveedores: boolean;
  gastos: boolean; creditos: boolean; configuracion: boolean; campanias: boolean;
  kits: boolean; pedidos_catalogo: boolean; reportes: boolean;
  [key: string]: boolean
}

// ─── Estructura del menú ──────────────────────────────────────────────────────
// Refleja los grupos de permisos definidos en lib/permissions.ts:
//   • Principal  — pantallas operativas del día a día
//   • Operación  — registro y análisis de la actividad comercial
//   • Catálogo   — maestros del negocio
//   • Gestión    — finanzas, clientes y promociones
//   • Sistema    — configuración (solo admin/configuracion)
// "Panel General" siempre visible (key: null).

const mainNav = [
  { name: "Panel General",   href: "/dashboard",        icon: LayoutDashboard, key: null },
  { name: "Punto de Venta",  href: "/dashboard/pos",    icon: ShoppingCart,    key: "ventas" },
]
const opNav = [
  { name: "Ventas",                href: "/dashboard/sales",              icon: Receipt,        key: "ventas" },
  { name: "Reportes",              href: "/dashboard/reports",            icon: BarChart2,      key: "reportes" },
  { name: "Campañas Descuento",    href: "/dashboard/campanias",          icon: Megaphone,      key: "campanias" },
  { name: "Pedidos del Catálogo",  href: "/dashboard/pedidos-catalogo",   icon: ClipboardList,  key: "pedidos_catalogo" },
]
const catalogNav = [
  { name: "Productos",   href: "/dashboard/products",   icon: Package,    key: "productos" },
  { name: "Categorías",  href: "/dashboard/categories", icon: FolderTree, key: "categorias" },
  { name: "Inventario",  href: "/dashboard/inventory",  icon: TrendingUp, key: "inventario" },
  { name: "Proveedores", href: "/dashboard/suppliers",  icon: Truck,      key: "proveedores" },
  { name: "Kits Promoción",  href: "/dashboard/kits",   icon: Layers,     key: "kits" },
]
const mgmtNav = [
  { name: "Clientes",     href: "/dashboard/clients",  icon: Users,      key: "clientes" },
  { name: "Créditos",     href: "/dashboard/debts",    icon: CreditCard, key: "creditos" },
  { name: "Gastos",       href: "/dashboard/expenses", icon: DollarSign, key: "gastos" },
  { name: "Rentabilidad", href: "/dashboard/profits",  icon: PiggyBank,  key: "rentabilidad" },
]
const systemNav = [
  { name: "Configuración", href: "/dashboard/settings", icon: Settings, key: "configuracion" },
]

export function DashboardSidebar() {
  const pathname        = usePathname()
  const { companyName } = useCompany()
  const [perms, setPerms]     = useState<UserPermissions | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen]       = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    if (!isMobile) return
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open, isMobile])

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

  const words   = companyName?.trim().split(/\s+/) ?? []
  const first   = words[0] ?? "Sistema"
  const rest    = words.slice(1).join(" ")
  const initials = companyName ? getCompanyInitials(companyName) : "G"

  const sidebarTransform = isMobile
    ? open ? "translateX(0)" : "translateX(-100%)"
    : "translateX(0)"

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SIDEBAR_CSS }} />

      {/* Hamburguesa */}
      <button
        className="sb-burger"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        aria-expanded={open}
      >
        <Menu size={16} strokeWidth={1.5} />
      </button>

      {/* Overlay */}
      {isMobile && open && (
        <div className="sb-overlay" onClick={close} aria-hidden="true" />
      )}

      {/* Sidebar */}
      <aside
        className="sb-root"
        style={{
          transform: sidebarTransform,
          transition: isMobile ? "transform 0.28s cubic-bezier(0.25,0.46,0.45,0.94)" : "none",
          boxShadow: isMobile && open ? "8px 0 40px rgba(0,0,0,0.14)" : "none",
        }}
        aria-label="Menú de navegación"
      >
        {/* Header */}
        <div className="sb-hd">
          <Link href="/dashboard" className="sb-logo-link" onClick={close}>
            <div className="sb-logo-mark" aria-hidden="true">
              {logoUrl ? (
                <Image
                  src={logoUrl} alt={companyName || "Logo"}
                  width={44} height={44}
                  style={{ objectFit: "cover", width: "100%", height: "100%" }}
                  onError={() => setLogoUrl(null)}
                />
              ) : (
                <span style={{
                  color: "white", fontSize: 14, fontWeight: 700,
                  letterSpacing: "0.04em", fontFamily: "'DM Sans',sans-serif"
                }}>
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
          {(() => {
            const sections: Array<{ label: string; items: typeof mainNav }> = [
              { label: "Principal", items: mainNav },
              { label: "Operación", items: opNav },
              { label: "Catálogo",  items: catalogNav },
              { label: "Gestión",   items: mgmtNav },
              { label: "Sistema",   items: systemNav },
            ]

            return sections.map((sec, idx) => {
              const visible = sec.items.filter(i => can(i.key))
              if (visible.length === 0) return null
              return (
                <div key={sec.label}>
                  {idx > 0 && <div className="sb-sep" />}
                  <p className="sb-section-label">{sec.label}</p>
                  {visible.map(item => {
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
                </div>
              )
            })
          })()}
        </nav>

        <div className="sb-ft">
          <p className="sb-ft-txt">Plataforma multiempresa · {new Date().getFullYear()}</p>
        </div>
      </aside>
    </>
  )
}
