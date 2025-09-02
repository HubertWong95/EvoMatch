import { Router } from "express";
import { prisma } from "../prisma";
import { authMiddleware } from "../auth";

const r = Router();

r.get("/matches", authMiddleware, async (req, res) => {
  const me = (req as any).user;
  const matches = await prisma.match.findMany({
    where: { OR: [{ userAId: me.id }, { userBId: me.id }] },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const rows = await Promise.all(
    matches.map(async (m) => {
      const oppId = m.userAId === me.id ? m.userBId : m.userAId;
      const opp = await prisma.user.findUnique({ where: { id: oppId } });
      const last = await prisma.message.findFirst({
        where: { matchId: m.id },
        orderBy: { createdAt: "desc" },
      });
      return {
        id: m.id,
        opponent: {
          id: opp?.id,
          name: opp?.name ?? opp?.username,
          avatarUrl: opp?.avatarUrl,
          figurineUrl: opp?.figurineUrl,
        },
        score: m.score,
        lastMessage: last
          ? { body: last.body, createdAt: last.createdAt }
          : undefined,
      };
    })
  );

  res.json({ matches: rows });
});

export default r;
