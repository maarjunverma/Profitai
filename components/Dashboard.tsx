
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
  const [demandFilter, setDemandFilter] = useState<DemandFilter>('ALL');
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
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

  const handleSearch = async (e?: React.FormEvent, pageNum: number = 1) => {
    if (e) e.preventDefault();
    if (!user) return;
    setLoading(true);
    setCurrentPage(pageNum);
    try {
      const results = await searchProducts(query, selectedCountry, selectedCategory, minPrice === '' ? undefined : Number(minPrice), maxPrice === '' ? undefined : Number(maxPrice), pageNum);
      setProducts(results);
      if (pageNum > 1 || results.length > 0) resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    if (demandFilter === 'ALL') return products;
    return products; // Simplified for production preview
  }, [products, demandFilter]);

  const currentMarketplace = COUNTRY_MARKETPLACES.find(m => m.code === selectedCountry);

  return (
    <div className="animate-fade-in" style={{paddingBottom: '5rem'}}>
      <PricingModal isOpen={isPricingModalOpen} onClose={() => setIsPricingModalOpen(false)} onUpgrade={() => {}} />

      <div className="scout-header-card">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h1 style={{fontSize: '1.5rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
             <div style={{padding: '0.5rem', background: '#0f172a', color: 'white', borderRadius: '12px'}}><Icons.LayoutDashboard /></div>
             Product Scout
          </h1>
          <div className="credit-badge">
            <Icons.Zap /> {user?.searchCredits === 999999 ? 'Unlimited' : `${user?.searchCredits} Credits Left`}
          </div>
        </div>

        <div className="scout-tabs">
          <button onClick={() => setActiveTab('online')} className={`tab-btn ${activeTab === 'online' ? 'tab-btn-active' : ''}`}>Manual Search</button>
          <button onClick={() => setActiveTab('trending')} className={`tab-btn ${activeTab === 'trending' ? 'tab-btn-active' : ''}`}>Trending</button>
        </div>

        <div className="search-input-wrapper">
          <div className="search-icon"><Icons.Search /></div>
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search product name or keyword..." className="search-field" />
        </div>

        <div className="filter-grid">
          <div className="filter-item">
            <span className="filter-label">Country</span>
            <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)} className="filter-select">
              {COUNTRY_MARKETPLACES.map(m => <option key={m.code} value={m.code}>{m.name}</option>)}
            </select>
          </div>
          <div className="filter-item">
            <span className="filter-label">Category</span>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="filter-select">
              {AMAZON_CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div className="filter-item">
            <span className="filter-label">Min Price</span>
            <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0" className="filter-input" />
          </div>
          <div className="filter-item">
            <span className="filter-label">Max Price</span>
            <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Unlimited" className="filter-input" />
          </div>
        </div>

        <div style={{marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--slate-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div className="filter-item" style={{flex: '0 0 200px', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
            <span className="filter-label" style={{margin: 0}}>Unit Cost</span>
            <input type="number" value={globalCost} onChange={(e) => setGlobalCost(Number(e.target.value))} className="filter-input" style={{textAlign: 'right', width: '60px'}} />
          </div>
          <button onClick={(e) => handleSearch(e)} disabled={loading} className="btn-primary">
            {loading ? 'Crunching...' : 'Scout Opportunities'} <Icons.Zap />
          </button>
        </div>
      </div>

      <div ref={resultsRef} className="product-grid">
        {filteredProducts.map(p => (
          <ProductCard key={p.asin} product={p} defaultCost={globalCost} isSaved={savedAsins.has(p.asin)} />
        ))}
      </div>
      
      {!loading && products.length === 0 && (
        <div style={{padding: '5rem 0', textAlign: 'center', opacity: 0.5}}>
          <Icons.Search />
          <p style={{fontWeight: 900, textTransform: 'uppercase', fontSize: '0.75rem', marginTop: '1rem'}}>Ready to Scout Market Intelligence</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
