import { Server } from "socket.io";
import { prisma } from "../prisma";
import { generateQuestions } from "../services/ai";

type QueueEntry = { userId: string; socketId: string };
const queue: QueueEntry[] = [];

export function enqueue(userId: string, socketId: string) {
  if (!queue.find((q) => q.userId === userId)) queue.push({ userId, socketId });
}

export function dequeue(userId: string) {
  const idx = queue.findIndex((q) => q.userId === userId);
  if (idx >= 0) queue.splice(idx, 1);
}

export async function tryMatch(io: Server) {
  if (queue.length < 2) return;

  const a = queue.shift()!;
  const b = queue.shift()!;
  if (!a || !b) return;

  const [userA, userB] = await Promise.all([
    prisma.user.findUnique({ where: { id: a.userId } }),
    prisma.user.findUnique({ where: { id: b.userId } }),
  ]);

  const questions = await generateQuestions(userA ?? {}, userB ?? {}, 10);

  const session = await prisma.matchSession.create({
    data: {
      userAId: a.userId,
      userBId: b.userId,
      status: "active",
      questions,
    },
  });

  // Notify both users
  io.to(a.socketId).emit("match:found", {
    opponentId: b.userId,
    sessionId: session.id,
  });
  io.to(b.socketId).emit("match:found", {
    opponentId: a.userId,
    sessionId: session.id,
  });

  // Send first question
  io.to(a.socketId).emit("session:question", {
    sessionId: session.id,
    index: 0,
    question: questions[0],
  });
  io.to(b.socketId).emit("session:question", {
    sessionId: session.id,
    index: 0,
    question: questions[0],
  });
}
