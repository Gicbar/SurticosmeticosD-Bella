"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden">
      {/* 🎥 Fondo de video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover opacity-50"
      >
        <source src="/videos/dbella-login.mp4" type="video/mp4" />
      </video>

      {/* 🌫️ Capa de difuminado */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-pink-100/40 to-transparent backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-sm p-6">
        <div className="flex flex-col gap-6 items-center text-center">
          <Card className="w-full backdrop-blur-md bg-white/70 border border-pink-200 shadow-xl">
            <CardHeader>
              <CardTitle className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-pink-400 via-rose-400 to-violet-500 bg-clip-text text-transparent drop-shadow-sm">
                ¡Registro Exitoso!
              </CardTitle>
              <CardDescription className="text-gray-600">
                Verifica tu correo electrónico
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <p className="text-sm text-gray-600">
                Tu cuenta ha sido creada exitosamente.  
                Revisa tu correo electrónico y confirma tu cuenta antes de iniciar sesión.
              </p>

              <Button
                asChild
                className="w-full bg-gradient-to-r from-pink-400 via-rose-400 to-violet-500 text-white font-semibold hover:from-pink-500 hover:to-violet-600 transition-all"
              >
                <Link href="/auth/login">Ir a Iniciar Sesión</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
