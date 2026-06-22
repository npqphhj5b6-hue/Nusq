import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";

  if (!token) {
    return new NextResponse("Missing unsubscribe token.", { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("subscribers")
    .update({ active: false })
    .eq("unsubscribe_token", token);

  if (error) {
    return new NextResponse("Could not process unsubscribe request.", { status: 500 });
  }

  return new NextResponse(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Unsubscribed — nusq</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f3; margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: #fff; border: 1px solid #ebebeb; border-radius: 12px; padding: 48px; max-width: 400px; text-align: center; }
    h1 { font-size: 20px; font-weight: 700; letter-spacing: -0.03em; color: #0f0f0f; margin: 0 0 12px; }
    p { font-size: 14px; color: #696969; line-height: 1.6; margin: 0 0 24px; }
    a { font-size: 13px; color: #0A5C3B; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <h1>You've been unsubscribed.</h1>
    <p>You'll no longer receive the nusq Daily Brief. You can re-subscribe any time from the homepage.</p>
    <a href="/">← Back to nusq</a>
  </div>
</body>
</html>`,
    { status: 200, headers: { "Content-Type": "text/html" } }
  );
}
