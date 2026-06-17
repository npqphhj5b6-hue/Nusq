import type { SourceTier, SourceType } from "./source-credibility";

export type { SourceType };

export interface ChartData {
  type: string;
  title: string;
  labels: string[];
  values: number[];
  unit: string;
  source: string;
}

export interface SourceRef {
  index: number;
  title: string;
  url: string;
  publisher: string;
  domain: string;
  publishedAt: string | null;
  language: "en" | "ar";
  tier: SourceTier;
  snippet: string;
  // Extended source intelligence fields (optional for backwards compatibility)
  originalUrl?: string | null;
  googleNewsUrl?: string | null;
  accessedAt?: string;
  sourceType?: SourceType;
  claimsSupported?: string[];
  eventDate?: string | null;
  isPrimarySource?: boolean;
  isBackgroundContext?: boolean;
  summaryOfRelevance?: string;
  confidence?: "high" | "medium" | "low" | "unknown";
  notes?: string;
}

export interface BriefingClaim {
  claim: string;
  sourceIndices: number[];
  confidence: "high" | "medium" | "low";
  requiresAttribution: boolean;
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
  marketImpactDetail: string;
  investorRelevance: "high" | "medium" | "low";
  relevanceReason: string;
  timeHorizon: "immediate" | "3-6 months" | "long-term" | "unclear";
  affectedSectors: string[];
  affectedGeographies: string[];
  confidenceNote: string;
  freshnessStatus: "fresh" | "developing" | "background" | "stale-risk";
  highestSourceTier: SourceTier;
  conflictingSourcesDetected: boolean;
}

export interface Briefing {
  id: string;
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
  claims?: BriefingClaim[];
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
