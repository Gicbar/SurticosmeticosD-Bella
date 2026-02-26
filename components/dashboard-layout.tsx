import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardThemeInjector } from "@/components/dashboard-theme-injector"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <DashboardThemeInjector />

      {/* Sidebar — position:fixed, fuera del flujo del documento */}
      <DashboardSidebar />

      {/*
        OUTER SHELL — height:100vh + overflow:hidden
        Impide que el BODY haga scroll. Sin esto el contenido
        se desliza por debajo del sidebar fijo.
      */}
      <div style={{ height: "100vh", overflow: "hidden" }}>

        {/*
          CONTENT SHELL — height:100vh + overflow-y:auto
          El scroll ocurre SOLO aquí, no en el body.
          El sidebar (position:fixed, z-index:400) nunca se superpone
          porque el scroll no mueve el viewport, solo este contenedor.
        */}
        <div
          id="dash-scroll"
          style={{
            height: "100vh",
            overflowY: "auto",
            overflowX: "hidden",
            display: "flex",
            flexDirection: "column",
            background: "#ffffff",
          }}
        >
          <style>{`
            /* Desktop: empujar el contenido al ancho exacto del sidebar */
            @media (min-width: 769px) {
              #dash-scroll { margin-left: 248px; }
            }
            /* Móvil: sin margin, sidebar es un drawer oculto */
            @media (max-width: 768px) {
              #dash-scroll { margin-left: 0; }
            }
            /* Padding reducido en móvil */
            @media (max-width: 640px) {
              #dash-main { padding: 16px 14px !important; }
            }
          `}</style>

          {/* Header sticky dentro del scroll container */}
          <DashboardHeader />

          <main
            id="dash-main"
            style={{
              flex: 1,
              padding: "24px 28px",
              background: "#f8f8f7",
            }}
          >
            {children}
          </main>

        </div>
      </div>
    </>
  )
}
