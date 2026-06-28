import { NextRequest, NextResponse } from "next/server";
import { getTrendsData } from "@/lib/db";

export async function GET(request: NextRequest) {
  const period = request.nextUrl.searchParams.get("period") ?? "30d";
  const days = period === "7d" ? 7 : period === "all" ? 3650 : 30;
  const data = await getTrendsData(days);
  return NextResponse.json(data ?? { briefingCount: 0, topSectors: [], topGeographies: [], marketImpact: [], topTags: [] });
}
