"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { ArrowRight, Eye, EyeOff } from "lucide-react"

const AUTH_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

  .auth-root {
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
    background: #FAFAF8;
    display: flex;
    color: #1a1a18;
  }
  .auth-serif { font-family: 'Cormorant Garamond', Georgia, serif; }

  /* Panel izquierdo oscuro */
  .auth-left {
    flex: 1;
    background: #0c0c0c;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 48px;
    position: relative;
    overflow: hidden;
  }
  @media (max-width: 768px) { .auth-left { display: none; } }

  .auth-left::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px);
    background-size: 28px 28px;
    pointer-events: none;
  }
  .auth-left::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 2px;
    background: var(--primary, oklch(0.60 0.18 320));
    opacity: 0.65;
  }

  /* Panel derecho */
  .auth-right {
    width: 100%;
    max-width: 460px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 56px 48px;
    background: #FAFAF8;
    position: relative;
  }
  .auth-right::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--primary, oklch(0.60 0.18 320)) 32px, rgba(26,26,24,0.07) 32px);
  }
  @media (max-width: 768px) {
    .auth-right { max-width: 100%; padding: 40px 28px; }
  }

  /* Label */
  .auth-label {
    display: block;
    font-size: 9px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(26,26,24,0.45);
    font-weight: 500;
    margin-bottom: 10px;
  }

  /* Input underline */
  .auth-input {
    width: 100%;
    background: transparent;
    border: none;
    border-bottom: 1px solid rgba(26,26,24,0.18);
    padding: 10px 32px 10px 0;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    color: #1a1a18;
    outline: none;
    transition: border-color 0.2s;
    box-sizing: border-box;
  }
  .auth-input:focus { border-bottom-color: var(--primary, oklch(0.60 0.18 320)); }
  .auth-input::placeholder { color: rgba(26,26,24,0.28); }

  /* Botón */
  .auth-btn {
    width: 100%;
    padding: 15px 24px;
    background: #1a1a18;
    color: white;
    border: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: background 0.25s;
    margin-top: 36px;
  }
  .auth-btn:hover:not(:disabled) { background: var(--primary, oklch(0.60 0.18 320)); }
  .auth-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  /* Error */
  .auth-error {
    border-left: 2px solid #dc2626;
    padding: 8px 12px;
    font-size: 12px;
    color: #b91c1c;
    margin-top: 16px;
    background: rgba(220,38,38,0.04);
  }

  /* Animaciones escalonadas */
  @keyframes authUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .a1 { animation: authUp 0.45s 0.00s ease both; }
  .a2 { animation: authUp 0.45s 0.07s ease both; }
  .a3 { animation: authUp 0.45s 0.14s ease both; }
  .a4 { animation: authUp 0.45s 0.21s ease both; }
  .a5 { animation: authUp 0.45s 0.28s ease both; }
  .a6 { animation: authUp 0.45s 0.35s ease both; }

  .auth-thin-line {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(26,26,24,0.1), transparent);
    margin: 28px 0;
  }
`

export default function LoginPage() {
  const [email, setEmail]               = useState("")
  const [password, setPassword]         = useState("")
  const [showPass, setShowPass]         = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [isLoading, setIsLoading]       = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push("/dashboard")
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: AUTH_CSS }} />
      <div className="auth-root">

        {/* ── Panel izquierdo ─────────────────────────────────────────────── */}
        <div className="auth-left">

          {/* Logo mark */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{
              width: 28, height: 28,
              background: "var(--primary, oklch(0.60 0.18 320))",
              opacity: 0.85,
            }} />
          </div>

          {/* Titular */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <p style={{
              fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.35)", marginBottom: 22,
            }}>
              Sistema de gestión
            </p>
            <h1 className="auth-serif" style={{
              fontSize: "clamp(34px, 3.5vw, 52px)",
              fontWeight: 300, lineHeight: 1.18,
              color: "white", margin: "0 0 24px",
            }}>
              Controla tu negocio<br />
              con{" "}
              <em style={{
                fontStyle: "italic",
                color: "var(--primary, oklch(0.70 0.18 320))",
              }}>
                claridad
              </em>
            </h1>
            <div style={{
              width: 28, height: 1.5,
              background: "var(--primary, oklch(0.60 0.18 320))",
              opacity: 0.55, marginBottom: 20,
            }} />
            <p style={{
              fontSize: 12, color: "rgba(255,255,255,0.35)",
              lineHeight: 1.75, maxWidth: 260, fontWeight: 300,
            }}>
              Inventario, ventas y rentabilidad centralizados. Multiempresa, en tiempo real.
            </p>
          </div>

          {/* Footer */}
          <p style={{
            position: "relative", zIndex: 1,
            fontSize: 9, letterSpacing: "0.14em",
            textTransform: "uppercase", color: "rgba(255,255,255,0.15)",
          }}>
            Plataforma multiempresa · {new Date().getFullYear()}
          </p>
        </div>

        {/* ── Panel derecho ────────────────────────────────────────────────── */}
        <div className="auth-right">
          <div style={{ maxWidth: 340, width: "100%" }}>

            {/* Encabezado */}
            <div className="a1" style={{ marginBottom: 44 }}>
              <p style={{
                fontSize: 9, letterSpacing: "0.24em", textTransform: "uppercase",
                color: "var(--primary, oklch(0.60 0.18 320))",
                marginBottom: 14, fontWeight: 500,
              }}>
                Acceso
              </p>
              <h2 className="auth-serif" style={{
                fontSize: 34, fontWeight: 400,
                lineHeight: 1.15, margin: "0 0 8px",
              }}>
                Iniciar sesión
              </h2>
              <p style={{ fontSize: 12, color: "rgba(26,26,24,0.4)", margin: 0 }}>
                Ingresa tus credenciales para continuar
              </p>
            </div>

            <form onSubmit={handleLogin}>

              {/* Email */}
              <div className="a2" style={{ marginBottom: 28 }}>
                <label className="auth-label">Correo electrónico</label>
                <div style={{ position: "relative" }}>
                  <input
                    className="auth-input"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div className="a3">
                <label className="auth-label">Contraseña</label>
                <div style={{ position: "relative" }}>
                  <input
                    className="auth-input"
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    style={{
                      position: "absolute", right: 0, bottom: 10,
                      background: "none", border: "none", cursor: "pointer",
                      color: "rgba(26,26,24,0.3)", padding: 0, lineHeight: 1,
                    }}
                  >
                    {showPass
                      ? <EyeOff size={14} strokeWidth={1.5} />
                      : <Eye size={14} strokeWidth={1.5} />
                    }
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="auth-error a3">{error}</div>
              )}

              {/* Botón */}
              <div className="a4">
                <button type="submit" className="auth-btn" disabled={isLoading}>
                  {isLoading ? (
                    <span>Verificando...</span>
                  ) : (
                    <>
                      Iniciar Sesión
                      <ArrowRight size={12} strokeWidth={1.5} />
                    </>
                  )}
                </button>
              </div>

            </form>

            {/* Pie 
            <div className="a5">
              <div className="auth-thin-line" />
              <p style={{
                fontSize: 12, color: "rgba(26,26,24,0.4)",
                textAlign: "center", margin: 0,
              }}>
                ¿Sin acceso?{" "}
                <Link href="/auth/sign-up" style={{
                  color: "#1a1a18", fontWeight: 500,
                  textDecoration: "none",
                  borderBottom: "1px solid rgba(26,26,24,0.25)",
                  paddingBottom: 1,
                }}>
                  Solicitar cuenta
                </Link>
              </p>
            </div>*/}

          </div>
        </div>

      </div>
    </>
  )
}
