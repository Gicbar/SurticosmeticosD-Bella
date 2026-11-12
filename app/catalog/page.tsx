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

  const [{ data: products }, { data: categories }, { data: kits }] = await Promise.all([
    supabase
      .from("public_products_with_offers")
      .select("*")
      .eq("company_id", company.id)
      .order("id", { ascending: false }),

    supabase
      .from("public_categories")
      .select("name")
      .eq("company_id", company.id)
      .order("name"),

    supabase
      .from("public_kits")
      .select("*")
      .eq("company_id", company.id)
      .order("price"),
  ])

  // Kits: se muestran en el catálogo como un producto más (categoría "Kits y regalos").
  // Si la vista aún no existe (script 023 sin ejecutar) data llega null y no pasa nada.
  const COP = (n: number) => "$" + Math.round(n).toLocaleString("es-CO")
  const kitProducts = (kits || []).map((k: any) => {
    const items = (k.items || []) as { name: string; quantity: number; gift: boolean }[]
    const linea = (i: { name: string; quantity: number }) => (i.quantity > 1 ? `${i.quantity} × ` : "") + i.name
    const trae = items.filter((i) => !i.gift).map(linea)
    const regalos = items.filter((i) => i.gift).map(linea)
    const ahorro = Number(k.regular_price || 0) - Number(k.price)
    const desc = [
      k.description,
      trae.length ? "Trae: " + trae.join(", ") + "." : "",
      regalos.length ? "🎁 De regalo: " + regalos.join(", ") + "." : "",
      ahorro > 0 ? `Por separado costaría ${COP(Number(k.regular_price))}: ahorras ${COP(ahorro)}.` : "",
    ].filter(Boolean).join("\n")
    return {
      id: k.id, name: k.name, description: desc,
      sale_price: Number(k.price), image_url: k.image_url, gallery_urls: k.gallery_urls,
      category_id: null, category_name: "Kits y regalos",
      total_inventario: k.stock, company_id: k.company_id,
      offer_price: null, offer_discount_pct: null, offer_start: null, offer_end: null,
      offer_campaign_id: null, has_offer: false, effective_price: Number(k.price),
      created_at: k.created_at, is_kit: true, regular_price: k.regular_price,
    }
  })

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
        products={[...kitProducts, ...(products || [])]}
        categories={categories || []}
        company={company}
      />
    </div>
  )
}
