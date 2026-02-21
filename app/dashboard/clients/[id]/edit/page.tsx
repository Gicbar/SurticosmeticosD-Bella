import { getUserPermissions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { ClientForm } from "@/components/client-form"
import { notFound, redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, Edit, Users } from "lucide-react"

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // ── 1. Permisos + company_id ──────────────────────────────────────────────
  const permissions = await getUserPermissions()

  if (!permissions?.permissions?.clientes) {
    redirect("/dashboard")
  }

  const companyId = permissions.company_id
  if (!companyId) redirect("/auth/sin-empresa")

  // ── 2. Query con doble filtro: id + company_id ────────────────────────────
  // Evita que un usuario edite clientes de otra empresa manipulando la URL
  const supabase = await createClient()

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .eq("company_id", companyId)              // ← FILTRO MULTIEMPRESA
    .single()

  if (!client) {
    notFound()
  }

  return (
    <div className="flex-1 flex flex-col bg-card/70 backdrop-blur-md p-4 md:p-6 rounded-2xl shadow-inner border border-border/20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border">
        <Button variant="ghost" size="icon" asChild className="group">
          <Link href="/dashboard/clients">
            <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        </Button>
        <div className="dashboard-header">
          <h1 className="dashboard-title flex items-center gap-3">
            <Users className="dashboard-title-icon h-7 w-7 icon-products" />
            Editar Cliente
          </h1>
          <p className="dashboard-subtitle mt-1">Modifica la información de {client.name}</p>
        </div>
      </div>

      {/* Formulario */}
      <Card className="card-dashboard max-w-3xl mx-auto w-full">
        <CardHeader className="card-header-dashboard">
          <div className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" />
            <CardTitle className="card-title-dashboard">Datos del Cliente</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <ClientForm client={client} companyId={companyId} />
        </CardContent>
      </Card>
    </div>
  )
}
