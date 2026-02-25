import type React from "react"
import { requireAuth } from "@/lib/auth"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { CompanyProvider } from "@/contexts/CompanyContext"
import { DashboardThemeInjector } from "@/components/dashboard-theme-injector"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAuth()

  return (
    <CompanyProvider>
      {/* Inyecta --primary, --secondary, --accent, --primary-rgb desde companies.theme */}
      <DashboardThemeInjector />

      {/*
        DashboardSidebar es position:fixed y gestiona su propio estado open/close.
        En desktop (≥769px) siempre visible, 248px de ancho.
        En móvil (<768px) oculto por defecto, se abre como drawer con overlay.

        El contenedor principal necesita margin-left:248px en desktop
        para no quedar debajo del sidebar fixed.
        En móvil margin-left:0 porque el sidebar está fuera del viewport.
      */}
      <DashboardSidebar />

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "#f8f8f7",
          // El margin lo manejamos con CSS para poder hacer responsive
        }}
        className="layout-main"
      >
        {/* CSS del layout aquí — evitamos inyectar un <style> en cada componente */}
        <style dangerouslySetInnerHTML={{ __html: `
          .layout-main {
            margin-left: 0;
          }
          @media (min-width: 769px) {
            .layout-main {
              margin-left: 248px;
            }
          }
          .layout-content {
            flex: 1;
            padding: 24px 20px;
            background: #f8f8f7;
          }
          @media (min-width: 640px) {
            .layout-content { padding: 28px 28px; }
          }
          @media (min-width: 1024px) {
            .layout-content { padding: 32px 36px; }
          }
        ` }} />

        <DashboardHeader />

        <main className="layout-content">
          {children}
        </main>
      </div>
    </CompanyProvider>
  )
}
