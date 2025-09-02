// src/routes/users.ts
import { Router } from "express";
import { prisma } from "../prisma";
import { authMiddleware } from "../auth";

const r = Router();

r.get("/me", authMiddleware, async (req, res) => {
  const userId = (req as any).userId as string;

  const me = await prisma.user.findUnique({
    where: { id: userId },
    include: { hobbies: { include: { hobby: true } } },
  });

  if (!me) return res.status(404).json({ error: "User not found" });

  res.json({
    user: {
      ...me,
      hobbies: me.hobbies.map((uh) => uh.hobby.name),
    },
  });
});

r.patch("/me", authMiddleware, async (req, res) => {
  const userId = (req as any).userId as string;
  const { name, bio, age, location, avatarUrl, figurineUrl, hobbies } =
    req.body || {};

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { name, bio, age, location, avatarUrl, figurineUrl },
  });

  if (Array.isArray(hobbies)) {
    // upsert hobby names
    const hobbyRecords = await Promise.all(
      hobbies.map(async (name: string) =>
        prisma.hobby.upsert({ where: { name }, update: {}, create: { name } })
      )
    );
    // reset junctions
    await prisma.userHobby.deleteMany({ where: { userId } });
    await prisma.userHobby.createMany({
      data: hobbyRecords.map((h) => ({ userId, hobbyId: h.id })),
    });
  }

  res.json({ user: updated });
});

r.get("/hobbies", async (_req, res) => {
  const list = await prisma.hobby.findMany({ orderBy: { name: "asc" } });
  res.json({ hobbies: list.map((h) => h.name) });
});

export default r;
