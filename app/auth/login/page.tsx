"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
            `${window.location.origin}/dashboard`,
        },
      })
      if (error) throw error
      router.push("/dashboard")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ocurrió un error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden">
      {/* 🎥 Video de fondo */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/videos/dbella-login.mp4" type="video/mp4" />

        Tu navegador no soporta videos HTML5.
      </video>

      {/* Capa de color y desenfoque */}
      <div className="absolute inset-0 bg-pink-100/50 dark:bg-black/60 backdrop-blur-sm" />

      {/* Contenedor del login */}
      <div className="relative z-10 w-full max-w-sm">
        <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-2xl border border-white/20 dark:border-pink-900/20">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-3xl font-extrabold tracking-tight text-pink-700 dark:text-pink-400 drop-shadow-md">
              Surticosméticos D’Bella
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Sistema de Gestión de Ventas
            </CardDescription> 
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                  Correo Electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-pink-200 focus:border-pink-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-pink-200 focus:border-pink-500 transition-colors"
                />
              </div>

              {error && (
                <div className="rounded-md bg-red-100/70 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-400">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-600 hover:opacity-90 text-white font-medium transition-all"
                disabled={isLoading}
              >
                {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>

              <div className="text-center text-sm text-muted-foreground mt-3">
                ¿No tienes una cuenta?{" "}
                <Link
                  href="/auth/sign-up"
                  className="text-pink-600 hover:text-pink-700 font-medium underline underline-offset-4"
                >
                  Registrarse
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
