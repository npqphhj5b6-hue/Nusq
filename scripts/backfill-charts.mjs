import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const FRED_SERIES = {
  brent_price: "MCOILBRENTEU",
  gold: "GOLDPMGBD228NLBM",
  fx_egp: "EXEGUS",
  fx_sar: "EXSAUS",
};

const WB_INDICATORS = {
  gdp_growth: "NY.GDP.MKTP.KD.ZG",
  inflation: "FP.CPI.TOTL.ZG",
};

const CHART_TITLES = {
  brent_price: "Brent Crude Oil (USD/barrel)",
  gold: "Gold Price (USD/troy oz)",
  fx_egp: "USD/EGP Exchange Rate",
  fx_sar: "USD/SAR Exchange Rate",
  gdp_growth: "GDP Growth Rate (%)",
  inflation: "Inflation Rate (CPI, %)",
};

async function fetchFredSeries(seriesId, limit = 24) {
  const key = process.env.FRED_API_KEY;
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${key}&file_type=json&sort_order=desc&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FRED ${res.status}`);
  const data = await res.json();
  const obs = data.observations
    .filter((o) => o.value !== "." && !isNaN(parseFloat(o.value)))
    .reverse();
  return {
    labels: obs.map((o) => o.date.slice(0, 7)),
    values: obs.map((o) => parseFloat(parseFloat(o.value).toFixed(2))),
  };
}

async function fetchWorldBankSeries(countryCode, indicator, limit = 10) {
  const url = `https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicator}?format=json&per_page=${limit}&mrv=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`World Bank ${res.status}`);
  const data = await res.json();
  const rows = (data[1] ?? []).filter((r) => r.value !== null).reverse();
  return {
    labels: rows.map((r) => r.date),
    values: rows.map((r) => parseFloat(r.value.toFixed(2))),
  };
}

async function pickChart(briefing) {
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 100,
    messages: [
      {
        role: "user",
        content: `Pick ONE data chart for this MENA financial briefing. Be decisive — always pick something if there is any reasonable match.

Title: ${briefing.title}
Tags: ${(briefing.tags ?? []).join(", ")}
Summary: ${briefing.summary}

Chart types (pick the best match):
- "brent_price" → any mention of oil, crude, Aramco, OPEC, energy prices, LNG
- "gold" → gold, safe-haven, commodities
- "fx_egp" → Egypt, pound, EGP, Egyptian economy, IMF deal
- "fx_sar" → Saudi riyal, Saudi monetary policy
- "gdp_growth" → economic growth, GDP, PIF investment, non-oil economy (country required)
- "inflation" → inflation, CPI, central bank rates, cost of living (country required)
- null → only if truly none of the above apply at all

Country codes (only for gdp_growth / inflation): SA=Saudi Arabia, AE=UAE, EG=Egypt, QA=Qatar, KW=Kuwait, OM=Oman, BH=Bahrain, JO=Jordan

Reply with ONLY JSON: {"type":"brent_price","country":null} — no other text.`,
      },
    ],
  });

  const raw = msg.content.find((b) => b.type === "text")?.text?.trim() ?? "{}";
  const text = raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
  try {
    return JSON.parse(text);
  } catch {
    console.log("  parse failed on:", raw);
    return { type: null, country: null };
  }
}

async function buildChartData(spec) {
  if (!spec.type) return null;
  try {
    let series;
    if (spec.type in FRED_SERIES) {
      series = await fetchFredSeries(FRED_SERIES[spec.type]);
    } else if (spec.type in WB_INDICATORS && spec.country) {
      series = await fetchWorldBankSeries(spec.country, WB_INDICATORS[spec.type]);
    } else {
      return null;
    }
    if (series.labels.length < 3) return null;
    return {
      type: spec.type,
      title: CHART_TITLES[spec.type] ?? spec.type,
      labels: series.labels,
      values: series.values,
      unit: spec.type.startsWith("fx_") ? "rate" : spec.type === "brent_price" || spec.type === "gold" ? "USD" : "%",
      source: spec.type in FRED_SERIES ? "FRED / St. Louis Fed" : "World Bank Open Data",
    };
  } catch (e) {
    console.error(`  Chart fetch failed: ${e.message}`);
    return null;
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

const { data: briefings, error } = await supabase
  .from("briefings")
  .select("id, slug, title, summary, tags, chart_data")
  .order("date", { ascending: false });

if (error) { console.error(error); process.exit(1); }

console.log(`Found ${briefings.length} briefings\n`);

for (const b of briefings) {
  console.log(`[${b.slug}] processing...`);

  const spec = await pickChart(b);
  console.log(`  → chart spec: ${JSON.stringify(spec)}`);

  const chartData = await buildChartData(spec);
  if (!chartData) {
    console.log("  → no chart data, leaving null");
    continue;
  }

  const { error: updateErr } = await supabase
    .from("briefings")
    .update({ chart_data: chartData })
    .eq("id", b.id);

  if (updateErr) {
    console.error(`  Update failed: ${updateErr.message}`);
  } else {
    console.log(`  ✓ saved "${chartData.title}" (${chartData.labels.length} points)`);
  }
}

console.log("\nDone.");
