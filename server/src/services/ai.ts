// server/src/services/ai.ts
// NOTE: No `node-fetch` import — uses Node 18+ built-in global fetch.

import { prisma } from "../prisma";
import { isSimilar as heuristicSimilar } from "../realtime/similarity";

// Read from env
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

type UserLike = {
  id?: string;
  name?: string | null;
  username?: string | null;
};

function cleanQuestionText(s: string): string | undefined {
  if (!s) return undefined;
  const t = s.trim();

  // If it's JSON-ish, try to extract "text" or "question"
  if (
    (t.startsWith("{") && t.endsWith("}")) ||
    (t.startsWith("[") && t.endsWith("]"))
  ) {
    try {
      const parsed = JSON.parse(t);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          const pick =
            typeof item === "string"
              ? item
              : typeof (item as any)?.text === "string"
              ? (item as any).text
              : typeof (item as any)?.question === "string"
              ? (item as any).question
              : undefined;
          if (pick) return pick.trim();
        }
        return undefined;
      }
      const pick =
        typeof parsed === "string"
          ? parsed
          : typeof (parsed as any)?.text === "string"
          ? (parsed as any).text
          : typeof (parsed as any)?.question === "string"
          ? (parsed as any).question
          : undefined;
      return pick?.trim();
    } catch {
      // fall through
    }
  }

  // Strip "Question: " prefix if present
  return t.replace(/^Question:\s*/i, "");
}

/**
 * Generate N open-ended, playful questions for two users.
 * Always returns plain strings (no JSON).
 */
export async function generateQuestions(
  userA: UserLike,
  userB: UserLike,
  count = 10
): Promise<string[]> {
  const aHobbies = await hobbiesFor(userA?.id);
  const bHobbies = await hobbiesFor(userB?.id);

  const commons = aHobbies.filter((h) => bHobbies.includes(h));
  const sharedPrompt =
    commons.length > 0
      ? `based on your shared interest in ${commons.join(", ")}`
      : `that helps two people who like different things — like ${
          aHobbies.join(", ") || "various things"
        } and ${
          bHobbies.join(", ") || "various things"
        } — discover if they vibe`;

  const prompt = `
Generate ${count} fun, open-ended, very short icebreaker questions ${sharedPrompt}.
Each question:
- must be a single line of text
- no numbering, no JSON, no id, no quotes
- friendly and playful (first-date style)
Return them as plain lines separated by newlines (no bullets, no numbering).
`.trim();

  if (!OPENAI_API_KEY) {
    // Fallback without OpenAI (dev)
    return defaultFallback(count);
  }

  const body = {
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
  };

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    console.warn("[ai.generateQuestions] OpenAI failed, using fallback.");
    return defaultFallback(count);
  }

  const data: any = await resp.json();
  const raw = data?.choices?.[0]?.message?.content || "";
  // Split by newline and clean each
  const lines = raw
    .split(/\r?\n/)
    .map((s: string) => s.trim())
    .filter(Boolean)
    .map(cleanQuestionText)
    .filter(Boolean) as string[];

  if (lines.length === 0) return defaultFallback(count);
  return lines.slice(0, count);
}

async function hobbiesFor(userId?: string): Promise<string[]> {
  if (!userId) return [];
  const rows = await prisma.userHobby.findMany({
    where: { userId },
    include: { hobby: true },
  });
  return rows.map((r) => r.hobby.name);
}

function defaultFallback(n: number): string[] {
  const base = [
    "Coffee or tea?",
    "Beach vacation or mountain cabin?",
    "What’s your comfort movie?",
    "What hobby helps you unwind?",
    "Early bird or night owl?",
    "Cats or dogs?",
    "Sweet or savory?",
    "Books or movies?",
    "Plan ahead or go with the flow?",
    "Art museum or live concert?",
  ];
  if (n <= base.length) return base.slice(0, n);
  while (base.length < n) base.push("Pick one thing you love—what is it?");
  return base;
}

/**
 * OpenAI-powered semantic similarity for short answers, with a safe heuristic fallback.
 * Returns true if "meaning is the same" even if phrasing differs.
 */
export async function isSemanticallySimilar(
  a: string,
  b: string
): Promise<boolean> {
  // Quick short-circuit to keep UX snappy and reduce API calls
  if (heuristicSimilar(a, b, 0.45)) return true;

  if (!OPENAI_API_KEY) return false;

  const prompt = `
Decide if these two short answers mean the same thing.
Answer ONLY "YES" or "NO".

A: ${a}
B: ${b}
`.trim();

  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
      }),
    });

    if (!resp.ok) return heuristicSimilar(a, b, 0.5);

    const data: any = await resp.json();
    const text: string = (data?.choices?.[0]?.message?.content || "")
      .trim()
      .toUpperCase();
    if (text.includes("YES")) return true;
    if (text.includes("NO")) return false;
    return heuristicSimilar(a, b, 0.5);
  } catch {
    return heuristicSimilar(a, b, 0.5);
  }
}
