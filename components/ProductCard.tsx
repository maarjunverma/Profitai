
import React, { useState, useMemo } from 'react';
import { Product, ProfitStats } from '../types';
import { Icons, REFERRAL_FEE_PERCENT, ESTIMATED_FBA_FEE, getCurrencySymbol } from '../constants';
import { getScoutInsights } from '../services/amazonService';

interface ProductCardProps {
  product: Product;
  defaultCost?: number;
  onSave?: (product: Product) => void;
  isSaved?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, defaultCost = 0, onSave, isSaved }) => {
  const [costPrice, setCostPrice] = useState<number>(defaultCost || Math.floor(product.price * 0.5));
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const currencySymbol = getCurrencySymbol(product.currency);

  const stats = useMemo((): ProfitStats => {
    const referralFee = product.price * REFERRAL_FEE_PERCENT;
    const fbaFee = ESTIMATED_FBA_FEE;
    const netProfit = product.price - costPrice - referralFee - fbaFee;
    const roi = costPrice > 0 ? (netProfit / costPrice) * 100 : 0;
    return { costPrice, referralFee, fbaFee, netProfit, roi, margin: 0 };
  }, [product.price, costPrice]);

  const fetchInsight = async () => {
    if (insight) return;
    setLoadingInsight(true);
    const text = await getScoutInsights(product);
    setInsight(text);
    setLoadingInsight(false);
  };

  return (
    <div className={`scout-card ${stats.roi > 30 ? 'scout-card-hot' : ''}`}>
      <div className="card-top">
        <div className="card-img-box">
          <img src={product.imageUrl} alt={product.title} />
          {stats.roi > 30 && <div className="hot-badge">HIGH ROI</div>}
        </div>
        <div className="card-info">
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <h3 className="product-title">{product.title}</h3>
            <div style={{display: 'flex', gap: '4px'}}>
              <a href={product.productUrl} target="_blank" className="nav-link" style={{padding: '4px'}}><Icons.ExternalLink /></a>
              <button onClick={() => onSave?.(product)} className="nav-link" style={{padding: '4px', color: isSaved ? 'var(--emerald-600)' : ''}}><Icons.Bookmark /></button>
            </div>
          </div>
          <div className="product-meta">
            <span className="asin-pill">{product.asin}</span>
            <span style={{color: '#0f172a', fontWeight: 800}}>BSR #{product.bsr.toLocaleString()}</span>
          </div>
          <div className="price-section">
            <div>
              <span className="stat-label">Amazon {product.currency}</span>
              <div className="price-display">{currencySymbol}{product.price.toFixed(2)}</div>
            </div>
            <div style={{flex: 1}}>
              <span className="stat-label">Your Cost</span>
              <input type="number" value={costPrice} onChange={(e) => setCostPrice(Number(e.target.value))} className="filter-input" style={{fontSize: '1rem', borderBottom: '2px solid var(--slate-100)'}} />
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
          <span className="stat-label">Referral</span>
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

      <div style={{padding: '1rem', background: 'var(--slate-50)', borderTop: '1px solid var(--slate-100)'}}>
        {!insight ? (
          <button onClick={fetchInsight} disabled={loadingInsight} style={{fontSize: '10px', fontWeight: 900, color: 'var(--emerald-600)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <Icons.Zap /> {loadingInsight ? 'Consulting Scout Intelligence...' : 'Get Insight Verdict'}
          </button>
        ) : (
          <p style={{fontSize: '11px', color: 'var(--slate-600)', margin: 0}}>
            <strong style={{color: 'var(--emerald-600)', textTransform: 'uppercase', marginRight: '8px'}}>Verdict:</strong>
            {insight}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
