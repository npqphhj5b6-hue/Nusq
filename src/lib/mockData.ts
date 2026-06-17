import { Briefing, Essay } from "./types";

export const mockBriefings: Briefing[] = [
  {
    id: "mock-1",
    slug: "15-june-2026",
    title: "Aramco holds dividend as oil slips; UAE non-oil GDP beats forecast",
    date: "2026-06-15",
    summary:
      "Saudi Aramco reaffirmed its $31.1bn annual dividend commitment despite a softer Q1 earnings print. Meanwhile, UAE non-oil GDP growth came in at 4.8% — above consensus — driven by logistics and financial services.",
    tags: ["Saudi Arabia", "UAE", "Energy", "Macro"],
    readingTime: 3,
    status: "published",
    body: `## Saudi Aramco: dividend holds, outlook cautious

Saudi Aramco reaffirmed its $31.1bn annual dividend commitment after a first quarter in which net income fell 14% year-on-year to $26.0bn, pressured by lower crude prices and a planned maintenance cycle at its Abqaiq facility.

The performance-linked dividend — introduced in 2024 as a sweetener during the secondary share offering — was not triggered this quarter, as free cash flow came in below the required threshold. That said, the base dividend remains fully covered, and management signalled no intention to reduce it, even in a $70 per barrel environment.

**What to watch:** The more important variable is Saudi Aramco's capital expenditure guidance, which it trimmed slightly to between $48bn and $58bn for the full year. This contraction, modest as it is, reflects the fiscal pressure on Riyadh as Vision 2030 project timelines shift — and it will matter for oilfield services firms with significant Saudi exposure.

## UAE non-oil economy: logistics and finance lead

The UAE Federal Competitiveness and Statistics Centre reported non-oil GDP growth of 4.8% in Q1 2026, beating analyst estimates of 3.9%. The outperformance was driven by the logistics sector — buoyed by continued diversion of Red Sea shipping through UAE ports — and financial services, where net foreign direct investment inflows accelerated.

Tourism, by contrast, came in softer than expected. Visitor numbers from key European markets declined marginally, which analysts attribute partly to a stronger dirham and partly to increased regional competition from Saudi Arabia's growing hospitality pipeline.

**The SAMA dimension:** The UAE data reinforces a pattern becoming visible across the Gulf: non-oil diversification is real, but unevenly distributed across sectors. Financial services and logistics are pulling ahead of manufacturing and tourism in most markets — a structural reality that complicates the headline diversification story.

## Egypt: IMF tranche delayed as fiscal targets slip

A disbursement of approximately $1.2bn from the IMF's Extended Fund Facility — expected in May — has been pushed to July following a review that found Egypt's fiscal consolidation slightly behind target. Energy subsidy reform, while substantially complete, has created second-order inflation pressures that complicated the government's revenue projections.

The delay is technical rather than political, according to people familiar with the programme, and the IMF has not revised its overall assessment of the programme. The Egyptian pound remained stable through the announcement.`,
  },
  {
    id: "mock-2",
    slug: "14-june-2026",
    title: "PIF's $40bn domestic push; Kuwait parliament passes budget",
    date: "2026-06-14",
    summary:
      "The Public Investment Fund confirmed a $40bn tranche of domestic project commitments for H2 2026, concentrated in logistics and renewable energy. Kuwait's National Assembly passed its 2026–27 budget with a projected deficit of KWD 5.8bn.",
    tags: ["Saudi Arabia", "Kuwait", "PIF", "Fiscal"],
    readingTime: 3,
    status: "published",
    body: `## PIF confirms $40bn domestic deployment for H2

The Public Investment Fund announced commitments worth approximately $40bn for domestic projects in the second half of 2026, primarily in logistics infrastructure and renewable energy. The announcement reinforces the fund's stated goal of raising domestic deployment to 70% of total assets by 2030 — a shift from the international-first strategy that defined the 2016–2022 period.

Key beneficiaries include NEOM's transport corridors, the Sudair solar complex phase three expansion, and a new logistics free zone near King Abdulaziz Port in Dammam. The last of these is notable: it represents a direct play on redirected Red Sea shipping flows, which have brought sustained volumes to Saudi ports that were previously routing through Jeddah Islamic Port.

**What to watch:** The pace of actual spend versus commitment. PIF announcements tend to lead disbursements by 12–18 months, and the contracting market has shown signs of cost inflation at several NEOM-adjacent sites. If spend accelerates faster than project absorption capacity, headline figures will outpace real economic impact.

## Kuwait: budget passes with KWD 5.8bn deficit

The Kuwaiti National Assembly approved the 2026–27 budget after three months of negotiations, with a projected deficit of KWD 5.8bn ($18.9bn) at current oil prices. The budget assumes a break-even oil price of approximately $90 per barrel — well above current Brent levels — making the actual deficit likely to be wider.

Kuwait's fiscal position remains structurally challenging. The General Reserve Fund, which covers budget shortfalls, has been drawn down significantly since 2020, and parliament has repeatedly blocked government attempts to introduce a domestic debt law that would allow bond issuance. Without that law, Kuwait cannot tap international capital markets and must rely entirely on reserve drawdowns to finance deficits.

This is a constraint that distinguishes Kuwait sharply from its GCC peers, all of which have issued sovereign debt in recent years with considerable investor appetite.`,
  },
  {
    id: "mock-3",
    slug: "13-june-2026",
    title: "Egypt's central bank holds rates; Riyadh Air announces first routes",
    date: "2026-06-13",
    summary:
      "The Central Bank of Egypt held its overnight deposit rate at 27.25%, citing elevated core inflation. Riyadh Air confirmed its first international route network, targeting 25 cities by end of 2026.",
    tags: ["Egypt", "Saudi Arabia", "Aviation", "Monetary Policy"],
    readingTime: 3,
    status: "published",
    body: `## Central Bank of Egypt: rates on hold

The Central Bank of Egypt's Monetary Policy Committee held the overnight deposit rate at 27.25% and the overnight lending rate at 28.25% at its June meeting, in line with market expectations. The decision reflects persistent core inflation, which came in at 26.1% year-on-year in May — down from a peak of 41% in September 2023, but still well above the CBE's medium-term target corridor of 7% (±2%).

The CBE cited improvements in food price inflation and the relative stability of the Egyptian pound as positive signals, but noted that services inflation remains elevated, driven in part by energy pass-through from the subsidy reform programme.

The market is pricing the first rate cut in Q4 2026, contingent on inflation continuing its downward trajectory.

## Riyadh Air: first routes confirmed

Riyadh Air, the new Saudi national carrier backed by PIF, confirmed its inaugural international route network. The airline will launch service to 25 cities by December 2026, with initial operations focused on Europe, South and Southeast Asia, and North Africa.

The announcement is notable for what it does not include: no routes to Israel were named, despite the Abraham Accords-adjacent diplomatic context that shaped early speculation about the airline's network. Routes to Jordan, Egypt, and Morocco were confirmed.

Riyadh Air enters a Gulf aviation market already served by Emirates, Etihad, Qatar Airways, and the incumbent Saudi carrier Saudia — now rebranding as Flyadeal for short-haul and Saudi Arabian Airlines for long-haul. The competitive dynamics are complex: Riyadh Air is not simply trying to grow the market but to shift the geographic centre of hub aviation away from Dubai and Doha toward Riyadh.`,
  },
  {
    id: "mock-4",
    slug: "12-june-2026",
    title: "Qatar LNG expansion greenlit; Morocco's renewable push attracts EU capital",
    date: "2026-06-12",
    summary:
      "QatarEnergy received final approval for the North Field South expansion, taking Qatar's LNG capacity to 142 MTPA by 2030. The EU's CBAM mechanism is redirecting clean energy investment toward Morocco.",
    tags: ["Qatar", "Morocco", "Energy", "LNG"],
    readingTime: 3,
    status: "published",
    body: `## QatarEnergy: North Field South greenlit

QatarEnergy received final government approval for the North Field South expansion project, the last of four phases that will raise Qatar's LNG export capacity from 77 MTPA today to 142 MTPA by 2030. The expansion cements Qatar's position as the world's largest LNG exporter by volume, ahead of Australia and the United States.

The timing is commercially significant. European buyers, who pivoted sharply toward LNG after 2022, have signed long-term offtake agreements with QatarEnergy through to the mid-2030s, providing revenue visibility that supports the capital-intensive expansion. Shell, TotalEnergies, ExxonMobil, and ConocoPhillips hold equity stakes in the expanded capacity.

**The geopolitical subtext:** Qatar's LNG expansion is also a soft-power instrument. Countries dependent on Qatari gas supply are unlikely to apply diplomatic pressure on Doha — a dynamic Qatari foreign policy has used with considerable sophistication since 2022.

## Morocco: EU carbon rules redirect clean investment

Morocco is emerging as a significant beneficiary of the EU's Carbon Border Adjustment Mechanism, which from 2026 applies a carbon price to imports of steel, aluminium, cement, and other industrial goods into the EU. Moroccan producers with access to renewable energy — Morocco has 52% renewable penetration in its grid — face a substantially lower CBAM cost than competitors in, say, Egypt or Turkey.

European industrial companies are responding by accelerating investment in Moroccan manufacturing capacity as a low-carbon production base for EU export. The pattern mirrors what happened to Central and Eastern Europe in the 1990s — when EU accession prospects made those countries attractive for German manufacturing investment.

Morocco is not an EU candidate, but CBAM is creating a partial economic equivalent of that pull.`,
  },
];

export const mockEssays: Essay[] = [];

export function getBriefingBySlug(slug: string): Briefing | undefined {
  return mockBriefings.find((b) => b.slug === slug);
}

export function getEssayBySlug(slug: string): Essay | undefined {
  return mockEssays.find((e) => e.slug === slug);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}
