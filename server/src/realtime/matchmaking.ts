import { Server, Socket } from "socket.io";
import { prisma } from "../prisma";
import { isAnswerSimilar } from "./similarity";

type QueuedUser = { userId: string; socketId: string; hobbies: string[] };
const queue: QueuedUser[] = [];
const sessionsAnswers = new Map<string, Map<string, Map<number, string>>>(); // sessionId -> userId -> index -> text

export async function queueJoin(
  userId: string,
  socket: Socket,
  io: Server,
  hobbies: string[]
) {
  // Try match by hobby overlap
  const idx = queue.findIndex((q) => overlap(q.hobbies, hobbies));
  if (idx >= 0) {
    const other = queue.splice(idx, 1)[0];
    const questions = genQuestions(10);
    const session = await prisma.matchSession.create({
      data: {
        userAId: other.userId,
        userBId: userId,
        status: "active",
        questions,
      },
    });

    // Init answers map
    sessionsAnswers.set(session.id, new Map());

    const [aSock, bSock] = [io.sockets.sockets.get(other.socketId), socket];
    const [userA, userB] = await Promise.all([
      prisma.user.findUnique({ where: { id: other.userId } }),
      prisma.user.findUnique({ where: { id: userId } }),
    ]);

    aSock?.emit("queue:matched", {
      sessionId: session.id,
      opponent: {
        id: userB?.id,
        name: userB?.name ?? userB?.username,
        avatarUrl: userB?.avatarUrl,
        figurineUrl: userB?.figurineUrl,
        hobbies,
      },
    });
    bSock?.emit("queue:matched", {
      sessionId: session.id,
      opponent: {
        id: userA?.id,
        name: userA?.name ?? userA?.username,
        avatarUrl: userA?.avatarUrl,
        figurineUrl: userA?.figurineUrl,
      },
    });

    // kick off first question
    io.to(other.socketId).emit("session:question", {
      index: 0,
      text: questions[0],
    });
    socket.emit("session:question", { index: 0, text: questions[0] });
  } else {
    queue.push({ userId, socketId: socket.id, hobbies });
  }
}

export async function queueLeave(userId: string, socketId?: string) {
  const i = queue.findIndex(
    (q) => q.userId === userId || q.socketId === socketId
  );
  if (i >= 0) queue.splice(i, 1);
}

export async function submitAnswer(
  io: Server,
  payload: {
    sessionId: string;
    userId: string;
    questionIndex: number;
    text: string;
  }
) {
  const { sessionId, userId, questionIndex, text } = payload;
  const sess = await prisma.matchSession.findUnique({
    where: { id: sessionId },
  });
  if (!sess) return;

  // record
  if (!sessionsAnswers.has(sessionId))
    sessionsAnswers.set(sessionId, new Map());
  const userMap = sessionsAnswers.get(sessionId)!;
  if (!userMap.has(userId)) userMap.set(userId, new Map());
  userMap.get(userId)!.set(questionIndex, text);

  const bothUsers = [sess.userAId, sess.userBId];
  const haveBoth =
    userMap.get(sess.userAId)?.has(questionIndex) &&
    userMap.get(sess.userBId)?.has(questionIndex);

  if (haveBoth) {
    const a = userMap.get(sess.userAId)!.get(questionIndex)!;
    const b = userMap.get(sess.userBId)!.get(questionIndex)!;
    const similar = isAnswerSimilar(a, b);
    const delta = similar ? 1 : -1;

    const updated = await prisma.matchSession.update({
      where: { id: sessionId },
      data: { scoreA: sess.scoreA + delta, scoreB: sess.scoreB + delta },
    });

    // broadcast score to both sockets
    io.sockets.sockets.forEach((s) => {
      if (s.data?.userId && bothUsers.includes(s.data.userId)) {
        s.emit("session:score", {
          scoreA: updated.scoreA,
          scoreB: updated.scoreB,
        });
      }
    });

    const nextIndex = questionIndex + 1;
    const q = (updated.questions as string[])[nextIndex];
    if (q) {
      // next question
      io.sockets.sockets.forEach((s) => {
        if (s.data?.userId && bothUsers.includes(s.data.userId)) {
          s.emit("session:question", { index: nextIndex, text: q });
        }
      });
    } else {
      // complete
      const finalScore = Math.max(updated.scoreA, updated.scoreB); // symmetric
      const matched = finalScore >= 5;
      if (matched) {
        await prisma.match.create({
          data: {
            userAId: sess.userAId,
            userBId: sess.userBId,
            score: finalScore,
          },
        });
      }
      io.sockets.sockets.forEach((s) => {
        if (s.data?.userId && bothUsers.includes(s.data.userId)) {
          s.emit("session:complete", { matched, finalScore });
        }
      });
      await prisma.matchSession.update({
        where: { id: sessionId },
        data: { status: "completed", completedAt: new Date() },
      });
      sessionsAnswers.delete(sessionId);
    }
  }
}

function overlap(a: string[] = [], b: string[] = []) {
  return a.some((x) => b.includes(x));
}

function genQuestions(n = 10) {
  const base = [
    "Morning person or night owl?",
    "Favorite weekend activity?",
    "Cats or dogs?",
    "Ideal vacation: beach, city, or mountains?",
    "Go-to comfort food?",
    "Read a book or watch a movie?",
    "Workout or chill day?",
    "Favorite music genre?",
    "Cook at home or eat out?",
    "Early planner or spontaneous?",
  ];
  // repeat/trim to n
  const arr = [...base];
  while (arr.length < n) arr.push(...base);
  return arr.slice(0, n);
}
