// server/src/config.ts
export const PORT = Number(process.env.PORT || 8080);

// Allow multiple CORS origins via env like: "http://localhost:5173,http://localhost:5174"
export const CORS_ORIGINS: string[] = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// IMPORTANT: Server-side env var should be OPENAI_API_KEY (no VITE_ prefix)
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
