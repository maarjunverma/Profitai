
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Product, User, SubscriptionTier } from '../types';
import { searchProducts } from '../services/amazonService';
import { strapiService } from '../services/strapiService';
import ProductCard from './ProductCard';
import PricingModal from './PricingModal';
import { Icons, COUNTRY_MARKETPLACES, AMAZON_CATEGORIES } from '../constants';

const SEARCH_LIMIT = 5;

type DemandFilter = 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'online' | 'trending'>('online');
  const [query, setQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [selectedCategory, setSelectedCategory] = useState('aps');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [globalCost, setGlobalCost] = useState<number>(0);
  const [savedAsins, setSavedAsins] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<User | null>(null);
  
  // Demand filtering state
  const [demandFilter, setDemandFilter] = useState<DemandFilter>('ALL');

  // Pricing Modal state
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('arbitrage_scout_user');
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      loadWatchlist(u.id);
    }
  }, []);

  const loadWatchlist = async (userId: string) => {
    const list = await strapiService.getWatchlist(userId);
    setSavedAsins(new Set(list.map(p => p.asin)));
  };

  const incrementRequestCount = () => {
    const count = parseInt(localStorage.getItem('as_request_count') || '0');
    localStorage.setItem('as_request_count', (count + 1).toString());
    return count + 1;
  };

  const getRequestCount = () => {
    return parseInt(localStorage.getItem('as_request_count') || '0');
  };

  const handleSearch = async (e?: React.FormEvent, pageNum: number = 1) => {
    if (e) e.preventDefault();
    if (!user) return;

    const currentCount = getRequestCount();
    if (currentCount >= SEARCH_LIMIT && user.tier === SubscriptionTier.FREE) {
      setIsPricingModalOpen(true);
      return;
    }

    if (user.searchCredits <= 0) {
      setIsPricingModalOpen(true);
      return;
    }

    setLoading(true);
    setCurrentPage(pageNum);
    
    try {
      const results = await searchProducts(
        query, 
        selectedCountry, 
        selectedCategory, 
        minPrice === '' ? undefined : Number(minPrice), 
        maxPrice === '' ? undefined : Number(maxPrice),
        pageNum
      );
      
      setProducts(results);
      
      incrementRequestCount();
      const newCredits = await strapiService.decrementCredits(user.id, user.email);
      const updatedUser = { ...user, searchCredits: newCredits };
      setUser(updatedUser);
      localStorage.setItem('arbitrage_scout_user', JSON.stringify(updatedUser));
      
      if (pageNum > 1 || results.length > 0) {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err) {
      console.error("Search failed:", err);
      alert("Search encountered an issue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Improved Demand Parsing & Filtering Logic
  const filteredProducts = useMemo(() => {
    if (demandFilter === 'ALL') return products;

    const parseVolume = (vol?: string): number => {
      if (!vol || vol === 'N/A') return 0;
      const lower = vol.toLowerCase();
      // Extract number part (handles 1,000, 1.5, etc)
      const numericPart = lower.replace(/[^0-9.]/g, '');
      const num = parseFloat(numericPart) || 0;
      
      if (lower.includes('k')) return num * 1000;
      if (lower.includes('m')) return num * 1000000;
      return num;
    };

    return products.filter(p => {
      const volumeNum = parseVolume(p.salesVolume);
      const bsr = p.bsr || 999999;

      switch (demandFilter) {
        case 'HIGH':
          // High: 1000+ monthly sales OR BSR in top 25k
          return volumeNum >= 1000 || bsr <= 25000;
        case 'MEDIUM':
          // Medium: 100-999 monthly sales OR BSR in 25k-150k range
          return (volumeNum >= 100 && volumeNum < 1000) || (bsr > 25000 && bsr <= 150000);
        case 'LOW':
          // Low: Less than 100 sales AND BSR above 150k
          return volumeNum < 100 && bsr > 150000;
        default:
          return true;
      }
    });
  }, [products, demandFilter]);

  const handleUpgrade = (plan: 'BASIC' | 'UNLIMITED') => {
    if (!user) return;
    const updatedUser = { 
      ...user, 
      tier: SubscriptionTier.PRO,
      searchCredits: plan === 'BASIC' ? 100 : 999999 
    };
    setUser(updatedUser);
    localStorage.setItem('arbitrage_scout_user', JSON.stringify(updatedUser));
    localStorage.setItem(`strapi_user_${user.email}`, JSON.stringify(updatedUser));
    setIsPricingModalOpen(false);
  };

  const clearFilters = () => {
    setQuery('');
    setSelectedCategory('aps');
    setMinPrice('');
    setMaxPrice('');
    setProducts([]);
    setCurrentPage(1);
    setDemandFilter('ALL');
  };

  const toggleSaveProduct = async (product: Product) => {
    if (!user) return;
    if (savedAsins.has(product.asin)) {
      await strapiService.removeProduct(user.id, product.asin);
      savedAsins.delete(product.asin);
    } else {
      await strapiService.saveProduct(user.id, product);
      savedAsins.add(product.asin);
    }
    setSavedAsins(new Set(savedAsins));
  };

  const currentMarketplace = COUNTRY_MARKETPLACES.find(m => m.code === selectedCountry);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <PricingModal 
        isOpen={isPricingModalOpen} 
        onClose={() => setIsPricingModalOpen(false)} 
        onUpgrade={handleUpgrade}
      />

      {/* Header Area */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-row items-center justify-between gap-4">
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
             <div className="p-2 bg-slate-900 text-white rounded-xl"><Icons.LayoutDashboard /></div>
             Product Scout
          </h1>
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-xs font-black border border-emerald-100 shadow-sm shadow-emerald-50">
            <Icons.Zap /> {user?.searchCredits === 999999 ? 'Unlimited' : `${user?.searchCredits} Credits Left`}
          </div>
        </div>

        {/* Tabs - Mobile Friendly */}
        <div className="flex bg-slate-100/80 p-1.5 rounded-2xl w-full">
          <button 
            onClick={() => setActiveTab('online')}
            className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${activeTab === 'online' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
          >
            Manual Search
          </button>
          <button 
            onClick={() => { setActiveTab('trending'); setProducts([]); setCurrentPage(1); }}
            className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${activeTab === 'trending' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
          >
            <span className="flex items-center justify-center gap-2"><Icons.Sparkles /> Trending</span>
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Main Search Row */}
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
              <Icons.Search />
            </div>
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={activeTab === 'trending' ? "Specific trending niche..." : "Search product name or keyword..."}
              className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium text-slate-700"
            />
          </div>

          {/* Country & Category Row - Stacked on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-2xl border border-slate-200 group transition-all focus-within:ring-2 focus-within:ring-emerald-500">
              <div className="p-2 bg-slate-50 text-slate-900 rounded-lg group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                <Icons.Globe />
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Country</span>
                <select 
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="bg-transparent text-sm font-bold text-slate-800 outline-none w-full cursor-pointer appearance-none"
                >
                  {COUNTRY_MARKETPLACES.map(m => (
                    <option key={m.code} value={m.code}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-2xl border border-slate-200 group transition-all focus-within:ring-2 focus-within:ring-emerald-500">
              <div className="p-2 bg-slate-50 text-slate-900 rounded-lg group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                <Icons.Layers />
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Category</span>
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent text-sm font-bold text-slate-800 outline-none w-full cursor-pointer appearance-none"
                >
                  {AMAZON_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Price Range & Cost Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 flex flex-col focus-within:ring-2 focus-within:ring-emerald-500 transition-all">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Min Price ({currentMarketplace?.symbol})</span>
              <input 
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="bg-transparent font-bold text-sm text-slate-800 outline-none w-full placeholder:text-slate-300"
              />
            </div>
            <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 flex flex-col focus-within:ring-2 focus-within:ring-emerald-500 transition-all">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Max Price ({currentMarketplace?.symbol})</span>
              <input 
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Unlimited"
                className="bg-transparent font-bold text-sm text-slate-800 outline-none w-full placeholder:text-slate-300"
              />
            </div>
          </div>

          {/* Final Action Bar */}
          <div className="flex flex-col gap-6 pt-4 border-t border-slate-50">
            <button 
              onClick={clearFilters}
              className="text-xs font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-[0.2em] self-center"
            >
              Clear All Filters
            </button>

            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
              <div className="flex-1 bg-slate-50 px-4 py-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Inventory Cost ({currentMarketplace?.symbol})</span>
                <input 
                  type="number"
                  value={globalCost}
                  onChange={(e) => setGlobalCost(Number(e.target.value))}
                  className="w-20 bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-black text-sm text-center focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
                />
              </div>
              
              <button 
                onClick={(e) => handleSearch(e, 1)}
                disabled={loading}
                className="px-8 py-5 bg-slate-900 hover:bg-black text-white font-black rounded-2xl shadow-xl transition-all disabled:opacity-50 uppercase tracking-[0.15em] text-xs flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                {loading ? 'Crunching Data...' : activeTab === 'trending' ? 'Scout Trending' : 'Scout Opportunities'} <Icons.Zap />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div ref={resultsRef} className="scroll-mt-24 space-y-6">
        {products.length > 0 && (
          <div className="flex flex-col gap-4">
            {/* Sorting / Filter Bar - Improved with flex-wrap and better padding */}
            <div className="flex flex-col sm:flex-row items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm gap-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Icons.TrendingUp />
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.1em] whitespace-nowrap">Filter by Market Demand</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as DemandFilter[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setDemandFilter(f)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all whitespace-nowrap border-2 ${
                      demandFilter === f 
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100' 
                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    {f === 'ALL' ? 'Show All' : `${f} Demand`}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredProducts.map(p => (
                <ProductCard 
                  key={p.asin} 
                  product={p} 
                  defaultCost={globalCost} 
                  onSave={toggleSaveProduct} 
                  isSaved={savedAsins.has(p.asin)} 
                />
              ))}
              {!loading && filteredProducts.length === 0 && (
                <div className="col-span-full py-20 text-center bg-white border-2 border-dashed border-slate-100 rounded-3xl">
                   <div className="mx-auto w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
                     <Icons.Search />
                   </div>
                   <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">No results match the {demandFilter} demand analytics.</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {!loading && products.length > 0 && (
              <div className="flex items-center justify-center gap-4 mt-8 py-6">
                <button
                  onClick={() => handleSearch(undefined, currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="flex items-center gap-2 px-6 py-3 text-xs font-black text-slate-700 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-emerald-500 transition-all disabled:opacity-30"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  Prev
                </button>
                
                <div className="flex items-center justify-center w-12 h-12 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-300">
                  {currentPage}
                </div>

                <button
                  onClick={() => handleSearch(undefined, currentPage + 1)}
                  disabled={loading || products.length < 5} 
                  className="flex items-center gap-2 px-6 py-3 text-xs font-black text-slate-700 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-emerald-500 transition-all disabled:opacity-30"
                >
                  Next
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </div>
            )}
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="col-span-full py-24 text-center opacity-30 bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center">
             <div className="p-6 bg-slate-50 rounded-full mb-6 text-emerald-600">
               <Icons.Search />
             </div>
             <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Ready to Scout</h3>
             <p className="mt-2 font-black text-slate-400 uppercase tracking-widest text-[10px]">
               {activeTab === 'trending' ? 'Identify trending movers & shakers' : 'Search by ASIN or keyword to begin'}
             </p>
          </div>
        )}

        {loading && (
          <div className="col-span-full py-24 text-center bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-slate-100 flex flex-col items-center justify-center animate-pulse">
             <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-6"></div>
             <p className="font-black text-slate-900 text-lg uppercase tracking-tighter">Crunching Market Data...</p>
             <p className="text-slate-400 text-sm font-medium">Validating inventory gaps in {currentMarketplace?.name}...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
