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
