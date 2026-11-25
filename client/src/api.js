const configuredApiUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");
const API_BASE_URL = configuredApiUrl.endsWith("/api") ? configuredApiUrl : `${configuredApiUrl}/api`;

function requestUrl(path) {
  const cleanPath = `/${String(path).replace(/^\/+/, "")}`.replace(/^\/api(?=\/|$)/, "");
  return `${API_BASE_URL}${cleanPath}`;
}

export async function apiRequest(path, { method = "GET", body, signal } = {}) {
  const headers = new Headers({ Accept: "application/json" });
  if (body !== undefined) headers.set("Content-Type", "application/json");

  const response = await fetch(requestUrl(path), {
    method,
    headers,
    credentials: "include",
    signal,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || "The request could not be completed.");
  }
  return data;
}
