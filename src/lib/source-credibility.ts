export type SourceTier = 1 | 2 | 3;

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
