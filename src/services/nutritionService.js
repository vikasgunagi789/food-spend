
const FOOD_AI_API = "https://foodspend-ai-backend.vercel.app/api";

export async function askNutritionQuestion(question) {
  const response = await fetch(`${FOOD_AI_API}/nutrition`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      data.error || "Unable to retrieve nutrition information."
    );
  }

  return data;
}
