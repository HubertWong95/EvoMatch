// server/src/routes/upload.ts
import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";

const upload = multer({ storage: multer.memoryStorage() });
const r = Router();

// ensure uploads dir exists
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/**
 * POST /api/upload/avatar
 * body: form-data file "avatar"
 * query: ?style=cartoon | raw
 */
r.post("/avatar", upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "missing file" });

    const style = (req.query.style as string) || "cartoon";
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
    const outPath = path.join(UPLOAD_DIR, id);

    const input = sharp(req.file.buffer).rotate(); // auto-orient

    let img = input.resize(512, 512, { fit: "cover" });

    if (style === "cartoon") {
      // A simple “cartoon-ish” pipeline:
      // - slight blur to smooth noise
      // - posterize-ish by reducing colors via median + gamma/contrast
      // - saturation boost
      img = img
        .median(3)
        .modulate({ saturation: 1.4 })
        .gamma(0.95) // gentle contrast curve
        .png({ quality: 90 });
    } else {
      img = img.png({ quality: 90 });
    }

    await img.toFile(outPath);

    // URL the client can use directly
    const publicUrl = `/uploads/${id}`;
    return res.json({ url: publicUrl });
  } catch (e) {
    console.error("[upload/avatar]", e);
    return res.status(500).json({ error: "upload failed" });
  }
});

export default r;
