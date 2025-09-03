// server/src/realtime/matchmaking.ts
import type { Server } from "socket.io";
import { prisma } from "../prisma";
import { generateQuestions } from "../services/ai";

type QueueEntry = {
  userId: string;
  socketId: string;
  hobbyFilters?: string[]; // names; undefined/empty => no filter
};

const queue: Map<string, QueueEntry> = new Map();

export function enqueue(
  userId: string,
  socketId: string,
  hobbyFilters?: string[]
) {
  const filters =
    Array.isArray(hobbyFilters) && hobbyFilters.length > 0
      ? hobbyFilters
      : undefined;
  queue.set(userId, { userId, socketId, hobbyFilters: filters });
}

export function dequeue(userId: string) {
  queue.delete(userId);
}

function compatible(a: QueueEntry, b: QueueEntry) {
  if (a.userId === b.userId) return false;
  if (!a.hobbyFilters || a.hobbyFilters.length === 0) return true;
  if (!b.hobbyFilters || b.hobbyFilters.length === 0) return true;
  const setB = new Set(b.hobbyFilters.map((h) => h.toLowerCase()));
  return a.hobbyFilters.some((h) => setB.has(h.toLowerCase()));
}

async function hobbyNames(userId: string): Promise<string[]> {
  const rows = await prisma.userHobby.findMany({
    where: { userId },
    include: { hobby: true },
  });
  return rows.map((r) => r.hobby.name);
}

export async function tryMatch(io: Server) {
  if (queue.size < 2) return;

  const entries = Array.from(queue.values());
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i];
      const b = entries[j];
      if (!compatible(a, b)) continue;

      // Remove both from queue
      dequeue(a.userId);
      dequeue(b.userId);

      const [userA, userB] = await Promise.all([
        prisma.user.findUnique({ where: { id: a.userId } }),
        prisma.user.findUnique({ where: { id: b.userId } }),
      ]);

      // Generate questions (always array<string>)
      const questions = await generateQuestions(userA ?? {}, userB ?? {}, 10);

      const session = await prisma.matchSession.create({
        data: {
          userAId: a.userId,
          userBId: b.userId,
          status: "pending", // wait until both press Start
          questions,
        },
      });

      const [aHobbies, bHobbies] = await Promise.all([
        hobbyNames(a.userId),
        hobbyNames(b.userId),
      ]);

      // Send opponent cards
      io.to(a.socketId).emit("queue:matched", {
        sessionId: session.id,
        opponent: {
          id: b.userId,
          name: userB?.name || userB?.username || "Opponent",
          avatarUrl: userB?.avatarUrl ?? undefined,
          figurineUrl: userB?.figurineUrl ?? undefined,
          hobbies: bHobbies,
          location: userB?.location ?? undefined,
        },
      });
      io.to(b.socketId).emit("queue:matched", {
        sessionId: session.id,
        opponent: {
          id: a.userId,
          name: userA?.name || userA?.username || "Opponent",
          avatarUrl: userA?.avatarUrl ?? undefined,
          figurineUrl: userA?.figurineUrl ?? undefined,
          hobbies: aHobbies,
          location: userA?.location ?? undefined,
        },
      });

      return; // only match one pair per tick
    }
  }
}
