"use client";

import { API_BASE_URL } from "@/lib/config";
import { useAdminStore } from "./store";

/**
 * Fetch wrapper for /api/admin. Attaches the admin token, normalises errors
 * (including express-validator field details) and ends the session on 401.
 */
export async function adminRequest(path, { method = "GET", body, auth = true } = {}) {
  const { token, clearSession } = useAdminStore.getState();
  const headers = { "Content-Type": "application/json" };
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/admin${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw Object.assign(new Error("Can't reach the server. Check your connection and try again."), { status: 0 });
  }

  const isJson = (response.headers.get("content-type") || "").includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    if (response.status === 401 && auth) clearSession();
    const details = Array.isArray(payload?.details) ? payload.details : [];
    const fieldErrors = {};
    details.forEach((d) => {
      if (d && typeof d === "object" && d.field && !fieldErrors[d.field]) fieldErrors[d.field] = d.message;
    });
    const firstDetail = details[0];
    const detailText = typeof firstDetail === "string" ? firstDetail : firstDetail?.message;
    const message =
      payload?.error === "Validation failed" && detailText
        ? detailText
        : payload?.error || (response.status >= 500 ? "Something went wrong on the server." : "Request failed.");
    throw Object.assign(new Error(message), { status: response.status, fieldErrors, payload });
  }

  return payload;
}

export const UPLOAD_TYPES = ["image/png", "image/jpeg", "image/webp", "image/avif"];
export const UPLOAD_MAX_MB = 8;

/** Upload one image file; resolves to its site URL (e.g. /media/peptides/x.webp). */
export async function adminUploadImage(file, { kind = "protocol", slug = "" } = {}) {
  if (!UPLOAD_TYPES.includes(file.type)) throw new Error("Choose a PNG, JPG, WebP or AVIF image.");
  if (file.size > UPLOAD_MAX_MB * 1024 * 1024) throw new Error(`Image is too large. The limit is ${UPLOAD_MAX_MB} MB.`);

  const { token, clearSession } = useAdminStore.getState();
  const qs = new URLSearchParams({ kind, ...(slug ? { slug } : {}) });
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/admin/uploads?${qs}`, {
      method: "POST",
      headers: { "Content-Type": file.type, Authorization: `Bearer ${token}` },
      body: file,
    });
  } catch {
    throw new Error("Upload failed — check your connection and try again.");
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) clearSession();
    throw new Error(payload?.error || "Upload failed.");
  }
  return payload.data.url;
}

/**
 * Ask the website to rebuild cached library pages so edits show up right
 * away instead of after the hourly ISR refresh. Never throws: a failure here
 * only means the page refreshes on its normal schedule.
 */
export async function revalidateSite(slugs = []) {
  const { token } = useAdminStore.getState();
  try {
    const res = await fetch("/api/admin/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ slugs: [...new Set(slugs.filter(Boolean))] }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
