import { Router } from "express";
import { prisma } from "../prisma";
import { authMiddleware } from "../auth";

const r = Router();

r.get("/messages", authMiddleware, async (req, res) => {
  const me = (req as any).user;
  const matchId = String(req.query.matchId || "");
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match || (match.userAId !== me.id && match.userBId !== me.id)) {
    return res.status(404).json({ error: "Not found" });
  }
  const opponentId = match.userAId === me.id ? match.userBId : match.userAId;
  const opponent = await prisma.user.findUnique({ where: { id: opponentId } });

  const messages = await prisma.message.findMany({
    where: { matchId },
    orderBy: { createdAt: "asc" },
  });

  res.json({
    opponent: {
      id: opponent?.id,
      name: opponent?.name ?? opponent?.username,
      avatarUrl: opponent?.avatarUrl,
      figurineUrl: opponent?.figurineUrl,
    },
    messages,
  });
});

r.post("/messages", authMiddleware, async (req, res) => {
  const me = (req as any).user;
  const { matchId, toId, body } = req.body || {};
  if (!matchId || !toId || !body)
    return res.status(400).json({ error: "Missing fields" });

  // TODO: Validate user belongs to match
  const msg = await prisma.message.create({
    data: { matchId, fromId: me.id, toId, body },
  });

  res.json({ message: msg });
});

export default r;
