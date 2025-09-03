// server/src/routes/messages.ts
import { Router } from "express";
import { prisma } from "../prisma";
import { authMiddleware } from "../auth";

const r = Router();

// GET /api/messages?matchId=...
r.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const matchId = String(req.query.matchId || "");

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) return res.status(404).json({ error: "match not found" });

    // ensure the requester is part of this match
    if (match.userAId !== userId && match.userBId !== userId) {
      return res.status(403).json({ error: "forbidden" });
    }

    const opponentId = match.userAId === userId ? match.userBId : match.userAId;
    const opponent = await prisma.user.findUnique({
      where: { id: opponentId },
      select: {
        id: true,
        username: true,
        name: true,
        avatarUrl: true,
        figurineUrl: true,
      },
    });

    const rows = await prisma.message.findMany({
      where: { matchId },
      orderBy: { createdAt: "asc" },
    });

    const messages = rows.map((m) => ({
      id: m.id,
      fromId: m.fromId,
      toId: m.toId,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
    }));

    res.json({
      opponent: {
        id: opponent?.id || opponentId,
        name: opponent?.name || opponent?.username || "Friend",
        avatarUrl: opponent?.avatarUrl || undefined,
        figurineUrl: opponent?.figurineUrl || undefined,
      },
      messages,
    });
  } catch (e) {
    console.error("[GET /api/messages] error", e);
    res.status(500).json({ error: "failed" });
  }
});

// (optional) POST /api/messages  — send via REST too
r.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const { matchId, toUserId, body } = req.body || {};
    if (!matchId || !toUserId || !body?.trim()) {
      return res.status(400).json({ error: "missing fields" });
    }

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) return res.status(404).json({ error: "match not found" });

    const belongs =
      (match.userAId === userId && match.userBId === toUserId) ||
      (match.userBId === userId && match.userAId === toUserId);
    if (!belongs) return res.status(403).json({ error: "forbidden" });

    const msg = await prisma.message.create({
      data: { matchId, fromId: userId, toId: toUserId, body: body.trim() },
    });

    res.json({
      id: msg.id,
      fromId: msg.fromId,
      toId: msg.toId,
      body: msg.body,
      createdAt: msg.createdAt.toISOString(),
    });
  } catch (e) {
    console.error("[POST /api/messages] error", e);
    res.status(500).json({ error: "failed" });
  }
});

// GET /api/messages/threads  — list conversations for the user
r.get("/threads", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const matches = await prisma.match.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      orderBy: { updatedAt: "desc" },
    });

    const threads = await Promise.all(
      matches.map(async (m) => {
        const otherId = m.userAId === userId ? m.userBId : m.userAId;
        const other = await prisma.user.findUnique({
          where: { id: otherId },
          select: { name: true, username: true },
        });
        const last = await prisma.message.findFirst({
          where: { matchId: m.id },
          orderBy: { createdAt: "desc" },
        });
        return {
          id: m.id,
          opponentName: other?.name || other?.username || "Friend",
          preview: last?.body || "",
          updatedAt: (last?.createdAt || m.updatedAt).toISOString(),
        };
      })
    );

    res.json({ threads });
  } catch (e) {
    console.error("[GET /api/messages/threads] error", e);
    res.status(500).json({ error: "failed" });
  }
});

export default r;
