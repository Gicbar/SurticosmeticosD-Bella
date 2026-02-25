"use client"

import type React from "react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"

// Reutiliza el mismo CSS base que el login
const AUTH_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
  .auth-root { font-family:'DM Sans',sans-serif; min-height:100vh; background:#FAFAF8; display:flex; color:#1a1a18; }
  .auth-serif { font-family:'Cormorant Garamond',Georgia,serif; }
  .auth-left { flex:1; background:#1a1a18; display:flex; flex-direction:column; justify-content:space-between; padding:48px; position:relative; overflow:hidden; }
  @media(max-width:768px){.auth-left{display:none;}}
  .auth-left::before { content:''; position:absolute; inset:0; background-image:radial-gradient(circle,rgba(255,255,255,0.05) 1px,transparent 1px); background-size:28px 28px; pointer-events:none; }
  .auth-left::after { content:''; position:absolute; bottom:0; left:0; right:0; height:2px; background:var(--primary,oklch(0.60 0.18 320)); opacity:0.65; }
  .auth-right { width:100%; max-width:480px; flex-shrink:0; display:flex; flex-direction:column; justify-content:center; padding:48px; background:#FAFAF8; position:relative; overflow-y:auto; }
  .auth-right::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,var(--primary,oklch(0.60 0.18 320)) 32px,rgba(26,26,24,0.07) 32px); }
  @media(max-width:768px){.auth-right{max-width:100%;padding:40px 28px;}}
  .auth-label { display:block; font-size:9px; letter-spacing:0.2em; text-transform:uppercase; color:rgba(26,26,24,0.45); font-weight:500; margin-bottom:10px; }
  .auth-input { width:100%; background:transparent; border:none; border-bottom:1px solid rgba(26,26,24,0.18); padding:10px 0; font-size:14px; font-family:'DM Sans',sans-serif; color:#1a1a18; outline:none; transition:border-color 0.2s; box-sizing:border-box; }
  .auth-input:focus { border-bottom-color:var(--primary,oklch(0.60 0.18 320)); }
  .auth-input::placeholder { color:rgba(26,26,24,0.28); }
  .auth-btn { width:100%; padding:15px 24px; background:#1a1a18; color:white; border:none; font-family:'DM Sans',sans-serif; font-size:10px; font-weight:500; letter-spacing:0.2em; text-transform:uppercase; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px; transition:background 0.25s; margin-top:32px; }
  .auth-btn:hover:not(:disabled) { background:var(--primary,oklch(0.60 0.18 320)); }
  .auth-btn:disabled { opacity:0.45; cursor:not-allowed; }
  .auth-error { border-left:2px solid #dc2626; padding:8px 12px; font-size:12px; color:#b91c1c; margin-top:16px; background:rgba(220,38,38,0.04); }
  @keyframes authUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  .a1{animation:authUp 0.45s 0.00s ease both} .a2{animation:authUp 0.45s 0.07s ease both}
  .a3{animation:authUp 0.45s 0.14s ease both} .a4{animation:authUp 0.45s 0.21s ease both}
  .a5{animation:authUp 0.45s 0.28s ease both} .a6{animation:authUp 0.45s 0.35s ease both}
  .auth-thin-line { height:1px; background:linear-gradient(90deg,transparent,rgba(26,26,24,0.1),transparent); margin:28px 0; }

  /* Override Select de shadcn para que encaje con el estilo */
  .auth-select-trigger {
    width: 100%;
    background: transparent !important;
    border: none !important;
    border-bottom: 1px solid rgba(26,26,24,0.18) !important;
    border-radius: 0 !important;
    padding: 10px 0 !important;
    font-size: 14px !important;
    font-family: 'DM Sans', sans-serif !important;
    color: #1a1a18 !important;
    box-shadow: none !important;
    height: auto !important;
  }
  .auth-select-trigger:focus { border-bottom-color: var(--primary,oklch(0.60 0.18 320)) !important; outline:none !important; ring:none !important; }
`

export default function SignUpPage() {
  const [email, setEmail]                   = useState("")
  const [password, setPassword]             = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [role, setRole]                     = useState("vendedor")
  const [error, setError]                   = useState<string | null>(null)
  const [isLoading, setIsLoading]           = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== repeatPassword) { setError("Las contraseñas no coinciden"); return }
    if (password.length < 6)        { setError("Mínimo 6 caracteres"); return }

    const supabase = createClient()
    setIsLoading(true); setError(null)
    try {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: { role },
        },
      })
      if (error) throw error
      router.push("/auth/sign-up-success")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al crear la cuenta")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: AUTH_CSS }} />
      <div className="auth-root">

        {/* Panel izquierdo */}
        <div className="auth-left">
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ width: 28, height: 28, background: "var(--primary, oklch(0.60 0.18 320))", opacity: 0.85 }} />
          </div>
          <div style={{ position: "relative", zIndex: 1 }}>
            <p style={{ fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 22 }}>
              Nuevo usuario
            </p>
            <h1 className="auth-serif" style={{ fontSize: "clamp(34px, 3.5vw, 52px)", fontWeight: 300, lineHeight: 1.18, color: "white", margin: "0 0 24px" }}>
              Únete al<br />
              <em style={{ fontStyle: "italic", color: "var(--primary, oklch(0.70 0.18 320))" }}>equipo</em>
            </h1>
            <div style={{ width: 28, height: 1.5, background: "var(--primary, oklch(0.60 0.18 320))", opacity: 0.55, marginBottom: 20 }} />
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.75, maxWidth: 260, fontWeight: 300 }}>
              Crea tu cuenta para acceder al sistema. Un administrador asignará tus permisos.
            </p>
          </div>
          <p style={{ position: "relative", zIndex: 1, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.15)" }}>
            Plataforma multiempresa · {new Date().getFullYear()}
          </p>
        </div>

        {/* Panel derecho */}
        <div className="auth-right">
          <div style={{ maxWidth: 360, width: "100%" }}>

            <div className="a1" style={{ marginBottom: 40 }}>
              <p style={{ fontSize: 9, letterSpacing: "0.24em", textTransform: "uppercase", color: "var(--primary, oklch(0.60 0.18 320))", marginBottom: 14, fontWeight: 500 }}>
                Registro
              </p>
              <h2 className="auth-serif" style={{ fontSize: 34, fontWeight: 400, lineHeight: 1.15, margin: "0 0 8px" }}>
                Crear cuenta
              </h2>
              <p style={{ fontSize: 12, color: "rgba(26,26,24,0.4)", margin: 0 }}>
                Completa el formulario para registrarte
              </p>
            </div>

            <form onSubmit={handleSignUp}>

              <div className="a2" style={{ marginBottom: 26 }}>
                <label className="auth-label">Correo electrónico</label>
                <input className="auth-input" type="email" placeholder="correo@ejemplo.com" required value={email} onChange={e => setEmail(e.target.value)} />
              </div>

              <div className="a3" style={{ marginBottom: 26 }}>
                <label className="auth-label">Rol en la empresa</label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="auth-select-trigger">
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendedor">Vendedor</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="a4" style={{ marginBottom: 26 }}>
                <label className="auth-label">Contraseña</label>
                <input className="auth-input" type="password" placeholder="Mínimo 6 caracteres" required value={password} onChange={e => setPassword(e.target.value)} />
              </div>

              <div className="a5">
                <label className="auth-label">Repetir contraseña</label>
                <input className="auth-input" type="password" placeholder="••••••••" required value={repeatPassword} onChange={e => setRepeatPassword(e.target.value)} />
              </div>

              {error && <div className="auth-error">{error}</div>}

              <div className="a6">
                <button type="submit" className="auth-btn" disabled={isLoading}>
                  {isLoading ? "Creando cuenta..." : <><span>Crear cuenta</span><ArrowRight size={12} strokeWidth={1.5} /></>}
                </button>
              </div>
            </form>

            <div className="a6">
              <div className="auth-thin-line" />
              <p style={{ fontSize: 12, color: "rgba(26,26,24,0.4)", textAlign: "center", margin: 0 }}>
                ¿Ya tienes acceso?{" "}
                <Link href="/auth/login" style={{ color: "#1a1a18", fontWeight: 500, textDecoration: "none", borderBottom: "1px solid rgba(26,26,24,0.25)", paddingBottom: 1 }}>
                  Iniciar sesión
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
