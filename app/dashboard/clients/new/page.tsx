import { ClientForm } from "@/components/client-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, UserPlus,Users } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function NewClientPage() {
  return (
    <div className="flex-1 flex flex-col bg-card/70 backdrop-blur-md p-4 md:p-6 rounded-2xl shadow-inner border border-border/20">
      {/* Header Premium */}
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border">
        <Button variant="ghost" size="icon" asChild className="group">
          <Link href="/dashboard/clients">
            <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        </Button>
        
        <div className="dashboard-header">
          <h1 className="dashboard-title flex items-center gap-3">
            <Users className="dashboard-title-icon h-7 w-7 icon-products" />
            Nuevo Cliente
          </h1>
          <p className="dashboard-subtitle mt-1">
            Registra un nuevo cliente para tus ventas
          </p>
        </div>
      </div>

      {/* Formulario con Card Premium */}
      <Card className="card-dashboard max-w-3xl mx-auto w-full">
        <CardHeader className="card-header-dashboard">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <CardTitle className="card-title-dashboard">Información del Cliente</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <ClientForm />
        </CardContent>
      </Card>
    </div>
  )
}