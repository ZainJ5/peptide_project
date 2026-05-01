import { permanentRedirect } from "next/navigation";
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

  const title = `${fullName} Dosage Protocol - Reconstitution & Dosing Guide`;
  const description = `Complete ${fullName} dosage protocol: reconstitution instructions, injection frequency, cycle schedule, benefits, and side effects. Research-backed dosing guide.`;

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

  // 308 permanent redirect from UUID URL to slug URL for SEO
  if (peptide?.slug && UUID_RE.test(id)) {
    permanentRedirect(`/library/${peptide.slug}`);
  }

  const slug = peptide?.slug || id;

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
          name: "MyPeptideDosages",
          url: SITE_URL,
        },
        publisher: {
          "@type": "Organization",
          name: "MyPeptideDosages",
          url: SITE_URL,
          logo: {
            "@type": "ImageObject",
            url: `${SITE_URL}/favicon.ico`,
          },
        },
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
    </>
  );
}
