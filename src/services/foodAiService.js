
const FOOD_AI_API = "https://foodspend-ai-backend.vercel.app/api";

export async function classifyFoodAiQuestion(message) {
  const response = await fetch(`${FOOD_AI_API}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || "Unable to contact Food AI.");
  }

  return data;
}

export async function getFoodRecommendations({
  budget,
  category = "any",
  vegetarianOnly = false,
}) {
  const response = await fetch(`${FOOD_AI_API}/recommend`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      budget: Number(budget),
      category,
      vegetarian_only: vegetarianOnly,
    }),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
  throw new Error(data.error || "Unable to contact Food AI.");
}

  return data;
}
