import { API_BASE_URL } from "./config";

function toQueryString(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });
  const result = query.toString();
  return result ? `?${result}` : "";
}

export async function apiRequest(path, { method = "GET", body, token, refreshToken, onRefresh } = {}) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const makeRequest = async (jwt) => {
    const requestHeaders = { ...headers };
    if (jwt) requestHeaders.Authorization = `Bearer ${jwt}`;

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 204) return { success: true };

    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const error = new Error(typeof payload === "string" ? payload : payload.error || "Request failed");
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  };

  try {
    return await makeRequest(token);
  } catch (error) {
    const canRefresh = error.status === 401 && refreshToken && typeof onRefresh === "function";
    if (!canRefresh) throw error;

    const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const refreshPayload = await refreshResponse.json();
    if (!refreshResponse.ok || !refreshPayload?.token) {
      throw error;
    }

    onRefresh(refreshPayload);
    return makeRequest(refreshPayload.token);
  }
}

export async function downloadSchedulePdf(scheduleId, token) {
  const response = await fetch(`${API_BASE_URL}/pdf/schedules/${scheduleId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Unable to download PDF");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `peptide-schedule-${scheduleId.slice(0, 8)}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

export { toQueryString };
