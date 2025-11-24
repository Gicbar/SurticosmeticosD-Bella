import { requireAuth } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { SupplierForm } from "@/components/supplier-form"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Edit, Truck } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default async function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params
  const supabase = await createClient()

  const { data: supplier } = await supabase.from("suppliers").select("*").eq("id", id).single()

  if (!supplier) {
    notFound()
  }

  return (
    <div className="flex-1 flex flex-col bg-card/70 backdrop-blur-md p-4 md:p-6 rounded-2xl shadow-inner border border-border/20">
      {/* Header Premium */}
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border">
        <Button variant="ghost" size="icon" asChild className="group">
          <Link href="/dashboard/suppliers">
            <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        </Button>
        <div>
          <h1 className="dashboard-title">Editar Proveedor</h1>
          <p className="dashboard-subtitle mt-1">
            Modifica la información de {supplier.name}
          </p>
        </div>
      </div>

      {/* Formulario con Card Premium */}
      <Card className="card-dashboard max-w-3xl mx-auto w-full">
        <CardHeader className="card-header-dashboard">
          <div className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" />
            <CardTitle className="card-title-dashboard">Datos del Proveedor</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <SupplierForm supplier={supplier} />
        </CardContent>
      </Card>
    </div>
  )
}