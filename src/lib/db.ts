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
