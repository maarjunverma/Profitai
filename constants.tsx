
import React from 'react';

export const REFERRAL_FEE_PERCENT = 0.15;
export const ESTIMATED_FBA_FEE = 4.50; // Flat estimate for MVP

export interface AmazonCategory {
  id: string;
  name: string;
  children?: { id: string; name: string }[];
}

export const COUNTRY_MARKETPLACES = [
  // North America
  { code: 'US', name: 'United States', currency: 'USD', symbol: '$' },
  { code: 'CA', name: 'Canada', currency: 'CAD', symbol: 'C$' },
  { code: 'MX', name: 'Mexico', currency: 'MXN', symbol: '$' },
  
  // Europe
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', symbol: '£' },
  { code: 'DE', name: 'Germany', currency: 'EUR', symbol: '€' },
  { code: 'FR', name: 'France', currency: 'EUR', symbol: '€' },
  { code: 'IT', name: 'Italy', currency: 'EUR', symbol: '€' },
  { code: 'ES', name: 'Spain', currency: 'EUR', symbol: '€' },
  { code: 'NL', name: 'Netherlands', currency: 'EUR', symbol: '€' },
  { code: 'PL', name: 'Poland', currency: 'PLN', symbol: 'zł' },
  { code: 'SE', name: 'Sweden', currency: 'SEK', symbol: 'kr' },
  { code: 'BE', name: 'Belgium', currency: 'EUR', symbol: '€' },
  { code: 'TR', name: 'Turkey', currency: 'TRY', symbol: '₺' },
  
  // Asia Pacific
  { code: 'JP', name: 'Japan', currency: 'JPY', symbol: '¥' },
  { code: 'IN', name: 'India', currency: 'INR', symbol: '₹' },
  { code: 'AU', name: 'Australia', currency: 'AUD', symbol: 'A$' },
  { code: 'SG', name: 'Singapore', currency: 'SGD', symbol: 'S$' },
  
  // Middle East & Africa
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED', symbol: 'د.إ' },
  { code: 'SA', name: 'Saudi Arabia', currency: 'SAR', symbol: 'SR' },
  { code: 'EG', name: 'Egypt', currency: 'EGP', symbol: 'E£' },
  
  // South America
  { code: 'BR', name: 'Brazil', currency: 'BRL', symbol: 'R$' },
];

export const AMAZON_CATEGORIES: AmazonCategory[] = [
  { id: 'aps', name: 'All Departments' },
  { 
    id: 'electronics', 
    name: 'Electronics',
    children: [
      { id: 'electronics', name: 'All Electronics' },
      { id: 'electronics-accessories', name: 'Accessories & Supplies' },
      { id: 'photo', name: 'Camera & Photo' },
      { id: 'car-electronics', name: 'Car & Vehicle Electronics' },
      { id: 'computers', name: 'Computers & Accessories' },
      { id: 'office-products', name: 'Office Electronics' },
      { id: 'audio-video', name: 'Portable Audio & Video' },
      { id: 'videogames', name: 'Video Games & Consoles' },
    ]
  },
  { 
    id: 'home-garden', 
    name: 'Home & Kitchen',
    children: [
      { id: 'home-garden', name: 'All Home & Kitchen' },
      { id: 'kitchen', name: 'Kitchen & Dining' },
      { id: 'bedding', name: 'Bedding' },
      { id: 'bath', name: 'Bath' },
      { id: 'furniture', name: 'Furniture' },
      { id: 'appliances', name: 'Large Appliances' },
      { id: 'storage-organization', name: 'Storage & Organization' },
    ]
  },
  { 
    id: 'beauty', 
    name: 'Beauty & Personal Care',
    children: [
      { id: 'beauty', name: 'All Beauty' },
      { id: 'makeup', name: 'Makeup' },
      { id: 'skin-care', name: 'Skin Care' },
      { id: 'hair-care', name: 'Hair Care' },
      { id: 'fragrance', name: 'Fragrance' },
      { id: 'beauty-tools', name: 'Beauty Tools' },
    ]
  },
  { 
    id: 'hpc', 
    name: 'Health & Household',
    children: [
      { id: 'hpc', name: 'All Health' },
      { id: 'vitamins', name: 'Vitamins & Supplements' },
      { id: 'household-supplies', name: 'Household Supplies' },
      { id: 'personal-care', name: 'Personal Care' },
      { id: 'baby-care', name: 'Baby & Child Care' },
    ]
  },
  { 
    id: 'toys-and-games', 
    name: 'Toys & Games',
    children: [
      { id: 'toys-and-games', name: 'All Toys' },
      { id: 'arts-crafts', name: 'Arts & Crafts' },
      { id: 'puzzles', name: 'Puzzles' },
      { id: 'learning-education', name: 'Learning & Education' },
      { id: 'action-figures', name: 'Action Figures' },
    ]
  },
  { 
    id: 'pets', 
    name: 'Pet Supplies',
    children: [
      { id: 'pets', name: 'All Pets' },
      { id: 'dog-supplies', name: 'Dogs' },
      { id: 'cat-supplies', name: 'Cats' },
      { id: 'fish-aquatic', name: 'Fish & Aquatics' },
      { id: 'bird-supplies', name: 'Birds' },
    ]
  },
  { 
    id: 'sporting-goods', 
    name: 'Sports & Outdoors',
    children: [
      { id: 'sporting-goods', name: 'All Sports' },
      { id: 'exercise-fitness', name: 'Exercise & Fitness' },
      { id: 'outdoor-recreation', name: 'Outdoor Recreation' },
      { id: 'sports-fan-shop', name: 'Sports Fan Shop' },
    ]
  },
  { 
    id: 'industrial', 
    name: 'Industrial & Scientific',
    children: [
      { id: 'industrial', name: 'All Industrial' },
      { id: 'lab-scientific', name: 'Lab & Scientific' },
      { id: 'safety-products', name: 'Safety Products' },
      { id: 'medical-supplies', name: 'Medical Supplies' },
    ]
  },
];

export const getCurrencySymbol = (currencyCode?: string) => {
  const marketplace = COUNTRY_MARKETPLACES.find(m => m.currency === currencyCode);
  return marketplace ? marketplace.symbol : '$';
};

export const Icons = {
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
  ),
  TrendingUp: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
  ),
  Bookmark: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
  ),
  BookmarkCheck: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/><path d="m9 10 2 2 4-4"/></svg>
  ),
  LayoutDashboard: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="5" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
  ),
  Calculator: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></svg>
  ),
  ExternalLink: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
  ),
  Zap: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.71 13 3l-2.09 7.29H20L11 21l2.09-7.29H4z"/></svg>
  ),
  Globe: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
  ),
  Layers: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.27a1 1 0 0 0 0 1.82l8.57 4.09a2 2 0 0 0 1.66 0l8.57-4.09a1 1 0 0 0 0-1.82z"/><path d="m2 12 10 4.76L22 12"/><path d="m2 17 10 4.76L22 17"/></svg>
  ),
  Sparkles: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
  )
};
