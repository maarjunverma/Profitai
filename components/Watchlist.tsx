
import React, { useState, useEffect } from 'react';
import { SavedProduct, User, Product } from '../types';
import { strapiService } from '../services/strapiService';
import { searchProducts } from '../services/amazonService';
import ProductCard from './ProductCard';
import { Icons, REFERRAL_FEE_PERCENT, ESTIMATED_FBA_FEE } from '../constants';

const Watchlist: React.FC = () => {
  const [watchlist, setWatchlist] = useState<SavedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedAsins, setSelectedAsins] = useState<Set<string>>(new Set());

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

  const toggleSelect = (asin: string) => {
    const next = new Set(selectedAsins);
    if (next.has(asin)) next.delete(asin);
    else next.add(asin);
    setSelectedAsins(next);
  };

  const handleSync = async () => {
    const stored = localStorage.getItem('arbitrage_scout_user');
    if (!stored || watchlist.length === 0) return;
    const u: User = JSON.parse(stored);
    
    setSyncing(true);
    const updatedWatchlist = [...watchlist];
    
    for (let i = 0; i < updatedWatchlist.length; i++) {
      const p = updatedWatchlist[i];
      try {
        const results = await searchProducts(p.asin, 'US'); 
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
    const nextSelect = new Set(selectedAsins);
    nextSelect.delete(product.asin);
    setSelectedAsins(nextSelect);
  };

  const handleBulkRemove = async () => {
    const stored = localStorage.getItem('arbitrage_scout_user');
    if (!stored) return;
    const u: User = JSON.parse(stored);
    
    for (const asin of selectedAsins) {
      await strapiService.removeProduct(u.id, asin);
    }
    setWatchlist(prev => prev.filter(p => !selectedAsins.has(p.asin)));
    setSelectedAsins(new Set());
  };

  const exportCSV = (pList: Product[]) => {
    const headers = "ASIN,Title,Current Price,BSR,Rating,Reviews,Saved Price,Saved Date,Link\n";
    const rows = pList.map(p => {
      const saved = p as SavedProduct;
      return `"${p.asin}","${p.title.replace(/"/g, '""')}",${p.price},${p.bsr},${p.rating},${p.reviewCount},${saved.trackedPrice},"${saved.savedAt}","${p.productUrl}"`;
    }).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `watchlist_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return (
    <div className="py-20 text-center flex flex-col items-center">
      <div className="animate-spin" style={{width: '2rem', height: '2rem', border: '4px solid var(--emerald-600)', borderTopColor: 'transparent', borderRadius: '50%', marginBottom: '1rem'}}></div>
      <p className="font-bold" style={{color: 'var(--slate-400)'}}>Syncing with Scout Database...</p>
    </div>
  );

  return (
    <div className="animate-in" style={{display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '4rem'}}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
            <Icons.Bookmark /> My Watchlist
          </h1>
          <p className="text-slate-500 mt-1">Persisted FBA scouting sessions. Select products to export or clear.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => exportCSV(watchlist)}
            className="nav-link"
            style={{background: 'var(--white)', border: '1px solid var(--slate-200)'}}
          >
            Export All CSV
          </button>
          <button 
            onClick={handleSync}
            disabled={syncing || watchlist.length === 0}
            className="btn-primary"
            style={{background: syncing ? 'var(--slate-100)' : 'var(--emerald-600)', color: syncing ? 'var(--slate-400)' : 'white'}}
          >
            {syncing ? 'Syncing...' : 'Sync Latest Prices'}
          </button>
        </div>
      </div>

      {watchlist.length > 0 ? (
        <div className="product-grid">
          {watchlist.map(product => {
            const priceDiff = product.price - product.trackedPrice;
            const isLower = priceDiff < 0;
            return (
              <div key={product.asin} className="relative">
                <ProductCard 
                  product={product} 
                  isSaved={true}
                  onSave={handleRemove}
                  isSelected={selectedAsins.has(product.asin)}
                  onToggleSelect={() => toggleSelect(product.asin)}
                />
                {priceDiff !== 0 && (
                  <div style={{
                    position: 'absolute', 
                    top: '0.75rem', 
                    right: '4rem', 
                    background: isLower ? 'var(--emerald-100)' : 'var(--slate-100)', 
                    color: isLower ? 'var(--emerald-700)' : 'var(--slate-700)',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '10px',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    zIndex: 5
                  }}>
                    {isLower ? 'Price Drop' : 'Price Up'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-24" style={{background: 'white', borderRadius: '32px', border: '2px dashed var(--slate-200)'}}>
          <div style={{width: '80px', height: '80px', background: 'var(--slate-50)', color: 'var(--slate-400)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto'}}>
            <Icons.Bookmark />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Your Watchlist is Empty</h2>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto">Use the Scout dashboard to find profitable products and save them here for 24h automated tracking.</p>
          <a href="#/" className="inline-flex items-center gap-2 mt-8 text-emerald-600 font-bold" style={{textDecoration: 'none'}}>
             Go to Dashboard <Icons.ExternalLink />
          </a>
        </div>
      )}

      {selectedAsins.size > 0 && (
        <div className="bulk-action-bar">
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <span className="bulk-count">{selectedAsins.size}</span>
            <span style={{fontSize: '0.75rem', fontWeight: 700}}>Selected</span>
          </div>
          <div style={{width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)'}} />
          <button onClick={handleBulkRemove} className="bulk-btn" style={{color: '#f87171'}}>
            Remove Selected
          </button>
          <button onClick={() => exportCSV(watchlist.filter(p => selectedAsins.has(p.asin)))} className="bulk-btn">
             Export Selected CSV
          </button>
          <button onClick={() => setSelectedAsins(new Set())} className="bulk-btn" style={{color: 'var(--slate-400)'}}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default Watchlist;
