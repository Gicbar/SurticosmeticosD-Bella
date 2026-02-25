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

      {/* Sidebar fixed — no ocupa espacio en el flujo del documento */}
      <DashboardSidebar />

      {/*
        Contenedor principal desplazado 248px a la derecha para no
        quedar debajo del sidebar en desktop. En móvil el sidebar es
        un drawer oculto, por lo que el margin baja a 0.
      */}
      <div
        className="ml-0 md:ml-[248px]"
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
        }}
      >
        <DashboardHeader />
        <main
          style={{
            flex: 1,
            padding: "24px 28px",
            background: "#f8f8f7",   /* fondo ligeramente crema para el contenido */
          }}
        >
          {children}
        </main>
      </div>
    </>
  )
}
