
import React, { useState, useEffect } from 'react';
import { SavedProduct, User } from '../types';
import { strapiService } from '../services/strapiService';
import { searchProducts } from '../services/amazonService';
import ProductCard from './ProductCard';
import { Icons, COUNTRY_MARKETPLACES } from '../constants';

const Watchlist: React.FC = () => {
  const [watchlist, setWatchlist] = useState<SavedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('arbitrage_scout_user');
    if (stored) {
      const u: User = JSON.parse(stored);
      fetchWatchlist(u.id);
    }
  }, []);

  const fetchWatchlist = async (userId: string) => {
    setLoading(true);
    const list = await strapiService.getWatchlist(userId);
    setWatchlist(list);
    setLoading(false);
  };

  const handleSync = async () => {
    const stored = localStorage.getItem('arbitrage_scout_user');
    if (!stored || watchlist.length === 0) return;
    const u: User = JSON.parse(stored);
    
    setSyncing(true);
    const updatedWatchlist = [...watchlist];
    
    // In a real app, we'd batch these ASINs
    for (let i = 0; i < updatedWatchlist.length; i++) {
      const p = updatedWatchlist[i];
      try {
        const results = await searchProducts(p.asin, 'US'); // Re-check ASIN
        if (results.length > 0) {
          const latest = results[0];
          updatedWatchlist[i] = {
            ...p,
            price: latest.price,
            bsr: latest.bsr,
            rating: latest.rating,
            reviewCount: latest.reviewCount
          };
        }
      } catch (e) {
        console.error("Failed to sync ASIN:", p.asin);
      }
    }
    
    // Save updated back to mock Strapi
    localStorage.setItem(`strapi_watchlist_${u.id}`, JSON.stringify(updatedWatchlist));
    setWatchlist(updatedWatchlist);
    setSyncing(false);
  };

  const handleRemove = async (product: any) => {
    const stored = localStorage.getItem('arbitrage_scout_user');
    if (!stored) return;
    const u: User = JSON.parse(stored);
    
    await strapiService.removeProduct(u.id, product.asin);
    setWatchlist(prev => prev.filter(p => p.asin !== product.asin));
  };

  if (loading) return (
    <div className="py-20 text-center flex flex-col items-center">
      <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mb-4"></div>
      <p className="font-bold text-slate-400">Syncing with Strapi Cloud...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
            <Icons.Bookmark /> My Watchlist
          </h1>
          <p className="text-slate-500 mt-1">Persisted FBA scouting sessions. ROI is recalculated automatically on sync.</p>
        </div>
        <button 
          onClick={handleSync}
          disabled={syncing || watchlist.length === 0}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${
            syncing 
            ? 'bg-slate-100 text-slate-400' 
            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100'
          }`}
        >
          {syncing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Syncing Prices...
            </>
          ) : (
            <>
              <Icons.Zap /> Sync Latest Prices
            </>
          )}
        </button>
      </div>

      {watchlist.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {watchlist.map(product => {
            const priceDiff = product.price - product.trackedPrice;
            const isLower = priceDiff < 0;
            return (
              <div key={product.asin} className="relative group">
                <ProductCard 
                  product={product} 
                  isSaved={true}
                  onSave={handleRemove}
                />
                <div className={`absolute top-2 right-14 px-2 py-0.5 rounded text-[9px] font-black uppercase shadow-sm ${
                  isLower ? 'bg-emerald-100 text-emerald-700' : priceDiff > 0 ? 'bg-red-100 text-red-700' : 'hidden'
                }`}>
                  {isLower ? 'Price Drop' : 'Price Up'}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200">
          <div className="mx-auto w-20 h-20 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-6">
            <Icons.Bookmark />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Your Watchlist is Empty</h2>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto">Use the Scout dashboard to find profitable products and save them here for 24h automated tracking.</p>
          <a href="#/" className="inline-flex items-center gap-2 mt-8 text-emerald-600 font-bold hover:underline">
             Go to Dashboard <Icons.ExternalLink />
          </a>
        </div>
      )}
    </div>
  );
};

export default Watchlist;
