export function toDisplayImageUrl(rawUrl) {
  const value = typeof rawUrl === "string" ? rawUrl.trim() : "";
  if (!value) return "";

  if (value.startsWith("/images/")) {
    return `/backend-images${value}`;
  }

  if (value.startsWith("/")) {
    return value;
  }

  try {
    const parsed = new URL(value);

    if (parsed.protocol === "http:") {
      return `/backend-images${parsed.pathname}${parsed.search}`;
    }

    return value;
  } catch {
    return value;
  }
}
