
import React, { useState } from 'react';
import { User } from '../types';
import { Icons } from '../constants';
import { strapiService } from '../services/strapiService';

interface LandingPageProps {
  onLogin: (user: User) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email || !email.includes('@')) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!phoneNumber || phoneNumber.length < 7) {
      setError("Please enter a valid mobile number.");
      return;
    }
    
    setLoading(true);
    try {
      // Capture lead info
      await strapiService.captureLead(email, phoneNumber);
      // Login/Register session
      const { user } = await strapiService.login(email, phoneNumber);
      onLogin(user);
    } catch (err: any) {
      setError(err.message || "Scout server is unreachable. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-page">
      <section className="hero-section">
        <div className="hero-glow-1" />
        <div className="hero-glow-2" />

        <div className="max-width-wrapper">
          <div className="hero-badge">
            <Icons.TrendingUp /> Get Real-time Product Trends & Demand
          </div>
          
          <h1 className="hero-title">
            Find Profitable Products <br /> on Popular Marketplaces <span style={{color: 'var(--emerald-600)'}}>Instantly.</span>
          </h1>
          
          <p className="hero-subtitle">
            The high-performance dashboard for FBA Sellers. Identify pricing discrepancies, 
            calculate ROI with FBA fees, and track profitable arbitrage opportunities.
          </p>

          <form onSubmit={handleStart} className="access-form">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col text-left gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Account Email</label>
                <input 
                  type="email" 
                  required
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="access-input"
                  style={error && !email.includes('@') ? {borderColor: 'var(--red-600)'} : {}}
                />
              </div>
              
              <div className="flex flex-col text-left gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Mobile Number</label>
                <input 
                  type="tel" 
                  required
                  inputMode="tel"
                  autoComplete="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="access-input"
                  style={error && (!phoneNumber || phoneNumber.length < 7) ? {borderColor: 'var(--red-600)'} : {}}
                />
              </div>
            </div>

            {error && <p style={{color: 'var(--red-600)', fontSize: '0.75rem', fontWeight: 700, margin: '4px 0'}}>{error}</p>}
            
            <button 
              type="submit"
              disabled={loading}
              className="btn-access"
              style={{marginTop: '0.5rem'}}
            >
              {loading ? (
                <>
                  <div className="animate-spin" style={{width: '20px', height: '20px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%'}} />
                  Initializing Scout...
                </>
              ) : (
                <>
                  Access Dashboard <Icons.Zap />
                </>
              )}
            </button>
            <p style={{fontSize: '11px', color: 'var(--slate-400)', marginTop: '1rem'}}>
              Join 2,500+ sellers finding gaps in the Amazon marketplace today.
            </p>
          </form>

          {/* Feature Preview Skeletons */}
          <div style={{marginTop: '5rem', background: 'white', padding: '1.5rem', borderRadius: '32px', border: '1px solid var(--slate-200)', boxShadow: 'var(--shadow-lg)'}} className="mx-auto max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {[1,2].map(i => (
                 <div key={i} style={{background: 'var(--slate-50)', borderRadius: '16px', padding: '1rem', display: 'flex', gap: '1rem', opacity: 0.6}}>
                    <div style={{width: '64px', height: '64px', background: 'var(--slate-200)', borderRadius: '8px', flexShrink: 0}} />
                    <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center'}}>
                      <div style={{height: '10px', background: 'var(--slate-200)', borderRadius: '4px', width: '80%'}} />
                      <div style={{height: '10px', background: 'var(--slate-100)', borderRadius: '4px', width: '50%'}} />
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </section>

      <footer style={{padding: '4rem 0', textAlign: 'center', borderTop: '1px solid var(--slate-100)', marginTop: '4rem'}}>
        <p style={{fontSize: '0.8rem', color: 'var(--slate-400)'}}>© 2024 ArbitrageScout. Powering the next generation of FBA sellers.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
