import { Router } from "express";
import { prisma } from "../prisma";
import { authMiddleware } from "../auth";

const r = Router();

r.get("/me", authMiddleware, async (req, res) => {
  const user = (req as any).user;
  const me = await prisma.user.findUnique({
    where: { id: user.id },
    include: { hobbies: { include: { hobby: true } } },
  });
  res.json({
    user: {
      ...me,
      hobbies: me?.hobbies.map((uh) => uh.hobby.name) ?? [],
    },
  });
});

r.patch("/me", authMiddleware, async (req, res) => {
  const user = (req as any).user;
  const { name, bio, age, location, avatarUrl, figurineUrl, hobbies } =
    req.body || {};
  const updated = await prisma.user.update({
    where: { id: user.id },
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
    await prisma.userHobby.deleteMany({ where: { userId: user.id } });
    await prisma.userHobby.createMany({
      data: hobbyRecords.map((h) => ({ userId: user.id, hobbyId: h.id })),
    });
  }

  res.json({ user: updated });
});

r.get("/hobbies", async (_req, res) => {
  const list = await prisma.hobby.findMany({ orderBy: { name: "asc" } });
  res.json({ hobbies: list.map((h) => h.name) });
});

export default r;
