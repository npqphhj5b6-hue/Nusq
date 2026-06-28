import { getTrendsData } from "@/lib/db";
import ScrollReveal from "@/components/ScrollReveal";
import TrendsDashboardClient from "@/components/TrendsDashboardClient";

export default async function TrendsDashboard() {
  const trends = await getTrendsData(30);
  if (!trends || trends.briefingCount === 0) return null;

  return (
    <section className="max-w-5xl mx-auto px-6 py-14 border-b border-[var(--c-border)]">
      <ScrollReveal>
        <TrendsDashboardClient initial={trends} />
      </ScrollReveal>
    </section>
  );
}
