import Link from "next/link";
import { permanentRedirect, notFound } from "next/navigation";
import PeptideDetailClient from "./PeptideDetailClient";

export const revalidate = 3600; // ISR: regenerate at most every hour

const SITE_URL = "https://mypeptidedosages.com";

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:4000"
).replace(/\/$/, "");

const API_BASE = BACKEND_URL.endsWith("/api") ? BACKEND_URL : `${BACKEND_URL}/api`;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function fetchPeptide(idOrSlug) {
  try {
    const res = await fetch(`${API_BASE}/peptides/${encodeURIComponent(idOrSlug)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

async function fetchRelated(peptide) {
  try {
    const res = await fetch(`${API_BASE}/peptides?limit=100`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const all = (json.data || []).filter((p) => p.slug && p.slug !== peptide.slug);
    if (all.length <= 8) return all;

    // Prefer peptides in the same health category, then fill with alphabetical
    // neighbours so every page gets a varied, non-boilerplate set of links.
    const cat = peptide?.healthCategories?.[0]?.toLowerCase();
    const sameCat = cat
      ? all.filter((p) => (p.healthCategories || []).some((c) => String(c).toLowerCase() === cat))
      : [];

    const cur = String(peptide?.name || "").toLowerCase();
    let start = all.findIndex((p) => String(p.name).toLowerCase() > cur);
    if (start < 0) start = 0;

    const picked = [];
    const seen = new Set();
    const add = (p) => {
      if (p && !seen.has(p.slug)) { seen.add(p.slug); picked.push(p); }
    };
    sameCat.forEach(add);
    for (let i = 0; picked.length < 8 && i < all.length; i++) add(all[(start + i) % all.length]);
    return picked.slice(0, 8);
  } catch {
    return [];
  }
}

export async function generateStaticParams() {
  try {
    const allSlugs = [];
    let offset = 0;
    const limit = 100;
    while (true) {
      const res = await fetch(`${API_BASE}/peptides?limit=${limit}&offset=${offset}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) break;
      const json = await res.json();
      const peptides = json.data || json.peptides || [];
      if (peptides.length === 0) break;
      allSlugs.push(...peptides.filter((p) => p.slug).map((p) => ({ id: p.slug })));
      offset += peptides.length;
      if (allSlugs.length >= (json.total || Infinity)) break;
    }
    return allSlugs;
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const peptide = await fetchPeptide(id);

  if (!peptide) {
    return {
      title: "Protocol Not Found",
      robots: { index: false },
    };
  }

  // If accessed by UUID, don't generate metadata (redirect will happen in the page component)
  const slug = peptide.slug || id;
  if (UUID_RE.test(id) && peptide.slug) {
    return {};
  }

  const name = peptide.name;
  const mg = peptide.mgAmount || "";
  const fullName = mg ? `${name} ${mg}` : name;

  const title = `${fullName} Dosage Protocol – Reconstitution & Dosing Guide`;
  const description = `Complete ${fullName} dosage protocol on My Peptide Dosages: reconstitution instructions, injection frequency, cycle schedule, benefits, and side effects. Research-backed dosing guide.`;

  return {
    title,
    description,
    alternates: { canonical: `/library/${slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/library/${slug}`,
      type: "article",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function PeptideDetailPage({ params }) {
  const { id } = await params;
  const peptide = await fetchPeptide(id);

  if (UUID_RE.test(id) && !peptide) {
    permanentRedirect("/library");
  }

  if (peptide?.slug && UUID_RE.test(id)) {
    permanentRedirect(`/library/${peptide.slug}`);
  }
  if (!peptide) {
    notFound();
  }

  const slug = peptide?.slug || id;
  const related = await fetchRelated(peptide);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Peptide Library", item: `${SITE_URL}/library` },
      ...(peptide
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: peptide.mgAmount ? `${peptide.name} ${peptide.mgAmount}` : peptide.name,
              item: `${SITE_URL}/library/${slug}`,
            },
          ]
        : []),
    ],
  };

  const medicalJsonLd = peptide
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        mainEntityOfPage: {
          "@type": "MedicalWebPage",
          "@id": `${SITE_URL}/library/${slug}`,
        },
        headline: peptide.mgAmount
          ? `${peptide.name} ${peptide.mgAmount} Dosage Protocol`
          : `${peptide.name} Dosage Protocol`,
        description: peptide.protocolTitle || `Dosage protocol for ${peptide.name}`,
        url: `${SITE_URL}/library/${slug}`,
        about: {
          "@type": "MedicalEntity",
          name: peptide.name,
          ...(peptide.howItWorks ? { description: peptide.howItWorks } : {}),
        },
        author: {
          "@type": "Organization",
          "@id": "https://mypeptidedosages.com/#organization",
          name: "My Peptide Dosages",
          url: SITE_URL,
        },
        publisher: {
          "@type": "Organization",
          "@id": "https://mypeptidedosages.com/#organization",
          name: "My Peptide Dosages",
          url: SITE_URL,
          logo: {
            "@type": "ImageObject",
            url: `${SITE_URL}/logo.png`,
            width: 512,
            height: 512,
          },
        },
        isPartOf: { "@id": "https://mypeptidedosages.com/#website" },
      }
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {medicalJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(medicalJsonLd) }}
        />
      )}
      <PeptideDetailClient initialPeptide={peptide} />

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-6 pb-8">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <h2 id="related-heading" className="text-lg font-bold text-slate-900">
              Related peptide protocols
            </h2>
            <p className="mt-1 text-sm text-slate-500">More research-backed dosing guides in this category.</p>
            <ul className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/library/${r.slug}`}
                    className="group flex flex-col rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-3 transition-colors hover:border-emerald-300 hover:bg-emerald-50/40"
                  >
                    <span className="text-sm font-semibold text-slate-800 group-hover:text-emerald-700">{r.name}</span>
                    {r.mgAmount && <span className="mt-0.5 text-xs font-medium text-slate-400">{r.mgAmount}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
