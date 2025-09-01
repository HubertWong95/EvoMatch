export async function isAnswerSimilar(
  userAnswer: string,
  opponentAnswer: string
): Promise<boolean> {
  const prompt = `
Determine if these two answers mean the same thing, even if they're phrased differently:

User Answer: "${userAnswer}"
Opponent Answer: "${opponentAnswer}"

Reply with only "yes" or "no".
`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    console.error("OpenAI Error:", await response.text());
    return false;
  }

  const data = await response.json();
  const reply = data?.choices?.[0]?.message?.content?.toLowerCase().trim();

  return reply === "yes";
}
