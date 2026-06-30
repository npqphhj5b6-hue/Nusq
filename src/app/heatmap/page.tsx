import { getAllBriefings } from "@/lib/db";
import { extractSignals } from "@/lib/signals";
import SectorHeatmap from "@/components/SectorHeatmap";

export const dynamic = "force-dynamic";

export default async function HeatmapPage() {
  const briefings = await getAllBriefings();
  const signals = extractSignals(briefings);

  // Build sector scores from signals
  const sectorMap: Record<string, { positive: number; negative: number; watch: number; total: number }> = {};

  for (const signal of signals) {
    for (const sector of signal.sectors) {
      if (!sectorMap[sector]) sectorMap[sector] = { positive: 0, negative: 0, watch: 0, total: 0 };
      sectorMap[sector][signal.direction]++;
      sectorMap[sector].total++;
    }
  }

  const sectors = Object.entries(sectorMap)
    .map(([name, counts]) => ({
      name,
      ...counts,
      score: (counts.positive - counts.negative) / Math.max(counts.total, 1),
    }))
    .sort((a, b) => b.total - a.total);

  return <SectorHeatmap sectors={sectors} />;
}
