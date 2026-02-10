
import React, { useState, useMemo } from 'react';
import { Product, ProfitStats, CompetitorPrice } from '../types';
import { Icons, REFERRAL_FEE_PERCENT, ESTIMATED_FBA_FEE, getCurrencySymbol } from '../constants';
import { getScoutInsights, getCompetitorPrices } from '../services/amazonService';

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
  
  const [competitors, setCompetitors] = useState<CompetitorPrice[]>([]);
  const [loadingCompetitors, setLoadingCompetitors] = useState(false);
  const [showCompetitors, setShowCompetitors] = useState(false);

  const currencySymbol = getCurrencySymbol(product.currency);

  const stats = useMemo((): ProfitStats => {
    const referralFee = product.price * REFERRAL_FEE_PERCENT;
    const fbaFee = ESTIMATED_FBA_FEE;
    const netProfit = product.price - costPrice - referralFee - fbaFee;
    const roi = costPrice > 0 ? (netProfit / costPrice) * 100 : 0;
    const margin = (netProfit / product.price) * 100;

    return { costPrice, referralFee, fbaFee, netProfit, roi, margin };
  }, [product.price, costPrice]);

  const isHighDemand = product.salesVolume && (product.salesVolume.includes('k') || parseInt(product.salesVolume) > 500);

  const getStatusColor = () => {
    if (stats.roi > 30) return 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-lg shadow-emerald-50';
    if (stats.roi < 10) return 'border-red-500 bg-red-50 text-red-700';
    return 'border-slate-200 bg-white text-slate-700 shadow-sm';
  };

  const fetchInsight = async () => {
    if (insight) return;
    setLoadingInsight(true);
    const text = await getScoutInsights(product);
    setInsight(text);
    setLoadingInsight(false);
  };

  const fetchCompetitors = async () => {
    setShowCompetitors(true);
    if (competitors.length > 0) return;
    setLoadingCompetitors(true);
    const results = await getCompetitorPrices(product);
    setCompetitors(results);
    setLoadingCompetitors(false);
  };

  return (
    <div className={`flex flex-col rounded-xl border-2 transition-all overflow-hidden ${getStatusColor()}`}>
      <div className="flex flex-col sm:flex-row p-4 gap-4 bg-white flex-1">
        {/* Product Image */}
        <div className="w-full sm:w-32 h-32 flex-shrink-0 bg-slate-50 rounded-lg overflow-hidden border border-slate-100 group relative">
          <img 
            src={product.imageUrl} 
            alt={product.title} 
            className="w-full h-full object-contain mix-blend-multiply transition-transform group-hover:scale-110"
          />
          {isHighDemand && (
             <div className="absolute top-1 left-1 bg-emerald-600 text-[10px] text-white font-black px-1.5 py-0.5 rounded shadow-sm">
               HIGH DEMAND
             </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-tight" title={product.title}>
                {product.title}
              </h3>
              <div className="flex items-center gap-1">
                <a 
                  href={product.productUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                  title="View on Amazon"
                >
                  <Icons.ExternalLink />
                </a>
                <button 
                  onClick={() => onSave?.(product)}
                  className={`p-2 rounded-full hover:bg-slate-100 transition-colors ${isSaved ? 'text-emerald-600' : 'text-slate-400'}`}
                >
                  {isSaved ? <Icons.BookmarkCheck /> : <Icons.Bookmark />}
                </button>
              </div>
            </div>
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-500">
              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{product.asin}</span>
              <span className="flex items-center gap-1 text-slate-900 font-semibold"><Icons.TrendingUp /> BSR #{product.bsr.toLocaleString()}</span>
              {product.salesVolume && (
                <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                  🔥 {product.salesVolume} last mo.
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 items-end">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Amazon Price ({product.currency})</span>
              <div className="text-2xl font-black text-slate-900 leading-none">{currencySymbol}{product.price.toFixed(2)}</div>
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter block mb-1">Your Cost ({currencySymbol})</label>
              <input 
                type="number" 
                value={costPrice}
                onChange={(e) => setCostPrice(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-md px-3 py-1.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Calculator Results */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-slate-100 px-4 py-3 gap-4 bg-white">
        <Stat label="Referral (15%)" value={`${currencySymbol}${stats.referralFee.toFixed(2)}`} />
        <Stat label="FBA Fee (Est)" value={`${currencySymbol}${stats.fbaFee.toFixed(2)}`} />
        <Stat label="Net Profit" value={`${currencySymbol}${stats.netProfit.toFixed(2)}`} highlight={stats.netProfit > 0} />
        <Stat label="ROI %" value={`${stats.roi.toFixed(1)}%`} highlight={stats.roi > 30} />
      </div>

      {/* Arbitrage Gap Analysis Section */}
      <div className="border-t border-slate-100 bg-white">
        {!showCompetitors ? (
          <button 
            onClick={fetchCompetitors}
            className="w-full py-2 text-[10px] font-black text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <Icons.Globe /> Analyze Arbitrage Gap
          </button>
        ) : (
          <div className="p-4 bg-emerald-50/30 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Pricing Gap analysis</span>
              <button onClick={() => setShowCompetitors(false)} className="text-[10px] font-bold text-slate-400 hover:text-slate-600">Hide</button>
            </div>
            
            {loadingCompetitors ? (
              <div className="flex items-center gap-2 py-2">
                <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-[11px] font-bold text-slate-400">Scouring Walmart, eBay, and more...</span>
              </div>
            ) : competitors.length > 0 ? (
              <div className="space-y-2">
                {competitors.map((comp, idx) => {
                  const gap = product.price - comp.price;
                  const isGapProfitable = gap > (product.price * 0.2); // 20% gap threshold
                  return (
                    <div key={idx} className="flex items-center justify-between text-[11px] border-b border-emerald-100/50 pb-1.5 last:border-0">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-800">{comp.store}</span>
                        <a href={comp.url} target="_blank" className="text-[9px] text-emerald-600 font-bold hover:underline">Source Link</a>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-slate-900">{currencySymbol}{comp.price.toFixed(2)}</span>
                          <span className={`font-black text-[9px] ${isGapProfitable ? 'text-emerald-600' : 'text-slate-400'}`}>
                            Gap: {currencySymbol}{gap.toFixed(2)}
                          </span>
                        </div>
                        {isGapProfitable && (
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200 animate-pulse" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic">No direct price gaps found for this specific ASIN.</p>
            )}
          </div>
        )}
      </div>

      {/* Scout Insights */}
      <div className="bg-slate-50 p-4 border-t border-slate-100">
        {!insight ? (
          <button 
            onClick={fetchInsight}
            disabled={loadingInsight}
            className="flex items-center gap-2 text-[10px] font-black text-emerald-600 hover:text-emerald-700 disabled:opacity-50 uppercase tracking-widest"
          >
            <Icons.Zap /> {loadingInsight ? 'Consulting Gemini Intelligence...' : 'Get Scout Intelligence Verdict'}
          </button>
        ) : (
          <p className="text-[11px] italic text-slate-600 leading-relaxed">
            <span className="font-bold text-emerald-600 not-italic uppercase mr-2 tracking-tighter">Scout Verdict:</span>
            {insight}
          </p>
        )}
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string, value: string, highlight?: boolean }> = ({ label, value, highlight }) => (
  <div className="flex flex-col">
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</span>
    <span className={`text-sm font-black ${highlight ? 'text-emerald-600' : 'text-slate-800'}`}>{value}</span>
  </div>
);

export default ProductCard;
