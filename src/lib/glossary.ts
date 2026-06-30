export type GlossaryCategory =
  | "Stock Markets"
  | "Currencies"
  | "Institutions"
  | "Instruments"
  | "Concepts";

export interface GlossaryTerm {
  slug: string;
  term: string;
  fullName?: string;
  category: GlossaryCategory;
  oneLiner: string; // used on index page cards
  definition: string; // 2–3 sentences, plain language
  whyItMatters: string; // 1–2 sentences on investor relevance
  relatedSlugs: string[];
  countries?: string[];
}

export const GLOSSARY: GlossaryTerm[] = [
  // ── Stock Markets ──────────────────────────────────────────────────────────
  {
    slug: "tasi",
    term: "TASI",
    fullName: "Tadawul All Share Index",
    category: "Stock Markets",
    oneLiner: "The main index tracking all companies listed on Saudi Arabia's stock exchange.",
    definition:
      "TASI (Tadawul All Share Index) is the benchmark index for the Saudi Exchange — commonly called Tadawul — which is the largest stock market in the Middle East. It tracks the performance of every company listed on the exchange, covering sectors from banking and energy to retail and healthcare. When people say 'the Saudi market is up today,' they usually mean TASI.",
    whyItMatters:
      "Saudi Arabia is by far the largest equity market in the MENA region, so TASI moves affect the whole region's investor sentiment. Major listings — like Saudi Aramco's IPO in 2019 — can shift the index significantly.",
    relatedSlugs: ["pif", "vision-2030", "sar", "tadawul"],
    countries: ["Saudi Arabia"],
  },
  {
    slug: "tadawul",
    term: "Tadawul",
    fullName: "Saudi Exchange",
    category: "Stock Markets",
    oneLiner: "Saudi Arabia's main stock exchange — the largest in the Middle East.",
    definition:
      "Tadawul is the official stock exchange of Saudi Arabia, headquartered in Riyadh. Its name means 'circulation' in Arabic. It hosts both equities (company shares) and a fixed-income market for bonds and sukuk. The exchange is owned and regulated by the Capital Market Authority (CMA). Tadawul is widely considered the gateway for investors wanting exposure to the Saudi economy.",
    whyItMatters:
      "Tadawul has a market capitalisation that dwarfs every other stock exchange in the Arab world. When Saudi companies list or delist — or when the exchange changes foreign ownership rules — it directly affects how much international money flows into the region.",
    relatedSlugs: ["tasi", "pif", "sar"],
    countries: ["Saudi Arabia"],
  },
  {
    slug: "egx-30",
    term: "EGX 30",
    fullName: "Egyptian Exchange 30 Index",
    category: "Stock Markets",
    oneLiner: "The index tracking Egypt's 30 largest publicly listed companies.",
    definition:
      "The EGX 30 is Egypt's main stock market index, tracking the 30 most actively traded and liquid companies on the Egyptian Exchange (EGX). It covers a mix of sectors — banking, real estate, telecoms, and consumer goods — and is the standard measure of how Egyptian equities are performing. When analysts talk about 'the Egyptian market,' they usually mean EGX 30.",
    whyItMatters:
      "Egypt is the most populous country in the Arab world and a significant emerging market. The EGX 30 is closely watched by Gulf investors — particularly those with exposure to Egyptian banks or real estate — and tends to react sharply to changes in the Egyptian pound's exchange rate.",
    relatedSlugs: ["egp", "cbe", "currency-peg"],
    countries: ["Egypt"],
  },
  {
    slug: "dfm",
    term: "DFM",
    fullName: "Dubai Financial Market",
    category: "Stock Markets",
    oneLiner: "Dubai's main stock exchange, listed on itself.",
    definition:
      "The Dubai Financial Market (DFM) is a stock exchange based in Dubai, part of the UAE. It lists shares of companies operating across the Gulf and wider Arab world, with a focus on real estate, banking, and telecoms. One of its quirks: DFM is itself a listed company — you can buy shares in the exchange. It operates under Islamic finance principles, meaning short-selling is restricted.",
    whyItMatters:
      "Dubai is a major regional financial hub, so DFM listings reflect the health of the emirate's property market and business environment. Changes in foreign ownership limits — which the UAE has been relaxing — directly affect how much outside capital can flow in.",
    relatedSlugs: ["adx", "aed"],
    countries: ["UAE"],
  },
  {
    slug: "adx",
    term: "ADX",
    fullName: "Abu Dhabi Securities Exchange",
    category: "Stock Markets",
    oneLiner: "Abu Dhabi's stock exchange, home to some of the Gulf's largest companies.",
    definition:
      "The Abu Dhabi Securities Exchange (ADX) is the stock market of Abu Dhabi, the capital and wealthiest emirate of the UAE. It hosts some of the largest companies in the Gulf by market value, including First Abu Dhabi Bank (FAB) — the UAE's biggest bank — and several state-linked energy and industrial conglomerates. ADX often outperforms DFM in market capitalisation because Abu Dhabi's sovereign wealth is concentrated here.",
    whyItMatters:
      "Abu Dhabi controls vast oil revenues and channels them through institutions like Mubadala and ADIA, many of which have subsidiaries listed on ADX. Moves in ADX often signal what Abu Dhabi's government is prioritising economically.",
    relatedSlugs: ["dfm", "mubadala", "adia", "adq", "aed"],
    countries: ["UAE"],
  },
  {
    slug: "qse",
    term: "QSE",
    fullName: "Qatar Stock Exchange",
    category: "Stock Markets",
    oneLiner: "Qatar's main stock exchange, dominated by energy and banking giants.",
    definition:
      "The Qatar Stock Exchange (QSE) — formerly called the Doha Securities Market — is Qatar's national stock market. It lists around 50 companies, with the biggest being Qatar National Bank (QNB), Industries Qatar (petrochemicals), and Qatar Telecom (Ooredoo). Euronext, the European exchange operator, owns a 20% stake in QSE as part of a partnership to modernise the market.",
    whyItMatters:
      "Qatar is one of the world's largest exporters of liquefied natural gas (LNG), so QSE moves often track global gas prices. The exchange is relatively small and dominated by a handful of stocks, meaning a single big company's results can swing the whole index.",
    relatedSlugs: ["qia", "qar"],
    countries: ["Qatar"],
  },

  // ── Currencies ─────────────────────────────────────────────────────────────
  {
    slug: "egp",
    term: "EGP",
    fullName: "Egyptian Pound",
    category: "Currencies",
    oneLiner: "Egypt's national currency, which has gone through several devaluations since 2022.",
    definition:
      "EGP stands for Egyptian pound, Egypt's official currency. Since 2022, the pound has depreciated significantly — at one point losing more than half its value against the US dollar — as Egypt managed a foreign currency shortage and negotiated an IMF loan programme. The central bank has at times maintained a semi-fixed rate and at other times allowed the currency to float freely in response to IMF requirements.",
    whyItMatters:
      "For anyone with savings, investments, or family remittances in Egypt, the pound's exchange rate is critical. Devaluations make Egyptian exports cheaper but erode the real value of Egyptian savings. Foreign investors watch the EGP closely before committing capital to Egyptian bonds or equities.",
    relatedSlugs: ["cbe", "currency-peg", "egx-30", "imf-programme"],
    countries: ["Egypt"],
  },
  {
    slug: "sar",
    term: "SAR",
    fullName: "Saudi Riyal",
    category: "Currencies",
    oneLiner: "Saudi Arabia's currency, pegged to the US dollar at a fixed rate since 1986.",
    definition:
      "SAR stands for Saudi riyal, Saudi Arabia's official currency. It has been pegged to the US dollar at a fixed rate of 3.75 riyals per dollar since 1986 — one of the longest-standing currency pegs in the world. This means the Saudi central bank (SAMA) adjusts its interest rates in lock-step with the US Federal Reserve to defend the peg, even if doing so doesn't suit Saudi Arabia's own economic conditions.",
    whyItMatters:
      "The riyal peg is a cornerstone of Saudi financial stability. It means businesses and investors can predict their dollar costs precisely when operating in Saudi Arabia. Any sign that Saudi Arabia might abandon the peg — which happens rarely, usually in times of very low oil prices — would send shockwaves through regional markets.",
    relatedSlugs: ["sama", "currency-peg", "tasi"],
    countries: ["Saudi Arabia"],
  },
  {
    slug: "aed",
    term: "AED",
    fullName: "UAE Dirham",
    category: "Currencies",
    oneLiner: "The UAE's currency, also pegged to the US dollar.",
    definition:
      "AED stands for UAE dirham, the official currency of the United Arab Emirates. Like the Saudi riyal, it is pegged to the US dollar — at 3.67 dirhams per dollar — and has maintained this peg since 1997. The UAE Central Bank manages monetary policy to keep the peg stable. Because the UAE is a major financial hub and re-export centre, the dirham's stability is central to its role as a regional trade currency.",
    whyItMatters:
      "A stable dirham reduces currency risk for the millions of expatriates working in the UAE who send money home, and for the international businesses that use Dubai as their regional headquarters. It also means UAE interest rates move in line with US rates, which affects mortgage costs and business borrowing.",
    relatedSlugs: ["dfm", "adx", "currency-peg"],
    countries: ["UAE"],
  },
  {
    slug: "qar",
    term: "QAR",
    fullName: "Qatari Riyal",
    category: "Currencies",
    oneLiner: "Qatar's currency, pegged to the US dollar since 1980.",
    definition:
      "QAR stands for Qatari riyal, Qatar's official currency. It has been pegged to the US dollar at 3.64 riyals per dollar since 1980. Qatar's enormous sovereign wealth — built on natural gas revenues — means the Qatar Central Bank has ample reserves to defend the peg. In 2017, during a regional diplomatic blockade of Qatar, the riyal briefly came under pressure on the parallel market, but the official peg held.",
    whyItMatters:
      "Qatar's vast LNG revenues flow in dollars, and the riyal peg ensures those revenues translate predictably into local purchasing power. For investors in Qatari assets, the stable exchange rate removes a layer of currency risk.",
    relatedSlugs: ["qse", "qia", "currency-peg"],
    countries: ["Qatar"],
  },

  // ── Institutions ───────────────────────────────────────────────────────────
  {
    slug: "pif",
    term: "PIF",
    fullName: "Public Investment Fund",
    category: "Institutions",
    oneLiner: "Saudi Arabia's sovereign wealth fund — one of the largest investors in the world.",
    definition:
      "PIF stands for Public Investment Fund, Saudi Arabia's sovereign wealth fund (a state-owned investment vehicle that invests the country's surplus oil revenues). Founded in 1971 but radically expanded under Crown Prince Mohammed bin Salman, PIF now manages over $700 billion in assets. It invests across Saudi Arabia — in tourism, manufacturing, and entertainment — and internationally, with major stakes in companies like Lucid Motors, Nintendo, and Uber.",
    whyItMatters:
      "PIF is the main engine of Saudi Arabia's economic transformation under Vision 2030. When PIF announces a new investment or takes a stake in a company, it signals where Saudi capital is flowing and which sectors the government is prioritising. Its domestic investments directly create jobs and build infrastructure.",
    relatedSlugs: ["vision-2030", "swf", "tasi", "sama"],
    countries: ["Saudi Arabia"],
  },
  {
    slug: "sama",
    term: "SAMA",
    fullName: "Saudi Arabian Monetary Authority",
    category: "Institutions",
    oneLiner: "Saudi Arabia's central bank — sets interest rates and manages the riyal peg.",
    definition:
      "SAMA (Saudi Arabian Monetary Authority) is Saudi Arabia's central bank, based in Riyadh. It sets monetary policy, manages the kingdom's foreign reserves, supervises the banking system, and defends the riyal's peg to the US dollar. Because of the peg, SAMA generally mirrors the US Federal Reserve's interest rate decisions. SAMA also regulates insurance, finance companies, and credit bureaus.",
    whyItMatters:
      "SAMA's decisions directly affect borrowing costs for Saudi households and businesses. When the US Federal Reserve raises rates, SAMA typically follows within hours, raising the cost of mortgages and business loans across Saudi Arabia. Its reserve levels are also a key indicator of fiscal health.",
    relatedSlugs: ["sar", "currency-peg", "pif"],
    countries: ["Saudi Arabia"],
  },
  {
    slug: "cbe",
    term: "CBE",
    fullName: "Central Bank of Egypt",
    category: "Institutions",
    oneLiner: "Egypt's central bank — manages the Egyptian pound and sets interest rates.",
    definition:
      "CBE stands for Central Bank of Egypt, the institution responsible for monetary policy in Egypt. It sets the key interest rate (the overnight deposit and lending rates), manages Egypt's foreign currency reserves, supervises banks, and regulates the exchange rate of the Egyptian pound. The CBE has been central to Egypt's negotiations with the IMF, often devaluing the pound or raising interest rates as part of economic reform agreements.",
    whyItMatters:
      "CBE decisions have an outsized impact on everyday Egyptians and investors alike. Rate changes affect bank deposit returns, mortgage costs, and the attractiveness of Egyptian government bonds to foreign buyers. The CBE's reserve levels — often closely watched — signal whether Egypt can cover its import needs.",
    relatedSlugs: ["egp", "egx-30", "currency-peg", "imf-programme"],
    countries: ["Egypt"],
  },
  {
    slug: "mubadala",
    term: "Mubadala",
    fullName: "Mubadala Investment Company",
    category: "Institutions",
    oneLiner: "Abu Dhabi's strategic sovereign investment arm, focused on long-term global deals.",
    definition:
      "Mubadala is one of Abu Dhabi's sovereign wealth funds, wholly owned by the Abu Dhabi government. Unlike ADIA (which manages a diversified financial portfolio), Mubadala focuses on strategic investments — technology, aerospace, healthcare, and renewable energy — often taking significant stakes or building partnerships with global companies. It manages around $300 billion in assets and operates in over 50 countries.",
    whyItMatters:
      "Mubadala's investments often signal Abu Dhabi's long-term economic strategy. When it invests in a sector — say, semiconductors or green hydrogen — it tends to build local capacity alongside the financial stake. Its moves are closely watched by those tracking where Gulf capital is being deployed globally.",
    relatedSlugs: ["adia", "adq", "adx", "swf"],
    countries: ["UAE"],
  },
  {
    slug: "adia",
    term: "ADIA",
    fullName: "Abu Dhabi Investment Authority",
    category: "Institutions",
    oneLiner: "Abu Dhabi's largest and most secretive wealth fund — estimated at over $1 trillion.",
    definition:
      "ADIA (Abu Dhabi Investment Authority) is Abu Dhabi's primary sovereign wealth fund and one of the largest investment funds in the world, with estimated assets of $1 trillion or more. It was established in 1976 to invest Abu Dhabi's oil revenues for the benefit of future generations. ADIA invests globally across equities, fixed income, real estate, and private equity, and is notably secretive — it rarely discusses specific investments publicly.",
    whyItMatters:
      "ADIA is one of the most powerful pools of capital on earth. When it shifts allocation — for example, increasing exposure to emerging markets or reducing bonds — it can move prices. Its investment decisions reflect Abu Dhabi's view of long-term global risks and opportunities.",
    relatedSlugs: ["mubadala", "adq", "swf"],
    countries: ["UAE"],
  },
  {
    slug: "adq",
    term: "ADQ",
    fullName: "Abu Dhabi Developmental Holding Company",
    category: "Institutions",
    oneLiner: "Abu Dhabi's newer strategic fund, focused on food, agriculture, and infrastructure.",
    definition:
      "ADQ is Abu Dhabi's youngest sovereign investment company, established in 2018. It focuses on sectors seen as strategically vital: food and agriculture, healthcare, utilities, transport, and logistics — particularly across Egypt and Africa. ADQ has made major investments in Egyptian assets, including stakes in banks, food companies, and ports, making it one of the largest foreign investors in Egypt.",
    whyItMatters:
      "ADQ's investments in Egypt signal Abu Dhabi's deep interest in Egyptian stability and food supply chains. Its agricultural investments — in fertiliser producers and farmland — reflect Gulf states' anxiety about food security after the Russia-Ukraine war disrupted grain supply.",
    relatedSlugs: ["mubadala", "adia", "swf", "egx-30"],
    countries: ["UAE"],
  },
  {
    slug: "qia",
    term: "QIA",
    fullName: "Qatar Investment Authority",
    category: "Institutions",
    oneLiner: "Qatar's sovereign wealth fund — owner of landmarks from Harrods to Paris Saint-Germain.",
    definition:
      "QIA (Qatar Investment Authority) is Qatar's sovereign wealth fund, established in 2005 to invest the country's vast natural gas revenues. It manages an estimated $475 billion in assets. QIA is known for high-profile investments in iconic assets: Harrods department store in London, a stake in Volkswagen, shares in Barclays bank, and Paris Saint-Germain football club. It also invests across Asia, real estate, and private equity.",
    whyItMatters:
      "QIA's investments reflect Qatar's strategy to diversify its economy away from gas revenues before reserves run out. Its buying activity in European markets during crises — such as the 2008 financial crisis — has made it a significant stabilising force in global capital markets.",
    relatedSlugs: ["qse", "qar", "swf"],
    countries: ["Qatar"],
  },

  // ── Instruments ────────────────────────────────────────────────────────────
  {
    slug: "sukuk",
    term: "Sukuk",
    category: "Instruments",
    oneLiner: "Islamic bonds — a way to raise money without paying interest, which is prohibited in Islam.",
    definition:
      "Sukuk are financial certificates that work like bonds but comply with Islamic law (Sharia), which prohibits charging or paying interest (riba). Instead of lending money and earning interest, a sukuk investor effectively buys a share in an asset or project and receives a portion of the income it generates. Saudi Arabia, the UAE, and Malaysia are among the world's largest sukuk issuers. They are used to fund everything from government spending to infrastructure projects.",
    whyItMatters:
      "As Gulf governments raise money to fund large projects — Vision 2030 megaprojects, infrastructure, healthcare — sukuk are a primary tool. When demand for sukuk rises, it reflects investor confidence in the issuing government or company. The sukuk market also taps a pool of Islamic-finance investors who won't buy conventional bonds.",
    relatedSlugs: ["pif", "vision-2030"],
  },
  {
    slug: "t-bill",
    term: "T-bill",
    fullName: "Treasury Bill",
    category: "Instruments",
    oneLiner: "Short-term government debt — governments borrow money for a few weeks to a year.",
    definition:
      "A T-bill (treasury bill) is a short-term loan a government takes from investors, usually for periods of 91 days, 182 days, or 364 days. The government sells the bill at a discount and pays back the full face value at maturity — the difference is the investor's return. Egypt uses treasury bills heavily to fund day-to-day government spending, and foreign investors buying Egyptian T-bills is a major source of foreign currency inflows.",
    whyItMatters:
      "T-bill yields in countries like Egypt are a key indicator of stress. When yields spike — meaning the government has to offer higher returns to attract buyers — it signals that investors are demanding more compensation for the risk of lending to that government. A sharp rise in Egyptian T-bill yields often precedes currency or fiscal pressures.",
    relatedSlugs: ["egp", "cbe", "egx-30"],
    countries: ["Egypt"],
  },
  {
    slug: "repo-rate",
    term: "Repo rate",
    fullName: "Repurchase Rate",
    category: "Instruments",
    oneLiner: "The interest rate central banks charge commercial banks to borrow overnight — the anchor for all other interest rates.",
    definition:
      "The repo rate (short for repurchase rate) is the interest rate a central bank charges when it lends money to commercial banks for short periods, usually overnight. It is the most direct lever a central bank has to control how expensive borrowing is across the whole economy. When a central bank raises the repo rate, borrowing becomes more expensive for banks, which then raise their own lending rates for businesses and households.",
    whyItMatters:
      "Repo rate decisions by SAMA, CBE, or the UAE Central Bank ripple through the entire economy — affecting mortgage rates, business loan costs, and deposit returns. In Egypt, the CBE's repo rate has been as high as 28% during periods of currency pressure, making domestic borrowing extremely expensive.",
    relatedSlugs: ["sama", "cbe", "currency-peg"],
  },

  // ── Concepts ───────────────────────────────────────────────────────────────
  {
    slug: "currency-peg",
    term: "Currency peg",
    category: "Concepts",
    oneLiner: "When a country fixes its exchange rate to another currency — usually the US dollar.",
    definition:
      "A currency peg is when a country's central bank commits to keeping its currency at a fixed exchange rate against another currency — almost always the US dollar in the Gulf. To maintain the peg, the central bank buys or sells its own currency using foreign reserves, and mirrors the other country's interest rate decisions. Most Gulf states (Saudi Arabia, UAE, Qatar, Bahrain, Oman) maintain dollar pegs. Egypt has moved between a managed float and a peg at various points.",
    whyItMatters:
      "Currency pegs provide stability and predictability for businesses and investors, but they come at a cost: the country loses the ability to set its own interest rates independently. When the US Federal Reserve raises rates aggressively — as it did in 2022-2023 — pegged Gulf countries must raise rates too, even if their own economies don't need it.",
    relatedSlugs: ["sar", "aed", "qar", "sama", "cbe", "egp"],
  },
  {
    slug: "swf",
    term: "Sovereign wealth fund",
    category: "Concepts",
    oneLiner: "A state-owned investment fund that invests a country's surplus revenues — often from oil — for future generations.",
    definition:
      "A sovereign wealth fund (SWF) is a pool of money owned and managed by a national government, typically funded by oil or gas export revenues, trade surpluses, or foreign exchange reserves. Instead of spending the money now, governments invest it globally to generate returns over decades. The Gulf region hosts some of the world's largest SWFs: PIF (Saudi Arabia), ADIA and Mubadala (Abu Dhabi), QIA (Qatar), and Kuwait Investment Authority (KIA).",
    whyItMatters:
      "Gulf SWFs collectively manage trillions of dollars and are among the most powerful investors in the world. When they increase or decrease exposure to a market — equities, real estate, private equity — it can move prices. Their investment decisions also reflect geopolitical priorities: investing in Africa for food security, or in technology for economic diversification.",
    relatedSlugs: ["pif", "adia", "mubadala", "qia", "adq"],
  },
  {
    slug: "vision-2030",
    term: "Vision 2030",
    category: "Concepts",
    oneLiner: "Saudi Arabia's plan to reduce dependence on oil by building new industries and tourism.",
    definition:
      "Vision 2030 is Saudi Arabia's national economic reform plan, launched by Crown Prince Mohammed bin Salman in 2016. Its core goal is to reduce the country's dependence on oil revenues by building new industries — tourism, entertainment, mining, manufacturing — and increasing the role of the private sector. It includes mega-projects like NEOM (a futuristic city in the northwest), the Red Sea Project (luxury tourism), and Diriyah (cultural heritage tourism near Riyadh).",
    whyItMatters:
      "Vision 2030 is the largest economic transformation project in the region, channelling hundreds of billions of dollars through PIF and state-linked companies. It directly affects which sectors attract investment (construction, tourism, hospitality), which companies win contracts, and how Saudi Arabia's economy is positioned beyond the oil era.",
    relatedSlugs: ["pif", "tasi", "neom"],
    countries: ["Saudi Arabia"],
  },
  {
    slug: "neom",
    term: "NEOM",
    category: "Concepts",
    oneLiner: "Saudi Arabia's $500bn+ futuristic city project in the northwest desert.",
    definition:
      "NEOM is a planned mega-city and special economic zone in northwest Saudi Arabia, on the coast of the Red Sea near the Jordanian and Egyptian borders. Announced in 2017, it spans over 26,500 square kilometres and is being built from scratch. It includes The Line (a proposed 170km linear city with no cars), Sindalah (a luxury yacht island), and Oxagon (an industrial port). NEOM is funded primarily by PIF and is a centrepiece of Vision 2030.",
    whyItMatters:
      "NEOM represents an enormous commitment of Saudi capital and ambition. Hundreds of international contractors, consultants, and technology firms have won contracts there. However, the project has faced questions about its scale, feasibility, and human rights concerns related to the displacement of the indigenous Huwaitat tribe. Investors watch NEOM as a barometer of Saudi state spending appetite.",
    relatedSlugs: ["vision-2030", "pif"],
    countries: ["Saudi Arabia"],
  },
  {
    slug: "fdi",
    term: "FDI",
    fullName: "Foreign Direct Investment",
    category: "Concepts",
    oneLiner: "When a foreign company or government invests directly in a business or project in another country.",
    definition:
      "FDI (Foreign Direct Investment) refers to investment made by an entity in one country into business operations in another country — for example, a UK company opening a factory in Egypt, or a Saudi wealth fund buying a stake in a Jordanian bank. It is distinct from portfolio investment (buying stocks or bonds), because FDI involves direct control or meaningful influence over operations. Governments compete aggressively for FDI because it brings capital, jobs, and technology.",
    whyItMatters:
      "MENA governments use FDI figures as a key measure of economic attractiveness. Egypt's IMF reform programme specifically targets increasing FDI as a way to earn foreign currency. When Gulf SWFs invest in Egypt or Jordan, that counts as FDI and relieves pressure on local currencies.",
    relatedSlugs: ["swf", "pif", "adq", "egp"],
  },
  {
    slug: "imf-programme",
    term: "IMF programme",
    fullName: "International Monetary Fund Loan Programme",
    category: "Concepts",
    oneLiner: "When the IMF lends a country money in exchange for economic reforms — often involving currency devaluation and spending cuts.",
    definition:
      "An IMF programme (formally called an Extended Fund Facility or Stand-By Arrangement) is when the International Monetary Fund lends money to a country facing a balance-of-payments crisis — typically because it has run low on foreign currency reserves and cannot pay for imports or service foreign debt. In exchange, the country agrees to a set of economic reforms: often devaluing the currency, raising interest rates, cutting government subsidies, and reducing the budget deficit. Egypt has had multiple IMF programmes since 2016.",
    whyItMatters:
      "An IMF programme signals both distress and a path to stabilisation. The announcement of a deal often triggers currency devaluations and higher interest rates — painful for ordinary citizens — but also reassures foreign investors that the country has a credible reform plan. IMF disbursements are tied to meeting reform targets, so delays signal slippage.",
    relatedSlugs: ["cbe", "egp", "currency-peg", "fdi"],
    countries: ["Egypt"],
  },
  {
    slug: "opec-plus",
    term: "OPEC+",
    fullName: "Organization of the Petroleum Exporting Countries Plus",
    category: "Concepts",
    oneLiner: "The oil producers' group — led by Saudi Arabia and Russia — that coordinates how much oil to pump.",
    definition:
      "OPEC+ is an alliance of 23 oil-producing countries that coordinate production levels to influence global oil prices. The original OPEC (Organisation of the Petroleum Exporting Countries) consists of 13 nations, mostly from the Gulf and Africa. The '+' refers to 10 additional countries — most importantly Russia — that joined the alliance in 2016. Saudi Arabia's oil minister chairs OPEC+ meetings and typically plays the leading role in setting production policy.",
    whyItMatters:
      "OPEC+ decisions to cut or increase oil output directly move the oil price, which in turn drives Gulf government revenues, stock market performance, and currency stability. A surprise production cut by Saudi Arabia can push oil above $100 per barrel; a decision to pump more can push it below $70. For MENA economies that depend on oil, OPEC+ is as important as any central bank.",
    relatedSlugs: ["pif", "sama", "vision-2030"],
    countries: ["Saudi Arabia"],
  },
  {
    slug: "privatisation",
    term: "Privatisation",
    category: "Concepts",
    oneLiner: "When a government sells state-owned companies or assets to private investors.",
    definition:
      "Privatisation is the process by which a government transfers ownership of state-owned enterprises (companies the government owns) to private shareholders — either by selling shares on the stock market (an IPO) or by selling directly to investors. In MENA, governments have historically owned a very large share of major industries: oil, utilities, telecoms, and banking. Vision 2030 in Saudi Arabia and various Egyptian reform programmes involve privatising state assets to raise money and attract private capital.",
    whyItMatters:
      "Privatisation announcements often move stock markets, because they create new investment opportunities and signal government willingness to hand over management to private hands. However, the process can be controversial if it is seen as selling national assets too cheaply or reducing public access to essential services.",
    relatedSlugs: ["pif", "vision-2030", "tasi", "egx-30"],
  },
];

export function getTermBySlug(slug: string): GlossaryTerm | undefined {
  return GLOSSARY.find((t) => t.slug === slug);
}

export function getRelatedTerms(term: GlossaryTerm): GlossaryTerm[] {
  return term.relatedSlugs
    .map((s) => getTermBySlug(s))
    .filter((t): t is GlossaryTerm => !!t);
}

export const CATEGORIES: GlossaryCategory[] = [
  "Stock Markets",
  "Currencies",
  "Institutions",
  "Instruments",
  "Concepts",
];

export function termsByCategory(category: GlossaryCategory): GlossaryTerm[] {
  return GLOSSARY.filter((t) => t.category === category);
}
