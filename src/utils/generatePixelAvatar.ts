export async function generatePixelAvatar(
  base64Image: string
): Promise<string> {
  const prompt =
    "Create a pixel-art game-style avatar using only the person's face from the provided image. The avatar should be centered, head-only, in 8-bit style with a transparent or simple background. Make it playful and cartoonish.";

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024", // ✅ Fixed size
      response_format: "url",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `OpenAI Error: ${error.error?.message || response.statusText}`
    );
  }

  const data = await response.json();
  return data?.data?.[0]?.url || "";
}
