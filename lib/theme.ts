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

// ─── Defaults ────────────────────────────────────────────────────────────────
// #984ca8 como color por defecto cuando la empresa no tiene theme en BD
const DEFAULT_THEME: Required<CompanyTheme> = {
  primary:     "#984ca8",
  secondary:   "#f3edf7",
  accent:      "#7b3d8a",
  radius:      "0",
  darkPrimary: "#b06cc0",
}

// ─── buildThemeCSS ────────────────────────────────────────────────────────────
/**
 * Toma el theme de companies.theme (JSON en BD) y genera un bloque <style>
 * que inyecta --primary, --secondary y --accent como variables CSS globales.
 *
 * ⚠️ REGLA: todos los componentes deben usar var(--primary) en lugar de
 * colores hardcodeados para que el theming por empresa funcione.
 *
 * Flujo:
 *   companies.theme.primary = "#d93e26"
 *   → buildThemeCSS({ primary: "#d93e26" })
 *   → :root { --primary: #d93e26; }
 *   → sidebar, header, cards lo usan via var(--primary)
 */
export function buildThemeCSS(theme: CompanyTheme | null): string {
  // Mezcla los defaults con lo que venga de BD — BD gana siempre
  const t: Required<CompanyTheme> = { ...DEFAULT_THEME, ...theme }

  // Genera variables RGB auxiliares para poder usar el color con opacidad
  // Ej: rgba(var(--primary-rgb), 0.1) — soporta hex de 6 dígitos
  const primaryRgb = hexToRgb(t.primary)

  return `
    :root {
      --primary:           ${t.primary};
      --primary-foreground: #ffffff;
      --secondary:         ${t.secondary};
      --accent:            ${t.accent};
      --dark-primary:      ${t.darkPrimary};
      ${primaryRgb ? `--primary-rgb: ${primaryRgb};` : ""}
    }
  `.trim()
}

// ─── Utilidades ───────────────────────────────────────────────────────────────

/**
 * Convierte #rrggbb → "r, g, b" para uso con rgba()
 * Retorna null si el formato no es reconocible
 */
function hexToRgb(hex: string): string | null {
  const clean = hex.replace("#", "")
  if (clean.length !== 6) return null
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null
  return `${r}, ${g}, ${b}`
}

/**
 * Iniciales de la empresa para el fallback del logo.
 * "Focus Cosmetics" → "FC"
 */
export function getCompanyInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}
