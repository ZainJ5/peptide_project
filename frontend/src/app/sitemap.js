const SITE_URL = "https://mypeptidedosages.com";

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:4000"
).replace(/\/$/, "");

const API_BASE = BACKEND_URL.endsWith("/api") ? BACKEND_URL : `${BACKEND_URL}/api`;

async function fetchAllPeptides() {
  const allPeptides = [];
  let offset = 0;
  const limit = 100;

  // Try direct backend URL first, then fallback to site's own proxy
  const urls = [
    `${API_BASE}/peptides`,
    `${SITE_URL}/backend-api/peptides`,
  ];

  for (const baseUrl of urls) {
    try {
      // Paginate until we have all peptides
      while (true) {
        const res = await fetch(`${baseUrl}?limit=${limit}&offset=${offset}`, {
          next: { revalidate: 86400 },
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) break;
        const json = await res.json();
        const peptides = json.data || json.peptides || [];
        if (peptides.length === 0) break;
        allPeptides.push(...peptides);
        offset += peptides.length;
        if (allPeptides.length >= (json.total || Infinity)) break;
      }
      if (allPeptides.length > 0) return allPeptides;
    } catch {
      // Try next URL
      offset = 0;
      allPeptides.length = 0;
    }
  }

  return allPeptides;
}

export default async function sitemap() {
  const staticPages = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE_URL}/library`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/schedule`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/videos`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/community`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  const peptides = await fetchAllPeptides();
  const peptidePages = peptides.map((p) => ({
    url: `${SITE_URL}/library/${p.id}`,
    lastModified: new Date(p.updatedAt || p.createdAt || Date.now()),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticPages, ...peptidePages];
}
