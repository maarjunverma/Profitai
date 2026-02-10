
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>

        <div className="p-8 text-center border-b border-slate-100 bg-slate-50/50">
          <div className="inline-flex p-3 bg-emerald-100 text-emerald-600 rounded-2xl mb-4">
            <Icons.Zap />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">You've hit the limit!</h2>
          <p className="text-slate-500 max-w-sm mx-auto">You've reached the free scouting limit. Upgrade now to unlock more pricing data and ROI insights.</p>
        </div>

        <div className="p-8 grid md:grid-cols-2 gap-6 bg-white">
          {/* Basic Plan */}
          <div className="border border-slate-200 rounded-2xl p-6 hover:border-emerald-500 transition-all flex flex-col group">
            <div className="mb-4">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Scout Basic</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black text-slate-900">$4.90</span>
                <span className="text-sm text-slate-500">/mo</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 100 Search Credits
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Basic Profit Calc
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Daily Price Sync
              </li>
            </ul>
            <button 
              onClick={() => onUpgrade('BASIC')}
              className="w-full py-3 px-4 bg-white border-2 border-slate-900 text-slate-900 font-bold rounded-xl hover:bg-slate-900 hover:text-white transition-all"
            >
              Choose Basic
            </button>
          </div>

          {/* Unlimited Plan */}
          <div className="relative border-2 border-emerald-500 rounded-2xl p-6 bg-emerald-50/30 flex flex-col shadow-lg shadow-emerald-50">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
              Best Value
            </div>
            <div className="mb-4">
              <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Scout Pro</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black text-slate-900">$10.00</span>
                <span className="text-sm text-slate-500">/mo</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center gap-2 text-sm text-slate-900 font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Unlimited Credits
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-900 font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Full ROI Breakdown
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-900 font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Priority Support
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-900 font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Advanced Filters
              </li>
            </ul>
            <button 
              onClick={() => onUpgrade('UNLIMITED')}
              className="w-full py-3 px-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200"
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
