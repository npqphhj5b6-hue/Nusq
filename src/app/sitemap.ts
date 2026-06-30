import type { MetadataRoute } from "next";
import { getAllBriefings } from "@/lib/db";
import { GLOSSARY } from "@/lib/glossary";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nusq.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const briefings = await getAllBriefings();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL,                        lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
    { url: `${SITE_URL}/briefings`,         lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${SITE_URL}/signals`,           lastModified: new Date(), changeFrequency: "daily",   priority: 0.8 },
    { url: `${SITE_URL}/heatmap`,           lastModified: new Date(), changeFrequency: "daily",   priority: 0.7 },
    { url: `${SITE_URL}/glossary`,          lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/about`,             lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  const briefingRoutes: MetadataRoute.Sitemap = briefings.map((b) => ({
    url: `${SITE_URL}/briefings/${b.slug}`,
    lastModified: new Date(b.date),
    changeFrequency: "never",
    priority: 0.8,
  }));

  const glossaryRoutes: MetadataRoute.Sitemap = GLOSSARY.map((t) => ({
    url: `${SITE_URL}/glossary/${t.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...briefingRoutes, ...glossaryRoutes];
}
