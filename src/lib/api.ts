// ============================================================
// API fetch wrapper for frontend → backend calls
// Auto-attaches JWT from localStorage.
// ============================================================

const API_BASE = "";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("neurofocus_token");
}

export function setToken(token: string): void {
  localStorage.setItem("neurofocus_token", token);
}

export function clearToken(): void {
  localStorage.removeItem("neurofocus_token");
}

export async function apiFetch<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers,
    });

    const json = await res.json();
    return json;
  } catch (err) {
    console.error(`[API] Fetch error for ${url}:`, err);
    return { success: false, error: "Network error" };
  }
}

export function apiGet<T = unknown>(url: string) {
  return apiFetch<T>(url, { method: "GET" });
}

export function apiPost<T = unknown>(url: string, body?: unknown) {
  return apiFetch<T>(url, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function apiDelete<T = unknown>(url: string) {
  return apiFetch<T>(url, { method: "DELETE" });
}
