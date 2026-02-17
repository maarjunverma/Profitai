
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Product, User, SubscriptionTier } from '../types';
import { searchProducts } from '../services/amazonService';
import { strapiService } from '../services/strapiService';
import ProductCard from './ProductCard';
import PricingModal from './PricingModal';
import { Icons, COUNTRY_MARKETPLACES, AMAZON_CATEGORIES, REFERRAL_FEE_PERCENT, ESTIMATED_FBA_FEE } from '../constants';

type SortOption = 'RELEVANCE' | 'BSR_ASC' | 'PRICE_DESC' | 'ROI_DESC';

const ScoutDropdown: React.FC<{
  label: string;
  value: string;
  options: { id: string; name: string; isGroup?: boolean }[];
  onChange: (val: string) => void;
}> = ({ label, value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedName = options.find(o => o.id === value)?.name || value;

  return (
    <div className="dropdown-container" ref={containerRef}>
      <button 
        type="button"
        className={`dropdown-trigger ${isOpen ? 'dropdown-trigger-active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="filter-label">{label}</span>
        <span className="filter-select" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '1.5rem' }}>
          {selectedName}
        </span>
        <div className="dropdown-chevron">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          {options.map((opt, idx) => (
            <React.Fragment key={`${opt.id}-${idx}`}>
              {opt.isGroup ? (
                <div className="dropdown-group-label">{opt.name}</div>
              ) : (
                <div 
                  className={`dropdown-item ${value === opt.id ? 'dropdown-item-active' : ''}`}
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                  }}
                >
                  {opt.name}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

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

  const countryOptions = COUNTRY_MARKETPLACES.map(m => ({ id: m.code, name: m.name }));
  const categoryOptions = useMemo(() => {
    const opts: { id: string; name: string; isGroup?: boolean }[] = [];
    AMAZON_CATEGORIES.forEach(cat => {
      if (cat.children) {
        opts.push({ id: `group-${cat.id}`, name: cat.name, isGroup: true });
        cat.children.forEach(child => {
          opts.push({ id: child.id, name: child.name });
        });
      } else {
        opts.push({ id: cat.id, name: cat.name });
      }
    });
    return opts;
  }, []);

  const sortOptions = [
    { id: 'RELEVANCE', name: 'Relevance' },
    { id: 'BSR_ASC', name: 'BSR: Low to High' },
    { id: 'PRICE_DESC', name: 'Price: High to Low' },
    { id: 'ROI_DESC', name: 'ROI: High to Low' }
  ];

  return (
    <div className="animate-fade-in" style={{paddingBottom: '2rem'}}>
      <PricingModal isOpen={isPricingModalOpen} onClose={() => setIsPricingModalOpen(false)} onUpgrade={() => {}} />

      {error && (
        <div className="error-banner">
          <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
            <Icons.Zap /> <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="error-close-btn">
             <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      <div className="scout-header-card">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem'}}>
          <h1 style={{fontSize: '1.25rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0}}>
             <div style={{padding: '0.4rem', background: '#0f172a', color: 'white', borderRadius: '10px'}}><Icons.LayoutDashboard /></div>
             <span className="hidden-mobile">Product</span> Scout
          </h1>
          <div className="credit-badge" style={{padding: '0.4rem 0.75rem', fontSize: '0.7rem'}}>
            <Icons.Zap /> {user?.searchCredits === 999999 ? 'Unlimited' : user?.searchCredits}
          </div>
        </div>

        <div className="scout-tabs">
          <button onClick={() => setActiveTab('online')} className={`tab-btn ${activeTab === 'online' ? 'tab-btn-active' : ''}`}>Search</button>
          <button onClick={() => setActiveTab('trending')} className={`tab-btn ${activeTab === 'trending' ? 'tab-btn-active' : ''}`}>Trending</button>
        </div>

        <div className="search-input-wrapper">
          <div className="search-icon"><Icons.Search /></div>
          <input 
            type="text" 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            placeholder="Search keywords..." 
            className="search-field" 
          />
        </div>

        <div className="filter-grid">
          <ScoutDropdown 
            label="Market" 
            value={selectedCountry} 
            options={countryOptions} 
            onChange={setSelectedCountry} 
          />
          <ScoutDropdown 
            label="Category" 
            value={selectedCategory} 
            options={categoryOptions} 
            onChange={setSelectedCategory} 
          />
          <ScoutDropdown 
            label="Sort By" 
            value={sortBy} 
            options={sortOptions} 
            onChange={(val) => setSortBy(val as SortOption)} 
          />
        </div>

        <div className="filter-grid" style={{marginTop: '0.75rem'}}>
          <div className="filter-item">
            <span className="filter-label">Min $</span>
            <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0" className="filter-input" />
          </div>
          <div className="filter-item">
            <span className="filter-label">Max $</span>
            <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Max" className="filter-input" />
          </div>
          <div className="filter-item">
            <span className="filter-label">Unit Cost</span>
            <input type="number" value={globalCost} onChange={(e) => setGlobalCost(Number(e.target.value))} className="filter-input" style={{fontWeight: 900}} />
          </div>
        </div>

        <div style={{marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--slate-100)'}}>
          <button onClick={(e) => handleSearch(e)} disabled={loading} className="btn-primary" style={{width: '100%'}}>
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
            isSaved={savedAsins.has(p.asin)} 
            onSave={() => handleSaveProduct(p)}
            isSelected={selectedAsins.has(p.asin)}
            onToggleSelect={() => toggleSelect(p.asin)}
          />
        ))}
      </div>
      
      {!loading && products.length === 0 && (
        <div style={{padding: '4rem 0', textAlign: 'center', opacity: 0.4}}>
          <div style={{marginBottom: '1rem'}}><Icons.Search /></div>
          <p style={{fontWeight: 900, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.1em'}}>Enter search terms to begin</p>
        </div>
      )}

      {selectedAsins.size > 0 && (
        <div className="bulk-action-bar">
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <span className="bulk-count">{selectedAsins.size}</span>
            <span style={{fontSize: '0.75rem', fontWeight: 700}}>Selected</span>
          </div>
          <div style={{width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)'}} />
          <button onClick={handleBulkSave} className="bulk-btn">
            <Icons.BookmarkCheck /> Save
          </button>
          <button onClick={() => exportCSV(products.filter(p => selectedAsins.has(p.asin)))} className="bulk-btn">
             Export CSV
          </button>
          <button onClick={() => setSelectedAsins(new Set())} className="bulk-btn" style={{color: 'var(--slate-400)'}}>
            Clear
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
