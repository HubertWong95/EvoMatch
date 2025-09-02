import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";
import { enqueue, dequeue, tryMatch } from "./matchmaking";
import { isSimilar } from "./similarity"; // keep your existing logic
const JWT_SECRET = process.env.JWT_SECRET || "replace-me";

export function initSocket(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: (process.env.CORS_ORIGIN ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || "";
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
      (socket as any).userId = payload.sub;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId: string = (socket as any).userId;

    socket.on("queue:join", async () => {
      enqueue(userId, socket.id);
      await tryMatch(io);
    });

    socket.on("queue:leave", () => {
      dequeue(userId);
    });

    // A user submitted an answer
    socket.on(
      "session:answer",
      async (payload: { sessionId: string; index: number; text: string }) => {
        const { sessionId, index, text } = payload;
        await prisma.answer.create({
          data: { sessionId, userId, questionIndex: index, text },
        });

        // wait until both answers arrive
        const answers = await prisma.answer.findMany({
          where: { sessionId, questionIndex: index },
        });
        if (answers.length < 2) return;

        const [a, b] = answers;
        const session = await prisma.matchSession.findUnique({
          where: { id: sessionId },
        });
        if (!session) return;

        const similar = isSimilar(a.text, b.text);
        const update = similar
          ? { scoreA: session.scoreA + 1, scoreB: session.scoreB + 1 }
          : { scoreA: session.scoreA - 1, scoreB: session.scoreB - 1 };

        const updated = await prisma.matchSession.update({
          where: { id: sessionId },
          data: update,
        });

        const qs = session.questions as any[];
        const nextIndex = index + 1;

        // push score update to both users (by userId rooms)
        io.to(a.userId).emit("session:score", {
          index,
          similar,
          scoreA: updated.scoreA,
          scoreB: updated.scoreB,
        });
        io.to(b.userId).emit("session:score", {
          index,
          similar,
          scoreA: updated.scoreA,
          scoreB: updated.scoreB,
        });

        if (nextIndex >= qs.length) {
          const pass = updated.scoreA >= 5 && updated.scoreB >= 5;

          if (pass) {
            const userAId = session.userAId;
            const userBId = session.userBId;
            await prisma.match.upsert({
              where: { userAId_userBId: { userAId, userBId } },
              update: { score: Math.min(updated.scoreA, updated.scoreB) },
              create: {
                userAId,
                userBId,
                score: Math.min(updated.scoreA, updated.scoreB),
              },
            });
          }

          await prisma.matchSession.update({
            where: { id: sessionId },
            data: { status: "completed", completedAt: new Date() },
          });

          io.to(a.userId).emit("session:complete", { pass });
          io.to(b.userId).emit("session:complete", { pass });
        } else {
          // send next question
          io.to(a.userId).emit("session:question", {
            sessionId,
            index: nextIndex,
            question: qs[nextIndex],
          });
          io.to(b.userId).emit("session:question", {
            sessionId,
            index: nextIndex,
            question: qs[nextIndex],
          });
        }
      }
    );

    socket.on("disconnect", () => {
      dequeue(userId);
    });
  });

  // Join userId room on connect so we can "io.to(userId)" above
  io.on("connection", (socket) => {
    const userId: string = (socket as any).userId;
    socket.join(userId);
  });
}
