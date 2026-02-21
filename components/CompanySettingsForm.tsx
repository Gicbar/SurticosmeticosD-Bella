"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { showError, showSuccess } from "@/lib/sweetalert"
import { Building2, Globe, Phone, Hash, Pencil, X, Check, Upload, Palette } from "lucide-react"
import { getCompanyInitials, type CompanyTheme } from "@/lib/theme"
import Image from "next/image"

type Company = {
  id: string
  name: string
  slug: string
  domain: string | null
  phone: string | null
  logo_url: string | null
  theme: CompanyTheme | null
}

// Paletas predefinidas — fácil de extender
const PRESET_THEMES: { label: string; emoji: string; theme: CompanyTheme }[] = [
  { label: "Orquídea",   emoji: "🪻", theme: { primary: "oklch(0.60 0.18 320)", secondary: "oklch(0.92 0.04 340)", accent: "oklch(0.88 0.12 85)",  darkPrimary: "oklch(0.70 0.18 330)" } },
  { label: "Esmeralda",  emoji: "💚", theme: { primary: "oklch(0.55 0.20 155)", secondary: "oklch(0.90 0.06 150)", accent: "oklch(0.85 0.10 90)",  darkPrimary: "oklch(0.65 0.18 155)" } },
  { label: "Zafiro",     emoji: "💙", theme: { primary: "oklch(0.55 0.20 250)", secondary: "oklch(0.90 0.05 240)", accent: "oklch(0.85 0.10 60)",  darkPrimary: "oklch(0.65 0.18 250)" } },
  { label: "Rubí",       emoji: "❤️", theme: { primary: "oklch(0.55 0.22 20)",  secondary: "oklch(0.92 0.04 20)",  accent: "oklch(0.88 0.10 70)",  darkPrimary: "oklch(0.65 0.20 20)"  } },
  { label: "Ámbar",      emoji: "🧡", theme: { primary: "oklch(0.65 0.18 60)",  secondary: "oklch(0.94 0.04 60)",  accent: "oklch(0.85 0.12 40)",  darkPrimary: "oklch(0.72 0.16 60)"  } },
  { label: "Grafito",    emoji: "🩶", theme: { primary: "oklch(0.45 0.04 265)", secondary: "oklch(0.90 0.02 265)", accent: "oklch(0.85 0.08 80)",  darkPrimary: "oklch(0.60 0.04 265)" } },
]

export function CompanySettingsForm({ company, isAdmin }: { company: Company; isAdmin: boolean }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(company.logo_url)
  const [selectedTheme, setSelectedTheme] = useState<CompanyTheme | null>(company.theme)

  const [formData, setFormData] = useState({
    name:   company.name,
    domain: company.domain || "",
    phone:  company.phone  || "",
  })

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setLogoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      let logoUrl = company.logo_url

      // ── Subir logo si hay uno nuevo ────────────────────────────────────
      if (logoFile) {
        const ext = logoFile.name.split(".").pop()
        const path = `${company.slug}/logo.${ext}`

        const { error: uploadError } = await supabase.storage
          .from("company-logos")
          .upload(path, logoFile, { upsert: true })

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from("company-logos").getPublicUrl(path)
        logoUrl = `${data.publicUrl}?t=${Date.now()}` // cache bust
      }

      // ── Actualizar empresa ─────────────────────────────────────────────
      const { error } = await supabase
        .from("companies")
        .update({
          name:     formData.name.trim(),
          domain:   formData.domain.trim() || null,
          phone:    formData.phone.trim()  || null,
          logo_url: logoUrl,
          theme:    selectedTheme,
        })
        .eq("id", company.id)

      if (error) throw error

      setEditing(false)
      setLogoFile(null)
      await showSuccess("Empresa actualizada correctamente")
      router.refresh()
    } catch (err: any) {
      showError(err.message || "Error al guardar")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({ name: company.name, domain: company.domain || "", phone: company.phone || "" })
    setLogoPreview(company.logo_url)
    setLogoFile(null)
    setSelectedTheme(company.theme)
    setEditing(false)
  }

  const initials = getCompanyInitials(company.name)

  return (
    <div className="space-y-6">

      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-5">
        {/* Preview */}
        <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-border shadow-sm flex-shrink-0 bg-gradient-to-br from-primary/20 to-secondary">
          {logoPreview ? (
            <Image src={logoPreview} alt="Logo" fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg font-black text-primary">
              {initials}
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold">{company.name}</p>
          <p className="text-xs text-muted-foreground font-mono">{company.slug}</p>
          {isAdmin && editing && (
            <label className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary cursor-pointer hover:underline">
              <Upload className="h-3 w-3" />
              Cambiar logo
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </label>
          )}
        </div>
      </div>

      {/* ── Campos de texto ───────────────────────────────────────────────── */}
      <div className="space-y-1 divide-y divide-border/40">
        {/* Slug — siempre solo lectura */}
        <div className="flex justify-between items-center py-3">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Identificador</span>
          <div className="flex items-center gap-2">
            <Hash className="h-3 w-3 text-muted-foreground" />
            <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{company.slug}</span>
          </div>
        </div>

        {[
          { label: "Nombre de la empresa", icon: <Building2 className="h-3 w-3 text-muted-foreground" />, field: "name" as const, placeholder: "Nombre" },
          { label: "Dominio del catálogo", icon: <Globe className="h-3 w-3 text-muted-foreground" />, field: "domain" as const, placeholder: "empresa.vercel.app", hint: "Dominio del catálogo público" },
          { label: "WhatsApp para pedidos", icon: <Phone className="h-3 w-3 text-muted-foreground" />, field: "phone" as const, placeholder: "573001234567", hint: "Sin + ni espacios" },
        ].map(({ label, icon, field, placeholder, hint }) => (
          <div key={field} className="flex justify-between items-start py-3 gap-4">
            <div>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
              {hint && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{hint}</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {icon}
              {editing ? (
                <Input
                  value={formData[field]}
                  onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                  placeholder={placeholder}
                  className="h-7 text-sm w-52"
                  disabled={isLoading}
                />
              ) : (
                <span className="font-medium text-sm text-right">
                  {formData[field] || <span className="text-muted-foreground italic text-xs">Sin configurar</span>}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Selector de theme ─────────────────────────────────────────────── */}
      {(editing || company.theme) && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Color del sistema</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {PRESET_THEMES.map((preset) => {
              const isSelected = selectedTheme?.primary === preset.theme.primary
              return (
                <button
                  key={preset.label}
                  type="button"
                  disabled={!editing || isLoading}
                  onClick={() => setSelectedTheme(preset.theme)}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all text-xs font-medium
                    ${isSelected
                      ? "border-primary bg-primary/10 shadow-sm scale-105"
                      : "border-border hover:border-primary/40 hover:bg-muted/50"
                    }
                    ${!editing ? "opacity-70 cursor-default" : "cursor-pointer"}
                  `}
                >
                  {/* Muestra el color primary del preset */}
                  <div
                    className="w-8 h-8 rounded-lg shadow-inner border border-white/20"
                    style={{ background: preset.theme.primary }}
                  />
                  <span className="text-[10px]">{preset.emoji} {preset.label}</span>
                </button>
              )
            })}
          </div>
          {!editing && (
            <p className="text-[10px] text-muted-foreground">Activa "Editar empresa" para cambiar el color.</p>
          )}
        </div>
      )}

      {/* ── Botones — solo admin ───────────────────────────────────────────── */}
      {isAdmin && (
        <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
          {editing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={isLoading} className="h-8 gap-1.5">
                <X className="h-3 w-3" /> Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isLoading || !formData.name.trim()} className="h-8 gap-1.5 btn-action-new">
                {isLoading
                  ? <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  : <Check className="h-3 w-3" />}
                Guardar cambios
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="h-8 gap-1.5">
              <Pencil className="h-3 w-3" /> Editar empresa
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
