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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ── 1. Sin sesión → redirigir a login ────────────────────────────────────
  if (!user && !request.nextUrl.pathname.startsWith("/auth")) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // ── 2. Con sesión → verificar que tiene empresa asignada ─────────────────
  if (user && request.nextUrl.pathname.startsWith("/dashboard")) {
    const { data: userCompany } = await supabase
      .from("user_companies")
      .select("company_id")
      .eq("user_id", user.id)
      .single()

    // Si el usuario autenticado no tiene empresa asignada → redirigir
    if (!userCompany) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/sin-empresa" // puedes cambiar esta ruta
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
