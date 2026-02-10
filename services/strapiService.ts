
import { User, SubscriptionTier, Product, SavedProduct } from '../types';

/**
 * STRAPI BACKEND SERVICE
 * Handles mock authentication and real lead capture to the specified endpoint.
 */

const MOCK_DELAY = 600;
const LEAD_ENDPOINT = 'https://api.madsag.in/api/amazon-emails';

export const strapiService = {
  // Lead Generation
  async captureLead(email: string): Promise<boolean> {
    try {
      console.log(`Scout: Capturing lead for ${email}...`);
      // Sending email data to the requested endpoint: https://api.madsag.in/api/amazon-emails
      // Strapi expects the payload to be wrapped in a 'data' key.
      const response = await fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          data: {
            email: email,
            source: 'ArbitrageScout App',
            timestamp: new Date().toISOString(),
            status: 'active'
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      console.log("Scout: Lead captured successfully.");
      return true;
    } catch (error) {
      // Log warning but don't block the user flow
      console.warn("Scout: Lead capture backend task failed:", error);
      return false;
    }
  },

  // Authentication (Simulated via LocalStorage)
  async login(email: string, password?: string): Promise<{ user: User; jwt: string }> {
    await new Promise(r => setTimeout(r, MOCK_DELAY));
    
    // Check local storage for existing user or create one
    const existing = localStorage.getItem(`strapi_user_${email}`);
    if (existing) {
      const user = JSON.parse(existing);
      return { user, jwt: 'mock-jwt-token-' + user.id };
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username: email.split('@')[0],
      email: email,
      tier: SubscriptionTier.FREE,
      searchCredits: 5 
    };
    
    localStorage.setItem(`strapi_user_${email}`, JSON.stringify(newUser));
    return { user: newUser, jwt: 'mock-jwt-token-' + newUser.id };
  },

  // Watchlist Operations
  async getWatchlist(userId: string): Promise<SavedProduct[]> {
    await new Promise(r => setTimeout(r, MOCK_DELAY));
    const saved = localStorage.getItem(`strapi_watchlist_${userId}`);
    return saved ? JSON.parse(saved) : [];
  },

  async saveProduct(userId: string, product: Product): Promise<SavedProduct> {
    const watchlist = await this.getWatchlist(userId);
    const newSaved: SavedProduct = {
      ...product,
      trackedPrice: product.price,
      savedAt: new Date().toISOString()
    };
    
    const updated = [...watchlist, newSaved];
    localStorage.setItem(`strapi_watchlist_${userId}`, JSON.stringify(updated));
    return newSaved;
  },

  async removeProduct(userId: string, asin: string): Promise<void> {
    const watchlist = await this.getWatchlist(userId);
    const updated = watchlist.filter(p => p.asin !== asin);
    localStorage.setItem(`strapi_watchlist_${userId}`, JSON.stringify(updated));
  },

  // Search Credits
  async decrementCredits(userId: string, email: string): Promise<number> {
    const userStr = localStorage.getItem(`strapi_user_${email}`);
    if (!userStr) return 0;
    
    const user = JSON.parse(userStr);
    user.searchCredits = Math.max(0, user.searchCredits - 1);
    localStorage.setItem(`strapi_user_${email}`, JSON.stringify(user));
    return user.searchCredits;
  }
};
