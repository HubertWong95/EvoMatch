import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { getUserFromToken } from "../auth";
import { queueJoin, queueLeave, submitAnswer } from "./matchmaking";

export function initSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, { cors: { origin: "*" } });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    const user = await getUserFromToken(token);
    if (!user) return next(new Error("Unauthorized"));
    socket.data.userId = user.id;
    next();
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;

    socket.on("queue:join", async (payload: { hobbyFilters?: string[] }) => {
      await queueJoin(userId, socket, io, payload?.hobbyFilters ?? []);
    });

    socket.on("queue:leave", async () => {
      await queueLeave(userId, socket.id);
    });

    socket.on(
      "session:answer",
      async (p: { sessionId: string; questionIndex: number; text: string }) => {
        await submitAnswer(io, { ...p, userId });
      }
    );

    socket.on(
      "message:send",
      async (p: { matchId: string; toId: string; body: string }) => {
        // You can persist via REST route or here; if here, call prisma.message.create then emit:
        io.to(socket.id).emit("message:new", {
          matchId: p.matchId,
          message: {
            id: Date.now().toString(),
            fromId: userId,
            toId: p.toId,
            body: p.body,
            createdAt: new Date().toISOString(),
          },
        });
      }
    );

    socket.on("disconnect", () => {
      queueLeave(userId, socket.id).catch(() => {});
    });
  });

  return io;
}
