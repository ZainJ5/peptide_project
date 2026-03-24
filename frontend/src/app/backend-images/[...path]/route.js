const BACKEND_URL = (
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:4000"
)
  .replace(/\/$/, "")
  .replace(/\/api$/, "");

async function handler(request, { params }) {
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
  });

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
export const HEAD = handler;