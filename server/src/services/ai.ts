import type { User } from "@prisma/client";
import { OPENAI_API_KEY } from "../config";
import { generateTrivia as localTrivia, TriviaItem } from "./localTrivia";

// Generate questions with AI if key is set; otherwise fall back to local pool.
export async function generateQuestions(
  userA: Partial<User> = {},
  userB: Partial<User> = {},
  count = 10
): Promise<TriviaItem[]> {
  if (OPENAI_API_KEY) {
    try {
      const items = await generateQuestionsAI(userA, userB, count);
      if (items?.length) return items.slice(0, count);
    } catch (e) {
      console.warn("[AI] fallback to local questions:", (e as Error).message);
    }
  }
  return localTrivia(count);
}

async function generateQuestionsAI(
  userA: Partial<User>,
  userB: Partial<User>,
  count: number
): Promise<TriviaItem[]> {
  const { default: OpenAI } = await import("openai");
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

  const a = pickFields(userA);
  const b = pickFields(userB);

  const prompt = `
Generate ${count} short, casual icebreaker questions tailored to two people meeting via a hobby-based dating app.
User A: ${JSON.stringify(a)}
User B: ${JSON.stringify(b)}
Keep each question under 12 words. Return ONLY a JSON array of { "id": string, "text": string }.
`;

  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  const raw = resp.choices?.[0]?.message?.content?.trim() || "[]";
  try {
    const list = JSON.parse(raw) as { id?: string; text?: string }[];
    return list
      .map((q, i) => ({ id: q.id || `q_${i}`, text: (q.text || "").trim() }))
      .filter((q) => q.text);
  } catch {
    // If JSON parsing fails, degrade gracefully by turning lines into questions
    return raw
      .split("\n")
      .map((t, i) => ({ id: `q_${i}`, text: t.trim() }))
      .filter((q) => q.text)
      .slice(0, count);
  }
}

function pickFields(u: Partial<User>) {
  const { username, name, age, bio, location } = u;
  return { username, name, age, bio, location };
}
