import type { Briefing } from "./types";

export type Direction = "positive" | "watch" | "negative";

export interface Signal {
  id: string;
  headline: string;
  detail: string;
  direction: Direction;
  confidence: number;
  sectors: string[];
  geographies: string[];
  relevance: "high" | "medium" | "low";
  sourceSlug: string;
  sourceTitle: string;
  sourcePublisher: string;
  date: string;
}

// Softens old professional-register signal text for a retail reader.
// Runs only if the text looks like the jargon format from the old pipeline prompt.
// New pipeline output (plain language) passes through unchanged.
function humaniseDetail(text: string): string {
  if (!text) return text;
  return text
    .replace(/\bBearish for\b/gi, "Uncertain outlook for")
    .replace(/\bBullish for\b/gi, "Broadly positive for")
    .replace(/\bNeutral to cautious\b/gi, "Mixed picture")
    .replace(/\bNeutral for\b/gi, "Broadly neutral for")
    .replace(/\bnear-term\b/gi, "in the near term")
    .replace(/\bTASI\b/g, "TASI (Saudi stock market)")
    .replace(/\bEGX\b/g, "EGX (Egyptian stock market)")
    .replace(/\bDFM\b/g, "DFM (Dubai Financial Market)")
    .replace(/\bADX\b/g, "ADX (Abu Dhabi Securities Exchange)")
    .replace(/\bQSE\b/g, "QSE (Qatar Stock Exchange)")
    .replace(/\bPIF\b/g, "PIF (Saudi Arabia's sovereign wealth fund)")
    .replace(/\bSAMA\b/g, "SAMA (Saudi central bank)")
    .replace(/\b(SWFs?)\b/g, (_, m) => m.endsWith("s") ? "sovereign wealth funds" : "sovereign wealth fund")
    .replace(/\bEM\b/g, "emerging market")
    .replace(/\bEM funds\b/gi, "emerging market funds")
    .replace(/\bAllocators\b/gi, "Investors");
}

function impactToDirection(impact: string): Direction {
  if (impact === "positive") return "positive";
  if (impact === "negative") return "negative";
  return "watch";
}

function relevanceToConfidence(relevance: string, hasConflicts: boolean): number {
  const base = relevance === "high" ? 82 : relevance === "medium" ? 64 : 46;
  return hasConflicts ? Math.max(base - 12, 30) : base;
}

export function extractSignals(briefings: Briefing[]): Signal[] {
  const signals: Signal[] = [];

  for (const b of briefings) {
    const intel = b.intelligence;
    const stories = b.stories ?? [];

    if (stories.length > 0) {
      for (const story of stories) {
        const evidence = story.evidence;
        if (!evidence) continue;
        const dir = impactToDirection(evidence.marketImpact.toLowerCase().includes("positive") ? "positive"
          : evidence.marketImpact.toLowerCase().includes("negative") ? "negative"
          : "watch");
        const conf = relevanceToConfidence(evidence.relevance, false);
        signals.push({
          id: `${b.slug}-story-${story.number}`,
          headline: story.headline,
          detail: humaniseDetail(evidence.marketImpact),
          direction: dir,
          confidence: conf,
          sectors: evidence.sectors,
          geographies: evidence.geographies,
          relevance: evidence.relevance,
          sourceSlug: b.slug,
          sourceTitle: b.title,
          sourcePublisher: b.sources?.[0]?.publisher ?? "Nusq",
          date: b.date,
        });
      }
    } else if (intel) {
      signals.push({
        id: `${b.slug}-briefing`,
        headline: b.title,
        detail: humaniseDetail(intel.marketImpactDetail),
        direction: impactToDirection(intel.marketImpact),
        confidence: relevanceToConfidence(intel.investorRelevance, intel.conflictingSourcesDetected),
        sectors: intel.affectedSectors,
        geographies: intel.affectedGeographies,
        relevance: intel.investorRelevance,
        sourceSlug: b.slug,
        sourceTitle: b.title,
        sourcePublisher: b.sources?.[0]?.publisher ?? "Nusq",
        date: b.date,
      });
    }
  }

  return signals.sort((a, b) => {
    const relOrder = { high: 0, medium: 1, low: 2 };
    const dateSort = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateSort !== 0) return dateSort;
    return relOrder[a.relevance] - relOrder[b.relevance];
  });
}

export function directionLabel(d: Direction) {
  return d === "positive" ? "Positive" : d === "negative" ? "Negative" : "Watch";
}

export function directionClass(d: Direction) {
  return d === "positive" ? "chip-positive" : d === "negative" ? "chip-negative" : "chip-watch";
}

export function directionDot(d: Direction) {
  return d === "positive" ? "var(--c-positive)" : d === "negative" ? "var(--c-negative)" : "var(--c-watch)";
}
