// lib/supabase/public-client.ts
// Cliente de Supabase para uso en contextos públicos (sin autenticación).
// NO usa cookies — opera siempre como role 'anon'.
// Usar SOLO en rutas públicas como /catalog.

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,   // no intentar recuperar sesión
        autoRefreshToken: false, // no refrescar tokens
        detectSessionInUrl: false,
      },
    }
  )
}
