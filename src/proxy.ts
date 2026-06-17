import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Admin guard (cookie-based, unchanged) ────────────────────────────────
  if (pathname.startsWith("/admin")) {
    const session = request.cookies.get("admin_session")?.value;
    const isLoginPage = pathname === "/admin/login";
    const isAuthed = session === process.env.ADMIN_PASSWORD;
    if (!isAuthed && !isLoginPage)
      return NextResponse.redirect(new URL("/admin/login", request.url));
    if (isAuthed && isLoginPage)
      return NextResponse.redirect(new URL("/admin", request.url));
    return NextResponse.next();
  }

  // ── Supabase auth token refresh (all other routes) ───────────────────────
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(toSet) {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
