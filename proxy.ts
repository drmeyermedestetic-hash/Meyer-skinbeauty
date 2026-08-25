// proxy.ts (antes middleware.ts — Next.js 16 renombró la convención)
// Primera capa de protección de /admin: exige una sesión de Supabase
// Auth válida. La segunda capa (¿esa cuenta está en `admin_users`?)
// se verifica server-side en cada página/API — ver lib/admin-auth.ts.

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function proxy(request: NextRequest) {
  const isLoginPath = request.nextUrl.pathname === "/admin/login";

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // Supabase no configurado todavía: no hay forma de verificar sesión.
    // Bloqueamos /admin en vez de dejarlo abierto por las dudas.
    if (!isLoginPath) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isLoginPath && !user) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  if (isLoginPath && user) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
