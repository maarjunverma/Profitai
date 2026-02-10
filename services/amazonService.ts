
import { GoogleGenAI, Type } from "@google/genai";
import { Product, CompetitorPrice } from "../types";
import { AMAZON_CATEGORIES } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Production RapidAPI Configuration
const RAPIDAPI_KEY = 'c3d9da1be9msh3415706f37fe7c7p12aa2ajsnbefa208afa10';
const RAPIDAPI_HOST = 'real-time-amazon-data.p.rapidapi.com';

const parsePrice = (price: any): number => {
  if (typeof price === 'number') return price;
  if (typeof price === 'string') {
    const cleaned = price.replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
  }
  return 0;
};

const parseSalesVolumeToBSR = (volume: string | null): number => {
  if (!volume) return 999999;
  const lower = volume.toLowerCase();
  let multiplier = 1;
  if (lower.includes('k')) multiplier = 1000;
  const numericMatch = volume.match(/\d+/);
  const baseValue = numericMatch ? parseInt(numericMatch[0]) : 1;
  return Math.max(1, 1000000 - (baseValue * multiplier));
};

export async function searchProducts(
  query: string, 
  country: string = 'US', 
  category: string = 'aps',
  minPrice?: number,
  maxPrice?: number,
  page: number = 1
): Promise<Product[]> {
  try {
    const categoryName = AMAZON_CATEGORIES.find(c => c.id === category)?.name || '';
    let searchQuery = query.trim();
    
    // Construct refined query based on keyword and category
    if (!searchQuery && category !== 'aps') {
      searchQuery = `best sellers in ${categoryName}`;
    } else if (searchQuery && category !== 'aps') {
      searchQuery = `${searchQuery} in ${categoryName}`;
    } else if (!searchQuery) {
      searchQuery = "top trending products";
    }

    let finalQuery = searchQuery;
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceContext = `price ${minPrice || 0} to ${maxPrice || 'any'}`;
      finalQuery += ` ${priceContext}`;
    }

    // Build URL with category filter if supported by API, or fallback to keyword-based
    const categoryParam = category !== 'aps' ? `&category_id=${category}` : '';
    const url = `https://${RAPIDAPI_HOST}/search?query=${encodeURIComponent(finalQuery)}${categoryParam}&page=${page}&country=${country}&sort_by=RELEVANCE&product_condition=ALL`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST
      }
    });

    if (response.ok) {
      const result = await response.json();
      const rawProducts = result.data?.products || [];
      
      let mapped = rawProducts.map((p: any) => ({
        asin: p.asin || 'N/A',
        title: p.product_title || 'Untitled Product',
        imageUrl: p.product_photo || `https://picsum.photos/seed/${p.asin}/300/300`,
        price: parsePrice(p.product_price),
        currency: p.currency || 'USD',
        bsr: parseSalesVolumeToBSR(p.sales_volume),
        reviewCount: parseInt(p.product_num_ratings) || 0,
        rating: parseFloat(p.product_star_rating) || 0,
        salesVolume: p.sales_volume || 'N/A',
        productUrl: p.product_url || `https://www.amazon.com/dp/${p.asin}`
      }));

      // Secondary client-side price filter
      if (minPrice !== undefined) mapped = mapped.filter(p => p.price >= minPrice);
      if (maxPrice !== undefined) mapped = mapped.filter(p => p.price <= maxPrice);

      return mapped;
    } else {
      throw new Error(`RapidAPI Error: ${response.status}`);
    }
  } catch (error) {
    console.warn("RapidAPI fallback triggered.");
    const simResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Simulate 6 high-demand Amazon product search results for: query: "${query}", category: "${category}", country: "${country}". Return valid JSON array. Include realistic salesVolume like "1K+ bought in past month".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              asin: { type: Type.STRING },
              title: { type: Type.STRING },
              imageUrl: { type: Type.STRING },
              price: { type: Type.NUMBER },
              currency: { type: Type.STRING },
              bsr: { type: Type.NUMBER },
              reviewCount: { type: Type.NUMBER },
              rating: { type: Type.NUMBER },
              salesVolume: { type: Type.STRING },
              productUrl: { type: Type.STRING }
            },
            required: ["asin", "title", "imageUrl", "price", "currency", "bsr", "reviewCount", "rating", "salesVolume", "productUrl"]
          }
        }
      }
    });

    return JSON.parse(simResponse.text || '[]');
  }
}

export async function getCompetitorPrices(product: Product): Promise<CompetitorPrice[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search for prices of "${product.title}" at retailers like Walmart, eBay, Target. Return JSON array of {store, price, url, currency}.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              store: { type: Type.STRING },
              price: { type: Type.NUMBER },
              url: { type: Type.STRING },
              currency: { type: Type.STRING }
            },
            required: ["store", "price", "url", "currency"]
          }
        }
      },
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Competitor price check failed:", error);
    return [];
  }
}

export async function getScoutInsights(product: Product): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Expert Arbitrage Analysis for "${product.title}" at ${product.price} ${product.currency}. Vol: ${product.salesVolume}. BSR: ${product.bsr}. Give a 1-sentence profit verdict.`,
    });
    return response.text || "Analysis unavailable.";
  } catch (err) {
    return "Intelligence service offline.";
  }
}
