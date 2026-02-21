// app/catalog/page.tsx
// El <style> del theme va como primer hijo del div contenedor (dentro del <body>),
// NO dentro de <head>. Esto evita el hydration mismatch de Next.js App Router.

import { headers } from "next/headers"
import { createPublicClient } from "@/lib/supabase/public-client"
import { resolveCompanyFromHost } from "@/lib/supabase/company-resolver"
import { buildThemeCSS } from "@/lib/theme"
import PublicCatalogPage from "./PublicCatalogPage"
import { notFound } from "next/navigation"

export default async function CatalogPage() {
  // ── 1. Resolver empresa ───────────────────────────────────────────────────
  const headersList = await headers()
  const host = headersList.get("host") || ""
  
  //const host = "surticosmeticosdbella"

  
  const company = await resolveCompanyFromHost(host)

  if (!company) {
    console.error(`❌ [CatalogPage] No se encontró empresa para host: ${host}`)
    notFound()
  }

  
  

  // ── 2. Queries con cliente público (sin autenticación) ───────────────────
  const supabase = createPublicClient()

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("public_products")
      .select("*")
      .eq("company_id", company.id)
      .order("id", { ascending: false }),

    supabase
      .from("public_categories")
      .select("name")
      .eq("company_id", company.id)
      .order("name"),
  ])

  console.log(categories)

  // ── 3. CSS del theme ─────────────────────────────────────────────────────
  // buildThemeCSS retorna el bloque :root { --primary: ...; } etc.
  const themeCSS = buildThemeCSS(company.theme ?? null)

  // ── 4. Render ─────────────────────────────────────────────────────────────
  // IMPORTANTE: el <style> va dentro del <div> contenedor (body),
  // NO en <head>. Next.js App Router mueve automáticamente los <style>
  // al lugar correcto sin causar hydration mismatch.
  return (
    <div className="min-h-screen" data-company={company.slug}>
      {/* Theme CSS — inyectado en el body como sibling del componente.
          Next.js lo hoista al <head> automáticamente sin hydration issues. */}
      <style dangerouslySetInnerHTML={{ __html: themeCSS }} />

      <PublicCatalogPage
        products={products || []}
        categories={categories || []}
        company={company}
      />
    </div>
  )
}
