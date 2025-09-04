// server/src/routes/upload.ts
// Avatar upload route using multer + sharp + Prisma

import express from "express";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import { prisma } from "../prisma"; // prisma client (server/src/prisma.ts)
import { requireAuth } from "../auth"; // must populate req.user.id (server/src/auth.ts)

type AuthedReq = express.Request & { user?: { id: string } };

const router = express.Router();

// In-memory storage; we write the resized image ourselves
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image uploads are allowed"));
    }
    cb(null, true);
  },
});

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

// POST /api/upload/avatar?max=512&persist=1
// Accepts field "avatar" (preferred) or "file"
router.post(
  "/avatar",
  requireAuth,
  upload.single("avatar"),
  async (req: AuthedReq, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      // also accept "file" field name
      const incoming =
        (req as any).file ||
        ((req as any).files && (req as any).files.file) ||
        null;

      const file: Express.Multer.File | null = incoming ?? null;
      if (!file) return res.status(400).json({ error: "No file uploaded" });

      const max = Math.max(
        1,
        Math.min(parseInt(String(req.query.max ?? "512"), 10) || 512, 4096)
      );
      const persist = String(req.query.persist ?? "1") !== "0";

      const UPLOAD_ROOT =
        process.env.UPLOAD_DIR || path.resolve(process.cwd(), "uploads");
      const userDir = path.join(UPLOAD_ROOT, "avatars", userId);
      await ensureDir(userDir);

      const filename = `avatar-${Date.now()}.png`;
      const absPath = path.join(userDir, filename);

      await sharp(file.buffer)
        .rotate()
        .resize({
          width: max,
          height: max,
          fit: "inside",
          withoutEnlargement: true,
        })
        .png({ quality: 90, compressionLevel: 9 })
        .toFile(absPath);

      const url = `/uploads/avatars/${userId}/${filename}`; // served statically

      if (persist) {
        await prisma.user.update({
          where: { id: userId },
          data: { avatarUrl: url },
        });
      }

      return res.status(201).json({ url });
    } catch (err: any) {
      console.error("[upload/avatar] error:", err);
      return res.status(500).json({ error: "Upload failed" });
    }
  }
);

export default router;
