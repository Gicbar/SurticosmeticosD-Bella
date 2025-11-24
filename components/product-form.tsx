"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { showError, showSuccess } from "@/lib/sweetalert"
import { Upload, X } from "lucide-react"
import Image from "next/image"

type Product = {
  id: string
  name: string
  description: string | null
  barcode: string | null
  category_id: string | null
  supplier_id: string | null
  sale_price: number
  min_stock: number
  image_url: string | null
}

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(product?.image_url || null)

  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    barcode: product?.barcode || "",
    category_id: product?.category_id || "",
    supplier_id: product?.supplier_id || "",
    sale_price: product?.sale_price?.toString() || "",
    min_stock: product?.min_stock?.toString() || "0",
  })

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: categoriesData } = await supabase.from("categories").select("id, name").order("name")
      const { data: suppliersData } = await supabase.from("suppliers").select("id, name").order("name")
      setCategories(categoriesData || [])
      setSuppliers(suppliersData || [])
    }
    fetchData()
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const supabase = createClient()

      if (formData.barcode) {
        const { data: existingProduct } = await supabase
          .from("products")
          .select("id")
          .eq("barcode", formData.barcode)
          .neq("id", product?.id || "")
          .single()
        if (existingProduct) {
          showError("Ya existe un producto con este código de barras", "Código de Barras Duplicado")
          setIsLoading(false)
          return
        }
      }

      let imageUrl = product?.image_url || null
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop()
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
        const filePath = `products/${fileName}`
        const { error: uploadError } = await supabase.storage.from("product-images").upload(filePath, imageFile)
        if (uploadError) throw new Error("Error al subir la imagen: " + uploadError.message)
        const { data } = supabase.storage.from("product-images").getPublicUrl(filePath)
        imageUrl = data.publicUrl
      }

      const productData = {
        name: formData.name,
        description: formData.description || null,
        barcode: formData.barcode || null,
        category_id: formData.category_id || null,
        supplier_id: formData.supplier_id || null,
        sale_price: Number.parseFloat(formData.sale_price),
        min_stock: Number.parseInt(formData.min_stock),
        image_url: imageUrl,
      }

      const { error } = product
        ? await supabase.from("products").update(productData).eq("id", product.id)
        : await supabase.from("products").insert(productData)

      if (error) throw new Error(error.message)
      await showSuccess(product ? "Producto actualizado correctamente" : "Producto creado correctamente")

      router.push("/dashboard/products")
      router.refresh()
    } catch (err) {
      showError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-zinc-900 dark:to-zinc-800 rounded-t-lg">
        <CardTitle className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent">
          {product ? "Editar Producto" : "Nuevo Producto"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          {/* Imagen */}
          <div className="space-y-2">
            <Label>Imagen del Producto</Label>
            <div className="flex items-start gap-4">
              {imagePreview ? (
                <div className="relative w-32 h-32 rounded-xl border overflow-hidden shadow-sm">
                  <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer hover:border-primary/70 transition-colors">
                  <Upload className="h-7 w-7 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Subir imagen</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Campos principales */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Nombre *</Label>
              <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>

            <div>
              <Label>Código de Barras</Label>
              <Input value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} />
            </div>

            <div>
              <Label>Categoría</Label>
              <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Proveedor</Label>
              <Select value={formData.supplier_id} onValueChange={(v) => setFormData({ ...formData, supplier_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecciona un proveedor" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Precio de Venta *</Label>
              <Input
                type="number"
                step="0.01"
                required
                value={formData.sale_price}
                onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
              />
            </div>

            <div>
              <Label>Stock Mínimo *</Label>
              <Input
                type="number"
                required
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Botones */}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-blue-600 to-purple-500 text-white">
              {isLoading ? "Guardando..." : product ? "Actualizar" : "Crear"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
