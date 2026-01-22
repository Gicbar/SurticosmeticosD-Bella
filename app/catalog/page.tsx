import { createClient } from "@/lib/supabase/server"
import PublicCatalogPage from "./PublicCatalogPage"

export default async function CatalogPage() {
  console.log("📌 [CatalogPage] Iniciando carga de catálogo público...")

  const supabase = await createClient()

  // -----------------------
  // 1. Obtener productos de la vista pública
  // -----------------------
  const { data: products, error: productsError } = await supabase
    .from("public_products")
    .select("*")
    .order("id", { ascending: false })
  

  // -----------------------
  // 2. Obtener categorías (necesarias para filtros)
  // -----------------------
  const { data: categories, error: categoriesError } = await supabase
    .from("public_categories")
    .select("name")
    .order("name")


  return (
    <div className="min-h-screen">
      <PublicCatalogPage 
        products={products || []}
        categories={categories || []}
      />
    </div>
  )
}
