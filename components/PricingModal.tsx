
import React from 'react';
import { Icons } from '../constants';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (plan: 'BASIC' | 'UNLIMITED') => void;
}

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, onUpgrade }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center" style={{padding: '1rem'}}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in">
        <button 
          onClick={onClose}
          style={{position: 'absolute', top: '1rem', right: '1rem', padding: '0.5rem', color: 'var(--slate-400)'}}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>

        <div style={{padding: '2rem', textAlign: 'center', borderBottom: '1px solid var(--slate-100)', background: 'var(--slate-50)'}}>
          <div style={{display: 'inline-flex', padding: '0.75rem', background: 'var(--emerald-100)', color: 'var(--emerald-600)', borderRadius: '1rem', marginBottom: '1rem'}}>
            <Icons.Zap />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">You've hit the limit!</h2>
          <p className="text-slate-500 max-w-sm mx-auto">Upgrade now to unlock more pricing data and AI-driven ROI insights.</p>
        </div>

        <div style={{padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', background: 'white'}}>
          {/* Basic Plan */}
          <div style={{border: '1px solid var(--slate-200)', borderRadius: '1.5rem', padding: '1.5rem', display: 'flex', flexDirection: 'column'}}>
            <div className="mb-4">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Scout Basic</span>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-3xl font-black text-slate-900">$4.90</span>
                <span className="text-sm text-slate-500">/mo</span>
              </div>
            </div>
            <ul style={{listStyle: 'none', padding: 0, margin: '0 0 2rem 0', flex: 1}}>
              <li className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                <div style={{width: '6px', height: '6px', borderRadius: '50%', background: 'var(--emerald-500)'}} /> 100 Search Credits
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                <div style={{width: '6px', height: '6px', borderRadius: '50%', background: 'var(--emerald-500)'}} /> Basic Profit Calc
              </li>
            </ul>
            <button 
              onClick={() => onUpgrade('BASIC')}
              className="w-full py-3 font-bold rounded-xl"
              style={{border: '2px solid var(--slate-900)', color: 'var(--slate-900)'}}
            >
              Choose Basic
            </button>
          </div>

          {/* Unlimited Plan */}
          <div style={{position: 'relative', border: '2px solid var(--emerald-500)', borderRadius: '1.5rem', padding: '1.5rem', background: 'var(--emerald-50)', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)'}}>
            <div style={{position: 'absolute', top: '-0.75rem', left: '50%', transform: 'translateX(-50%)', background: 'var(--emerald-500)', color: 'white', fontSize: '10px', fontWeight: 900, padding: '0.25rem 0.75rem', borderRadius: '99px', textTransform: 'uppercase'}}>
              Best Value
            </div>
            <div className="mb-4">
              <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Scout Pro</span>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-3xl font-black text-slate-900">$10.00</span>
                <span className="text-sm text-slate-500">/mo</span>
              </div>
            </div>
            <ul style={{listStyle: 'none', padding: 0, margin: '0 0 2rem 0', flex: 1}}>
              <li className="flex items-center gap-2 text-sm text-slate-900 font-bold mb-2">
                <div style={{width: '6px', height: '6px', borderRadius: '50%', background: 'var(--emerald-500)'}} /> Unlimited Credits
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-900 font-bold mb-2">
                <div style={{width: '6px', height: '6px', borderRadius: '50%', background: 'var(--emerald-500)'}} /> AI Profit Analysis
              </li>
            </ul>
            <button 
              onClick={() => onUpgrade('UNLIMITED')}
              className="w-full py-3 font-bold rounded-xl"
              style={{background: 'var(--emerald-600)', color: 'white'}}
            >
              Get Unlimited
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;
