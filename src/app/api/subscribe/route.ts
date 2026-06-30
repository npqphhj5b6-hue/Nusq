import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(request: Request) {
  let email: string;
  try {
    const body = await request.json();
    email = (body.email ?? "").toString().trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from("subscribers")
    .select("active, unsubscribe_token")
    .eq("email", email)
    .maybeSingle();

  if (existing?.active) {
    return NextResponse.json({ ok: true, status: "already_subscribed" });
  }

  if (existing && !existing.active) {
    const { error } = await supabaseAdmin
      .from("subscribers")
      .update({ active: true, subscribed_at: new Date().toISOString() })
      .eq("email", email);
    if (error) return NextResponse.json({ error: "Could not re-subscribe" }, { status: 500 });
    // Send welcome back — fire and forget
    if (existing.unsubscribe_token) {
      sendWelcomeEmail(email, existing.unsubscribe_token).catch(() => null);
    }
    return NextResponse.json({ ok: true, status: "resubscribed" });
  }

  const { data: inserted, error } = await supabaseAdmin
    .from("subscribers")
    .insert({ email })
    .select("unsubscribe_token")
    .single();

  if (error) return NextResponse.json({ error: "Could not subscribe" }, { status: 500 });

  // Send welcome email — fire and forget, never block the response
  if (inserted?.unsubscribe_token) {
    sendWelcomeEmail(email, inserted.unsubscribe_token).catch(() => null);
  }

  return NextResponse.json({ ok: true, status: "subscribed" });
}
