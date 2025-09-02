import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("[AUTH] JWT_SECRET is missing. Set it in server/.env");
  throw new Error("JWT_SECRET not set");
}

export function signToken(userId: string) {
  // keep 'sub' as the canonical claim
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "3d" });
}

export async function hashPassword(plain: string) {
  return await bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string) {
  return await bcrypt.compare(plain, hash);
}

// Primary middleware
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return res.status(401).json({ error: "Missing token" });

    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };

    // Provide BOTH shapes for compatibility with existing routes:
    (req as any).userId = payload.sub; // some routes read this
    (req as any).user = { id: payload.sub }; // others read this.user.id

    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Alias to match your imports in routes
export const authMiddleware = requireAuth;
