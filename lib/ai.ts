import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "X-Title": "ExpenseTracker AI",
  },
});

const validCategories = [
  "Food",
  "Transportation",
  "Entertainment",
  "Shopping",
  "Bills",
  "Healthcare",
  "Other",
] as const;

type Category = (typeof validCategories)[number];

/** Simple local keyword-based fallback */
function fallbackCategory(description: string): Category {
  const d = description.toLowerCase();
  if (d.includes("pizza") || d.includes("restaurant") || d.includes("coffee"))
    return "Food";
  if (d.includes("uber") || d.includes("bus") || d.includes("taxi"))
    return "Transportation";
  if (d.includes("movie") || d.includes("netflix")) return "Entertainment";
  if (d.includes("amazon") || d.includes("mall")) return "Shopping";
  if (d.includes("electricity") || d.includes("wifi")) return "Bills";
  if (d.includes("doctor") || d.includes("pharmacy")) return "Healthcare";
  return "Other";
}

/** Retry wrapper with exponential backoff */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    if (err.status === 429 && retries > 0) {
      console.warn(`⏳ Rate limited. Retrying in ${delay}ms...`);
      await new Promise((res) => setTimeout(res, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw err;
  }
}

/**
 * Categorize multiple expenses in one call
 */
export async function categorizeExpenses(
  descriptions: string[]
): Promise<Category[]> {
  if (descriptions.length === 0) return [];

  try {
    return await withRetry(async () => {
      const prompt = `Categorize each of the following expenses into one of these categories:
${validCategories.join(", ")}.

Expenses:
${descriptions.map((d, i) => `${i + 1}. ${d}`).join("\n")}

Return only a JSON array of categories in the same order, e.g. ["Food", "Bills", "Other"].`;

      const completion = await openai.chat.completions.create({
        model: "deepseek/deepseek-chat-v3-0324:free",
        messages: [
          {
            role: "system",
            content:
              "You are an expense categorization AI. Always respond with only a JSON array of valid categories.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 200,
      });

      let response = completion.choices[0].message.content?.trim();
      if (!response) throw new Error("Empty response from AI");

      // Remove ```json fences if present
      if (response.startsWith("```json")) {
        response = response.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (response.startsWith("```")) {
        response = response.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }

      const parsed = JSON.parse(response);

      if (!Array.isArray(parsed))
        throw new Error("Invalid JSON format from AI");

      return descriptions.map((desc, i) => {
        const cat = parsed[i]?.trim?.();
        return validCategories.includes(cat as Category)
          ? (cat as Category)
          : fallbackCategory(desc);
      });
    });
  } catch (error) {
    console.error("❌ Error categorizing expenses:", error);
    // fallback all if AI fails
    return descriptions.map((d) => fallbackCategory(d));
  }
}
