
import { GoogleGenAI } from "@google/genai";
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

const findCategory = (id: string) => {
  if (id === 'aps') return { id: 'aps', name: 'All Departments' };
  for (const cat of AMAZON_CATEGORIES) {
    if (cat.id === id) return cat;
    if (cat.children) {
      const found = cat.children.find(c => c.id === id);
      if (found) return found;
    }
  }
  return null;
};

export async function searchProducts(
  query: string, 
  country: string = 'US', 
  category: string = 'aps',
  minPrice?: number,
  maxPrice?: number,
  page: number = 1
): Promise<Product[]> {
  const categoryObj = findCategory(category);
  const categoryName = categoryObj?.name || '';
  let searchQuery = query.trim();
  
  if (!searchQuery && category !== 'aps') {
    searchQuery = `best sellers in ${categoryName}`;
  } else if (searchQuery && category !== 'aps') {
    searchQuery = `${searchQuery} ${categoryName}`;
  } else if (!searchQuery) {
    searchQuery = "best sellers";
  }

  let finalQuery = searchQuery;
  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceContext = `price ${minPrice || 0} to ${maxPrice || 'any'}`;
    finalQuery += ` ${priceContext}`;
  }

  const categoryIdParam = (category === 'aps') ? 'aps' : category;
  const url = `https://${RAPIDAPI_HOST}/search?query=${encodeURIComponent(finalQuery)}&category_id=${categoryIdParam}&page=${page}&country=${country}&sort_by=RELEVANCE&product_condition=ALL`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST
      }
    });

    if (response.status === 429) {
      throw new Error("Search limit reached. Please try again in a few minutes.");
    }
    
    if (response.status === 401 || response.status === 403) {
      throw new Error("Service authentication failed. Please check your network or subscription.");
    }

    if (!response.ok) {
      throw new Error(`Amazon data sync failed (${response.status}). Our engineers are notified.`);
    }

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
  } catch (error: any) {
    throw new Error(error.message || "Unable to connect to Amazon. Please check your connection.");
  }
}

export async function getScoutInsights(product: Product): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a professional Amazon FBA Arbitrage Scout. 
      Analyze this product for potential arbitrage:
      - Title: ${product.title}
      - Price: ${product.price} ${product.currency}
      - BSR: ${product.bsr}
      - Recent Sales Volume: ${product.salesVolume}
      - Rating: ${product.rating} stars from ${product.reviewCount} reviews
      
      Provide a concise 2-sentence verdict. Determine if it's a high, medium, or low risk opportunity. 
      Consider BSR (lower is better) and sales volume as demand indicators.`
    });

    if (!response || !response.text) {
      throw new Error("AI verdict unavailable");
    }

    return response.text;
  } catch (err: any) {
    throw new Error("AI analysis service is busy. Please try analyzing this item again.");
  }
}
