
import React, { useState, useMemo } from 'react';
import { Product, ProfitStats } from '../types';
import { Icons, REFERRAL_FEE_PERCENT, ESTIMATED_FBA_FEE, getCurrencySymbol } from '../constants';
import { getScoutInsights } from '../services/amazonService';

interface ProductCardProps {
  product: Product;
  defaultCost?: number;
  onSave?: (product: Product) => void;
  isSaved?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  defaultCost = 0, 
  onSave, 
  isSaved,
  isSelected,
  onToggleSelect 
}) => {
  const [costPrice, setCostPrice] = useState<number>(defaultCost || Math.floor(product.price * 0.5));
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);
  const currencySymbol = getCurrencySymbol(product.currency);

  const stats = useMemo((): ProfitStats => {
    const referralFee = product.price * REFERRAL_FEE_PERCENT;
    const fbaFee = ESTIMATED_FBA_FEE;
    const netProfit = product.price - costPrice - referralFee - fbaFee;
    const roi = costPrice > 0 ? (netProfit / costPrice) * 100 : 0;
    return { costPrice, referralFee, fbaFee, netProfit, roi, margin: 0 };
  }, [product.price, costPrice]);

  const fetchInsight = async () => {
    setLoadingInsight(true);
    setInsightError(null);
    try {
      const text = await getScoutInsights(product);
      setInsight(text);
    } catch (err: any) {
      setInsightError(err.message);
    } finally {
      setLoadingInsight(false);
    }
  };

  return (
    <div className={`scout-card ${stats.roi > 30 ? 'scout-card-hot' : ''} ${isSelected ? 'scout-card-selected' : ''}`}>
      <input 
        type="checkbox" 
        checked={!!isSelected} 
        onChange={onToggleSelect} 
        className="card-checkbox"
      />
      
      <div className="card-top">
        <div className="card-img-box" onClick={onToggleSelect} style={{cursor: 'pointer'}}>
          <img src={product.imageUrl} alt={product.title} />
          {stats.roi > 30 && <div className="hot-badge">HIGH ROI</div>}
        </div>
        <div className="card-info">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem'}}>
            <h3 className="product-title">{product.title}</h3>
            <div style={{display: 'flex', gap: '4px', flexShrink: 0}}>
              <a href={product.productUrl} target="_blank" className="nav-link" style={{padding: '4px', background: 'var(--slate-50)', borderRadius: '6px'}}><Icons.ExternalLink /></a>
              <button onClick={() => onSave?.(product)} className="nav-link" style={{padding: '4px', background: isSaved ? 'var(--emerald-50)' : 'var(--slate-50)', color: isSaved ? 'var(--emerald-600)' : 'var(--slate-400)', borderRadius: '6px'}}>
                {isSaved ? <Icons.BookmarkCheck /> : <Icons.Bookmark />}
              </button>
            </div>
          </div>
          <div className="product-meta">
            <span className="asin-pill">{product.asin}</span>
            <span style={{color: 'var(--slate-800)', fontWeight: 800}}>BSR #{product.bsr.toLocaleString()}</span>
            {product.salesVolume && product.salesVolume !== 'N/A' && (
              <span className="volume-badge">{product.salesVolume} mo</span>
            )}
          </div>
          <div className="price-section">
            <div style={{minWidth: '70px'}}>
              <span className="stat-label">Amazon</span>
              <div className="price-display" style={{fontSize: 'clamp(1.1rem, 4vw, 1.5rem)'}}>{currencySymbol}{product.price.toFixed(2)}</div>
            </div>
            <div style={{flex: 1, minWidth: '0'}}>
              <span className="stat-label">Your Cost</span>
              <input 
                type="number" 
                value={costPrice} 
                onChange={(e) => setCostPrice(Number(e.target.value))} 
                className="filter-input" 
                style={{fontSize: 'clamp(0.9rem, 3.5vw, 1.1rem)', borderBottom: '1px solid var(--slate-200)', padding: '2px 0'}} 
              />
            </div>
          </div>
        </div>
      </div>

      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-label">FBA Fee</span>
          <span className="stat-value">{currencySymbol}{stats.fbaFee.toFixed(2)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Ref. Fee</span>
          <span className="stat-value">{currencySymbol}{stats.referralFee.toFixed(2)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Profit</span>
          <span className={`stat-value ${stats.netProfit > 0 ? 'stat-value-success' : ''}`}>{currencySymbol}{stats.netProfit.toFixed(2)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">ROI</span>
          <span className={`stat-value ${stats.roi > 30 ? 'stat-value-success' : ''}`}>{stats.roi.toFixed(1)}%</span>
        </div>
      </div>

      <div style={{padding: '0.75rem 1rem', background: 'var(--slate-50)', borderTop: '1px solid var(--slate-100)'}}>
        {insightError ? (
           <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
             <p style={{fontSize: '9px', color: 'var(--red-700)', fontWeight: 800, margin: 0}}>{insightError}</p>
             <button onClick={fetchInsight} style={{fontSize: '8px', fontWeight: 900, color: 'var(--slate-500)', textTransform: 'uppercase', cursor: 'pointer', border: 'none', background: 'none', textAlign: 'left', padding: 0}}>Retry Analysis</button>
           </div>
        ) : !insight ? (
          <button onClick={fetchInsight} disabled={loadingInsight} style={{fontSize: '9px', fontWeight: 900, color: 'var(--emerald-600)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '6px', width: '100%', justifyContent: 'center', cursor: 'pointer', border: 'none', background: 'none'}}>
            <div className={loadingInsight ? 'animate-spin' : ''}><Icons.Zap /></div> 
            {loadingInsight ? 'Consulting AI...' : 'Analyze Opportunity'}
          </button>
        ) : (
          <div style={{fontSize: '10px', color: 'var(--slate-700)', display: 'flex', gap: '8px', alignItems: 'flex-start'}}>
            <div style={{color: 'var(--emerald-600)', flexShrink: 0}}><Icons.Sparkles /></div>
            <div>
              <strong style={{color: 'var(--emerald-600)', textTransform: 'uppercase', marginRight: '4px'}}>AI Verdict:</strong>
              {insight}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
