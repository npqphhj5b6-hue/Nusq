import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/briefings";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(toSet) {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && user) {
      // If a specific next destination was requested (e.g. update-password), honour it
      if (next !== "/briefings") {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Detect new users: no preferences row yet → send to onboarding
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!prefs) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      return NextResponse.redirect(`${origin}/briefings`);
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=auth_failed`);
}
