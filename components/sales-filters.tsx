"use client"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { Filter } from "lucide-react"

export function SalesFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [from, setFrom] = useState(searchParams.get("from") || "")
  const [to, setTo] = useState(searchParams.get("to") || "")
  const [client, setClient] = useState(searchParams.get("client") || "")
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    const fetchClients = async () => {
      const supabase = createClient()
      const { data } = await supabase.from("clients").select("id, name").order("name")
      setClients(data || [])
    }
    fetchClients()
  }, [])

  const handleFilter = () => {
    const params = new URLSearchParams()
    if (from) params.set("from", from)
    if (to) params.set("to", to)
    if (client) params.set("client", client)
    router.push(`/dashboard/sales?${params.toString()}`)
  }

  const handleClear = () => {
    setFrom("")
    setTo("")
    setClient("")
    router.push("/dashboard/sales")
  }

  return (
    <Card className="card group w-full">
      <CardHeader className="card-header">
        <CardTitle className="card-title flex items-center gap-2 text-primary">
          <Filter className="h-5 w-5" />
          Filtros de Ventas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Fecha inicial */}
          <div className="space-y-2">
            <Label htmlFor="from" className="text-sm font-medium text-muted-foreground">
              Fecha inicial
            </Label>
            <Input
              id="from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="input-modern"
            />
          </div>

          {/* Fecha final */}
          <div className="space-y-2">
            <Label htmlFor="to" className="text-sm font-medium text-muted-foreground">
              Fecha final
            </Label>
            <Input
              id="to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="input-modern"
            />
          </div>

          {/* Cliente */}
          <div className="space-y-2">
            <Label htmlFor="client" className="text-sm font-medium text-muted-foreground">
              Cliente
            </Label>
            <Select value={client} onValueChange={setClient}>
              <SelectTrigger id="client" className="input-modern">
                <SelectValue placeholder="Todos los clientes" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">Todos los clientes</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="hover:bg-secondary/20">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botones */}
          <div className="flex gap-2">
            <Button
              onClick={handleFilter}
              className="btn-action-new flex-1"
            >
              Aplicar Filtros
            </Button>
            <Button
              variant="outline"
              onClick={handleClear}
              className="btn-elegant-secondary"
            >
              Limpiar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
