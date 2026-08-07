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

  // Color de "oferta/descuento" derivado del primary de la empresa (no un
  // rojo fijo): mismo tono general, pero más saturado y con la luminosidad
  // ajustada para que resalte y tenga buen contraste con texto blanco.
  const offer = deriveOfferColor(t.primary)

  return `
    :root {
      --primary:           ${t.primary};
      --primary-foreground: #ffffff;
      --secondary:         ${t.secondary};
      --accent:            ${t.accent};
      --dark-primary:      ${t.darkPrimary};
      ${primaryRgb ? `--primary-rgb: ${primaryRgb};` : ""}
      --offer:             ${offer.hex};
      --offer-rgb:         ${offer.rgb};
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
 * Convierte #rrggbb → [r, g, b]. Retorna null si el formato no es reconocible.
 */
function hexToRgbTuple(hex: string): [number, number, number] | null {
  const clean = hex.replace("#", "")
  if (clean.length !== 6) return null
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  if ([r, g, b].some((n) => isNaN(n))) return null
  return [r, g, b]
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0, s = 0
  const d = max - min
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      default: h = (r - g) / d + 4
    }
    h /= 6
  }
  return [h * 360, s * 100, l * 100]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 360) + 360) % 360 / 360
  s /= 100; l /= 100
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  let r: number, g: number, b: number
  if (s === 0) {
    r = g = b = l
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0")
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Deriva un color de "oferta/descuento" a partir del primary de la empresa,
 * en vez de usar un rojo fijo (que visualmente comunica "peligro/error", no
 * "promoción"). Desplaza el matiz (misma familia de color, no un color
 * random) y sube saturación/ajusta luminosidad para que sea vistoso y
 * mantenga buen contraste con texto blanco.
 */
function deriveOfferColor(primaryHex: string): { hex: string; rgb: string } {
  const rgb = hexToRgbTuple(primaryHex)
  if (!rgb) return { hex: "#c2185b", rgb: "194, 24, 91" }
  const [h, s, l] = rgbToHsl(...rgb)
  const offerH = h + 26
  const offerS = Math.max(s, 72)
  const offerL = Math.min(Math.max(l, 42), 50)
  const [r, g, b] = hslToRgb(offerH, offerS, offerL)
  return { hex: rgbToHex(r, g, b), rgb: `${r}, ${g}, ${b}` }
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
