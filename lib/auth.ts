import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

// ─── requireAuth ─────────────────────────────────────────────────────────────

export async function requireAuth() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return user
}

// ─── getUserPermissions ───────────────────────────────────────────────────────
// Retorna permisos del usuario + company_id en una sola llamada.
// Así las páginas del dashboard no necesitan hacer consultas extra.

export async function getUserPermissions() {
  const supabase = await createClient()
  const user = await requireAuth()

  // Traer permisos y empresa en paralelo para no encadenar awaits
  const [{ data: permissions }, { data: userCompany }] = await Promise.all([
    supabase
      .from("user_permissions")
      .select("*")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("user_companies")
      .select("company_id, role, companies(id, name, slug)")
      .eq("user_id", user.id)
      .single(),
  ])

  
    console.log('Llegoooo')
    
    console.log(userCompany?.company_id)

  return {
    ...permissions,
    // company_id disponible directamente en el retorno
    company_id: userCompany?.company_id ?? null,
    company: userCompany?.companies ?? null,
  }
}

// ─── requireRole ─────────────────────────────────────────────────────────────

export async function requireRole(allowedRoles: string[]) {
  const permissions = await getUserPermissions()

  if (!permissions || !allowedRoles.includes(permissions.role)) {
    redirect("/dashboard")
  }

  return permissions
}

// ─── requireCompany ───────────────────────────────────────────────────────────
// Helper para páginas que solo necesitan company_id sin verificar permisos extra.
// Uso: const { companyId } = await requireCompany()

export async function requireCompany() {
  const supabase = await createClient()
  const user = await requireAuth()

  const { data: userCompany } = await supabase
    .from("user_companies")
    .select("company_id, role, companies(id, name, slug)")
    .eq("user_id", user.id)
    .single()

  if (!userCompany?.company_id) {
    redirect("/auth/sin-empresa")
  }

  return {
    user,
    companyId: userCompany.company_id,
    role: userCompany.role,
    company: userCompany.companies,
  }
}
