import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { permission } from "process"

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

export async function getUserPermissions() {
  const supabase = await createClient()
  const user = await requireAuth()

  const { data: permissions } = await supabase.from("user_permissions").select("*").eq("user_id", user.id).single()

  return permissions
}

export async function requireRole(allowedRoles: string[]) {
  const permissions = await getUserPermissions()

  if (!permissions || !allowedRoles.includes(permissions.role)) {
    redirect("/dashboard")
  }

  return permissions
}
