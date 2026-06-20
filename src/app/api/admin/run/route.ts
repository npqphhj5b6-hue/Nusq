import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const session = request.cookies.get("admin_session")?.value;
  if (session !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  try {
    // If manual story seeds are provided, POST to the pipeline; otherwise GET (auto-select)
    const body = await request.json().catch(() => null);
    const hasManualStories = Array.isArray(body?.stories) && body.stories.length >= 2;

    const res = hasManualStories
      ? await fetch(`${siteUrl}/api/pipeline`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.CRON_SECRET}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        })
      : await fetch(`${siteUrl}/api/pipeline`, {
          headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
        });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
