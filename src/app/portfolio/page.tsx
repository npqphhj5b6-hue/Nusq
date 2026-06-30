import { getAllBriefings } from "@/lib/db";
import { extractSignals } from "@/lib/signals";
import PortfolioClient from "./PortfolioClient";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const briefings = await getAllBriefings();
  const signals = extractSignals(briefings.slice(0, 20));

  return <PortfolioClient allSignals={signals} />;
}
