import CommunityClient from "./CommunityClient";

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:4000"
).replace(/\/$/, "");

const API_BASE = BACKEND_URL.endsWith("/api") ? BACKEND_URL : `${BACKEND_URL}/api`;

export const revalidate = 300; // 5-minute ISR for community posts

async function fetchInitialPosts() {
  const url = `${API_BASE}/community?limit=40&offset=0`;
  try {
    const res = await fetch(url, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.error(`[community/page] SSR fetch failed — ${res.status} ${res.statusText} — ${url}`);
      return [];
    }
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error(`[community/page] SSR fetch threw — ${url}`, err);
    return [];
  }
}

export default async function CommunityPage() {
  const initialPosts = await fetchInitialPosts();
  return <CommunityClient initialPosts={initialPosts} />;
}
