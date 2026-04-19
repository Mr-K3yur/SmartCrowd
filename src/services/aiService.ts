import { GoogleGenAI } from '@google/genai';

// We use the VITE_ prefix to expose the key to the Vite frontend.
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

export const generateEmergencyBroadcast = async (scenario: string): Promise<string> => {
  if (!apiKey) {
    throw new Error("Missing VITE_GEMINI_API_KEY in environment variables.");
  }
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Based on the following scenario: "${scenario}", output an emergency broadcast following exactly this template:
🚨 EMERGENCY ALERT: [INCIDENT TYPE] reported at [ZONE]. Stop all work immediately and follow safety protocols for this area. Await further instructions. Replace [INCIDENT TYPE] and [ZONE] with the appropriate details extracted from the scenario. Only return the completed alert message, nothing else.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Failed to generate message.";
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
};
