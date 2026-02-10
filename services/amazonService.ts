
// import { GoogleGenAI, Type } from "@google/genai";
import { Product, CompetitorPrice } from "../types";
import { AMAZON_CATEGORIES } from "../constants";

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

      if (minPrice !== undefined) mapped = mapped.filter(p => p.price >= minPrice);
      if (maxPrice !== undefined) mapped = mapped.filter(p => p.price <= maxPrice);

      return mapped;
    } else {
      throw new Error(`RapidAPI Error: ${response.status}`);
    }
  } catch (error) {
    console.warn("RapidAPI failed and AI fallback is disabled for production stability.");
    /* 
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const simResponse = await ai.models.generateContent({ ... });
    */
    return [];
  }
}

export async function getCompetitorPrices(product: Product): Promise<CompetitorPrice[]> {
  try {
    console.log("Competitor price check (AI) is currently disabled in production.");
    /*
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({ ... });
    return JSON.parse(response.text || '[]');
    */
    return [];
  } catch (error) {
    return [];
  }
}

export async function getScoutInsights(product: Product): Promise<string> {
  try {
    // const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // const response = await ai.models.generateContent({ ... });
    // return response.text || "Analysis unavailable.";
    return "AI Insights currently disabled. Evaluate ROI based on current Amazon price and your acquisition cost.";
  } catch (err) {
    return "Intelligence service offline.";
  }
}
