import { Router } from "express";
import { prisma } from "../prisma";
import { signToken, verifyPassword, hashPassword } from "../auth";

const r = Router();

// seed or register
r.post("/register", async (req, res) => {
  const { username, password, name } = req.body || {};
  if (!username || !password)
    return res.status(400).json({ error: "Missing fields" });
  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return res.status(409).json({ error: "Username already exists" });
  const user = await prisma.user.create({
    data: { username, name, passwordHash: await hashPassword(password) },
  });
  const token = signToken(user.id);
  res.json({ token, user: sanitize(user) });
});

r.post("/login", async (req, res) => {
  const { username, password } = req.body || {};
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  const token = signToken(user.id);
  res.json({ token, user: sanitize(user) });
});

// helper to remove sensitive fields
function sanitize(user: any) {
  const { passwordHash, ...safe } = user;
  return safe;
}

export default r;
