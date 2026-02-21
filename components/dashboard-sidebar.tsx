"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { useCompany } from "@/contexts/CompanyContext"
import { getCompanyInitials } from "@/lib/theme"
import {
  LayoutDashboard, Package, ShoppingCart, Users, TrendingUp, Receipt,
  Settings, Truck, FolderTree, DollarSign, PiggyBank, Loader2
} from "lucide-react"

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

const mainNav = [
  { name: "Panel General",   href: "/dashboard",          icon: LayoutDashboard, permissionKey: null },
  { name: "Punto de Venta",  href: "/dashboard/pos",      icon: ShoppingCart,    permissionKey: "ventas" },
  { name: "Ventas",          href: "/dashboard/sales",    icon: Receipt,         permissionKey: "ventas" },
  { name: "Reportes",        href: "/dashboard/reports",  icon: Receipt,         permissionKey: "rentabilidad" },
]

const inventoryNav = [
  { name: "Productos",   href: "/dashboard/products",   icon: Package,   permissionKey: "productos" },
  { name: "Categorías",  href: "/dashboard/categories", icon: FolderTree,permissionKey: "categorias" },
  { name: "Inventario",  href: "/dashboard/inventory",  icon: TrendingUp,permissionKey: "inventario" },
  { name: "Proveedores", href: "/dashboard/suppliers",  icon: Truck,     permissionKey: "proveedores" },
]

const managementNav = [
  { name: "Rentabilidad", href: "/dashboard/profits",  icon: PiggyBank, permissionKey: "rentabilidad" },
  { name: "Clientes",     href: "/dashboard/clients",  icon: Users,     permissionKey: "clientes" },
  { name: "Gastos",       href: "/dashboard/expenses", icon: DollarSign,permissionKey: "gastos" },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { companyName, companyId } = useCompany()  // ← nombre de empresa del contexto
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Permisos + logo en paralelo
        const [{ data: permData }, { data: companyData }] = await Promise.all([
          supabase
            .from("user_permissions")
            .select("permissions")
            .eq("user_id", user.id)
            .single(),
          supabase
            .from("user_companies")
            .select("companies(logo_url)")
            .eq("user_id", user.id)
            .single(),
        ])

        if (permData?.permissions) {
          setPermissions(permData.permissions as UserPermissions)
        }

        const company = Array.isArray(companyData?.companies)
          ? companyData.companies[0]
          : companyData?.companies

        if (company?.logo_url) {
          setLogoUrl(company.logo_url)
        }
      } catch (err) {
        console.error("Error cargando sidebar:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const shouldShowItem = (key: string | null) => {
    if (loading) return false
    if (!key) return true
    if (!permissions) return false
    return permissions[key] === true
  }

  // Iniciales para el fallback del logo
  const initials = companyName ? getCompanyInitials(companyName) : "DB"

  // Nombre corto para mostrar en sidebar (primera palabra)
  const shortName = companyName?.split(" ")[0] || "D'Bella"

  const NavItem = ({ item }: { item: any }) => {
    const isActive = pathname === item.href
    if (!shouldShowItem(item.permissionKey)) return null

    return (
      <Link
        href={item.href}
        className={cn(
          "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 outline-none",
          isActive
            ? "bg-sidebar-primary/10 text-sidebar-primary shadow-sm font-semibold"
            : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        )}
      >
        {isActive && (
          <span className="absolute left-0 h-6 w-1 rounded-r-full bg-sidebar-primary transition-all" />
        )}
        <item.icon
          className={cn(
            "h-[18px] w-[18px] transition-all duration-300",
            isActive
              ? "text-sidebar-primary"
              : "text-sidebar-foreground/50 group-hover:text-sidebar-primary group-hover:scale-110"
          )}
          strokeWidth={1.5}
        />
        <span className="flex-1 tracking-wide">{item.name}</span>
      </Link>
    )
  }

  if (loading) {
    return (
      <aside className="flex h-screen w-72 flex-col border-r border-sidebar-border bg-sidebar items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sidebar-primary/50" />
      </aside>
    )
  }

  return (
    <aside className="flex h-screen w-72 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300">

      {/* ── Logo + nombre de empresa ─────────────────────────────────────── */}
      <div className="flex h-20 items-center px-6 border-b border-sidebar-border/50">
        <Link href="/dashboard" className="flex items-center gap-3 group w-full">

          {/* Logo — dinámico, fallback con iniciales */}
          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-sidebar-primary to-sidebar-accent flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 flex-shrink-0">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={companyName || "Logo"}
                width={40}
                height={40}
                className="object-cover w-full h-full"
                priority
                onError={() => setLogoUrl(null)}  // fallback si falla la URL
              />
            ) : (
              <span className="text-sm font-black text-white tracking-tight">
                {initials}
              </span>
            )}
          </div>

          {/* Nombre dinámico de la empresa */}
          <div className="flex flex-col min-w-0">
            <h2
              className="text-xl font-black tracking-tight truncate"
              style={{
                background: "linear-gradient(90deg, var(--sidebar-primary), var(--sidebar-accent-foreground))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {shortName}
            </h2>
            <span className="text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/50 font-semibold truncate">
              {companyName && companyName.split(" ").length > 1
                ? companyName.split(" ").slice(1).join(" ")
                : "Sistema"}
            </span>
          </div>
        </Link>
      </div>

      {/* ── Navegación ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6 scrollbar-hide">
        <div className="space-y-1">
          <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/40 mb-2">Principal</p>
          <nav className="space-y-1">
            {mainNav.map((item) => <NavItem key={item.href} item={item} />)}
          </nav>
        </div>

        {inventoryNav.some((i) => shouldShowItem(i.permissionKey)) && (
          <div className="space-y-1">
            <div className="px-4 my-2 h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent opacity-50" />
            <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/40 mb-2">Catálogo</p>
            <nav className="space-y-1">
              {inventoryNav.map((item) => <NavItem key={item.href} item={item} />)}
            </nav>
          </div>
        )}

        <div className="space-y-1">
          {(managementNav.some((i) => shouldShowItem(i.permissionKey)) || shouldShowItem("configuracion")) && (
            <div className="px-4 my-2 h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent opacity-50" />
          )}
          {managementNav.some((i) => shouldShowItem(i.permissionKey)) && (
            <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/40 mb-2">Gestión</p>
          )}
          <nav className="space-y-1">
            {managementNav.map((item) => <NavItem key={item.href} item={item} />)}
            <NavItem item={{ name: "Configuración", href: "/dashboard/settings", icon: Settings, permissionKey: "configuracion" }} />
          </nav>
        </div>
      </div>
    </aside>
  )
}
