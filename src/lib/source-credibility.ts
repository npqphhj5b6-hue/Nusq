export type SourceTier = 1 | 2 | 3;

export type SourceType =
  | "official_statement"   // gov/CB press releases, policy announcements
  | "government_data"      // statistics, economic data from official bodies
  | "market_data"          // exchange data, price data
  | "data_release"         // economic indicator releases (IMF WEO, etc.)
  | "research_report"      // multilateral/think tank research
  | "financial_filing"     // company filings, earnings, IR documents
  | "company_announcement" // company press releases
  | "news_report"          // journalism and wire services
  | "analysis"             // rating actions, editorial commentary
  | "unknown";

// Tier 1: official government, regulatory, exchange, multilateral, SWF sources
const TIER_1_DOMAINS = new Set([
  // GCC central banks
  "sama.gov.sa", "cbuae.gov.ae", "qcb.gov.qa", "cbk.gov.kw", "cbo.gov.om", "cbb.gov.bh",
  "cbe.org.eg",
  // Stock exchanges
  "tadawul.com.sa", "adx.ae", "dfm.ae", "kse.com.kw", "bme.com.bh",
  // Sovereign wealth funds / gov investment
  "pif.gov.sa", "adia.ae", "qia.qa", "mubadala.ae", "adq.ae",
  "mumtalakat.bh", "khazanahcom.kw",
  // Official government
  "vision2030.gov.sa", "mof.gov.sa", "mci.gov.sa", "mcit.gov.sa",
  "economy.gov.ae", "mof.gov.ae",
  // Multilateral / international institutions
  "imf.org", "worldbank.org", "opec.org", "iea.org", "un.org",
  "oecd.org", "bis.org", "fatf-gafi.org", "wto.org",
  "amf.org.ae", "isdb.org",
  // Rating agencies (official releases)
  "moodys.com", "spglobal.com", "fitchratings.com",
]);

// Tier 2: established financial/regional media and research
const TIER_2_DOMAINS = new Set([
  // Major international financial media
  "reuters.com", "bloomberg.com", "ft.com", "wsj.com", "economist.com",
  "cnbc.com", "bbc.com", "apnews.com", "ap.org",
  // MENA-specialist media
  "zawya.com", "arabianbusiness.com", "meed.com", "thenationalnews.com",
  "gulfnews.com", "khaleejtimes.com", "agbi.com",
  "asharq.com", "asharqbusiness.com", "argaam.com", "mubasher.info",
  "aljazeera.com", "middleeasteye.net", "al-monitor.com",
  // Arabic financial press
  "aawsat.com", "alriyadh.com", "aleqt.com", "alwatan.com.sa",
  // Think tanks / research
  "mei.edu", "chathamhouse.org", "carnegieendowment.org",
  "brookings.edu", "cfr.org", "wilsoncenter.org",
  // Data / research
  "refinitiv.com", "ihs.com", "capitaliq.com", "semafor.com",
]);

// Source type by domain — what kind of content does this source publish?
const SOURCE_TYPE_MAP: Record<string, SourceType> = {
  // GCC central banks → official statements
  "sama.gov.sa": "official_statement",
  "cbuae.gov.ae": "official_statement",
  "qcb.gov.qa": "official_statement",
  "cbk.gov.kw": "official_statement",
  "cbo.gov.om": "official_statement",
  "cbb.gov.bh": "official_statement",
  "cbe.org.eg": "official_statement",
  // Stock exchanges → market data
  "tadawul.com.sa": "market_data",
  "adx.ae": "market_data",
  "dfm.ae": "market_data",
  "kse.com.kw": "market_data",
  "bme.com.bh": "market_data",
  // SWFs → official statements
  "pif.gov.sa": "official_statement",
  "adia.ae": "official_statement",
  "qia.qa": "official_statement",
  "mubadala.ae": "official_statement",
  "adq.ae": "official_statement",
  "mumtalakat.bh": "official_statement",
  // Government ministries
  "vision2030.gov.sa": "official_statement",
  "mof.gov.sa": "government_data",
  "mci.gov.sa": "official_statement",
  "mcit.gov.sa": "official_statement",
  "economy.gov.ae": "official_statement",
  "mof.gov.ae": "government_data",
  // Multilaterals
  "imf.org": "data_release",
  "worldbank.org": "research_report",
  "opec.org": "official_statement",
  "iea.org": "official_statement",
  "un.org": "research_report",
  "oecd.org": "research_report",
  "bis.org": "research_report",
  "fatf-gafi.org": "research_report",
  "wto.org": "official_statement",
  "amf.org.ae": "research_report",
  "isdb.org": "research_report",
  // Rating agencies
  "moodys.com": "analysis",
  "spglobal.com": "analysis",
  "fitchratings.com": "analysis",
  // International news
  "reuters.com": "news_report",
  "bloomberg.com": "news_report",
  "ft.com": "news_report",
  "wsj.com": "news_report",
  "economist.com": "analysis",
  "cnbc.com": "news_report",
  "bbc.com": "news_report",
  "apnews.com": "news_report",
  "ap.org": "news_report",
  // MENA media
  "zawya.com": "news_report",
  "arabianbusiness.com": "news_report",
  "meed.com": "news_report",
  "thenationalnews.com": "news_report",
  "gulfnews.com": "news_report",
  "khaleejtimes.com": "news_report",
  "agbi.com": "news_report",
  "asharq.com": "news_report",
  "asharqbusiness.com": "news_report",
  "argaam.com": "news_report",
  "mubasher.info": "news_report",
  "aljazeera.com": "news_report",
  "middleeasteye.net": "news_report",
  "al-monitor.com": "news_report",
  "aawsat.com": "news_report",
  "alriyadh.com": "news_report",
  "aleqt.com": "news_report",
  "alwatan.com.sa": "news_report",
  "alarabiya.net": "news_report",
  // Think tanks
  "mei.edu": "analysis",
  "chathamhouse.org": "analysis",
  "carnegieendowment.org": "analysis",
  "brookings.edu": "analysis",
  "cfr.org": "analysis",
  "wilsoncenter.org": "analysis",
  // Research/data
  "refinitiv.com": "analysis",
  "ihs.com": "analysis",
  "capitaliq.com": "analysis",
  "semafor.com": "news_report",
};

export function getSourceTier(url: string): SourceTier {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    if (TIER_1_DOMAINS.has(hostname)) return 1;
    if (TIER_2_DOMAINS.has(hostname)) return 2;
    return 3;
  } catch {
    return 3;
  }
}

export function getSourceType(url: string): SourceType {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return SOURCE_TYPE_MAP[hostname] ?? "unknown";
  } catch {
    return "unknown";
  }
}

export function getSourceTypeByName(publisherName: string): SourceType {
  const domain = getPublisherDomain(publisherName);
  if (domain) return SOURCE_TYPE_MAP[domain] ?? "unknown";
  // name-based fallback for unmapped publishers
  const key = publisherName.trim().toLowerCase();
  const NAME_FALLBACK: Record<string, SourceType> = {
    "reuters": "news_report", "bloomberg": "news_report",
    "financial times": "news_report", "ft": "news_report",
    "wall street journal": "news_report", "wsj": "news_report",
    "the economist": "analysis", "cnbc": "news_report",
    "bbc": "news_report", "ap news": "news_report",
    "imf": "data_release", "international monetary fund": "data_release",
    "world bank": "research_report", "opec": "official_statement",
    "iea": "official_statement", "sama": "official_statement",
    "pif": "official_statement", "moody's": "analysis",
    "moodys": "analysis", "s&p global": "analysis",
    "fitch ratings": "analysis", "fitch": "analysis",
    "saudi exchange": "market_data", "tadawul": "market_data",
    "adx": "market_data", "dfm": "market_data",
  };
  return NAME_FALLBACK[key] ?? "unknown";
}

export function isPrimarySource(tier: SourceTier, sourceType: SourceType): boolean {
  if (tier !== 1) return false;
  return (
    sourceType === "official_statement" ||
    sourceType === "government_data" ||
    sourceType === "market_data" ||
    sourceType === "data_release" ||
    sourceType === "financial_filing"
  );
}

const PUBLISHER_MAP: Record<string, string> = {
  "reuters.com": "Reuters",
  "bloomberg.com": "Bloomberg",
  "ft.com": "Financial Times",
  "wsj.com": "Wall Street Journal",
  "economist.com": "The Economist",
  "zawya.com": "Zawya",
  "arabianbusiness.com": "Arabian Business",
  "meed.com": "MEED",
  "thenationalnews.com": "The National",
  "gulfnews.com": "Gulf News",
  "khaleejtimes.com": "Khaleej Times",
  "argaam.com": "Argaam",
  "asharq.com": "Asharq News",
  "asharqbusiness.com": "Asharq Business",
  "agbi.com": "AGBI",
  "sama.gov.sa": "Saudi Central Bank (SAMA)",
  "pif.gov.sa": "Public Investment Fund",
  "imf.org": "IMF",
  "worldbank.org": "World Bank",
  "opec.org": "OPEC",
  "iea.org": "IEA",
  "tadawul.com.sa": "Saudi Exchange",
  "adx.ae": "Abu Dhabi Securities Exchange",
  "dfm.ae": "Dubai Financial Market",
  "aljazeera.com": "Al Jazeera",
  "cnbc.com": "CNBC",
  "bbc.com": "BBC",
  "apnews.com": "AP News",
  "aawsat.com": "Asharq Al-Awsat",
  "aleqt.com": "Al-Eqtisadiah",
  "moodys.com": "Moody's",
  "spglobal.com": "S&P Global",
  "fitchratings.com": "Fitch Ratings",
  "semafor.com": "Semafor",
  "middleeasteye.net": "Middle East Eye",
  "al-monitor.com": "Al-Monitor",
};

// Reverse map: publisher display name → tier (for when only the name is known, e.g. Google News RSS)
const PUBLISHER_NAME_TIERS: Record<string, SourceTier> = {
  // Tier 1 – official
  "saudi central bank (sama)": 1, "sama": 1, "public investment fund": 1, "pif": 1,
  "imf": 1, "international monetary fund": 1, "world bank": 1, "opec": 1, "iea": 1,
  "saudi exchange": 1, "tadawul": 1, "abu dhabi securities exchange": 1, "adx": 1,
  "dubai financial market": 1, "dfm": 1, "moody's": 1, "moodys": 1,
  "s&p global": 1, "sp global": 1, "fitch ratings": 1, "fitch": 1,
  // Tier 2 – established media & research
  "reuters": 2, "bloomberg": 2, "financial times": 2, "ft": 2,
  "wall street journal": 2, "wsj": 2, "the economist": 2, "cnbc": 2,
  "bbc": 2, "ap news": 2, "associated press": 2,
  "zawya": 2, "arabian business": 2, "meed": 2, "the national": 2,
  "gulf news": 2, "khaleej times": 2, "صحيفة الخليج": 2,
  "argaam": 2, "asharq news": 2, "asharq business": 2, "agbi": 2,
  "al jazeera": 2, "aljazeera": 2, "الجزيرة": 2,
  "asharq al-awsat": 2, "aawsat": 2, "الشرق الأوسط": 2,
  "al-eqtisadiah": 2, "aleqt": 2, "الاقتصادية": 2,
  "middle east eye": 2, "al-monitor": 2, "semafor": 2,
  "arab news": 2, "arabnews": 2,
  "alarabiya": 2, "العربية": 2, "al arabiya": 2,
  "bloomberg arabic": 2, "اقتصاد الشرق مع بلومبرغ": 2, "asharq bloomberg": 2,
  "capital economics": 2, "capitaleconomics": 2,
  "chatham house": 2, "brookings": 2, "cfr": 2, "mei": 2,
  "mubasher": 2, "مباشر": 2,
};

export function getSourceTierByName(publisherName: string): SourceTier {
  const key = publisherName.trim().toLowerCase();
  return PUBLISHER_NAME_TIERS[key] ?? 3;
}

// Publisher display name → domain (for favicon lookup when URL is a proxy)
const PUBLISHER_NAME_TO_DOMAIN: Record<string, string> = {
  // Tier 1
  "saudi central bank (sama)": "sama.gov.sa", "sama": "sama.gov.sa",
  "public investment fund": "pif.gov.sa", "pif": "pif.gov.sa",
  "imf": "imf.org", "international monetary fund": "imf.org",
  "world bank": "worldbank.org", "opec": "opec.org", "iea": "iea.org",
  "saudi exchange": "tadawul.com.sa", "tadawul": "tadawul.com.sa",
  "abu dhabi securities exchange": "adx.ae", "adx": "adx.ae",
  "dubai financial market": "dfm.ae", "dfm": "dfm.ae",
  "moody's": "moodys.com", "moodys": "moodys.com",
  "s&p global": "spglobal.com", "fitch ratings": "fitchratings.com", "fitch": "fitchratings.com",
  // Tier 2 – international
  "reuters": "reuters.com", "bloomberg": "bloomberg.com",
  "financial times": "ft.com", "ft": "ft.com",
  "wall street journal": "wsj.com", "wsj": "wsj.com",
  "the economist": "economist.com", "cnbc": "cnbc.com",
  "bbc": "bbc.com", "ap news": "apnews.com", "associated press": "apnews.com",
  "semafor": "semafor.com", "middle east eye": "middleeasteye.net",
  "al-monitor": "al-monitor.com", "chatham house": "chathamhouse.org",
  "brookings": "brookings.edu", "capital economics": "capitaleconomics.com",
  // Tier 2 – MENA
  "zawya": "zawya.com", "arabian business": "arabianbusiness.com",
  "meed": "meed.com", "the national": "thenationalnews.com",
  "gulf news": "gulfnews.com", "khaleej times": "khaleejtimes.com",
  "صحيفة الخليج": "alkhaleej.ae",
  "argaam": "argaam.com", "asharq news": "asharq.com",
  "asharq business": "asharqbusiness.com", "agbi": "agbi.com",
  "al jazeera": "aljazeera.com", "aljazeera": "aljazeera.com",
  "الجزيرة": "aljazeera.com",
  "asharq al-awsat": "aawsat.com", "الشرق الأوسط": "aawsat.com",
  "al-eqtisadiah": "aleqt.com", "الاقتصادية": "aleqt.com",
  "arab news": "arabnews.com",
  "alarabiya": "alarabiya.net", "العربية": "alarabiya.net", "al arabiya": "alarabiya.net",
  "اقتصاد الشرق مع بلومبرغ": "asharqbusiness.com",
  "asharq bloomberg": "asharqbusiness.com",
  "mubasher": "mubasher.info", "مباشر": "mubasher.info",
  // Additional regional outlets (English transliterated names)
  "al khaleej": "alkhaleej.ae",
  "al bayan": "albayan.ae",
  "sabq": "sabq.org",
  "mal": "mal.com.sa",
  "energynow.com": "energynow.com",
  "enterpriseam": "enterpriseam.com",
  "al youm": "alyaum.com",
  "al watan": "alwatan.com.sa",
  "al riyadh": "alriyadh.com",
  "okaz": "okaz.com.sa",
  "al madinah": "al-madina.com",
  "al bilad": "albilad-sa.com",
  "al anbaa": "anba.com.kw",
  "al rai": "alraimedia.com",
};

export function getPublisherDomain(publisherName: string): string {
  return PUBLISHER_NAME_TO_DOMAIN[publisherName.trim().toLowerCase()] ?? "";
}

// Arabic publisher names → English transliterations for display
const ARABIC_PUBLISHER_NAMES: Record<string, string> = {
  "الجزيرة": "Al Jazeera",
  "العربية": "Al Arabiya",
  "الشرق الأوسط": "Asharq Al-Awsat",
  "الاقتصادية": "Al-Eqtisadiah",
  "مباشر": "Mubasher",
  "اقتصاد الشرق مع بلومبرغ": "Asharq Bloomberg",
  "صحيفة الخليج": "Al Khaleej",
  "الخليج": "Al Khaleej",
  "البيان": "Al Bayan",
  "صحيفة سبق الإلكترونية": "Sabq",
  "سبق": "Sabq",
  "صحيفة مال": "Mal",
  "مال": "Mal",
  "الوطن": "Al Watan",
  "صحيفة الوطن": "Al Watan",
  "اليوم": "Al Youm",
  "الرياض": "Al Riyadh",
  "عكاظ": "Okaz",
  "المدينة": "Al Madinah",
  "البلاد": "Al Bilad",
  "الأنباء": "Al Anbaa",
  "الراي": "Al Rai",
  "عرب نيوز": "Arab News",
  "بلومبرغ": "Bloomberg Arabic",
  "رويترز": "Reuters Arabic",
};

export function normalizePublisherName(name: string): string {
  return ARABIC_PUBLISHER_NAMES[name.trim()] ?? name;
}

export function getPublisherName(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return PUBLISHER_MAP[hostname] ?? hostname;
  } catch {
    return url;
  }
}

export const TIER_LABELS: Record<SourceTier, string> = {
  1: "Official",
  2: "Established",
  3: "Other",
};

export const TIER_DESCRIPTIONS: Record<SourceTier, string> = {
  1: "Official government, regulatory, or multilateral source",
  2: "Established financial or regional media",
  3: "Other publication",
};

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  official_statement: "Official",
  government_data: "Gov. Data",
  market_data: "Market Data",
  data_release: "Data Release",
  research_report: "Research",
  financial_filing: "Filing",
  company_announcement: "Company",
  news_report: "News",
  analysis: "Analysis",
  unknown: "Unknown",
};
