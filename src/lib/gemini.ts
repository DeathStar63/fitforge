import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function analyzeFood(description: string): Promise<string> {
  if (!genAI) return "Please set your Gemini API key in .env.local";
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = `You are a precise nutrition analyst. The user ate the following:

"${description}"

Respond ONLY with valid JSON (no markdown, no backticks) in this exact format:
{
  "items": [
    { "name": "Food name", "calories": 000, "protein": 00, "carbs": 00, "fats": 00, "quantity": "amount" }
  ],
  "totalCalories": 000,
  "totalProtein": 00,
  "totalCarbs": 00,
  "totalFats": 00,
  "summary": "Brief one-line summary"
}

Be accurate with Indian foods if mentioned. All values in grams except calories (kcal).`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("429")) throw new Error("Rate limit exceeded — free tier quota used up. Try again later.");
    throw error;
  }
}

export async function analyzeFoodImage(
  base64Image: string,
  mimeType: string
): Promise<string> {
  if (!genAI) return "Please set your Gemini API key in .env.local";
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = `You are a precise nutrition analyst. Analyze this food photo.

Respond ONLY with valid JSON (no markdown, no backticks) in this exact format:
{
  "items": [
    { "name": "Food name", "calories": 000, "protein": 00, "carbs": 00, "fats": 00, "quantity": "estimated amount" }
  ],
  "totalCalories": 000,
  "totalProtein": 00,
  "totalCarbs": 00,
  "totalFats": 00,
  "summary": "Brief one-line summary"
}

Estimate portions from the image. All values in grams except calories (kcal).`;

  const result = await model.generateContent([
    prompt,
    { inlineData: { data: base64Image, mimeType } },
  ]);
  return result.response.text();
}

export async function analyzeBody(stats: {
  weight: number;
  height: number;
  age: number;
  bmi: number;
  bodyFat?: number;
}): Promise<string> {
  if (!genAI) return "Please set your Gemini API key in .env.local";
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = `You are an expert fitness coach. Analyze these body stats for a person running a 6-day high-volume Legs/Push/Pull split (90 min lifting + 30 min LISS cardio daily).

Stats:
- Weight: ${stats.weight} kg
- Height: ${stats.height} cm
- Age: ${stats.age} years
- BMI: ${stats.bmi}
${stats.bodyFat ? `- Body Fat: ${stats.bodyFat}%` : ""}

Provide a detailed, motivating analysis covering:
1. BMI category and what it means for their goals
2. Estimated daily calorie needs (TDEE) for their activity level
3. Recommended protein intake (g/day)
4. Whether they should cut or bulk at this stage
5. Specific actionable tips for their transformation
6. Estimated timeline for visible changes

Keep it concise but detailed. Use a motivating, coach-like tone. Format with clear sections.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("429")) throw new Error("Rate limit exceeded — free tier quota used up. Try again later.");
    throw error;
  }
}

export async function analyzeInBodyReport(
  base64Image: string,
  mimeType: string
): Promise<string> {
  if (!genAI) return "Please set your Gemini API key in .env.local";
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = `You are an expert fitness coach and body composition specialist. This is an InBody body composition analysis report/result image.

Carefully read ALL values from the image and provide a comprehensive analysis covering:

1. **Body Composition Summary** — Extract and list all key metrics you can read: body weight, skeletal muscle mass, body fat mass, body fat percentage, BMI, visceral fat level, basal metabolic rate, etc.

2. **Muscle-Fat Analysis** — Interpret the muscle-fat balance. Is the person over-fat, under-muscled, or well-balanced? Compare to healthy ranges.

3. **Segmental Analysis** — If visible, analyze the segmental lean mass (arms, legs, trunk). Identify any imbalances.

4. **Strengths** — What looks good in the report? Highlight positives.

5. **Areas for Improvement** — What needs work? Be specific and actionable.

6. **Recommendations** — Based on this report, for someone doing a 6-day Legs/Push/Pull split (90 min lifting + 30 min LISS cardio):
   - Calorie target (TDEE estimate)
   - Protein recommendation
   - Should they cut, bulk, or recomp?
   - Specific training adjustments based on weak points

7. **Progress Tracking** — What metrics should they focus on improving by their next InBody scan?

Be detailed, motivating, and coach-like. Use clear sections with headers. Reference specific numbers from the report.`;

  try {
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType } },
    ]);
    return result.response.text();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("429")) throw new Error("Rate limit exceeded — free tier quota used up. Try again later.");
    throw error;
  }
}
