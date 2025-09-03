// src/utils/generatePixelAvatar.ts
import { apiForm } from "@/lib/apiClient";

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(",");
  const mimeMatch = /data:(.*?);base64/.exec(meta);
  const mime = mimeMatch?.[1] || "image/png";
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/**
 * Try server route first (/avatar/cartoonize), then optional client OpenAI fallback,
 * then original webcam image as a last resort.
 */
export async function generatePixelAvatar(dataUrl: string): Promise<string> {
  // 1) Preferred: server route (hides OpenAI key; fewer CORS issues)
  try {
    const blob = dataUrlToBlob(dataUrl);
    const form = new FormData();
    form.append("image", blob, "webcam.png");
    form.append("style", "pixel-art");

    const res = await apiForm<{ dataUrl?: string; url?: string }>(
      "/avatar/cartoonize",
      form
    );
    if (res?.dataUrl) return res.dataUrl;
    if (res?.url) return res.url;
  } catch {
    // ignore and try client fallback
  }

  // 2) Optional client-side fallback (not recommended for production—exposes key)
  const OPENAI = import.meta.env.VITE_OPENAI_API_KEY?.trim();
  if (OPENAI) {
    try {
      const blob = dataUrlToBlob(dataUrl);
      const form = new FormData();
      form.append("model", "gpt-image-1");
      form.append("image[]", blob, "input.png");
      form.append(
        "prompt",
        "Transform this face photo into a friendly pixel-art avatar (cute, vibrant, simplified features, square). Keep hair and general look recognizable."
      );
      form.append("size", "512x512");
      form.append("response_format", "b64_json");

      const resp = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: { Authorization: `Bearer ${OPENAI}` },
        body: form,
      });

      if (resp.ok) {
        const data: any = await resp.json();
        const b64 = data?.data?.[0]?.b64_json;
        if (b64) return `data:image/png;base64,${b64}`;
      }
    } catch {
      // ignore and fall back to raw
    }
  }

  // 3) Final fallback: raw image so the UX never blocks
  return dataUrl;
}
