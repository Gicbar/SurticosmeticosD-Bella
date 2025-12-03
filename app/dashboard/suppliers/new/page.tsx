import { requireAuth } from "@/lib/auth"
import { SupplierForm } from "@/components/supplier-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Truck } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function NewSupplierPage() {
  return (
    <div className="dashboard-page-container">
      {/* Header */}
      <div className="dashboard-toolbar">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="group">
            <Link href="/dashboard/suppliers">
              <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          </Button>
          <div>
            <h1 className="dashboard-title">
              <Truck className="dashboard-title-icon" />
              Nuevo Proveedor
            </h1>
            <p className="dashboard-subtitle">
              Registra un nuevo proveedor para tus compras
            </p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <Card className="card max-w-3xl mx-auto w-full animate-fadeIn">
        <CardHeader className="card-header">
          <CardTitle className="card-title flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Información del Proveedor
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <SupplierForm />
        </CardContent>
      </Card>
    </div>
  )
}
