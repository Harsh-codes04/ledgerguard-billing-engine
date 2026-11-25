const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiRequest(path, { method = "GET", body, headers, ...options } = {}) {
  const requestHeaders = new Headers(headers || {});
  requestHeaders.set("Accept", "application/json");

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && !isFormData) {
    requestHeaders.set("Content-Type", "application/json");
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`, {
      ...options,
      method,
      headers: requestHeaders,
      credentials: "include",
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError(
      "Cannot reach the LedgerGuard API. Check Vercel's VITE_API_URL and Render's CLIENT_URL settings.",
      0
    );
  }

  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(payload?.message || `Request failed with status ${response.status}.`, response.status);
  }
  return payload;
}

export function pingHealth(options = {}) {
  return apiRequest("/health", options);
}
