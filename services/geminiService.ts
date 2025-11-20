import { GoogleGenAI } from "@google/genai";
import { DailyRecord } from "../types";

// Initialize Gemini
// In a real app, ensure environment variable is set. 
// For this demo code to work in the user's environment without .env, we rely on the instruction saying process.env.API_KEY is available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'dummy_key' });

export const generateDailyInsight = async (record: DailyRecord): Promise<string> => {
  if (!process.env.API_KEY) return "API Key missing for insights.";

  try {
    const prompt = `
      Analyze this daily badminton center sales report (JSON):
      ${JSON.stringify(record)}
      
      Provide a brief, encouraging summary for the owner. 
      Highlight:
      1. Total revenue performance.
      2. Any inventory discrepancies (Sold vs Calculated).
      3. Most popular drink.
      4. Suggestions for improvement.
      
      Keep it under 100 words. Use emojis.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No insight generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to generate insights at this time.";
  }
};

export const scanReceipt = async (base64Image: string): Promise<string> => {
    if (!process.env.API_KEY) return "API Key missing.";
    
    try {
         const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
                    { text: "Extract the total amount and any visible drink items from this receipt. Return as a short text summary." }
                ]
            }
        });
        return response.text || "Could not read receipt.";
    } catch (e) {
        console.error(e);
        return "Error scanning receipt.";
    }
}
