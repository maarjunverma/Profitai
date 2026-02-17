
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
  const [error, setError] = useState<string | null>(null);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !email.includes('@')) {
      setError("Please enter a valid email address.");
      return;
    }
    
    setLoading(true);
    try {
      await strapiService.captureLead(email);
      const { user } = await strapiService.login(email);
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
            <Icons.TrendingUp />Get Real-time Products trends and Demands Intelligence
          </div>
          
          <h1 className="hero-title">
            Find Profitable Products <br /> on Popular Marketplace <span style={{color: 'var(--emerald-600)'}}>Instantly.</span>
          </h1>
          
          <p className="hero-subtitle">
            The high-performance dashboard for FBA Sellers. Identify pricing discrepancies, 
            calculate ROI with FBA fees, and track profitable arbitrage opportunities.
          </p>

          <form onSubmit={handleStart} className="access-form">
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email to start scouting..."
              className="access-input"
              style={error ? {borderColor: 'var(--red-600)'} : {}}
            />
            {error && <p style={{color: 'var(--red-600)', fontSize: '0.75rem', fontWeight: 700, margin: '4px 0'}}>{error}</p>}
            <button 
              type="submit"
              disabled={loading}
              className="btn-access"
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
          <div style={{marginTop: '5rem', background: 'white', padding: '1.5rem', borderRadius: '32px', border: '1px solid var(--slate-200)', boxShadow: 'var(--shadow-lg)'}}>
            <div style={{background: 'var(--slate-50)', borderRadius: '20px', padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem'}}>
               <div style={{background: 'white', borderRadius: '16px', border: '1px solid var(--slate-200)', padding: '1rem', display: 'flex', gap: '1rem'}}>
                  <div style={{width: '64px', height: '64px', background: 'var(--slate-200)', borderRadius: '8px', flexShrink: 0}} />
                  <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                    <div style={{height: '10px', background: 'var(--slate-200)', borderRadius: '4px', width: '80%'}} />
                    <div style={{height: '10px', background: 'var(--slate-100)', borderRadius: '4px', width: '50%'}} />
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      <footer style={{padding: '4rem 0', textAlign: 'center', borderTop: '1px solid var(--slate-100)', color: 'var(--slate-500)', fontSize: '0.875rem'}}>
        <p>&copy; 2024 ArbitrageScout. Powering high-ROI decisions.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
