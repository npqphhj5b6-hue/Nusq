export interface Briefing {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  readingTime: number;
  body: string;
  status: "draft" | "published";
  coverImageUrl?: string | null;
  coverImageCredit?: string | null;
  coverImageCreditLink?: string | null;
  tickers?: string[];
}

export interface Essay {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  readingTime: number;
  body: string;
}
