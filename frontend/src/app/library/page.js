import LibraryClient from "./LibraryClient";

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:4000"
).replace(/\/$/, "");

const API_BASE = BACKEND_URL.endsWith("/api") ? BACKEND_URL : `${BACKEND_URL}/api`;

export const revalidate = 3600;

async function fetchInitialPeptides() {
  try {
    const res = await fetch(`${API_BASE}/peptides?limit=100&offset=0`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

async function fetchInitialCategories() {
  try {
    const res = await fetch(`${API_BASE}/peptides/categories`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.categories || [];
  } catch {
    return [];
  }
}

export default async function LibraryPage() {
  const [initialPeptides, initialCategories] = await Promise.all([
    fetchInitialPeptides(),
    fetchInitialCategories(),
  ]);

  return (
    <LibraryClient
      initialPeptides={initialPeptides}
      initialCategories={initialCategories}
    />
  );
}
