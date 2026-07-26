import VideosClient from "./VideosClient";

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:4000"
).replace(/\/$/, "");

const API_BASE = BACKEND_URL.endsWith("/api") ? BACKEND_URL : `${BACKEND_URL}/api`;

export const revalidate = 3600; // ISR: refresh the list at most hourly

async function fetchVideos() {
  try {
    const res = await fetch(`${API_BASE}/videos`, {
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

export default async function VideosPage() {
  const videos = await fetchVideos();
  return <VideosClient videos={videos} />;
}
