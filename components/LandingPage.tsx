
import React, { useState } from 'react';
import { User } from '../types';
import { Icons } from '../constants';
import { strapiService } from '../services/strapiService';

interface LandingPageProps {
  onLogin: (user: User) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      alert("Please enter a valid email address.");
      return;
    }
    
    setLoading(true);
    try {
      // 1. Send email data to Strapi lead endpoint api.madsag.in/amazonEmailLeads
      // We wait for this to complete or fail gracefully
      await strapiService.captureLead(email);
      
      // 2. Proceed with the dashboard access (mock authentication)
      const { user } = await strapiService.login(email);
      onLogin(user);
    } catch (error) {
      console.error("Access failed:", error);
      alert("Authentication encountered an issue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-200/30 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-200/30 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-black text-emerald-600 uppercase tracking-widest shadow-sm mb-8">
            <Icons.TrendingUp /> LIVE PRODUCTION DATA ENABLED
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
            Find Profitable Amazon <br /> Products in <span className="text-emerald-600">Seconds.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-slate-600 mb-10 leading-relaxed">
            The all-in-one Smart Ai intelligence dashboard for FBA Sellers. Real-time data, ROI analysis, and secure watchlist tracking.
          </p>

          <form onSubmit={handleStart} className="max-w-md mx-auto flex flex-col gap-4">
            <div className="relative group">
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email to start scouting..."
                className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all group-hover:border-slate-300"
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="px-10 py-5 bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-bold rounded-2xl transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  Access Dashboard <Icons.Zap />
                </>
              )}
            </button>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
              By clicking, you agree to our data processing for arbitrage analytics.
            </p>
          </form>

          <div className="mt-20 relative max-w-5xl mx-auto bg-white p-4 rounded-3xl border border-slate-200 shadow-2xl overflow-hidden group">
            <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex aspect-video items-center justify-center p-8 transition-transform group-hover:scale-[1.01]">
              <div className="grid grid-cols-2 gap-4 w-full">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-white rounded-xl border border-slate-200 p-4 flex gap-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-lg animate-pulse" />
                    <div className="flex-1 space-y-2 opacity-50">
                      <div className="h-3 w-3/4 bg-slate-200 rounded animate-pulse" />
                      <div className="h-3 w-1/2 bg-slate-200 rounded animate-pulse" />
                      <div className="h-3 w-1/4 bg-emerald-100 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent pointer-events-none" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
