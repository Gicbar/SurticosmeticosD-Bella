"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

const AUTH_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
  .auth-root { font-family:'DM Sans',sans-serif; min-height:100vh; background:#FAFAF8; display:flex; color:#1a1a18; }
  .auth-serif { font-family:'Cormorant Garamond',Georgia,serif; }
  .auth-left { flex:1; background:#1a1a18; display:flex; flex-direction:column; justify-content:space-between; padding:48px; position:relative; overflow:hidden; }
  @media(max-width:768px){.auth-left{display:none;}}
  .auth-left::before { content:''; position:absolute; inset:0; background-image:radial-gradient(circle,rgba(255,255,255,0.05) 1px,transparent 1px); background-size:28px 28px; pointer-events:none; }
  .auth-left::after { content:''; position:absolute; bottom:0; left:0; right:0; height:2px; background:var(--primary,oklch(0.60 0.18 320)); opacity:0.65; }
  .auth-right { width:100%; max-width:460px; flex-shrink:0; display:flex; flex-direction:column; justify-content:center; padding:56px 48px; background:#FAFAF8; position:relative; }
  .auth-right::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,var(--primary,oklch(0.60 0.18 320)) 32px,rgba(26,26,24,0.07) 32px); }
  @media(max-width:768px){.auth-right{max-width:100%;padding:40px 28px;}}
  .auth-btn { display:inline-flex; align-items:center; gap:10px; width:100%; justify-content:center; padding:15px 24px; background:#1a1a18; color:white; border:none; font-family:'DM Sans',sans-serif; font-size:10px; font-weight:500; letter-spacing:0.2em; text-transform:uppercase; cursor:pointer; text-decoration:none; transition:background 0.25s; margin-top:32px; }
  .auth-btn:hover { background:var(--primary,oklch(0.60 0.18 320)); }
  @keyframes authUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  .a1{animation:authUp 0.45s 0.00s ease both} .a2{animation:authUp 0.45s 0.10s ease both} .a3{animation:authUp 0.45s 0.20s ease both} .a4{animation:authUp 0.45s 0.30s ease both}
`

export default function SignUpSuccessPage() {
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
              Registro completado
            </p>
            <h1 className="auth-serif" style={{ fontSize: "clamp(34px, 3.5vw, 52px)", fontWeight: 300, lineHeight: 1.18, color: "white", margin: "0 0 24px" }}>
              Bienvenido al<br />
              <em style={{ fontStyle: "italic", color: "var(--primary, oklch(0.70 0.18 320))" }}>equipo</em>
            </h1>
            <div style={{ width: 28, height: 1.5, background: "var(--primary, oklch(0.60 0.18 320))", opacity: 0.55, marginBottom: 20 }} />
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.75, maxWidth: 260, fontWeight: 300 }}>
              Tu cuenta ha sido creada. Un administrador revisará y habilitará tus permisos pronto.
            </p>
          </div>
          <p style={{ position: "relative", zIndex: 1, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.15)" }}>
            Plataforma multiempresa · {new Date().getFullYear()}
          </p>
        </div>

        {/* Panel derecho */}
        <div className="auth-right">
          <div style={{ maxWidth: 340, width: "100%" }}>

            {/* Check mark decorativo */}
            <div className="a1" style={{ marginBottom: 36 }}>
              <div style={{
                width: 48, height: 48,
                border: "1px solid rgba(26,26,24,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 28,
              }}>
                <span style={{
                  fontSize: 20, color: "var(--primary, oklch(0.60 0.18 320))",
                  fontFamily: "Georgia, serif",
                }}>✓</span>
              </div>

              <p style={{ fontSize: 9, letterSpacing: "0.24em", textTransform: "uppercase", color: "var(--primary, oklch(0.60 0.18 320))", marginBottom: 14, fontWeight: 500 }}>
                Cuenta creada
              </p>
              <h2 className="auth-serif" style={{ fontSize: 34, fontWeight: 400, lineHeight: 1.15, margin: "0 0 8px" }}>
                ¡Registro exitoso!
              </h2>
            </div>

            {/* Pasos */}
            <div className="a2" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { num: "01", text: "Tu cuenta ha sido creada correctamente." },
                { num: "02", text: "Revisa tu correo y confirma tu dirección de email." },
                { num: "03", text: "Un administrador habilitará tus permisos de acceso." },
              ].map((step) => (
                <div key={step.num} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <span style={{
                    fontSize: 9, fontWeight: 500, letterSpacing: "0.1em",
                    color: "var(--primary, oklch(0.60 0.18 320))",
                    flexShrink: 0, marginTop: 2,
                  }}>
                    {step.num}
                  </span>
                  <p style={{ fontSize: 13, color: "rgba(26,26,24,0.6)", lineHeight: 1.6, margin: 0 }}>
                    {step.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="a3">
              <Link href="/auth/login" className="auth-btn">
                Ir a iniciar sesión
                <ArrowRight size={12} strokeWidth={1.5} />
              </Link>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
