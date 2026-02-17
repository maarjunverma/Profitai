
import { User, SubscriptionTier, Product, SavedProduct } from '../types';

const MOCK_DELAY = 600;
const LEAD_ENDPOINT = 'https://api.madsag.in/api/amazon-emails';

export const strapiService = {
  async captureLead(email: string, phoneNumber?: string): Promise<boolean> {
    try {
      const response = await fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          data: {
            email: email,
            phone: phoneNumber || 'N/A',
            source: 'ArbitrageScout App',
            timestamp: new Date().toISOString(),
            status: 'active'
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Lead capture failed with status ${response.status}`);
      }

      return true;
    } catch (error) {
      console.warn("Lead capture failed:", error);
      return false;
    }
  },

  async login(email: string, phoneNumber?: string): Promise<{ user: User; jwt: string }> {
    try {
      await new Promise(r => setTimeout(r, MOCK_DELAY));
      
      const existingKey = `strapi_user_${email}`;
      const existing = localStorage.getItem(existingKey);
      
      if (existing) {
        const user = JSON.parse(existing);
        // Update phone number if provided
        if (phoneNumber) user.phoneNumber = phoneNumber;
        localStorage.setItem(existingKey, JSON.stringify(user));
        return { user, jwt: 'mock-jwt-token-' + user.id };
      }

      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        username: email.split('@')[0],
        email: email,
        phoneNumber: phoneNumber,
        tier: SubscriptionTier.FREE,
        searchCredits: 5 
      };
      
      localStorage.setItem(existingKey, JSON.stringify(newUser));
      return { user: newUser, jwt: 'mock-jwt-token-' + newUser.id };
    } catch (error) {
      throw new Error("Login failed. Please check your internet connection.");
    }
  },

  async getWatchlist(userId: string): Promise<SavedProduct[]> {
    try {
      await new Promise(r => setTimeout(r, MOCK_DELAY));
      const saved = localStorage.getItem(`strapi_watchlist_${userId}`);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      throw new Error("Could not retrieve your watchlist.");
    }
  },

  async saveProduct(userId: string, product: Product): Promise<SavedProduct> {
    try {
      const watchlist = await this.getWatchlist(userId);
      const newSaved: SavedProduct = {
        ...product,
        trackedPrice: product.price,
        savedAt: new Date().toISOString()
      };
      
      const updated = [...watchlist, newSaved];
      localStorage.setItem(`strapi_watchlist_${userId}`, JSON.stringify(updated));
      return newSaved;
    } catch (error) {
      throw new Error("Failed to save product. Local storage might be full.");
    }
  },

  async removeProduct(userId: string, asin: string): Promise<void> {
    try {
      const watchlist = await this.getWatchlist(userId);
      const updated = watchlist.filter(p => p.asin !== asin);
      localStorage.setItem(`strapi_watchlist_${userId}`, JSON.stringify(updated));
    } catch (error) {
      throw new Error("Could not remove product from watchlist.");
    }
  }
};
