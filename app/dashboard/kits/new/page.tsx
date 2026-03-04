// app/dashboard/kits/new/page.tsx
import { getUserPermissions } from "@/lib/auth"
import { KitBuilderForm } from "@/components/kit-builder-form"
import { redirect } from "next/navigation"

export default async function NewKitPage() {
  const permissions = await getUserPermissions()
  const companyId   = permissions?.company_id
  if (!companyId) redirect("/auth/sin-empresa")

  return <KitBuilderForm companyId={companyId} />
}
