export interface UserPreferences {
  markets: string[];
  sectors: string[];
}

export const MARKETS = ["GCC/MENA", "US", "Europe", "Asia", "Global"] as const;
export const SECTORS = ["Energy", "Finance", "Tech", "Real Estate", "Agriculture", "Geopolitics"] as const;

const MARKET_KEYWORDS: Record<string, string[]> = {
  "GCC/MENA": ["gcc", "mena", "saudi", "uae", "dubai", "qatar", "kuwait", "oman", "bahrain", "egypt", "jordan", "gulf", "riyadh", "aramco", "opec", "arab"],
  "US": ["us ", "usa", "american", "federal reserve", "fed", "wall street", "s&p", "nasdaq", "dow", "treasury", "washington"],
  "Europe": ["europe", "eu ", "ecb", "eurozone", "uk ", "britain", "london", "germany", "france", "euro"],
  "Asia": ["china", "japan", "india", "asia", "hong kong", "singapore", "tokyo", "beijing", "seoul", "vietnam"],
  "Global": ["global", "world", "imf", "world bank", "g20", "g7", "international", "wto"],
};

const SECTOR_KEYWORDS: Record<string, string[]> = {
  "Energy": ["energy", "oil", "gas", "opec", "petroleum", "renewables", "solar", "wind", "power", "crude", "brent"],
  "Finance": ["finance", "banking", "investment", "stocks", "markets", "currency", "bonds", "inflation", "interest rate", "monetary"],
  "Tech": ["tech", "technology", "ai ", "digital", "startup", "cloud", "semiconductor", "software", "artificial intelligence"],
  "Real Estate": ["real estate", "property", "housing", "construction", "reit", "mortgage"],
  "Agriculture": ["agriculture", "food", "farming", "commodities", "wheat", "grain", "livestock", "crop"],
  "Geopolitics": ["geopolitics", "politics", "sanctions", "war", "conflict", "diplomacy", "trade war", "nuclear", "military"],
};

export function matchesBriefing(prefs: UserPreferences, tags: string[]): boolean {
  if (prefs.markets.length === 0 && prefs.sectors.length === 0) return false;
  const text = tags.join(" ").toLowerCase();

  const marketMatch = prefs.markets.some((market) =>
    (MARKET_KEYWORDS[market] ?? []).some((kw) => text.includes(kw))
  );
  const sectorMatch = prefs.sectors.some((sector) =>
    (SECTOR_KEYWORDS[sector] ?? []).some((kw) => text.includes(kw))
  );
  return marketMatch || sectorMatch;
}
