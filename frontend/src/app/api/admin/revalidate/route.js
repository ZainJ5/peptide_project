import { revalidatePath } from "next/cache";

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:4000"
).replace(/\/$/, "");

const API_BASE = BACKEND_URL.endsWith("/api") ? BACKEND_URL : `${BACKEND_URL}/api`;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Purge cached library pages after an admin edit. The caller's admin token is
 * checked against the backend, so only a signed-in admin can trigger this.
 */
export async function POST(request) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) {
    return Response.json({ success: false, error: "Admin authentication required." }, { status: 401 });
  }

  try {
    const me = await fetch(`${API_BASE}/admin/auth/me`, {
      headers: { Authorization: authorization },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!me.ok) {
      return Response.json({ success: false, error: "Admin session is not valid." }, { status: 401 });
    }
  } catch {
    return Response.json({ success: false, error: "Could not verify admin session." }, { status: 502 });
  }

  const body = await request.json().catch(() => ({}));
  const slugs = (Array.isArray(body?.slugs) ? body.slugs : [])
    .filter((s) => typeof s === "string" && SLUG_RE.test(s) && s.length <= 300)
    .slice(0, 50);

  for (const slug of slugs) revalidatePath(`/library/${slug}`);
  revalidatePath("/library");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");

  return Response.json({ success: true, revalidated: slugs });
}
