// server/src/routes/debug.ts
import express from "express";
import type { Server as SocketIOServer } from "socket.io";
import { requireAuth } from "../auth";

const router = express.Router();

// See whether your authed socket is connected & which room
router.get("/socket", requireAuth, async (req: any, res) => {
  try {
    const io = req.app.get("io") as SocketIOServer | undefined;
    if (!io) return res.status(500).json({ error: "io not available" });

    const userId = String(req.user?.id || "");
    const room = `user:${userId}`;

    // Which sockets are in your room?
    const ids = await io.in(room).allSockets();
    const socketIds = Array.from(ids);

    // List a few rooms (clipped)
    const rooms = Array.from(io.sockets.adapter.rooms.keys()).slice(0, 20);

    return res.json({
      userId,
      room,
      socketIds,
      rooms,
      hint:
        socketIds.length === 0
          ? "No authed socket is in your room. The client may be connecting as guest or token is missing."
          : "Authed socket present. If Matches still empty, server might not emit the events your client listens for.",
    });
  } catch (e: any) {
    console.error("[debug] /socket error", e);
    return res.status(500).json({ error: e?.message || "debug error" });
  }
});

// Simple echo for sanity
router.get("/echo", (req, res) => {
  res.json({
    ok: true,
    now: Date.now(),
    query: req.query,
  });
});

export default router;
