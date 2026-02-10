
export interface CompetitorPrice {
  store: string;
  price: number;
  url: string;
  currency: string;
}

export interface Product {
  asin: string;
  title: string;
  imageUrl: string;
  price: number;
  currency: string;
  bsr: number;
  reviewCount: number;
  rating: number;
  salesVolume?: string;
  productUrl?: string;
  competitors?: CompetitorPrice[];
  dimensions?: {
    weight: number;
    length: number;
    width: number;
    height: number;
  };
}

export interface ProfitStats {
  costPrice: number;
  referralFee: number;
  fbaFee: number;
  netProfit: number;
  roi: number;
  margin: number;
}

export enum SubscriptionTier {
  FREE = 'FREE',
  PRO = 'PRO'
}

export interface User {
  id: string;
  username: string;
  email: string;
  tier: SubscriptionTier;
  searchCredits: number;
}

export interface SavedProduct extends Product {
  trackedPrice: number;
  savedAt: string;
}
