const BACKEND_URL = (
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:4000"
).replace(/\/$/, "");

const API_BASE = BACKEND_URL.endsWith("/api") ? BACKEND_URL : `${BACKEND_URL}/api`;

async function handler(request, { params }) {
  const { path } = await params;
  const pathStr = Array.isArray(path) ? path.join("/") : path;
  const url = new URL(request.url);
  const target = `${API_BASE}/${pathStr}${url.search}`;

  const headers = new Headers();
  for (const [key, value] of request.headers.entries()) {
    if (["host", "connection", "transfer-encoding"].includes(key.toLowerCase())) continue;
    headers.set(key, value);
  }

  const init = {
    method: request.method,
    headers,
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
    init.duplex = "half";
  }

  const response = await fetch(target, init);

  const responseHeaders = new Headers();
  for (const [key, value] of response.headers.entries()) {
    if (["transfer-encoding", "content-encoding"].includes(key.toLowerCase())) continue;
    responseHeaders.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
