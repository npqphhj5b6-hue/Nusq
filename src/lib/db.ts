import { supabase } from "./supabase";
import { Briefing, BriefingClaim, BriefingIntelligence, BriefingStory, ChartData, Counterpoint, Essay, SourceRef, ValidationResult } from "./types";

export async function getAllBriefings(): Promise<Briefing[]> {
  const { data, error } = await supabase
    .from("briefings")
    .select("*")
    .eq("status", "published")
    .order("date", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToBriefing);
}

export async function getBriefingBySlug(slug: string): Promise<Briefing | null> {
  const { data, error } = await supabase
    .from("briefings")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error) return null;
  return rowToBriefing(data);
}

export async function getAllEssays(): Promise<Essay[]> {
  const { data, error } = await supabase
    .from("essays")
    .select("*")
    .order("date", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToEssay);
}

export async function getEssayBySlug(slug: string): Promise<Essay | null> {
  const { data, error } = await supabase
    .from("essays")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) return null;
  return rowToEssay(data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToBriefing(row: any): Briefing {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    date: row.date,
    summary: row.summary,
    tags: row.tags ?? [],
    readingTime: row.reading_time,
    body: row.body,
    status: row.status,
    coverImageUrl: row.cover_image_url ?? null,
    coverImageCredit: row.cover_image_credit ?? null,
    coverImageCreditLink: row.cover_image_credit_link ?? null,
    tickers: row.tickers ?? [],
    chartData: (row.chart_data as ChartData | null) ?? null,
    sources: (row.sources as SourceRef[] | null) ?? [],
    validation: (row.validation as ValidationResult | null) ?? null,
    intelligence: (row.intelligence as BriefingIntelligence | null) ?? null,
    claims: (row.claims as BriefingClaim[] | null) ?? [],
    counterpoints: (row.counterpoints as Counterpoint[] | null) ?? null,
    stories: (row.stories as BriefingStory[] | null) ?? null,
    tldrBullets: (row.tldr_bullets as string[] | null) ?? null,
    alsoWatching: (row.also_watching as string[] | null) ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToEssay(row: any): Essay {
  return {
    slug: row.slug,
    title: row.title,
    date: row.date,
    summary: row.summary,
    tags: row.tags ?? [],
    readingTime: row.reading_time,
    body: row.body,
  };
}

export interface TrendsData {
  briefingCount: number;
  topSectors: { name: string; count: number }[];
  topGeographies: { name: string; count: number }[];
  marketImpact: { label: string; count: number }[];
  topTags: { name: string; count: number }[];
}

export async function getTrendsData(days = 30): Promise<TrendsData | null> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("briefings")
    .select("tags, stories, intelligence")
    .eq("status", "published")
    .gte("date", since);

  if (error || !data || data.length === 0) return null;

  const sectorCounts: Record<string, number> = {};
  const geoCounts: Record<string, number> = {};
  const impactCounts: Record<string, number> = {};
  const tagCounts: Record<string, number> = {};

  for (const b of data) {
    for (const tag of (b.tags as string[]) ?? []) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
    const impact = (b.intelligence as { marketImpact?: string } | null)?.marketImpact;
    if (impact) impactCounts[impact] = (impactCounts[impact] ?? 0) + 1;
    for (const s of (b.stories as Array<{ evidence?: { sectors?: string[]; geographies?: string[] } }> | null) ?? []) {
      for (const sector of s.evidence?.sectors ?? []) {
        sectorCounts[sector] = (sectorCounts[sector] ?? 0) + 1;
      }
      for (const geo of s.evidence?.geographies ?? []) {
        geoCounts[geo] = (geoCounts[geo] ?? 0) + 1;
      }
    }
  }

  const top = (counts: Record<string, number>, n: number) =>
    Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, n)
      .map(([name, count]) => ({ name, count }));

  const IMPACT_ORDER = ["positive", "mixed", "negative", "neutral", "unclear"];
  const marketImpact = IMPACT_ORDER
    .filter((k) => impactCounts[k] !== undefined)
    .map((k) => ({ label: k, count: impactCounts[k] ?? 0 }));

  return {
    briefingCount: data.length,
    topSectors: top(sectorCounts, 6),
    topGeographies: top(geoCounts, 7),
    marketImpact,
    topTags: top(tagCounts, 12),
  };
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}
