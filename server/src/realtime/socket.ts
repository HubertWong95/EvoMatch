// server/src/realtime/socket.ts
import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";
import { enqueue, dequeue, tryMatch } from "./matchmaking";
import { isSimilar } from "./similarity";

const JWT_SECRET = process.env.JWT_SECRET || "replace-me";

// Track readiness for sessions (in-memory)
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
  if (typeof q === "string") return q;
  if (typeof q?.text === "string") return q.text;
  if (typeof q?.question === "string") return q.question;
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

  // Auth gate
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

    // --- Queue Flow ---
    socket.on("queue:join", async (payload?: { hobbyFilters?: string[] }) => {
      try {
        const raw = payload?.hobbyFilters;
        const hobbyFilters =
          Array.isArray(raw) && raw.length > 0 ? raw : undefined;
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
        // If user was waiting/active in a session, end it for both sides
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

    // --- Ready-up Handshake ---
    socket.on("session:ready", async ({ sessionId }: { sessionId: string }) => {
      try {
        const session = await prisma.matchSession.findUnique({
          where: { id: sessionId },
        });
        if (!session) return;

        const existing =
          sessionReady.get(sessionId) ||
          ({
            aUserId: session.userAId,
            bUserId: session.userBId,
            readyA: false,
            readyB: false,
          } as ReadyState);

        if (userId === session.userAId) {
          existing.readyA = true;
          existing.aSocketId = socket.id;
        } else if (userId === session.userBId) {
          existing.readyB = true;
          existing.bSocketId = socket.id;
        } else {
          return;
        }
        sessionReady.set(sessionId, existing);

        // Start only when both are ready
        if (existing.readyA && existing.readyB) {
          // NOTE: do NOT write startedAt (column doesn’t exist in your schema)
          await prisma.matchSession.update({
            where: { id: sessionId },
            data: { status: "active" },
          });

          // notify both
          const startedPayload = { sessionId };
          if (existing.aSocketId)
            io.to(existing.aSocketId).emit("session:started", startedPayload);
          if (existing.bSocketId)
            io.to(existing.bSocketId).emit("session:started", startedPayload);
          io.to(existing.aUserId).emit("session:started", startedPayload);
          io.to(existing.bUserId).emit("session:started", startedPayload);

          // send first question (defensive)
          let qs = (session.questions as unknown as any[]) ?? [];
          const first = coerceToString(qs[0]) ?? "Coffee or tea?"; // fallback if AI returned nothing

          const qPayload = { sessionId, index: 0, text: first };
          if (existing.aSocketId)
            io.to(existing.aSocketId).emit("session:question", qPayload);
          if (existing.bSocketId)
            io.to(existing.bSocketId).emit("session:question", qPayload);
          io.to(existing.aUserId).emit("session:question", qPayload);
          io.to(existing.bUserId).emit("session:question", qPayload);
        }
      } catch (e) {
        console.error("[session:ready] error", e);
        socket.emit("queue:error", "Failed to start session");
      }
    });

    // --- In-session Answers ---
    socket.on(
      "session:answer",
      async (data: {
        sessionId: string;
        questionIndex?: number;
        index?: number;
        text: string;
      }) => {
        try {
          const sessionId = data.sessionId;
          const index =
            typeof data.index === "number"
              ? data.index
              : (data.questionIndex as number);
          const text = data.text;

          if (!sessionId || typeof index !== "number" || !text) return;
          const session = await prisma.matchSession.findUnique({
            where: { id: sessionId },
          });
          if (!session || session.status !== "active") return;

          await prisma.answer.create({
            data: { sessionId, userId, questionIndex: index, text },
          });

          // Wait until both answers arrive
          const answers = await prisma.answer.findMany({
            where: { sessionId, questionIndex: index },
          });
          if (answers.length < 2) return;

          const [a, b] = answers;
          const similar = isSimilar(a.text, b.text);
          const update = similar
            ? { scoreA: session.scoreA + 1, scoreB: session.scoreB + 1 }
            : { scoreA: session.scoreA - 1, scoreB: session.scoreB - 1 };

          const updated = await prisma.matchSession.update({
            where: { id: sessionId },
            data: update,
          });

          const scorePayload = {
            index,
            similar,
            scoreA: updated.scoreA,
            scoreB: updated.scoreB,
          };
          io.to(a.userId).emit("session:score", scorePayload);
          io.to(b.userId).emit("session:score", scorePayload);

          // Next question or complete
          let qs = (session.questions as unknown as any[]) ?? [];
          const nextIndex = index + 1;
          if (nextIndex >= qs.length) {
            const pass = updated.scoreA >= 5 && updated.scoreB >= 5;

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
            io.to(a.userId).emit("session:complete", completePayload);
            io.to(b.userId).emit("session:complete", completePayload);
            sessionReady.delete(sessionId);
          } else {
            const nextQ =
              coerceToString(qs[nextIndex]) ??
              "Surprise me: pick one thing you love!";
            const qPayload = { sessionId, index: nextIndex, text: nextQ };
            io.to(a.userId).emit("session:question", qPayload);
            io.to(b.userId).emit("session:question", qPayload);
          }
        } catch (e) {
          console.error("[session:answer] error", e);
          socket.emit("queue:error", "Error while processing answer");
        }
      }
    );

    // --- Early Leave / Disconnect ends the session for both ---
    socket.on("session:leave", ({ sessionId }: { sessionId: string }) => {
      endSession(io, sessionId, "opponent_left").catch((err) =>
        console.error("[session:leave endSession]", err)
      );
    });

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
