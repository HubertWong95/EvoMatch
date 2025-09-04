// server/src/routes/users.ts
import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";

const JWT_SECRET = process.env.JWT_SECRET || "replace-me";

interface AuthedRequest extends Request {
  userId?: string;
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const hdr = req.headers.authorization || "";
  const m = hdr.match(/^Bearer\s+(.+)$/i);
  if (!m) return res.status(401).json({ error: "Unauthorized" });
  const token = m[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const uid = payload?.sub || payload?.id || payload?.userId;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });
    req.userId = String(uid);
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

const r = Router();

/** GET /api/me */
r.get("/me", requireAuth, async (req: AuthedRequest, res: Response) => {
  const id = req.userId!;
  const u = await prisma.user.findUnique({ where: { id } });
  if (!u) return res.status(404).json({ error: "Not found" });
  res.json({
    id: u.id,
    username: u.username,
    name: u.name,
    age: (u as any).age ?? undefined,
    bio: (u as any).bio ?? undefined,
    location: (u as any).location ?? undefined,
    hobbies: (u as any).hobbies ?? [],
    avatarUrl: (u as any).avatarUrl ?? (u as any).photoUrl ?? null,
    figurineUrl: (u as any).figurineUrl ?? (u as any).pixelUrl ?? null,
  });
});

/** PATCH /api/me */
r.patch("/me", requireAuth, async (req: AuthedRequest, res: Response) => {
  const id = req.userId!;
  const { name, bio, location, hobbies, avatarUrl, figurineUrl } =
    req.body ?? {};
  const data: any = {};
  if (typeof name === "string") data.name = name;
  if (typeof bio === "string") data.bio = bio;
  if (typeof location === "string") data.location = location;
  if (Array.isArray(hobbies)) data.hobbies = hobbies;
  if (typeof avatarUrl === "string") data.avatarUrl = avatarUrl;
  if (typeof figurineUrl === "string") data.figurineUrl = figurineUrl;

  const u = await prisma.user.update({ where: { id }, data });

  res.json({
    id: u.id,
    username: u.username,
    name: u.name,
    age: (u as any).age ?? undefined,
    bio: (u as any).bio ?? undefined,
    location: (u as any).location ?? undefined,
    hobbies: (u as any).hobbies ?? [],
    avatarUrl: (u as any).avatarUrl ?? (u as any).photoUrl ?? null,
    figurineUrl: (u as any).figurineUrl ?? (u as any).pixelUrl ?? null,
  });
});

export default r;
