// app/dashboard/kits/[id]/edit/page.tsx
import { getUserPermissions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { KitBuilderForm } from "@/components/kit-builder-form"
import { redirect, notFound } from "next/navigation"

export default async function EditKitPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id }      = await params
  const permissions = await getUserPermissions()
  const companyId   = permissions?.company_id
  if (!companyId) redirect("/auth/sin-empresa")

  const supabase = await createClient()
  const { data: kit } = await supabase
    .from("product_kits")
    .select(`
      id, code, name, description, is_active,
      product_kit_items (
        product_id, quantity, unit_price_in_kit,
        products ( name, sale_price )
      )
    `)
    .eq("id", id)
    .eq("company_id", companyId)
    .single()

  if (!kit) notFound()

  return <KitBuilderForm companyId={companyId} existingKit={kit as any} />
}
