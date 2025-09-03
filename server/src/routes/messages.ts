// server/src/routes/messages.ts
import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth } from "../auth";

const r = Router();

r.get("/", requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const matchId = String(req.query.matchId || "");
  if (!matchId) return res.status(400).json({ error: "missing matchId" });

  // simple auth: ensure user is part of the match
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match || (match.userAId !== userId && match.userBId !== userId)) {
    return res.status(403).json({ error: "forbidden" });
  }

  const messages = await prisma.message.findMany({
    where: { matchId },
    orderBy: { createdAt: "asc" },
  });

  res.json({ messages });
});

export default r;
