
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Product, User, SubscriptionTier } from '../types';
import { searchProducts } from '../services/amazonService';
import { strapiService } from '../services/strapiService';
import ProductCard from './ProductCard';
import PricingModal from './PricingModal';
import { Icons, COUNTRY_MARKETPLACES, AMAZON_CATEGORIES, REFERRAL_FEE_PERCENT, ESTIMATED_FBA_FEE } from '../constants';

type SortOption = 'RELEVANCE' | 'BSR_ASC' | 'PRICE_DESC' | 'ROI_DESC';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'online' | 'trending'>('online');
  const [query, setQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [selectedCategory, setSelectedCategory] = useState('aps');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState<SortOption>('RELEVANCE');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [globalCost, setGlobalCost] = useState<number>(0);
  const [selectedAsins, setSelectedAsins] = useState<Set<string>>(new Set());
  const [savedAsins, setSavedAsins] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<User | null>(null);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const resultsRef = useRef<HTMLDivElement>(null);

  const activeMarketplace = useMemo(() => 
    COUNTRY_MARKETPLACES.find(m => m.code === selectedCountry) || COUNTRY_MARKETPLACES[0], 
  [selectedCountry]);

  const currencySymbol = activeMarketplace.symbol;

  useEffect(() => {
    const stored = localStorage.getItem('arbitrage_scout_user');
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      loadWatchlist(u.id).catch(e => setError(e.message));
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
    setError(null);
    setCurrentPage(pageNum);
    setSelectedAsins(new Set());
    try {
      const results = await searchProducts(query, selectedCountry, selectedCategory, minPrice === '' ? undefined : Number(minPrice), maxPrice === '' ? undefined : Number(maxPrice), pageNum);
      setProducts(results);
      if (pageNum > 1 || results.length > 0) resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sortedProducts = useMemo(() => {
    const list = [...products];
    if (sortBy === 'BSR_ASC') return list.sort((a, b) => a.bsr - b.bsr);
    if (sortBy === 'PRICE_DESC') return list.sort((a, b) => b.price - a.price);
    if (sortBy === 'ROI_DESC') {
      return list.sort((a, b) => {
        const roiA = globalCost > 0 ? ((a.price - globalCost - (a.price * REFERRAL_FEE_PERCENT) - ESTIMATED_FBA_FEE) / globalCost) : 0;
        const roiB = globalCost > 0 ? ((b.price - globalCost - (b.price * REFERRAL_FEE_PERCENT) - ESTIMATED_FBA_FEE) / globalCost) : 0;
        return roiB - roiA;
      });
    }
    return list;
  }, [products, sortBy, globalCost]);

  const toggleSelect = (asin: string) => {
    const next = new Set(selectedAsins);
    if (next.has(asin)) next.delete(asin);
    else next.add(asin);
    setSelectedAsins(next);
  };

  const handleSaveProduct = async (product: Product) => {
    if (!user) return;
    try {
      if (savedAsins.has(product.asin)) {
        await strapiService.removeProduct(user.id, product.asin);
        const next = new Set(savedAsins);
        next.delete(product.asin);
        setSavedAsins(next);
      } else {
        await strapiService.saveProduct(user.id, product);
        const next = new Set(savedAsins);
        next.add(product.asin);
        setSavedAsins(next);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleBulkSave = async () => {
    if (!user) return;
    const selectedProducts = products.filter(p => selectedAsins.has(p.asin));
    try {
      for (const p of selectedProducts) {
        if (!savedAsins.has(p.asin)) {
          await strapiService.saveProduct(user.id, p);
        }
      }
      await loadWatchlist(user.id);
      setSelectedAsins(new Set());
    } catch (err: any) {
      setError(err.message);
    }
  };

  const exportCSV = (pList: Product[]) => {
    try {
      const headers = "ASIN,Title,Price,BSR,Sales Volume,ROI%,Profit,Link\n";
      const rows = pList.map(p => {
        const referral = p.price * REFERRAL_FEE_PERCENT;
        const profit = p.price - globalCost - referral - ESTIMATED_FBA_FEE;
        const roi = globalCost > 0 ? (profit / globalCost) * 100 : 0;
        return `"${p.asin}","${p.title.replace(/"/g, '""')}",${p.price},${p.bsr},"${p.salesVolume}",${roi.toFixed(1)}%,${profit.toFixed(2)},"${p.productUrl}"`;
      }).join("\n");
      
      const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", `arbitrage_scout_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError("Failed to export CSV. Please try again.");
    }
  };

  return (
    <div className="animate-fade-in" style={{paddingBottom: '5rem'}}>
      <PricingModal isOpen={isPricingModalOpen} onClose={() => setIsPricingModalOpen(false)} onUpgrade={() => {}} />

      {error && (
        <div className="error-banner">
          <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
            <Icons.Zap /> <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="error-close-btn">
             <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      <div className="scout-header-card">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h1 style={{fontSize: '1.25rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0}}>
             <div className="brand-icon"><Icons.LayoutDashboard /></div>
             Scout Deals
          </h1>
          <div style={{background: 'var(--emerald-50)', color: 'var(--emerald-700)', padding: '0.4rem 0.75rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px'}}>
            <Icons.Zap /> {user?.searchCredits === 999999 ? '∞' : user?.searchCredits}
          </div>
        </div>

        <div className="scout-tabs">
          <button onClick={() => setActiveTab('online')} className={`tab-btn ${activeTab === 'online' ? 'tab-btn-active' : ''}`}>Manual Search</button>
          <button onClick={() => setActiveTab('trending')} className={`tab-btn ${activeTab === 'trending' ? 'tab-btn-active' : ''}`}>Trending</button>
        </div>

        <div className="search-input-wrapper">
          <div className="search-icon"><Icons.Search /></div>
          <input 
            type="text" 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            placeholder="Search keywords or ASIN..." 
            className="search-field" 
          />
        </div>

        <div className="filter-grid">
          <div className="filter-item">
            <span className="filter-label">Market</span>
            <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)} className="filter-select">
              {COUNTRY_MARKETPLACES.map(m => <option key={m.code} value={m.code}>{m.name}</option>)}
            </select>
          </div>
          <div className="filter-item">
            <span className="filter-label">Category</span>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="filter-select">
              {AMAZON_CATEGORIES.map(cat => {
                if (cat.children) {
                  return (
                    <optgroup key={cat.id} label={cat.name}>
                      {cat.children.map(child => (
                        <option key={child.id} value={child.id}>{child.name}</option>
                      ))}
                    </optgroup>
                  );
                }
                return <option key={cat.id} value={cat.id}>{cat.name}</option>;
              })}
            </select>
          </div>
          <div className="filter-item">
            <span className="filter-label">Sort Results</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="filter-select">
              <option value="RELEVANCE">Relevance</option>
              <option value="BSR_ASC">BSR: Low to High</option>
              <option value="PRICE_DESC">Price: High to Low</option>
              <option value="ROI_DESC">ROI: High to Low</option>
            </select>
          </div>
        </div>

        <div className="filter-grid" style={{marginTop: '0.75rem'}}>
          <div className="filter-item">
            <span className="filter-label">Min Price ({currencySymbol})</span>
            <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0.00" className="filter-input" />
          </div>
          <div className="filter-item">
            <span className="filter-label">Max Price ({currencySymbol})</span>
            <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Any" className="filter-input" />
          </div>
          <div className="filter-item">
            <span className="filter-label">Target Unit Cost ({currencySymbol})</span>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '1rem', fontWeight: 900, marginRight: '4px', color: 'var(--slate-400)' }}>{currencySymbol}</span>
              <input type="number" value={globalCost} onChange={(e) => setGlobalCost(Number(e.target.value))} className="filter-input" />
            </div>
          </div>
        </div>

        <div style={{marginTop: '1.25rem'}}>
          <button onClick={(e) => handleSearch(e)} disabled={loading} className="btn-primary w-full">
            {loading ? 'Searching...' : 'Scout Deals'} <Icons.Zap />
          </button>
        </div>
      </div>

      <div ref={resultsRef} className="product-grid">
        {sortedProducts.map(p => (
          <ProductCard 
            key={p.asin} 
            product={p} 
            defaultCost={globalCost} 
            forcedCurrencySymbol={currencySymbol}
            isSaved={savedAsins.has(p.asin)} 
            onSave={() => handleSaveProduct(p)}
            isSelected={selectedAsins.has(p.asin)}
            onToggleSelect={() => toggleSelect(p.asin)}
          />
        ))}
      </div>
      
      {!loading && products.length === 0 && (
        <div style={{padding: '5rem 0', textAlign: 'center', opacity: 0.3}}>
          <div style={{marginBottom: '1rem'}}><Icons.Search /></div>
          <p style={{fontWeight: 900, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.1em'}}>Enter search terms to find ROI</p>
        </div>
      )}

      {selectedAsins.size > 0 && (
        <div className="bulk-action-bar">
          <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
            <span style={{background: 'var(--emerald-500)', color: 'white', padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 900}}>{selectedAsins.size}</span>
            <span style={{fontSize: '0.85rem', fontWeight: 800}}>Scouted</span>
          </div>
          <div className="flex gap-2">
            <button onClick={handleBulkSave} className="bulk-btn" style={{padding: '0.5rem'}}><Icons.BookmarkCheck /></button>
            <button onClick={() => exportCSV(products.filter(p => selectedAsins.has(p.asin)))} className="bulk-btn" style={{padding: '0.5rem', fontSize: '0.75rem', fontWeight: 900}}>CSV</button>
            <button onClick={() => setSelectedAsins(new Set())} className="bulk-btn" style={{padding: '0.5rem', opacity: 0.6}}><svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
