import type { MetadataRoute } from "next";
import { getAllBriefings } from "@/lib/db";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nusq.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const briefings = await getAllBriefings();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL,                        lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
    { url: `${SITE_URL}/briefings`,         lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${SITE_URL}/how-it-works`,      lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/about`,             lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  const briefingRoutes: MetadataRoute.Sitemap = briefings.map((b) => ({
    url: `${SITE_URL}/briefings/${b.slug}`,
    lastModified: new Date(b.date),
    changeFrequency: "never",
    priority: 0.8,
  }));

  return [...staticRoutes, ...briefingRoutes];
}
