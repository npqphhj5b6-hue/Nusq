import type { SourceTier, SourceType } from "./source-credibility";

export type { SourceType };

export interface ChartDataset {
  label: string;
  values: number[];
  color?: string;
}

export interface ChartData {
  type: string;
  title: string;
  labels: string[];
  values: number[];
  unit: string;
  source: string;
  datasets?: ChartDataset[];
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

export interface Counterpoint {
  claim: string;
  claimSourceIndices: number[];
  counterEvidence: string;
  counterSourceIndices: number[];
  type: "direct_contradiction" | "time_horizon_difference" | "scope_difference" | "official_vs_media_difference" | "risk_factor";
  severity: "high" | "medium" | "low";
  blocksPublish: boolean;
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
  // Stage 5 quality pass: human-readable list of edits the quality pass applied
  editsApplied?: string[];
}

// Per-story evidence metadata (the "Evidence bubble" — Part 5)
export interface StoryEvidence {
  sourcesReviewed: number;        // exact count of sources behind this story
  verifiedAt: string;             // ISO — when sources were last checked
  marketImpact: string;           // directional clause, never a single word
  asOf: string | null;            // ISO of the most-recent source → rendered "Xh ago"
  relevance: "high" | "medium" | "low";
  relevanceReason: string;        // one clause
  geographies: string[];          // pill tags
  sectors: string[];              // pill tags
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

export interface BriefingStory {
  number: number;
  headline: string;
  location: string;
  city?: string;
  body: string;
  imageUrl?: string | null;
  imageCredit?: string | null;
  imageCreditLink?: string | null;
  chartData?: ChartData | null;
  // Per-story evidence bubble (new 2-story format)
  evidence?: StoryEvidence | null;
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
  counterpoints?: Counterpoint[] | null;
  // Multi-story format
  stories?: BriefingStory[] | null;
  tldrBullets?: string[] | null;
  // "Also Watching" — three single-line signal flags (new 2-story format)
  alsoWatching?: string[] | null;
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
