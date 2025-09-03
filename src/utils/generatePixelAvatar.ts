// src/utils/generatePixelAvatar.ts
// Client → OpenAI Images Edits (gpt-image-1) using your VITE_OPENAI_API_KEY.
// Fix: size must be one of "1024x1024" | "1024x1536" | "1536x1024" | "auto".
// We downscale first to avoid 413 Payload Too Large.

const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY?.trim();
const OPENAI_ORG = import.meta.env.VITE_OPENAI_ORG_ID?.trim();

function ensureKey() {
  if (!OPENAI_KEY) {
    throw new Error("Missing VITE_OPENAI_API_KEY in client .env");
  }
}

// Downscale + JPEG-compress to keep payload small
async function downscaleDataUrl(
  dataUrl: string,
  maxSide: number,
  quality = 0.9
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, w, h);
      // JPEG reduces payload size a lot vs PNG for photos
      const out = canvas.toDataURL("image/jpeg", quality);
      resolve(out);
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(",");
  const mimeMatch = /data:(.*?);base64/.exec(meta || "");
  const mime = mimeMatch?.[1] || "image/jpeg";
  const bin = atob(b64 || "");
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

type OpenAISize = "1024x1024" | "1024x1536" | "1536x1024" | "auto";

function maxSideFromSize(size: OpenAISize): number {
  if (size === "auto") return 1024; // conservative default to keep upload light
  const [w, h] = size.split("x").map((n) => parseInt(n, 10));
  return Math.max(w, h);
}

/**
 * Generate a pixel/cartoon avatar directly via OpenAI Images Edits.
 * - Uses "gpt-image-1"
 * - Sends the downscaled webcam image (multipart)
 * - Accepts OpenAI's allowed sizes only
 * - Returns a data: URL (PNG) if b64 is provided, otherwise the hosted URL
 */
export async function generatePixelAvatar(
  webcamDataUrl: string,
  {
    size = "1024x1024",
    prompt = "Transform this face photo into a playful 8-bit pixel-art avatar. Head-only, centered, simplified features, vibrant colors, clean outline. Transparent or simple background.",
  }: { size?: OpenAISize; prompt?: string } = {}
): Promise<string> {
  ensureKey();

  // 1) Downscale to match target constraints (helps avoid 413 errors)
  const maxSide = maxSideFromSize(size);
  const small = await downscaleDataUrl(webcamDataUrl, maxSide, 0.9);
  const blob = dataUrlToBlob(small);

  // 2) OpenAI Images Edits (multipart)
  const form = new FormData();
  form.append("model", "gpt-image-1");
  form.append("prompt", prompt);
  form.append("size", size);
  // No `response_format` here — the endpoint rejects that param.
  form.append("image[]", blob, "input.jpg");

  const resp = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      // DO NOT set Content-Type; the browser sets the multipart boundary.
    },
    body: form,
  });

  if (!resp.ok) {
    let message = `OpenAI error ${resp.status}`;
    try {
      const err = await resp.json();
      message =
        err?.error?.message ||
        err?.message ||
        `OpenAI error ${resp.status} ${resp.statusText}`;
    } catch {}
    throw new Error(message);
  }

  const data = await resp.json();
  // API commonly returns b64_json; some SDKs normalize to url — handle both.
  const b64 = data?.data?.[0]?.b64_json;
  const url = data?.data?.[0]?.url;

  if (b64) return `data:image/png;base64,${b64}`;
  if (url) return url;

  throw new Error("No image returned from OpenAI");
}
