# Nusq Site Audit — 2026-07-01

**Scope:** Local codebase (`main` @ `69a1789`) vs deployed production (`https://www.nusqapp.com`).
**Method:** Read-only. Code paths traced against live HTML/curl. No changes made.

---

## 0. Important framing: the brief is auditing a site that no longer exists

The audit prompt is written against the **pre-restructure** site: it assumes the nav still exposes Signals / Portfolio / Heatmap / Glossary, that the featured item shows a 26-June briefing under a 1-July header, and that a duplicated "Indicative" ticker is on screen. **None of that is true in production today.**

- `/signals`, `/portfolio`, `/heatmap`, `/glossary` all return **404** (verified).
- The homepage header shows the correct current date (`WEDNESDAY 1 JUL`) and the featured card is the newest briefing by date (`page.tsx:19`, `db.ts:9`).
- The ticker component (`MarketBar.tsx`) still exists in the repo but is **rendered nowhere** — it is dead code, not a live "duplicated marquee."

So the codebase/deployment is **ahead** of the brief. The restructure to the two-page direction has largely shipped. The real risks are different and, in one case, more serious than the brief anticipated: **the primary conversion action does not exist on the site at all.**

---

## 1. Executive summary

The biggest risk is that Nusq is a daily-email product with **no email signup anywhere on the site** and **only one briefing published** — a visitor lands, finds a single article under a "four things today / every weekday morning" promise, and has no way to subscribe even if convinced. The biggest opportunity is nearly free: the signup component and its working backend already exist (`SubscribeForm.tsx` → `/api/subscribe`), so wiring conversion in is hours, not weeks, and briefing pages are clean, indexable, and genuinely differentiated (Arabic-source terms explained inline) — they just lack schema/canonical to rank. Overall verdict: the restructure and redesign are in good shape, but the site currently **cannot convert and looks under-published**; fix freshness/trust and conversion before touching anything cosmetic.

---

## 2. Findings table

| ID | Dimension | Severity | Effort | Description | Reference |
|----|-----------|----------|--------|-------------|-----------|
| C1 | Conversion | Critical | S | No email signup rendered anywhere; primary conversion goal absent | `SubscribeForm.tsx` (0 usages), `page.tsx` |
| C2 | Freshness | Critical | L | Only 1 briefing published; site promises daily/weekday cadence | sitemap.xml, `how-it-works` copy |
| C3 | Freshness | Critical | S | Homepage prints today's date next to newest briefing with no "as of" — a missed pipeline day silently shows stale content as fresh | `page.tsx:10-15,19` |
| H1 | Conversion | High | M | Welcome email is fire-and-forget with swallowed errors; may silently never send | `api/subscribe/route.ts:35,51`, `email.ts` |
| H2 | SEO | High | M | Briefing pages have no NewsArticle JSON-LD and no canonical tag | `briefings/[slug]/page.tsx:29-44` |
| H3 | Rebrand/links | High | S | Transactional emails link to dead `/signals` (404) | `email.ts:166,272` |
| H4 | Design coherence | High | M | About & Essays pages never migrated to new design system (dead classes, off-palette amber→teal) | `about/page.tsx`, `essays/page.tsx` |
| H5 | Positioning | High | S | "Ishara" used as jargon with no definition/Arabic gloss, including in the meta description | `layout.tsx:24`, `how-it-works/page.tsx:44` |
| H6 | SEO | High | S | No `robots.txt` (returns 404 HTML); no `robots.ts`; sitemap not referenced | live `/robots.txt` |
| M1 | Copy | Medium | S | Homepage subhead hardcoded "Four things moving…today" while only 1 briefing shows | `page.tsx:55` |
| M2 | SEO | Medium | S | Double title suffix "— Nusq — Nusq" on briefing pages | `briefings/[slug]/page.tsx:29` + `layout.tsx:22` |
| M3 | Architecture | Medium | S | `/essays` live (200) but orphaned — not in nav or sitemap | `essays/page.tsx`, sitemap |
| M4 | Architecture | Medium | S | `/onboarding` live (200) and orphaned | `onboarding/page.tsx` |
| M5 | Code health | Medium | M | Dead components + heavy unused deps (leaflet, d3-geo, topojson, world-atlas) | see §5 |
| M6 | SEO/social | Medium | S | OG image hotlinks Unsplash w/ long query; no fallback for image-less pages | live briefing `og:image` |
| M7 | Conversion | Medium | S | `SubscribeForm` references tokens dropped in CSS rewrite — will render broken when added | `SubscribeForm.tsx:47,66,68,85` |
| L1 | Compliance | Low | S | "Not investment advice" only in footer; scoring language edges advice-like — flag for legal | `Footer`, `BriefingCheck`/scoring |
| L2 | Bug | Low | S | Weekend banner uses `getUTCDay()` but date string is local — edge mismatch | `page.tsx:15-16` |
| L3 | Positioning | Low | S | Arabic identity thin outside briefing bodies | sitewide |
| L4 | Config | Low | S | `metadataBase` falls back to `nusq.vercel.app` if env unset | `layout.tsx:17` |

---

## 3. Detailed findings (Critical & High)

### C1 — No email signup anywhere on the site  *(Critical / S)*
**Evidence:** `SubscribeForm.tsx` is a complete, working component that POSTs to `/api/subscribe`. A repo-wide search returns **zero** usages of `<SubscribeForm`. The homepage (`page.tsx`) imports `StreakBadge`, `BriefingCover`, `ScrollReveal` — never `SubscribeForm`. The only email inputs on the site are Supabase **account** auth (`/auth`), which is a different thing (login, not newsletter capture).
**Why it matters:** The stated primary conversion goal is the free daily email. Every visitor who is persuaded by the homepage currently has **no action to take**. This is the single highest-leverage defect on the site.
**Fix:** Render `SubscribeForm` in two places: (1) a hero-adjacent block on the homepage directly under the subhead, and (2) an end-of-article block on `briefings/[slug]`. Before shipping, fix M7 (token names). Make it the one dominant CTA (see conversion roadmap). Backend needs no work — it already inserts to `subscribers` and dedupes.

### C2 — One briefing published against a daily-cadence promise  *(Critical / L)*
**Evidence:** `sitemap.xml` lists exactly one briefing: `/briefings/1-july-2026`. Copy promises cadence in multiple places: homepage empty-state "briefings publish every weekday morning" (`page.tsx:55,142`), how-it-works "Every weekday, Nusq reads hundreds of… sources" (`how-it-works/page.tsx:95`), email "Every weekday morning you'll get one briefing" (`email.ts:240`).
**Why it matters:** For a daily product, a public archive of one is the strongest possible "abandoned" signal — worse than the staleness the brief worried about. It also makes C1's signup ask unbelievable: subscribe to a daily that has published once.
**Fix (operational + copy):** This is primarily a pipeline/publishing problem, not a code one. Until cadence is real, **soften the promise** everywhere ("new briefings regularly" / "building toward daily") so the copy doesn't contradict the archive. Then restore "every weekday" once the archive backs it.

### C3 — Today's date printed next to possibly-stale content  *(Critical / S)*
**Evidence:** `page.tsx:10-15` computes `today` from `new Date()` every render (`force-dynamic`), and unconditionally prints it in the eyebrow (`page.tsx:33`). The featured card is simply `briefings[0]` by date desc (`page.tsx:19`, `db.ts:9`) with **no freshness check**. If the pipeline misses a day, the eyebrow still says (e.g.) "THURSDAY 2 JUL" above a 1-July briefing, with nothing signalling the gap.
**Why it matters:** This is exactly the "front page serves old content dressed as today's" trust-killer the brief flagged — the mechanism just moved. It's latent now (dates happen to match) but will fire the first missed day.
**Fix:** Drive the eyebrow from the **featured briefing's own date**, not `now`. If `featured.date` is not today, show the real date and an honest label ("Latest briefing · 1 Jul" or "As of 1 Jul"). Cheap, removes the whole class of failure.

### H1 — Welcome email silently fails  *(High / M)*
**Evidence:** `api/subscribe/route.ts:35,51` call `sendWelcomeEmail(...).catch(() => null)` — fire-and-forget with the error swallowed. This aligns with the known open issue in memory (Resend notifications silently failing).
**Why it matters:** Once C1 is fixed and signups flow, a broken welcome email means new subscribers get silence at the exact moment of highest intent — the worst time to be invisible.
**Fix:** Root-cause the Resend failure (verify domain/API key/from-address in prod env), log failures instead of swallowing, and consider a lightweight retry or at least an alert. Pairs with the existing `project_email_issue` memory.

### H2 — Briefing pages lack schema and canonical  *(High / M)*
**Evidence:** Live briefing HTML contains **no** `application/ld+json` block. `generateMetadata` (`briefings/[slug]/page.tsx:17-44`) sets title/description/OG/Twitter but no `alternates.canonical` and emits no `NewsArticle`/`Article` structured data.
**Why it matters:** Briefing pages ranking for MENA-finance queries is the cheapest growth channel Nusq has, and it's the differentiated content (Arabic-sourced). Google News / rich results strongly favour `NewsArticle` schema with `datePublished`, `author`, `publisher`. Missing canonical risks duplicate-URL dilution.
**Fix:** Add a `NewsArticle` JSON-LD `<script>` in the briefing page (headline, datePublished from `briefing.date`, author "Yousef Quaba", publisher "Nusq" + logo, image from `coverImageUrl`, description from `summary`). Add `alternates: { canonical: \`/briefings/${slug}\` }` to `generateMetadata`.

### H3 — Emails link to a dead page  *(High / S)*
**Evidence:** `email.ts:166` and `:272` link to `${SITE_URL}/signals` ("See today's signals →", "view all signals"). `/signals` is 404 in production.
**Why it matters:** Every welcome/newsletter email currently drives its main click to a dead URL — a conversion and credibility leak in the retention loop.
**Fix:** Repoint to `/briefings` (or the specific briefing). While in the file, update "signals" wording to match the chosen naming (see H5).

### H4 — About & Essays pages skipped the redesign  *(High / M)*
**Evidence:** `about/page.tsx` uses `gold-line` and `text-glow` classes that **no longer exist** in `globals.css` (grep count 0), plus `--c-amber` which the rewrite **aliased to teal** (`--c-secondary`) — so the "gold" brand accent renders teal and the decorative rules are dead. `essays/page.tsx` has the same amber pattern and old utility styling. The rest of the site is emerald/OKLCH.
**Why it matters:** These are the credibility pages (About is the founder story — the human reason-to-believe). Rendering them in a half-migrated, off-palette state undercuts the polish of the redesigned core.
**Fix:** Migrate About to the new tokens/type scale (emerald accent, `var(--font-display)`, drop `gold-line`/`text-glow`). Decide Essays' fate first (M3) — migrate or remove.

### H5 — "Ishara" is undefined jargon, including in the meta description  *(High / S)*
**Evidence:** `layout.tsx:24` description: *"Daily **Isharas** and briefings…"* — this is the homepage SEO/social snippet. `how-it-works/page.tsx:44-45` introduces "Ishara scoring / becomes an Ishara" with no gloss. The Arabic إشارة appears **nowhere** on the site. A first-time visitor (and Google's snippet) leads with a word that means nothing to them.
**Why it matters:** Finimize never asks a cold visitor to learn proprietary vocabulary before understanding the product; the value prop comes first, the branded term later (if at all). "Isharas" in the meta description actively costs clarity at the highest-visibility touchpoint.
**Fix:** Two-part — (a) immediate: change the meta description to plain language ("One daily briefing on Gulf & MENA markets…"); (b) decision needed (see Open Questions): either commit to Ishara *with* an inline definition + إشارة gloss on first use, or drop it for "signals/scored stories." Don't leave it half-adopted.

### H6 — No robots.txt  *(High / S)*
**Evidence:** `/robots.txt` returns the app's 404 HTML page; there is no `robots.ts` in `src/app`. `sitemap.ts` exists and serves correctly, but nothing points crawlers to it.
**Why it matters:** For a content product betting on organic discovery, a missing robots.txt + un-advertised sitemap is leaving the front door unlabelled.
**Fix:** Add `src/app/robots.ts` (Next metadata route) allowing all, disallowing `/admin` and `/account`, and declaring the sitemap URL.

---

## 4. Quick wins (High/Medium severity, Small effort — ranked, execute top-to-bottom)

1. **C3** — Drive homepage eyebrow date from `featured.date`, add "as of" when not today. *(kills the staleness trust-bomb)*
2. **C1 + M7** — Fix `SubscribeForm` token names, then render it on homepage (under subhead) and end of briefing. *(turns the site's conversion on)*
3. **H3** — Repoint email `/signals` links to `/briefings`.
4. **H6** — Add `robots.ts` with sitemap declaration.
5. **H5a** — Rewrite meta description to plain language (drop "Isharas").
6. **M2** — Remove the extra "— Nusq" from `briefings/[slug]` title (let the layout template add it).
7. **M1** — Make the homepage subhead reflect actual content (or remove the count claim).
8. **C2 (copy half)** — Soften cadence promises until the archive supports "every weekday."
9. **H2 (canonical half)** — Add `alternates.canonical` to briefing metadata. *(schema is the M-effort half)*

---

## 5. Code health detail (M5)

Dead components (0 render sites): `MarketBar` (the "ticker" the brief worried about — not mounted anywhere), `TradingViewChart`, `TrendsDashboard` + `TrendsDashboardClient`, `SignOutButton` (replaced by `SettingsControls`), `ReadingProgress`. Likely-unused heavy dependencies tied to removed map/chart features: `leaflet`, `react-leaflet`, `@types/leaflet`, `d3-geo`, `topojson-client`, `world-atlas` (map), possibly `rss-parser`. Also `/api/trends` route + `TrendsData` in `db.ts` feed the dead dashboard. `mockData.ts` still ships. Removing these shrinks the bundle and, more importantly, removes fragile surface area from the daily publishing loop. **Recommend verifying with `next build` + a dependency check before deletion — do not bulk-remove blind.**

---

## 6. Sequenced roadmap

**Tranche 1 — Trust & freshness (do first).** C3, C2 (copy), H4, M1, M2. Rationale: nothing else matters if the site looks abandoned or serves stale content as fresh. These make the product look alive and honest. Mostly S-effort.

**Tranche 2 — Conversion (do second).** C1, M7, H1, H3, plus social-proof/sample-preview near the new form (H7 in table maps here). Rationale: once the site looks credible, capture the intent it earns. The backend already exists; this is wiring + one email fix. Add a one-line reason-to-believe near the form (founder credential, or "read a sample" linking to the live briefing) since a cold visitor is being asked for an email on a tagline.

**Tranche 3 — Growth / SEO (do third).** H2 (schema + canonical), H6 (robots), M6 (OG), M3/M4 (kill orphans), M5 (dead code/deps). Rationale: SEO compounds over time, so it's highest-value long-term but lowest-urgency — and it only pays off once tranches 1–2 make the landing experience worth ranking for.

---

## 7. Open questions (Yousef's call)

1. **Ishara vs Signals naming.** Commit to "Ishara" (with an inline definition + إشارة gloss on first use, Finimize-style proprietary term) or revert to plain "signals / scored stories"? Currently half-adopted (public copy says Ishara; emails/prompts/metadata still say signals). Pick one and make it consistent.
2. **Essays / Research — keep or kill?** `/essays` is live but orphaned (not in nav or sitemap) and off-palette. Fold into the two-page strategy, promote it deliberately, or remove?
3. **`/onboarding`** — is this load-bearing for the account flow or a leftover? It's public and orphaned.
4. **Is `/auth` premature?** Accounts (saved briefings, streaks, preferences) add complexity before the newsletter funnel exists. Consider hiding "Sign in" until accounts earn their place, and leading with email capture only.
5. **Ticker data.** `MarketBar` is currently dead code. Decide: build it properly with a live source + honest "as of [timestamp]" labelling, or delete it. Do not ship the static "Indicative" version.
6. **Compliance (L1).** Scoring language ("positive/negative/watch" directional framing) edges toward advice-like for a UK operator; footer-only "Not investment advice" may be thin. Flagged for professional/legal review — not resolved here.

---

*Prepared read-only. Where deployment and codebase diverge, the deployment is ahead of this audit's brief; where the brief and reality diverge, reality is described above with evidence.*
