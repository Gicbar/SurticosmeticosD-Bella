"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { LogOut, ChevronDown, Bell, Slash, Menu } from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const ROUTE_NAMES: Record<string, string> = {
  dashboard: "Resumen",
  pos: "Punto de Venta",
  sales: "Ventas",
  products: "Productos",
  categories: "Categorías",
  inventory: "Inventario",
  suppliers: "Proveedores",
  profits: "Rentabilidad",
  clients: "Clientes",
  expenses: "Gastos",
  settings: "Configuración",
}

export function DashboardHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data?.user) setUser(data.user)
    }
    fetchUser()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const generateBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean)
    const displayPaths = paths.length > 1 && paths[0] === 'dashboard' ? paths.slice(1) : paths
    
    if (paths.length === 1 && paths[0] === 'dashboard') {
      return <span className="text-sm font-medium text-foreground">Panel General</span>
    }

    return (
      <div className="flex items-center text-sm text-muted-foreground">
        <span className="opacity-60">Panel</span>
        {displayPaths.map((path, index) => (
          <div key={path} className="flex items-center">
            <Slash className="h-3 w-3 mx-2 text-border -skew-x-12" />
            <span className={index === displayPaths.length - 1 ? "font-medium text-foreground capitalize" : "capitalize hover:text-foreground transition-colors"}>
              {ROUTE_NAMES[path] || path}
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <header 
      className={`
        sticky top-0 z-30 flex h-16 w-full items-center justify-between px-6
        transition-all duration-300 ease-in-out
        ${scrolled 
          ? "bg-background/80 backdrop-blur-lg border-b border-border/50 shadow-sm" 
          : "bg-transparent border-b border-transparent"
        }
      `}
    >
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden -ml-2">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex flex-col justify-center">
           {generateBreadcrumbs()}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-destructive ring-2 ring-background" />
        </Button>

        <div className="h-5 w-px bg-border/60 mx-1 hidden sm:block" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="group flex items-center gap-3 pl-2 pr-1 py-1 h-auto rounded-full hover:bg-secondary/50 transition-all">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                   {user?.email?.split('@')[0] || 'Usuario'}
                </span>
              </div>
              <Avatar className="h-8 w-8 border-2 border-background shadow-sm group-hover:border-primary/20 transition-colors">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xs font-bold">
                  {user?.email?.charAt(0).toUpperCase() || 'D'}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-3 w-3 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl border-border/50 bg-card/95 backdrop-blur-xl shadow-xl mt-2">
            <DropdownMenuLabel className="px-2 py-1.5">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">Mi Cuenta</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem onClick={handleLogout} className="rounded-lg cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}