
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
  
  // Track if fields have been interacted with to show errors
  const [touched, setTouched] = useState({ email: false, phone: false });

  const validateEmail = (val: string) => {
    // Robust email regex checking for standard format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(val.trim());
  };

  const validatePhone = (phone: string) => {
    // Requirements: Standard mobile/business number (Exactly 10 or 11 digits)
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 11;
  };

  const emailInvalid = touched.email && !validateEmail(email);
  const phoneInvalid = touched.phone && !validatePhone(phoneNumber);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTouched({ email: true, phone: true });
    
    const isEmailValid = validateEmail(email);
    const isPhoneValid = validatePhone(phoneNumber);

    if (!isEmailValid || !isPhoneValid) {
      if (!isEmailValid) {
        setError("Please enter a valid business email address.");
      } else if (!isPhoneValid) {
        setError("Mobile number must be exactly 10 or 11 digits.");
      }
      return;
    }
    
    setLoading(true);
    try {
      await strapiService.captureLead(email, phoneNumber);
      const { user } = await strapiService.login(email, phoneNumber);
      onLogin(user);
    } catch (err: any) {
      setError(err.message || "Scout server connection error.");
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
            <Icons.TrendingUp /> Real-time Arbitrage Intelligence
          </div>
          
          <h1 className="hero-title">
            Find Profitable Products <br /> on Amazon <span style={{color: 'var(--emerald-600)'}}>Instantly.</span>
          </h1>
          
          <p className="hero-subtitle">
            The high-performance dashboard for FBA Sellers. Identify pricing gaps, 
            calculate real-time ROI, and scale your business.
          </p>

          <form onSubmit={handleStart} className="access-form">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col text-left gap-1">
                <div className="flex justify-between items-center px-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Account Email
                  </label>
                  {emailInvalid && (
                    <span className="text-[9px] text-red-500 font-bold uppercase tracking-tighter animate-slide-down">
                      Invalid Email
                    </span>
                  )}
                </div>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched(prev => ({...prev, email: true}))}
                  placeholder="name@example.com"
                  className={`access-input ${emailInvalid ? 'border-red-500 bg-red-50 ring-1 ring-red-100' : ''}`}
                />
              </div>
              
              <div className="flex flex-col text-left gap-1">
                <div className="flex justify-between items-center px-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Mobile Number
                  </label>
                  {phoneInvalid && (
                    <span className="text-[9px] text-red-500 font-bold uppercase tracking-tighter animate-slide-down">
                      10-11 Digits Required
                    </span>
                  )}
                </div>
                <input 
                  type="tel" 
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  onBlur={() => setTouched(prev => ({...prev, phone: true}))}
                  placeholder="e.g. 9998887777"
                  className={`access-input ${phoneInvalid ? 'border-red-500 bg-red-50 ring-1 ring-red-100' : ''}`}
                />
              </div>
            </div>

            {error && (
              <div className="animate-slide-down flex items-center gap-2 mt-2 px-3 py-2 bg-red-50 border border-red-100 rounded-xl">
                <div className="text-red-600 flex-shrink-0"><Icons.Zap /></div>
                <p className="text-red-700 text-[11px] font-bold leading-tight m-0">{error}</p>
              </div>
            )}
            
            <button 
              type="submit"
              disabled={loading}
              className={`btn-access ${loading ? 'opacity-70' : ''}`}
              style={{marginTop: '0.75rem'}}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin" style={{width: '18px', height: '18px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%'}} />
                  Verifying...
                </div>
              ) : (
                <>
                  Access Dashboard <Icons.Zap />
                </>
              )}
            </button>
            <p style={{fontSize: '11px', color: 'var(--slate-400)', marginTop: '1rem'}}>
              Used by 2,500+ top-rated Amazon FBA sellers.
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
