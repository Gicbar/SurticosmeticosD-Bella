// ─── Tipos ───────────────────────────────────────────────────────────────────

export type CompanyTheme = {
  primary?:     string
  secondary?:   string
  accent?:      string
  radius?:      string
  darkPrimary?: string
}

export type CompanyBranding = {
  id:       string
  name:     string
  slug:     string
  domain:   string | null
  phone:    string | null
  logo_url: string | null
  theme:    CompanyTheme | null
}

// ─── Defaults (igual que globals.css) ────────────────────────────────────────

const DEFAULT_THEME: Required<CompanyTheme> = {
  primary:     "oklch(0.60 0.18 320)",
  secondary:   "oklch(0.92 0.04 340)",
  accent:      "oklch(0.88 0.12 85)",
  radius:      "0.75rem",
  darkPrimary: "oklch(0.70 0.18 330)",
}

// ─── buildThemeCSS ────────────────────────────────────────────────────────────
/**
 * Genera el bloque <style> que sobreescribe las variables CSS del globals.css
 * con los valores del theme de la empresa.
 *
 * Solo inyecta lo que difiere del default — el resto hereda.
 */
export function buildThemeCSS(theme: CompanyTheme | null): string {
  const t = { ...DEFAULT_THEME, ...theme }

  return `
    :root {
      --primary:   ${t.primary};
      --secondary: ${t.secondary};
      --accent:    ${t.accent};
      --radius:    ${t.radius};
      --ring:      ${t.primary};
      --sidebar-primary: ${t.primary};
      --chart-1:   ${t.primary};
    }
    .dark {
      --primary:   ${t.darkPrimary};
      --ring:      ${t.darkPrimary};
      --sidebar-primary: ${t.darkPrimary};
      --chart-1:   ${t.darkPrimary};
    }
  `.trim()
}

/**
 * Genera las iniciales de la empresa para el fallback del logo.
 * "Surticosméticos D'Bella" → "SD"
 */
export function getCompanyInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}
