// app/catalog/layout.tsx
// Layout específico de /catalog — se anida dentro del RootLayout.
// Aquí inyectamos el theme de la empresa de forma segura,
// usando generateMetadata para el <head> y el layout para el <body>.
// NO poner <style> dentro de <head> directamente desde un Server Component
// porque causa hydration mismatch en Next.js App Router.

export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // El theme se inyecta en catalog/page.tsx directamente como primer
  // elemento del JSX (fuera de <head>), no aquí.
  // Este layout solo sirve como contenedor limpio.
  return <>{children}</>
}
