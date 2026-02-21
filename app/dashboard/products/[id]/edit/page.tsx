import { createClient } from "@/lib/supabase/server"
import { ProductForm } from "@/components/product-form"
import { notFound, redirect } from "next/navigation"
import { Package } from "lucide-react"

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // ── 1. Obtener company_id del usuario ─────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const { data: userCompany } = await supabase
    .from("user_companies")
    .select("company_id")
    .eq("user_id", user.id)
    .single()

  if (!userCompany?.company_id) redirect("/dashboard")

  // ── 2. Buscar producto verificando que pertenece a la empresa ─────────────
  // IMPORTANTE: el doble filtro (id + company_id) evita que un usuario
  // edite productos de otra empresa adivinando el UUID.
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("company_id", userCompany.company_id)  // ← SEGURIDAD MULTIEMPRESA
    .single()

  if (!product) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
        <div>
          <h1 className="dashboard-title flex items-center gap-3">
            <Package className="h-7 w-7 icon-products" />
            Editar Producto
          </h1>
          <p className="dashboard-subtitle mt-1">
            Modifica <span>{product.name}</span> del catálogo
          </p>
        </div>
      </div>

      {/* Form — recibe companyId para actualizaciones seguras */}
      <div className="card-dashboard">
        <ProductForm product={product} companyId={userCompany.company_id} />
      </div>
    </div>
  )
}
