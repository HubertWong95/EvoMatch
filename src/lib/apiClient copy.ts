// // src/lib/apiClient.ts
// export const API_URL =
//   import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "http://localhost:8080";

// /**
//  * JSON-friendly fetch helper (function form).
//  */
// export async function api<T = any>(
//   path: string,
//   init: RequestInit = {}
// ): Promise<T> {
//   const token =
//     typeof window !== "undefined" ? localStorage.getItem("token") : null;

//   const headers = new Headers(init.headers);
//   // Only set Content-Type if body exists and isn't FormData
//   if (
//     !headers.has("Content-Type") &&
//     init.body &&
//     !(init.body instanceof FormData)
//   ) {
//     headers.set("Content-Type", "application/json");
//   }
//   if (token && !headers.has("Authorization")) {
//     headers.set("Authorization", `Bearer ${token}`);
//   }

//   const res = await fetch(`${API_URL}${path}`, {
//     ...init,
//     headers,
//     credentials: init.credentials ?? "include",
//   });

//   if (!res.ok) {
//     const text = await res.text().catch(() => "");
//     try {
//       const j = text ? JSON.parse(text) : null;
//       const msg = j?.error || j?.message || text || res.statusText;
//       throw new Error(msg);
//     } catch {
//       throw new Error(text || res.statusText);
//     }
//   }

//   const raw = await res.text().catch(() => "");
//   if (!raw) return {} as T;

//   try {
//     return JSON.parse(raw) as T;
//   } catch {
//     return raw as unknown as T;
//   }
// }

// /**
//  * Multipart/form-data helper (for file uploads).
//  * Do NOT set Content-Type; browser sets boundary.
//  */
// export async function apiForm<T = any>(
//   path: string,
//   form: FormData,
//   init: RequestInit = {}
// ): Promise<T> {
//   const token =
//     typeof window !== "undefined" ? localStorage.getItem("token") : null;

//   const headers = new Headers(init.headers);
//   if (token && !headers.has("Authorization")) {
//     headers.set("Authorization", `Bearer ${token}`);
//   }

//   return api<T>(path, {
//     ...init,
//     method: init.method ?? "POST",
//     body: form,
//     headers,
//   });
// }
