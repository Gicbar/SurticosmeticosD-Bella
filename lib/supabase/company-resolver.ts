// lib/supabase/company-resolver.ts
// Resuelve la empresa desde el host de la request.
// Usa createPublicClient() porque opera sin autenticación (catálogo público).

import { createPublicClient } from "@/lib/supabase/public-client"

export type CompanyInfo = {
  id: string
  name: string
  slug: string
  domain: string | null
  phone: string | null
  logo_url: string | null
  theme: Record<string, string> | null
}

/**
 * Extrae el identificador de empresa desde el host.
 *
 * empresa1.vercel.app      → { type: "slug", value: "empresa1" }
 * empresa1.midominio.com   → { type: "slug", value: "empresa1" }
 * midominio.com            → { type: "domain", value: "midominio.com" }
 * localhost                → { type: "slug", value: NEXT_PUBLIC_DEFAULT_COMPANY_SLUG }
 */
export function extractCompanyIdentifier(host: string): { type: "slug" | "domain"; value: string } {
  const hostname = host.split(":")[0] // quitar puerto

  const parts = hostname.split(".")

  // localhost o IP → usar variable de entorno para desarrollo
  if (parts.length === 1) {
    const defaultSlug = process.env.NEXT_PUBLIC_DEFAULT_COMPANY_SLUG || hostname
    return { type: "slug", value: defaultSlug }
  }

  // subdominio.algo.com o subdominio.vercel.app (3+ partes) → slug
  if (parts.length >= 3) {
    return { type: "slug", value: parts[0] }
  }

  // algo.com (2 partes) → domain completo
  return { type: "domain", value: hostname }
}

/**
 * Resuelve la empresa desde el host de la request.
 * Usa cliente público (anon) — no requiere autenticación.
 */
export async function resolveCompanyFromHost(host: string): Promise<CompanyInfo | null> {
  // ← CAMBIO CLAVE: usar createPublicClient en lugar de createClient
  const supabase = createPublicClient()
  const { type, value } = extractCompanyIdentifier(host)


  if (type === "slug") {
    // Buscar por slug
    const { data } = await supabase
      .from("companies")
      .select("id, name, slug, domain, phone, logo_url, theme")
      .eq("slug", value)
      .single()


    if (data) {
      return data
    }else{
      
    }

    // Fallback: buscar por domain completo
    const hostname = host.split(":")[0]
    const { data: byDomain } = await supabase
      .from("companies")
      .select("id, name, slug, domain, phone, logo_url, theme")
      .eq("domain", hostname)
      .single()


    if (byDomain) {
    } 

    return byDomain ?? null
  }

  // Buscar por domain completo
  const { data } = await supabase
    .from("companies")
    .select("id, name, slug, domain, phone, logo_url, theme")
    .eq("domain", value)
    .single()


  if (data) {
  }

  return data ?? null
}
