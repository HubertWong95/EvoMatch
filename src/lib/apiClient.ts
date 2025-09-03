// src/lib/apiClient.ts

// ORIGIN: your server origin (no trailing slash), e.g. http://localhost:8080
const ORIGIN =
  import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "http://localhost:8080";

// API_BASE: optional base path (leading slash, no trailing slash), e.g. "/api" or ""
// With your current setup, either leave VITE_API_BASE unset or set it to "".
const API_BASE = (
  import.meta.env.VITE_API_BASE?.replace(/^\/?/, "/") || ""
).replace(/\/+$/, "");

// Final base URL
export const API_URL = ORIGIN + API_BASE;

/**
 * JSON-friendly fetch helper (function form).
 */
export async function api<T = any>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers = new Headers(init.headers);
  // Only set Content-Type if body exists and isn't FormData
  if (
    !headers.has("Content-Type") &&
    init.body &&
    !(init.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    // Using JWT in Authorization header; omit cookies to avoid CSRF/CORS confusion
    credentials: init.credentials ?? "omit",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let msg = res.statusText;
    try {
      const j = text ? JSON.parse(text) : null;
      msg = (j?.error || j?.message || text || res.statusText) as string;
    } catch {
      /* keep default msg */
    }
    const err = new Error(msg) as Error & { status?: number; body?: string };
    err.status = res.status;
    err.body = text;
    throw err;
  }

  const raw = await res.text().catch(() => "");
  if (!raw) return {} as T;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as unknown as T;
  }
}

/**
 * Multipart/form-data helper (for file uploads).
 * Do NOT set Content-Type; browser sets boundary.
 */
export async function apiForm<T = any>(
  path: string,
  form: FormData,
  init: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers = new Headers(init.headers);
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return api<T>(path, {
    ...init,
    method: init.method ?? "POST",
    body: form,
    headers,
  });
}
