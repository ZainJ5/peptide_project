import PeptideDetailClient from "./PeptideDetailClient";

const SITE_URL = "https://mypeptidedosages.com";

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:4000"
).replace(/\/$/, "");

const API_BASE = BACKEND_URL.endsWith("/api") ? BACKEND_URL : `${BACKEND_URL}/api`;

async function fetchPeptide(id) {
  try {
    const res = await fetch(`${API_BASE}/peptides/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
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

  const name = peptide.name;
  const mg = peptide.mgAmount || "";
  const fullName = mg ? `${name} ${mg}` : name;

  const title = `${fullName} Dosage Protocol - Reconstitution & Dosing Guide`;
  const description = `Complete ${fullName} dosage protocol: reconstitution instructions, injection frequency, cycle schedule, benefits, and side effects. Research-backed dosing guide.`;

  return {
    title,
    description,
    alternates: { canonical: `/library/${id}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/library/${id}`,
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
              item: `${SITE_URL}/library/${id}`,
            },
          ]
        : []),
    ],
  };

  const medicalJsonLd = peptide
    ? {
        "@context": "https://schema.org",
        "@type": "MedicalWebPage",
        name: peptide.mgAmount
          ? `${peptide.name} ${peptide.mgAmount} Dosage Protocol`
          : `${peptide.name} Dosage Protocol`,
        description: peptide.protocolTitle || `Dosage protocol for ${peptide.name}`,
        url: `${SITE_URL}/library/${id}`,
        mainContentOfPage: {
          "@type": "WebPageElement",
          cssSelector: "#benefits, #reconstitution, #dosage",
        },
        about: {
          "@type": "Drug",
          name: peptide.name,
          description: peptide.howItWorks || undefined,
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
      <PeptideDetailClient />
    </>
  );
}
