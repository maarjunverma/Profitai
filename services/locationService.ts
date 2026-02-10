
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface NearByStore {
  name: string;
  uri: string;
  snippet?: string;
}

/**
 * Uses Gemini 2.5 with Google Maps tool to find retail stores near the user.
 * Retail Arbitrageurs need to find stores like Walmart, Target, Home Depot, etc.
 */
export async function findNearbyRetailers(latitude: number, longitude: number): Promise<NearByStore[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Find the nearest major retail stores (Walmart, Target, Best Buy, Home Depot, Lowe's) where I can do retail arbitrage. List them with their details.",
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: latitude,
              longitude: longitude
            }
          }
        }
      },
    });

    const stores: NearByStore[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.maps) {
          stores.push({
            name: chunk.maps.title || "Retail Store",
            uri: chunk.maps.uri,
            snippet: chunk.maps.placeAnswerSources?.[0]?.reviewSnippets?.[0]
          });
        }
      });
    }

    return stores;
  } catch (error) {
    console.error("Error finding nearby retailers:", error);
    return [];
  }
}
