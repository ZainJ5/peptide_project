const SITE_URL = "https://mypeptidedosages.com";
const INDEXNOW_KEY = "6ebf7ed4e82c37825de45733e0b4afbb";

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:4000"
).replace(/\/$/, "");

const API_BASE = BACKEND_URL.endsWith("/api") ? BACKEND_URL : `${BACKEND_URL}/api`;

export async function POST(request) {
  // Optional: protect with a secret
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  if (secret !== (process.env.INDEXNOW_SECRET || "indexnow-trigger")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Collect all URLs to submit
  const urls = [
    SITE_URL,
    `${SITE_URL}/library`,
    `${SITE_URL}/schedule`,
    `${SITE_URL}/videos`,
    `${SITE_URL}/community`,
  ];

  // Fetch peptide pages
  try {
    let offset = 0;
    const limit = 100;
    while (true) {
      const res = await fetch(`${API_BASE}/peptides?limit=${limit}&offset=${offset}`);
      if (!res.ok) break;
      const json = await res.json();
      const peptides = json.data || json.peptides || [];
      if (peptides.length === 0) break;
      peptides.forEach((p) => urls.push(`${SITE_URL}/library/${p.slug || p.id}`));
      offset += peptides.length;
      if (urls.length >= (json.total || Infinity) + 5) break;
    }
  } catch {
    // Continue with static URLs
  }

  // Submit to IndexNow (covers Bing, Yandex, and others)
  const results = [];
  for (const engine of ["api.indexnow.org", "www.bing.com", "yandex.com"]) {
    try {
      const res = await fetch(`https://${engine}/indexnow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: "mypeptidedosages.com",
          key: INDEXNOW_KEY,
          keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
          urlList: urls,
        }),
      });
      results.push({ engine, status: res.status });
    } catch (err) {
      results.push({ engine, error: err.message });
    }
  }

  return Response.json({
    submitted: urls.length,
    results,
  });
}
