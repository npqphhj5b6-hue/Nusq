import type { SourceTier } from "./source-credibility";

export interface ChartData {
  type: string;
  title: string;
  labels: string[];
  values: number[];
  unit: string;
  source: string;
}

export interface SourceRef {
  index: number;       // 1-based, matches [N] in body
  title: string;
  url: string;
  publisher: string;
  publishedAt: string | null;  // ISO date string
  language: "en" | "ar";
  tier: SourceTier;
  snippet: string;
}

export interface ValidationResult {
  passed: boolean;
  sourceCount: number;
  hasUrls: boolean;
  freshnessOk: boolean;
  warnings: string[];
  staleSentinelWords: string[];
  needsReview: boolean;
  checkedAt: string;
}

export interface BriefingIntelligence {
  marketImpact: "positive" | "negative" | "mixed" | "neutral" | "unclear";
  investorRelevance: "high" | "medium" | "low";
  timeHorizon: "immediate" | "3-6 months" | "long-term" | "unclear";
  affectedSectors: string[];
  affectedGeographies: string[];
  confidenceNote: string;
  freshnessStatus: "fresh" | "developing" | "background" | "stale-risk";
  highestSourceTier: SourceTier;
  conflictingSourcesDetected: boolean;
}

export interface Briefing {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  readingTime: number;
  body: string;
  status: "draft" | "published";
  coverImageUrl?: string | null;
  coverImageCredit?: string | null;
  coverImageCreditLink?: string | null;
  tickers?: string[];
  chartData?: ChartData | null;
  sources?: SourceRef[];
  validation?: ValidationResult | null;
  intelligence?: BriefingIntelligence | null;
}

export interface Essay {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  readingTime: number;
  body: string;
}
