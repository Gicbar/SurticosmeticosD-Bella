import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  let user = null
  try {
    const { data, error } = await supabase.auth.getUser()

    // Fallo de red/transitorio al validar la sesión contra Supabase (p.ej.
    // un blip de DNS) — NO es lo mismo que "no hay sesión". Si forzamos el
    // logout aquí, un corte de conectividad de un segundo saca al usuario
    // de la app aunque su sesión siga siendo válida. En ese caso dejamos
    // pasar la request tal cual, sin tocar cookies ni redirigir.
    if (error && (error.name === "AuthRetryableFetchError" || error.status === 0)) {
      return supabaseResponse
    }

    user = data.user
  } catch {
    // Mismo criterio: si getUser() ni siquiera pudo completar la llamada,
    // no lo tratamos como sesión inválida.
    return supabaseResponse
  }

  // ── 1. Sin sesión → redirigir a login ────────────────────────────────────
  if (!user && !request.nextUrl.pathname.startsWith("/auth")) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // ── 2. Con sesión → verificar que tiene empresa asignada ─────────────────
  if (user && request.nextUrl.pathname.startsWith("/dashboard")) {
    const { data: userCompany, error: companyError } = await supabase
      .from("user_companies")
      .select("company_id")
      .eq("user_id", user.id)
      .single()

    // companyError.code === "PGRST116" = ".single() no encontró filas", que
    // es el caso real de "no tiene empresa asignada". Cualquier OTRO error
    // (red, timeout, etc.) no debe interpretarse como eso — ahí no redirigimos.
    const genuinelyNoCompany = !userCompany && (!companyError || companyError.code === "PGRST116")
    if (genuinelyNoCompany) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/sin-empresa" // puedes cambiar esta ruta
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
