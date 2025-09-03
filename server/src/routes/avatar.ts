// server/src/routes/avatar.ts
import { Router } from "express";
import multer from "multer";
import OpenAI from "openai";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.warn(
    "[avatar] OPENAI_API_KEY missing; will return original image as-is."
  );
}
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

/**
 * POST /avatar/cartoonize
 * FormData fields:
 *  - image: file (required)
 *  - style: string (optional: "pixel-art" | "cartoon" …)
 *
 * Response:
 *  - { dataUrl: string }  (base64 PNG)
 */
router.post("/cartoonize", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    if (!file || !file.buffer) {
      return res.status(400).json({ error: "Missing image file" });
    }

    // If OpenAI key is missing, just return original
    if (!openai) {
      const b64 = file.buffer.toString("base64");
      return res.json({ dataUrl: `data:${file.mimetype};base64,${b64}` });
    }

    // Build an in-memory File for the OpenAI SDK
    const input = new File([file.buffer], "input.png", { type: file.mimetype });

    const style = (req.body?.style || "pixel-art") as string;
    const prompt =
      style === "pixel-art"
        ? "Transform this face photo into a cute, friendly pixel-art avatar with vibrant colors and simplified features. Keep hair, pose, and general look recognizable. Square composition."
        : "Transform this face photo into a friendly cartoon avatar with clean outlines and simplified features. Keep hair, pose, and general look recognizable. Square composition.";

    // Use Images Edits endpoint (gpt-image-1)
    const result = await openai.images.edits({
      model: "gpt-image-1",
      prompt,
      image: [input],
      size: "512x512",
      response_format: "b64_json",
    });

    const b64 = result.data?.[0]?.b64_json;
    if (!b64) {
      // Fall back: return the original if edit failed
      const raw = file.buffer.toString("base64");
      return res.json({ dataUrl: `data:${file.mimetype};base64,${raw}` });
    }

    return res.json({ dataUrl: `data:image/png;base64,${b64}` });
  } catch (err: any) {
    console.error("[avatar/cartoonize] error", err);
    // Fall back gracefully
    try {
      const file = req.file;
      if (file?.buffer) {
        const raw = file.buffer.toString("base64");
        return res.json({ dataUrl: `data:${file.mimetype};base64,${raw}` });
      }
    } catch {}
    return res.status(500).json({ error: "Avatar cartoonize failed" });
  }
});

export default router;
