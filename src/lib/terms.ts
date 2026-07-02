import { GLOSSARY } from "./glossary";
import type { SourceRef } from "./types";

export interface TermToken { type: "term"; value: string; slug: string; definition: string }
export interface TextToken { type: "text"; value: string }
export interface BoldToken { type: "bold"; value: string }
export interface CitationToken { type: "citation"; n: number; url: string | null }
export type AnnotatedToken = TermToken | TextToken | BoldToken | CitationToken;

interface TermEntry {
  slug: string;
  definition: string;
  aliases: string[];
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const TERM_ENTRIES: TermEntry[] = GLOSSARY.map((t) => ({
  slug: t.slug,
  // GLOSSARY.oneLiner is already a single tight sentence — reused as-is for the popover.
  definition: t.oneLiner,
  aliases: Array.from(new Set([t.term, t.fullName].filter((v): v is string => !!v))),
}));

// Longest alias first so multi-word terms (e.g. "IMF programme") match before shorter substrings (e.g. "IMF").
const ALL_ALIASES = TERM_ENTRIES
  .flatMap((entry) => entry.aliases.map((alias) => ({ alias, entry })))
  .sort((a, b) => b.alias.length - a.alias.length);

const ALIAS_TO_ENTRY = new Map(ALL_ALIASES.map(({ alias, entry }) => [alias.toLowerCase(), entry]));

const TERM_REGEX = new RegExp(
  `\\b(${ALL_ALIASES.map((a) => escapeRegExp(a.alias)).join("|")})\\b`,
  "gi"
);

function splitTerms(text: string, usedSlugs: Set<string>): (TextToken | TermToken)[] {
  const out: (TextToken | TermToken)[] = [];
  let lastIndex = 0;
  TERM_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TERM_REGEX.exec(text))) {
    const entry = ALIAS_TO_ENTRY.get(match[0].toLowerCase());
    if (!entry) continue;
    if (match.index > lastIndex) {
      out.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    if (usedSlugs.has(entry.slug)) {
      out.push({ type: "text", value: match[0] });
    } else {
      usedSlugs.add(entry.slug);
      out.push({ type: "term", value: match[0], slug: entry.slug, definition: entry.definition });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) out.push({ type: "text", value: text.slice(lastIndex) });
  return out;
}

const MARKUP_REGEX = /\*\*(.+?)\*\*|\[(\d+)\]/g;

/** Tokenizes briefing prose (handles **bold** and [n] citations) and wraps the first
 *  occurrence of each glossary term for click-to-define. `usedSlugs` is mutated in
 *  place so callers can share (or not share) "already annotated" state across paragraphs. */
export function annotateParagraph(
  para: string,
  sourceMap: Map<number, SourceRef>,
  usedSlugs: Set<string>
): AnnotatedToken[] {
  const out: AnnotatedToken[] = [];
  let lastIndex = 0;
  MARKUP_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = MARKUP_REGEX.exec(para))) {
    if (match.index > lastIndex) {
      out.push(...splitTerms(para.slice(lastIndex, match.index), usedSlugs));
    }
    if (match[1] !== undefined) {
      out.push({ type: "bold", value: match[1] });
    } else if (match[2] !== undefined) {
      const n = parseInt(match[2], 10);
      const source = sourceMap.get(n);
      out.push({ type: "citation", n, url: source?.url ?? null });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < para.length) {
    out.push(...splitTerms(para.slice(lastIndex), usedSlugs));
  }
  return out;
}

/** Tokenizes **bold** and [n] citations only — no glossary-term wrapping. For
 *  short recap text (TL;DR bullets, summary, Also Watching, "why this matters")
 *  where inline click-to-define popovers would be noise. Note: callers currently
 *  strip [n] markers before passing text in, so in practice this handles bold. */
export function annotateCitations(
  text: string,
  sourceMap: Map<number, SourceRef>
): AnnotatedToken[] {
  const out: AnnotatedToken[] = [];
  let lastIndex = 0;
  MARKUP_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = MARKUP_REGEX.exec(text))) {
    if (match.index > lastIndex) {
      out.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    if (match[1] !== undefined) {
      out.push({ type: "bold", value: match[1] });
    } else if (match[2] !== undefined) {
      const n = parseInt(match[2], 10);
      const source = sourceMap.get(n);
      out.push({ type: "citation", n, url: source?.url ?? null });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    out.push({ type: "text", value: text.slice(lastIndex) });
  }
  return out;
}

/** For plain sentences with no markdown markup (e.g. Ishara block headline/detail). */
export function annotateText(text: string, usedSlugs: Set<string>): AnnotatedToken[] {
  return splitTerms(text, usedSlugs);
}
