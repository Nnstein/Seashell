import { GoogleGenAI, Type } from "@google/genai";

// Helper to get AI instance
const getAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("API Key not found in environment variables");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateMenuDescription = async (dishName: string, ingredients: string): Promise<{ description: string, suggestedPrice: number } | null> => {
  const ai = getAI();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a mouth-watering, high-end resort style menu description for a dish named "${dishName}" containing these main ingredients: "${ingredients}". Also suggest a price in USD for a luxury resort.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING, description: "A 1-2 sentence appetizing description." },
            suggestedPrice: { type: Type.NUMBER, description: "A suggested price number." }
          },
          required: ["description", "suggestedPrice"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};

export const analyzeOrderSentiment = async (orders: any[]): Promise<string> => {
  // Placeholder for a more advanced feature if needed
  return "Analysis complete";
};
