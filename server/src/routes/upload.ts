// server/src/routes/upload.ts
import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";

const upload = multer({ storage: multer.memoryStorage() });
const r = Router();

const JWT_SECRET = process.env.JWT_SECRET || "replace-me";

// ensure uploads dir exists
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Extract userId from Bearer token (optional)
function getUserIdFromAuth(hdr?: string): string | undefined {
  if (!hdr) return;
  const m = hdr.match(/^Bearer\s+(.+)$/i);
  if (!m) return;
  const token = m[1];
  try {
    const p: any = jwt.verify(token, JWT_SECRET);
    return p?.sub || p?.id || p?.userId;
  } catch {
    return;
  }
}

/**
 * POST /api/upload/avatar
 * Form field: "avatar" (image)
 * Query:
 *   persist=1  -> also save avatarUrl on the user
 *   max=512    -> max width/height
 */
r.post("/upload/avatar", upload.single("avatar"), async (req, res) => {
  try {
    const file = req.file;
    if (!file?.buffer) return res.status(400).json({ error: "missing file" });

    const max = Number(req.query.max || 512);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
    const outPath = path.join(UPLOAD_DIR, id);

    await sharp(file.buffer)
      .rotate()
      .resize({ width: max, height: max, fit: "inside" })
      .png({ quality: 90 })
      .toFile(outPath);

    const publicUrl = `/uploads/${id}`;

    // Optionally persist on user
    const persist = String(req.query.persist || req.query.save || "0") === "1";
    if (persist) {
      const uid = getUserIdFromAuth(req.headers.authorization);
      if (uid) {
        try {
          await prisma.user.update({
            where: { id: String(uid) },
            data: { avatarUrl: publicUrl },
          });
        } catch (e) {
          console.warn("[upload/avatar] failed to persist avatarUrl", e);
        }
      }
    }

    return res.json({ url: publicUrl });
  } catch (e) {
    console.error("[upload/avatar]", e);
    return res.status(500).json({ error: "upload failed" });
  }
});

export default r;
