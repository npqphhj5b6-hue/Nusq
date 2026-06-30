import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GLOSSARY, getTermBySlug, getRelatedTerms } from "@/lib/glossary";

export async function generateStaticParams() {
  return GLOSSARY.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const term = getTermBySlug(slug);
  if (!term) return {};
  return {
    title: `${term.term}${term.fullName ? ` (${term.fullName})` : ""} — Nusq Glossary`,
    description: term.oneLiner,
  };
}

export default async function GlossaryTermPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const term = getTermBySlug(slug);
  if (!term) notFound();

  const related = getRelatedTerms(term);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-8 text-xs" style={{ color: "var(--c-text-3)" }}>
        <Link href="/" className="hover:text-[var(--c-text-2)] transition-colors">Home</Link>
        <span>/</span>
        <Link href="/glossary" className="hover:text-[var(--c-text-2)] transition-colors">Glossary</Link>
        <span>/</span>
        <span style={{ color: "var(--c-text-2)" }}>{term.term}</span>
      </div>

      {/* Term header */}
      <div className="mb-8">
        <p
          className="text-xs font-bold tracking-widest uppercase mb-3"
          style={{ color: "var(--c-accent)" }}
        >
          {term.category}
        </p>
        <h1
          className="font-bold mb-1 leading-tight"
          style={{
            fontSize: "clamp(2rem, 7vw, 3rem)",
            letterSpacing: "-0.04em",
            color: "var(--c-text-1)",
          }}
        >
          {term.term}
        </h1>
        {term.fullName && (
          <p className="text-sm mb-3" style={{ color: "var(--c-text-3)" }}>
            {term.fullName}
          </p>
        )}
        <p
          className="text-base font-medium leading-relaxed"
          style={{ color: "var(--c-text-2)" }}
        >
          {term.oneLiner}
        </p>
      </div>

      {/* Definition */}
      <div
        className="rounded-2xl px-6 py-5 mb-4"
        style={{
          background: "var(--c-surface)",
          border: "1px solid var(--c-border)",
        }}
      >
        <p
          className="text-[10px] font-bold tracking-widest uppercase mb-3"
          style={{ color: "var(--c-text-3)" }}
        >
          What it means
        </p>
        <p className="text-sm leading-[1.8]" style={{ color: "var(--c-text-1)" }}>
          {term.definition}
        </p>
      </div>

      {/* Why it matters */}
      <div
        className="rounded-2xl px-6 py-5 mb-6"
        style={{
          background: "var(--c-surface)",
          border: "1px solid color-mix(in srgb, var(--c-accent) 35%, transparent)",
        }}
      >
        <p
          className="text-[10px] font-bold tracking-widest uppercase mb-3"
          style={{ color: "var(--c-accent)" }}
        >
          Why it matters
        </p>
        <p className="text-sm leading-[1.8]" style={{ color: "var(--c-text-2)" }}>
          {term.whyItMatters}
        </p>
      </div>

      {/* Country tags */}
      {term.countries && term.countries.length > 0 && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span className="text-xs" style={{ color: "var(--c-text-3)" }}>Relevant to:</span>
          {term.countries.map((c) => (
            <span
              key={c}
              className="text-xs px-2.5 py-1 rounded-lg"
              style={{
                background: "var(--c-surface-2)",
                border: "1px solid var(--c-border)",
                color: "var(--c-text-2)",
              }}
            >
              {c}
            </span>
          ))}
        </div>
      )}

      {/* Related terms */}
      {related.length > 0 && (
        <div>
          <p
            className="text-[10px] font-bold tracking-widest uppercase mb-3"
            style={{ color: "var(--c-text-3)" }}
          >
            Related terms
          </p>
          <div className="flex flex-col gap-2">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/glossary/${r.slug}`}
                className="group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-150"
                style={{
                  background: "var(--c-surface)",
                  border: "1px solid var(--c-border)",
                }}
              >
                <div>
                  <span
                    className="text-sm font-semibold transition-colors group-hover:text-[var(--c-accent)]"
                    style={{ color: "var(--c-text-1)", letterSpacing: "-0.02em" }}
                  >
                    {r.term}
                  </span>
                  <span className="text-xs ml-2" style={{ color: "var(--c-text-3)" }}>
                    {r.category}
                  </span>
                </div>
                <span
                  className="text-sm transition-transform duration-150 group-hover:translate-x-0.5"
                  style={{ color: "var(--c-text-3)" }}
                >
                  →
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Back link */}
      <div className="mt-10 pt-6" style={{ borderTop: "1px solid var(--c-border)" }}>
        <Link
          href="/glossary"
          className="text-sm transition-colors"
          style={{ color: "var(--c-text-3)" }}
        >
          ← All terms
        </Link>
      </div>
    </div>
  );
}
