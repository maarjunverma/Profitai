
// import { GoogleGenAI } from "@google/genai";

export interface NearByStore {
  name: string;
  uri: string;
  snippet?: string;
}

/**
 * Uses Gemini 2.5 with Google Maps tool to find retail stores near the user.
 * (Disabled for Production Stability)
 */
export async function findNearbyRetailers(latitude: number, longitude: number): Promise<NearByStore[]> {
  try {
    console.log("Nearby Retailer Search (AI) is currently disabled.");
    /*
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "...",
      config: { tools: [{ googleMaps: {} }], ... }
    });
    ...
    */
    return [];
  } catch (error) {
    console.error("Error finding nearby retailers:", error);
    return [];
  }
}
