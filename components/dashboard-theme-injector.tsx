// components/dashboard-theme-injector.tsx
// Server Component — inyecta el theme CSS de la empresa del usuario autenticado.
// Se coloca en app/dashboard/layout.tsx

import { createClient } from "@/lib/supabase/server"
import { buildThemeCSS } from "@/lib/theme"

export async function DashboardThemeInjector() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
      .from("user_companies")
      .select("companies(logo_url, theme, name, slug)")
      .eq("user_id", user.id)
      .single()

    const company = Array.isArray(data?.companies) ? data.companies[0] : data?.companies
    if (!company?.theme) return null

    const css = buildThemeCSS(company.theme)

    return (
      <style
        dangerouslySetInnerHTML={{ __html: css }}
        data-company-theme={company.slug}
      />
    )
  } catch {
    return null
  }
}
