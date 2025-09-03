import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";
import { enqueue, dequeue, tryMatch } from "./matchmaking";

const JWT_SECRET = process.env.JWT_SECRET || "replace-me";

type ReadyState = {
  aUserId: string;
  bUserId: string;
  aSocketId?: string;
  bSocketId?: string;
  readyA: boolean;
  readyB: boolean;
};
const sessionReady: Map<string, ReadyState> = new Map();

function coerceToString(q: any): string | undefined {
  if (typeof q === "string") return q.trim();
  if (typeof q?.text === "string") return q.text.trim();
  if (typeof q?.question === "string") return q.question.trim();
  if (typeof q === "string" && q.trim().startsWith("{")) {
    try {
      const obj = JSON.parse(q);
      if (typeof obj?.text === "string") return obj.text.trim();
      if (typeof obj?.question === "string") return obj.question.trim();
    } catch {}
  }
  return undefined;
}

export function initSocket(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: (process.env.CORS_ORIGIN ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      credentials: true,
    },
    transports: ["websocket"],
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || "";
    try {
      const p = jwt.verify(token, JWT_SECRET) as {
        sub?: string;
        id?: string;
        userId?: string;
      };
      const userId = p.sub || p.id || p.userId;
      if (!userId) return next(new Error("Unauthorized"));
      (socket as any).userId = userId;
      next();
    } catch (e) {
      console.error("[socket] auth error", e);
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId: string = (socket as any).userId;
    socket.join(userId);

    // ---------- Queueing / Matchmaking ----------
    socket.on("queue:join", async (payload?: { hobbyFilters?: string[] }) => {
      try {
        const hobbyFilters =
          Array.isArray(payload?.hobbyFilters) && payload!.hobbyFilters.length
            ? payload!.hobbyFilters
            : undefined;
        enqueue(userId, socket.id, hobbyFilters);
        await tryMatch(io);
      } catch (e) {
        console.error("[queue:join] error", e);
        socket.emit("queue:error", "Failed to join queue");
      }
    });

    socket.on("queue:leave", () => {
      try {
        dequeue(userId);
        for (const [sid, st] of sessionReady) {
          if (st.aUserId === userId || st.bUserId === userId) {
            endSession(io, sid, "opponent_left").catch((err) =>
              console.error("[queue:leave endSession]", err)
            );
          }
        }
      } catch (e) {
        console.error("[queue:leave] error", e);
      }
    });

    // ---------- Session lifecycle ----------
    socket.on("session:ready", async ({ sessionId }: { sessionId: string }) => {
      try {
        const session = await prisma.matchSession.findUnique({
          where: { id: sessionId },
        });
        if (!session) return;

        let st = sessionReady.get(sessionId);
        if (!st) {
          st = {
            aUserId: session.userAId,
            bUserId: session.userBId,
            readyA: false,
            readyB: false,
          };
          sessionReady.set(sessionId, st);
        }
        if (userId === st.aUserId) {
          st.readyA = true;
          st.aSocketId = socket.id;
        } else if (userId === st.bUserId) {
          st.readyB = true;
          st.bSocketId = socket.id;
        }

        if (st.readyA && st.readyB) {
          io.to(st.aUserId).emit("session:started", { sessionId });
          io.to(st.bUserId).emit("session:started", { sessionId });

          const qs = (session.questions as any[]) || [];
          const firstQ = coerceToString(qs[0]) ?? "Pick one thing you love!";
          const payload = {
            sessionId,
            index: 0,
            text: firstQ,
            total: qs.length || 10,
          };
          io.to(st.aUserId).emit("session:question", payload);
          io.to(st.bUserId).emit("session:question", payload);
        }
      } catch (e) {
        console.error("[session:ready] error", e);
        socket.emit("queue:error", "Failed to start session");
      }
    });

    socket.on(
      "session:answer",
      async ({
        sessionId,
        index,
        answer,
        scoreDelta,
      }: {
        sessionId: string;
        index: number;
        answer: string;
        scoreDelta?: number;
      }) => {
        try {
          const session = await prisma.matchSession.findUnique({
            where: { id: sessionId },
          });
          if (!session) return;

          const aUserId = session.userAId;
          const bUserId = session.userBId;

          const field = userId === aUserId ? "scoreA" : "scoreB";
          const updated = await prisma.matchSession.update({
            where: { id: sessionId },
            data: {
              [field]: (session as any)[field] + (scoreDelta ?? 1),
            } as any,
          });

          io.to(aUserId).emit("session:score", {
            scoreA: updated.scoreA,
            scoreB: updated.scoreB,
          });
          io.to(bUserId).emit("session:score", {
            scoreA: updated.scoreA,
            scoreB: updated.scoreB,
          });

          const qs = (session.questions as any[]) || [];
          const nextIndex = (index ?? 0) + 1;
          const total = qs.length || 10;

          const completed =
            nextIndex >= total || (updated.scoreA >= 6 && updated.scoreB >= 6);

          if (completed) {
            const pass = Math.min(updated.scoreA, updated.scoreB) >= 6;

            if (pass) {
              await prisma.match.upsert({
                where: {
                  userAId_userBId: {
                    userAId: session.userAId,
                    userBId: session.userBId,
                  },
                },
                update: { score: Math.min(updated.scoreA, updated.scoreB) },
                create: {
                  userAId: session.userAId,
                  userBId: session.userBId,
                  score: Math.min(updated.scoreA, updated.scoreB),
                },
              });
            }

            await prisma.matchSession.update({
              where: { id: sessionId },
              data: { status: "completed", completedAt: new Date() },
            });

            const completePayload = {
              pass,
              finalScore: Math.min(updated.scoreA, updated.scoreB),
            };
            io.to(aUserId).emit("session:complete", {
              sessionId,
              ...completePayload,
            });
            io.to(bUserId).emit("session:complete", {
              sessionId,
              ...completePayload,
            });
            sessionReady.delete(sessionId);
          } else {
            const nextQ =
              coerceToString(qs[nextIndex]) ?? "Pick one thing you love!";
            const qPayload = {
              sessionId,
              index: nextIndex,
              text: nextQ,
              total,
            };
            io.to(aUserId).emit("session:question", qPayload);
            io.to(bUserId).emit("session:question", qPayload);
          }
        } catch (e) {
          console.error("[session:answer] error", e);
          socket.emit("queue:error", "Error while processing answer");
        }
      }
    );

    socket.on("session:leave", ({ sessionId }: { sessionId: string }) => {
      endSession(io, sessionId, "opponent_left").catch((err) =>
        console.error("[session:leave endSession]", err)
      );
    });

    // ---------- CHAT (dedupe-friendly via clientNonce) ----------
    const handleSend = async (p: {
      matchId: string;
      toUserId: string;
      text: string;
      clientNonce?: string; // <<— NEW
    }) => {
      try {
        const { matchId, toUserId, text, clientNonce } = p || {};
        if (!matchId || !toUserId || !text?.trim()) return;

        const match = await prisma.match.findUnique({ where: { id: matchId } });
        if (!match) return;

        const belongs =
          (match.userAId === userId && match.userBId === toUserId) ||
          (match.userBId === userId && match.userAId === toUserId);
        if (!belongs) return;

        const msg = await prisma.message.create({
          data: {
            matchId,
            fromId: userId,
            toId: toUserId,
            body: text.trim(),
          },
        });

        const shaped = {
          id: msg.id,
          matchId,
          fromId: msg.fromId,
          toId: msg.toId,
          text: msg.body,
          body: msg.body,
          createdAt: msg.createdAt.toISOString(),
          clientNonce: clientNonce || undefined, // <<— echo back for optimistic replace
        };

        // Emit to both participants
        io.to(userId).emit("chat:message", shaped);
        io.to(toUserId).emit("chat:message", shaped);

        // Also emit generic event (some clients listen to this)
        io.to(userId).emit("message:new", { matchId, message: shaped });
        io.to(toUserId).emit("message:new", { matchId, message: shaped });
      } catch (e) {
        console.error("[chat:send] error", e);
        socket.emit("chat:error", "Failed to send message");
      }
    };

    socket.on("chat:send", handleSend);
    socket.on("message:send", (p) =>
      handleSend({
        matchId: p?.matchId,
        toUserId: p?.toId ?? p?.toUserId,
        text: p?.text ?? p?.body,
        clientNonce: p?.clientNonce,
      })
    );

    socket.on("disconnect", () => {
      try {
        dequeue(userId);
        for (const [sid, st] of sessionReady) {
          if (st.aUserId === userId || st.bUserId === userId) {
            endSession(io, sid, "opponent_left").catch((err) =>
              console.error("[disconnect endSession]", err)
            );
          }
        }
      } catch (e) {
        console.error("[disconnect] error", e);
      }
    });
  });
}

async function endSession(
  io: Server,
  sessionId: string,
  reason: "opponent_left" | "cancelled"
) {
  try {
    const st = sessionReady.get(sessionId);
    sessionReady.delete(sessionId);

    const session = await prisma.matchSession.findUnique({
      where: { id: sessionId },
    });

    if (session && session.status !== "completed") {
      await prisma.matchSession.update({
        where: { id: sessionId },
        data: { status: "cancelled", completedAt: new Date() },
      });
    }

    const payload = { reason, sessionId };
    if (st?.aUserId) io.to(st.aUserId).emit("session:ended", payload);
    if (st?.bUserId) io.to(st.bUserId).emit("session:ended", payload);
    if (st?.aSocketId) io.to(st.aSocketId).emit("session:ended", payload);
    if (st?.bSocketId) io.to(st.bSocketId).emit("session:ended", payload);
  } catch (e) {
    console.error("[endSession] error", e);
  }
}
