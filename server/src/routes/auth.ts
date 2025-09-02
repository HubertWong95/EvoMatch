// server/src/routes/auth.ts
import { Router } from "express";
import { prisma } from "../prisma";
import { signToken, hashPassword, verifyPassword } from "../auth";

const r = Router();

r.post("/register", async (req, res) => {
  const { username, password, name } = req.body ?? {};
  if (!username || !password)
    return res.status(400).json({ error: "Missing fields" });
  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return res.status(409).json({ error: "Username taken" });

  const user = await prisma.user.create({
    data: { username, name, passwordHash: await hashPassword(password) },
  });
  const token = signToken(user.id);
  res.json({
    token,
    user: { id: user.id, username: user.username, name: user.name },
  });
});

r.post("/login", async (req, res) => {
  const { username, password } = req.body ?? {};
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = signToken(user.id);
  res.json({
    token,
    user: { id: user.id, username: user.username, name: user.name },
  });
});

export default r;
