import { TriviaQuestion } from "@/mock/triviaQuestions";

export async function generateTriviaQuestion(
  yourHobbies: string[],
  opponentHobbies: string[]
): Promise<TriviaQuestion> {
  const commonHobbies = yourHobbies.filter((hobby) =>
    opponentHobbies.includes(hobby)
  );

  const sharedHobbyPrompt = `based on your shared interest in ${commonHobbies.join(
    ", "
  )}`;

  const matchPrompt = `that helps two people who like different things — like ${yourHobbies.join(
    ", "
  )} and ${opponentHobbies.join(", ")} — discover if they vibe`;

  const promptContext =
    commonHobbies.length > 0 ? sharedHobbyPrompt : matchPrompt;

  const prompt = `
Generate a fun, open-ended trivia question ${promptContext}.
Make it playful and short — like something you'd hear on a first date.
Only return the question itself — no commentary, explanation, or formatting.
`.trim();

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `OpenAI Error: ${error.error?.message || response.statusText}`
    );
  }

  const data = await response.json();
  const question = data?.choices?.[0]?.message?.content
    ?.trim()
    .replace(/^Question:\s*/i, "");

  if (!question) throw new Error("Failed to generate question.");

  return {
    question,
    opponentAnswer: opponentHobbies[0] || "Pizza",
  };
}
