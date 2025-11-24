"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden">
      {/* 🎥 Fondo de video */}
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

      {/* 🩷 Capa de color y desenfoque */}
      <div className="absolute inset-0 bg-pink-100/50 dark:bg-black/60 backdrop-blur-sm" />

      {/* 🪟 Contenedor del mensaje */}
      <div className="relative z-10 w-full max-w-sm">
        <Card className="bg-white/60 dark:bg-gray-900/70 backdrop-blur-xl shadow-2xl border border-white/30">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-pink-700 dark:text-pink-300">
              Error de Autenticación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            {params?.error ? (
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Código de error: <strong>{params.error}</strong>
              </p>
            ) : (
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Ocurrió un error no especificado.
              </p>
            )}
            <Button
              asChild
              className="w-full bg-pink-600 hover:bg-pink-700 text-white shadow-lg transition-all"
            >
              <Link href="/auth/login">Volver a Iniciar Sesión</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
