"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { LogOut, ChevronDown, Bell, Palette, Check, RotateCcw, Save } from "lucide-react"

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Theme = { primary: string; secondary: string; accent: string }
type UserData = { email: string; role: string; companyId: string; theme: Theme | null }

// ─── Paletas predefinidas ─────────────────────────────────────────────────────
const PRESETS: { name: string; theme: Theme }[] = [
  { name: "Violeta",   theme: { primary: "#984ca8", secondary: "#f3edf7", accent: "#7b3d8a" } },
  { name: "Índigo",    theme: { primary: "#4f46e5", secondary: "#eef2ff", accent: "#3730a3" } },
  { name: "Esmeralda", theme: { primary: "#059669", secondary: "#ecfdf5", accent: "#047857" } },
  { name: "Coral",     theme: { primary: "#e05252", secondary: "#fff1f1", accent: "#c43a3a" } },
  { name: "Ámbar",     theme: { primary: "#d97706", secondary: "#fffbeb", accent: "#b45309" } },
  { name: "Pizarra",   theme: { primary: "#475569", secondary: "#f1f5f9", accent: "#334155" } },
  { name: "Rosa",      theme: { primary: "#db2777", secondary: "#fdf2f8", accent: "#be185d" } },
  { name: "Cian",      theme: { primary: "#0891b2", secondary: "#ecfeff", accent: "#0e7490" } },
]

// ─── Helpers de color ─────────────────────────────────────────────────────────
function hexToRgb(hex: string): string {
  const clean = hex.replace("#", "")
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return `${r},${g},${b}`
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.style.setProperty("--primary",      theme.primary)
  root.style.setProperty("--primary-rgb",  hexToRgb(theme.primary))
  root.style.setProperty("--secondary",    theme.secondary)
  root.style.setProperty("--accent",       theme.accent)
  root.style.setProperty("--accent-rgb",   hexToRgb(theme.accent))
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const HEADER_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  .hdr-root {
    font-family: 'DM Sans', sans-serif;
    position: sticky; top: 0; z-index: 100;
    height: 52px;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 24px 0 56px;
    /* Fondo 100% opaco — color sólido del tema, sin transparencias */
    background: var(--secondary, #f3edf7);
    border-bottom: 1px solid rgba(var(--primary-rgb,152,76,168), 0.20);
    transition: box-shadow 0.2s;
  }
  @media (min-width: 769px) { .hdr-root { padding: 0 28px; } }
  .hdr-root.hdr-scrolled {
    box-shadow:
      0 2px 0 rgba(var(--primary-rgb,152,76,168), 0.35),
      0 8px 28px rgba(var(--primary-rgb,152,76,168), 0.18);
  }

  /* Línea de acento inferior */
  .hdr-root::after {
    content: ''; position: absolute; bottom: -2px; left: 0;
    width: 100%; height: 3px;
    background: linear-gradient(
      to right,
      var(--primary, #984ca8) 0%,
      rgba(var(--primary-rgb,152,76,168), 0.35) 55%,
      rgba(var(--primary-rgb,152,76,168), 0.05) 100%
    );
  }
  @media (max-width: 768px) { .hdr-root::after { left: 50%; transform: translateX(-50%); } }

  /* Breadcrumb */
  .hdr-bread {
    display: flex; align-items: center; gap: 6px;
    font-size: 11px; color: rgba(3, 3, 3, 0.88);
    overflow: hidden; min-width: 0;
  }
  .hdr-bread-sep   { color: rgba(26,26,24,0.18); user-select: none; }
  .hdr-bread-current {
    font-size: 12px; font-weight: 700;
    color: var(--primary, #984ca8);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  @media (max-width: 380px) { .hdr-bread-prefix { display: none; } }

  /* Acciones */
  .hdr-actions { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }

  .hdr-icon-btn {
    width: 36px; height: 36px;
    display: flex; align-items: center; justify-content: center;
    background: none; border: none; cursor: pointer;
    color: rgba(2, 2, 2, 0.92); position: relative;
    transition: color 0.15s, background 0.15s;
    -webkit-tap-highlight-color: transparent;
  }
  .hdr-icon-btn:hover {
    color: var(--primary, #984ca8);
    background: rgba(var(--primary-rgb,152,76,168), 0.14);
  }
  .hdr-icon-btn.active {
    color: var(--primary, #984ca8);
    background: rgba(var(--primary-rgb,152,76,168), 0.20);
  }

  .hdr-notif-dot {
    position: absolute; top: 8px; right: 8px;
    width: 5px; height: 5px;
    background: var(--primary, #984ca8); border-radius: 50%;
    /* border combina con el fondo secondary del header */
    border: 1.5px solid var(--secondary, #f3edf7);
  }

  /* Divisor con color */
  .hdr-vdiv {
    width: 1px; height: 18px;
    background: rgba(var(--primary-rgb,152,76,168), 0.95);
    margin: 0 4px;
  }

  /* Avatar / usuario */
  .hdr-user-wrap { position: relative; }
  .hdr-user-btn {
    display: flex; align-items: center; gap: 8px;
    background: none; border: none; cursor: pointer;
    padding: 4px 8px 4px 4px; height: 36px;
    border-radius: 4px;
    transition: background 0.15s; -webkit-tap-highlight-color: transparent;
  }
  .hdr-user-btn:hover { background: rgba(var(--primary-rgb,152,76,168), 0.16); }

  /* Avatar con sombra coloreada */
  .hdr-avatar {
    width: 28px; height: 28px; flex-shrink: 0;
    background: var(--primary, #984ca8);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 8px rgba(var(--primary-rgb,152,76,168), 0.35);
    border-radius: 4px;
  }
  .hdr-avatar span { font-size: 10px; font-weight: 700; color: white; letter-spacing: 0.04em; text-transform: uppercase; }

  .hdr-user-name {
    font-size: 11px; font-weight: 500; color: rgba(26,26,24,0.95);
    max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  @media (max-width: 480px) { .hdr-user-name { display: none; } }

  /* ── Menú usuario ── */
  .hdr-menu {
    position: absolute; top: calc(100% + 6px); right: 0;
    min-width: 200px; background: #fff;
    border: 1px solid rgba(var(--primary-rgb,152,76,168), 0.14);
    box-shadow:
      0 8px 24px rgba(26,26,24,0.08),
      0 2px 8px rgba(var(--primary-rgb,152,76,168), 0.08);
    z-index: 9999; overflow: hidden;
    animation: hdrMenuIn 0.14s ease forwards;
    /* Franja superior de color */
    border-top: 2px solid var(--primary, #984ca8);
  }
  @keyframes hdrMenuIn {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .hdr-menu-info {
    padding: 12px 16px 10px;
    border-bottom: 1px solid rgba(26,26,24,0.06);
    background: rgba(var(--primary-rgb,152,76,168), 0.03);
  }
  .hdr-menu-tag  { font-size: 8px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--primary, #984ca8); opacity: 0.6; margin: 0 0 3px; }
  .hdr-menu-email { font-size: 12px; font-weight: 500; color: #1a1a18; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .hdr-menu-sep  { height: 1px; background: rgba(26,26,24,0.06); }
  .hdr-menu-items { padding: 4px 0; }
  .hdr-menu-btn {
    display: flex; align-items: center; gap: 10px;
    width: 100%; padding: 10px 16px;
    background: none; border: none; cursor: pointer;
    font-family: 'DM Sans', sans-serif; font-size: 12px; color: rgba(26,26,24,0.55);
    transition: background 0.12s, color 0.12s; text-align: left; min-height: 40px;
  }
  .hdr-menu-btn:hover { background: rgba(var(--primary-rgb,152,76,168), 0.05); color: #1a1a18; }
  .hdr-menu-btn.danger { color: #eb1010; }
  .hdr-menu-btn.danger:hover { background: rgba(185,28,28,0.04); }

  /* ════════════════════════════════════════════════════════════
     THEME PICKER PANEL
  ════════════════════════════════════════════════════════════ */

  /* Wrapper con posición relativa para el panel */
  .thm-wrap { position: relative; }

  /* Panel principal */
  .thm-panel {
    position: absolute;
    top: calc(100% + 8px); right: 0;
    width: 300px;
    background: #fff;
    border: 1px solid rgba(26,26,24,0.09);
    box-shadow: 0 12px 40px rgba(26,26,24,0.13), 0 2px 8px rgba(26,26,24,0.06);
    z-index: 9998; overflow: hidden;
    animation: thmPanelIn 0.16s cubic-bezier(0.32,0.72,0,1) forwards;
  }
  /* En móvil: ancho completo, anclado a la derecha */
  @media (max-width: 420px) {
    .thm-panel {
      width: calc(100vw - 24px);
      right: -8px;
    }
  }
  @keyframes thmPanelIn {
    from { opacity: 0; transform: translateY(-8px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* Header del panel */
  .thm-panel-hd {
    padding: 13px 16px 11px;
    border-bottom: 1px solid rgba(26,26,24,0.07);
    display: flex; align-items: center; gap: 9px;
  }
  .thm-panel-hd-icon {
    width: 22px; height: 22px; flex-shrink: 0;
    background: rgba(var(--primary-rgb,152,76,168), 0.10);
    display: flex; align-items: center; justify-content: center;
  }
  .thm-panel-hd-icon svg { color: var(--primary, #984ca8); width: 11px; height: 11px; }
  .thm-panel-title { font-size: 10px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: #1a1a18; margin: 0; }

  /* Sección del panel */
  .thm-section { padding: 14px 16px; border-bottom: 1px solid rgba(26,26,24,0.06); }
  .thm-section:last-child { border-bottom: none; }
  .thm-section-title {
    font-size: 8px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase;
    color: rgba(26,26,24,0.35); margin: 0 0 10px;
  }

  /* ── Paletas presets ── */
  .thm-presets {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;
  }
  .thm-preset-btn {
    display: flex; flex-direction: column; align-items: center; gap: 5px;
    padding: 7px 4px;
    border: 1.5px solid rgba(26,26,24,0.08); background: #fff; cursor: pointer;
    transition: border-color 0.14s, background 0.14s;
    -webkit-tap-highlight-color: transparent;
  }
  .thm-preset-btn:hover { border-color: rgba(26,26,24,0.2); background: rgba(26,26,24,0.02); }
  .thm-preset-btn.selected { border-color: var(--primary, #984ca8); background: rgba(var(--primary-rgb,152,76,168),0.05); }

  /* Swatch de 3 colores */
  .thm-swatch {
    display: flex; width: 100%; height: 18px; overflow: hidden;
  }
  .thm-swatch span { flex: 1; }

  .thm-preset-name {
    font-size: 9px; font-weight: 500; letter-spacing: 0.06em;
    color: rgba(26,26,24,0.5); text-align: center; white-space: nowrap;
  }
  .thm-preset-btn.selected .thm-preset-name { color: var(--primary, #984ca8); }

  /* ── Controles de color individuales ── */
  .thm-colors { display: flex; flex-direction: column; gap: 10px; }
  .thm-color-row { display: flex; align-items: center; gap: 10px; }

  .thm-color-label {
    font-size: 9px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase;
    color: rgba(26,26,24,0.4); width: 66px; flex-shrink: 0;
  }

  /* Input nativo de color — cuadrado con borde custom */
  .thm-color-pick {
    width: 32px; height: 32px; flex-shrink: 0;
    padding: 2px; cursor: pointer;
    border: 1px solid rgba(26,26,24,0.12); background: #fff;
    -webkit-appearance: none; -moz-appearance: none; appearance: none;
  }
  .thm-color-pick::-webkit-color-swatch-wrapper { padding: 0; }
  .thm-color-pick::-webkit-color-swatch { border: none; }
  .thm-color-pick::-moz-color-swatch { border: none; }

  /* Hex input */
  .thm-hex-input {
    flex: 1; height: 32px; padding: 0 10px;
    border: 1px solid rgba(26,26,24,0.10); background: rgba(26,26,24,0.02);
    font-family: 'DM Sans', monospace; font-size: 12px; font-weight: 500;
    color: #1a1a18; letter-spacing: 0.06em; text-transform: uppercase;
    outline: none; transition: border-color 0.14s;
    border-radius: 0;
  }
  .thm-hex-input:focus { border-color: var(--primary, #984ca8); background: #fff; }

  /* Preview strip */
  .thm-preview {
    height: 6px; display: flex; gap: 0; margin-bottom: 0;
  }
  .thm-preview span { flex: 1; transition: background 0.2s; }

  /* ── Barra de acciones ── */
  .thm-actions {
    padding: 12px 16px;
    background: rgba(26,26,24,0.02);
    border-top: 1px solid rgba(26,26,24,0.07);
    display: flex; align-items: center; gap: 8px;
  }

  .thm-btn-save {
    flex: 1; height: 36px;
    background: var(--primary, #984ca8); color: #fff;
    border: none; cursor: pointer;
    font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 600;
    letter-spacing: 0.1em; text-transform: uppercase;
    display: flex; align-items: center; justify-content: center; gap: 6px;
    transition: opacity 0.15s;
  }
  .thm-btn-save:hover:not(:disabled) { opacity: 0.87; }
  .thm-btn-save:disabled { opacity: 0.45; cursor: not-allowed; }

  .thm-btn-reset {
    width: 36px; height: 36px; flex-shrink: 0;
    border: 1px solid rgba(26,26,24,0.12); background: #fff; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: rgba(26,26,24,0.4); transition: border-color 0.14s, color 0.14s;
  }
  .thm-btn-reset:hover { border-color: rgba(26,26,24,0.25); color: #1a1a18; }

  /* Spinner */
  .thm-spinner {
    width: 12px; height: 12px; flex-shrink: 0;
    border: 2px solid rgba(255,255,255,0.3); border-top-color: white;
    border-radius: 50%; animation: thmSpin 0.7s linear infinite;
  }
  @keyframes thmSpin { to { transform: rotate(360deg); } }

  /* Toast de guardado */
  .thm-toast {
    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
    background: #1a1a18; color: white;
    padding: 10px 18px; font-size: 12px; font-weight: 500;
    display: flex; align-items: center; gap: 8px; z-index: 99999;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    animation: thmToastIn 0.2s ease forwards;
  }
  @keyframes thmToastIn {
    from { opacity: 0; transform: translateX(-50%) translateY(8px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  .thm-toast.exit { animation: thmToastOut 0.2s ease forwards; }
  @keyframes thmToastOut {
    to { opacity: 0; transform: translateX(-50%) translateY(8px); }
  }
`

// ─── Rutas del breadcrumb ──────────────────────────────────────────────────────
const ROUTES: Record<string, string> = {
  dashboard: "Panel General", pos: "Punto de Venta", sales: "Ventas",
  products: "Productos", categories: "Categorías", inventory: "Inventario",
  suppliers: "Proveedores", profits: "Rentabilidad", clients: "Clientes",
  expenses: "Gastos", settings: "Configuración", reports: "Reportes",
  debts: "Deudas",
}

const DEFAULT_THEME: Theme = { primary: "#984ca8", secondary: "#f3edf7", accent: "#7b3d8a" }

// ─── ThemePicker ──────────────────────────────────────────────────────────────
function ThemePicker({
  companyId,
  initialTheme,
}: { companyId: string; initialTheme: Theme }) {
  const [open, setOpen]       = useState(false)
  const [draft, setDraft]     = useState<Theme>(initialTheme)
  const [saving, setSaving]   = useState(false)
  const [toast, setToast]     = useState<"saved" | "error" | null>(null)
  const panelRef              = useRef<HTMLDivElement>(null)

  // Detectar preset seleccionado
  const activePreset = PRESETS.findIndex(
    p => p.theme.primary.toLowerCase() === draft.primary.toLowerCase()
  )

  // Aplicar draft al DOM en tiempo real (preview)
  useEffect(() => {
    applyTheme(draft)
  }, [draft])

  // Cerrar al click fuera
  useEffect(() => {
    if (!open) return
    const fn = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    const id = setTimeout(() => document.addEventListener("mousedown", fn), 10)
    return () => { clearTimeout(id); document.removeEventListener("mousedown", fn) }
  }, [open])

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("keydown", fn)
    return () => document.removeEventListener("keydown", fn)
  }, [open])

  // Validar hex al escribir
  const handleHexInput = (field: keyof Theme, value: string) => {
    const clean = value.startsWith("#") ? value : `#${value}`
    setDraft(prev => ({ ...prev, [field]: clean }))
  }

  // Validar al perder foco
  const handleHexBlur = (field: keyof Theme, value: string) => {
    const hex = /^#[0-9a-fA-F]{6}$/.test(value) ? value : initialTheme[field]
    setDraft(prev => ({ ...prev, [field]: hex }))
  }

  const handlePreset = (preset: Theme) => setDraft({ ...preset })

  const handleReset = () => setDraft({ ...initialTheme })

  const showToast = (type: "saved" | "error") => {
    setToast(type)
    setTimeout(() => setToast(null), 2200)
  }

  const handleSave = async () => {
    // Validar los 3 hex
    const valid = Object.values(draft).every(v => /^#[0-9a-fA-F]{6}$/.test(v))
    if (!valid) return

    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("companies")
        .update({ theme: draft })
        .eq("id", companyId)

      if (error) throw error
      applyTheme(draft)
      setOpen(false)
      showToast("saved")
    } catch {
      showToast("error")
    } finally {
      setSaving(false)
    }
  }

  const colorFields: { key: keyof Theme; label: string }[] = [
    { key: "primary",   label: "Principal" },
    { key: "secondary", label: "Secundario" },
    { key: "accent",    label: "Acento" },
  ]

  return (
    <div className="thm-wrap" ref={panelRef}>
      {/* Botón de trigger */}
      <button
        className={`hdr-icon-btn${open ? " active" : ""}`}
        aria-label="Personalizar colores"
        title="Personalizar tema"
        onClick={() => setOpen(o => !o)}
      >
        <Palette size={14} strokeWidth={1.5} aria-hidden />
      </button>

      {/* Panel */}
      {open && (
        <div className="thm-panel" role="dialog" aria-label="Personalizador de tema">

          {/* Header */}
          <div className="thm-panel-hd">
            <div className="thm-panel-hd-icon"><Palette /></div>
            <p className="thm-panel-title">Personalizar tema</p>
          </div>

          {/* Preview strip en tiempo real */}
          <div className="thm-preview">
            <span style={{ background: draft.primary }} />
            <span style={{ background: draft.accent }} />
            <span style={{ background: draft.secondary, flex: 2 }} />
          </div>

          {/* Paletas rápidas */}
          <div className="thm-section">
            <p className="thm-section-title">Paletas predefinidas</p>
            <div className="thm-presets">
              {PRESETS.map((p, i) => (
                <button
                  key={p.name}
                  className={`thm-preset-btn${activePreset === i ? " selected" : ""}`}
                  onClick={() => handlePreset(p.theme)}
                  title={p.name}
                >
                  <div className="thm-swatch">
                    <span style={{ background: p.theme.primary }} />
                    <span style={{ background: p.theme.accent }} />
                    <span style={{ background: p.theme.secondary }} />
                  </div>
                  <span className="thm-preset-name">{p.name}</span>
                  {activePreset === i && (
                    <Check size={9} style={{ color: "var(--primary)", position: "absolute" }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Controles individuales */}
          <div className="thm-section">
            <p className="thm-section-title">Colores personalizados</p>
            <div className="thm-colors">
              {colorFields.map(({ key, label }) => (
                <div key={key} className="thm-color-row">
                  <span className="thm-color-label">{label}</span>
                  <input
                    type="color"
                    className="thm-color-pick"
                    value={draft[key]}
                    onChange={e => setDraft(prev => ({ ...prev, [key]: e.target.value }))}
                    title={`Elegir color ${label}`}
                  />
                  <input
                    type="text"
                    className="thm-hex-input"
                    value={draft[key]}
                    onChange={e => handleHexInput(key, e.target.value)}
                    onBlur={e => handleHexBlur(key, e.target.value)}
                    maxLength={7}
                    spellCheck={false}
                    aria-label={`Código hex ${label}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Acciones */}
          <div className="thm-actions">
            <button
              className="thm-btn-reset"
              onClick={handleReset}
              title="Restaurar colores actuales"
              disabled={saving}
            >
              <RotateCcw size={13} />
            </button>
            <button
              className="thm-btn-save"
              onClick={handleSave}
              disabled={saving}
            >
              {saving
                ? <><span className="thm-spinner" />Guardando...</>
                : <><Save size={12} />Guardar tema</>
              }
            </button>
          </div>
        </div>
      )}

      {/* Toast feedback */}
      {toast && (
        <div className={`thm-toast`}>
          {toast === "saved"
            ? <><Check size={13} style={{ color: "#4ade80" }} />Tema guardado correctamente</>
            : <span style={{ color: "#f87171" }}>Error al guardar. Intenta de nuevo.</span>
          }
        </div>
      )}
    </div>
  )
}

// ─── DashboardHeader ──────────────────────────────────────────────────────────
export function DashboardHeader() {
  const router   = useRouter()
  const pathname = usePathname()
  const [userData, setUserData]   = useState<UserData | null>(null)
  const [scrolled, setScrolled]   = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)
  const menuRef                   = useRef<HTMLDivElement>(null)

  // Scroll shadow
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8)
    window.addEventListener("scroll", fn, { passive: true })
    return () => window.removeEventListener("scroll", fn)
  }, [])

  // Cargar usuario + company + theme
  useEffect(() => {
    ;(async () => {
      const supabase = createClient()

      const { data: { user }, error: uErr } = await supabase.auth.getUser()
      if (uErr || !user) return

      // Obtener rol y company_id de user_companies + user_permissions
      const [{ data: uc }, { data: up }] = await Promise.all([
        supabase.from("user_companies")
          .select("company_id, role")
          .eq("user_id", user.id)
          .single(),
        supabase.from("user_permissions")
          .select("role")
          .eq("user_id", user.id)
          .single(),
      ])

      const companyId = uc?.company_id
      const role      = up?.role ?? uc?.role ?? "vendedor"

      // Cargar theme de la empresa
      let theme: Theme | null = null
      if (companyId) {
        const { data: company } = await supabase
          .from("companies")
          .select("theme")
          .eq("id", companyId)
          .single()
        theme = (company?.theme as Theme) ?? null
      }

      setUserData({ email: user.email ?? "", role, companyId: companyId ?? "", theme })

      // Aplicar theme al DOM
      if (theme) applyTheme(theme)
    })()
  }, [])

  // Cerrar menú al click fuera
  useEffect(() => {
    if (!menuOpen) return
    const fn = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    const id = setTimeout(() => document.addEventListener("mousedown", fn), 10)
    return () => { clearTimeout(id); document.removeEventListener("mousedown", fn) }
  }, [menuOpen])

  // Cerrar con Escape
  useEffect(() => {
    if (!menuOpen) return
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false) }
    document.addEventListener("keydown", fn)
    return () => document.removeEventListener("keydown", fn)
  }, [menuOpen])

  // Cerrar al navegar
  useEffect(() => { setMenuOpen(false) }, [pathname])

  const handleLogout = useCallback(async () => {
    setMenuOpen(false)
    await createClient().auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }, [router])

  // Breadcrumb
  const segments = pathname.split("/").filter(Boolean)
  const isRoot   = segments.length === 1 && segments[0] === "dashboard"
  const crumbs   = isRoot ? [] : segments.slice(1)

  const userInitial = (userData?.email?.charAt(0) ?? "U").toUpperCase()
  const userName    = userData?.email?.split("@")[0] ?? "Usuario"
  const isAdmin     = userData?.role === "admin"

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: HEADER_CSS }} />

      <header className={`hdr-root${scrolled ? " hdr-scrolled" : ""}`} role="banner">

        {/* ── Breadcrumb ── */}
        <nav className="hdr-bread" aria-label="Ubicación">
          {isRoot ? (
            <span className="hdr-bread-current">Panel General</span>
          ) : (
            <>
              <span className="hdr-bread-prefix">Panel</span>
              {crumbs.map((seg, i) => (
                <span key={seg} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="hdr-bread-sep" aria-hidden>/</span>
                  <span className={i === crumbs.length - 1 ? "hdr-bread-current" : ""}>
                    {ROUTES[seg] ?? seg}
                  </span>
                </span>
              ))}
            </>
          )}
        </nav>

        {/* ── Acciones ── */}
        <div className="hdr-actions">

          {/* Theme picker — solo admins */}
          { userData?.companyId && (
            <>
              <ThemePicker
                companyId={userData.companyId}
                initialTheme={userData.theme ?? DEFAULT_THEME}
              />
              <div className="hdr-vdiv" aria-hidden />
            </>
          )}

          {/* Notificaciones */}
          <button className="hdr-icon-btn" aria-label="Notificaciones">
            <Bell size={14} strokeWidth={1.4} aria-hidden />
            <span className="hdr-notif-dot" aria-hidden />
          </button>

          <div className="hdr-vdiv" aria-hidden />

          {/* Menú usuario */}
          <div className="hdr-user-wrap" ref={menuRef}>
            <button
              className="hdr-user-btn"
              aria-label="Menú de usuario"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOpen(o => !o)}
            >
              <div className="hdr-avatar" aria-hidden>
                <span>{userInitial}</span>
              </div>
              <span className="hdr-user-name">{userName}</span>
              <ChevronDown
                size={10} strokeWidth={1.5}
                style={{
                  color: "rgba(26,26,24,0.22)", flexShrink: 0,
                  transform: menuOpen ? "rotate(180deg)" : "none",
                  transition: "transform 0.15s",
                }}
                aria-hidden
              />
            </button>

            {menuOpen && (
              <div className="hdr-menu" role="menu" aria-label="Opciones de usuario">
                <div className="hdr-menu-info">
                  <p className="hdr-menu-tag">Sesión activa</p>
                  <p className="hdr-menu-email">{userData?.email ?? "—"}</p>
                </div>
                {/* Badge de rol */}
                <div style={{
                  padding: "8px 16px 10px",
                  borderBottom: "1px solid rgba(26,26,24,0.06)",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: "0.14em",
                    textTransform: "uppercase", padding: "3px 8px",
                    background: "rgba(var(--primary-rgb,152,76,168),0.10)",
                    color: "var(--primary, #984ca8)",
                  }}>
                    {userData?.role === "admin"    ? "Administrador"
                     : userData?.role === "gerente" ? "Gerente"
                     : "Vendedor"}
                  </span>
                </div>
                <div className="hdr-menu-sep" aria-hidden />
                <div className="hdr-menu-items">
                  <button
                    className="hdr-menu-btn danger"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <LogOut size={12} strokeWidth={1.4} aria-hidden />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>
    </>
  )
}
