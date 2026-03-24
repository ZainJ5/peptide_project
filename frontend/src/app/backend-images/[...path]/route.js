const BACKEND_URL = (
  process.env.BACKEND_BASE_URL ||
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://139.59.34.214"
)
  .replace(/\/$/, "")
  .replace(/\/api$/, "");

async function handler(request, { params }) {
  try {
    const { path } = await params;
    const pathStr = Array.isArray(path) ? path.join("/") : path;
    const url = new URL(request.url);
    const target = `${BACKEND_URL}/${pathStr}${url.search}`;

    const headers = new Headers();
    for (const [key, value] of request.headers.entries()) {
      if (["host", "connection", "transfer-encoding"].includes(key.toLowerCase())) continue;
      headers.set(key, value);
    }

    const response = await fetch(target, {
      method: request.method,
      headers,
      cache: "no-store",
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete("transfer-encoding");
    responseHeaders.set("Cache-Control", "public, max-age=300, s-maxage=300");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch {
    return new Response("Image proxy failed", { status: 502 });
  }
}

export const GET = handler;
export const HEAD = handler;