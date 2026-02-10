
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Watchlist from './components/Watchlist';
import LandingPage from './components/LandingPage';
import { Icons } from './constants';
import { User, SubscriptionTier } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check local storage for simulated session
    const storedUser = localStorage.getItem('arbitrage_scout_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (mockUser: User) => {
    setUser(mockUser);
    setIsAuthenticated(true);
    localStorage.setItem('arbitrage_scout_user', JSON.stringify(mockUser));
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('arbitrage_scout_user');
  };

  if (!isAuthenticated) {
    return <LandingPage onLogin={handleLogin} />;
  }

  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                  AS
                </div>
                <span className="text-xl font-bold text-slate-900 hidden sm:inline-block">ArbitrageScout</span>
              </Link>
              <nav className="hidden md:flex items-center gap-1">
                <NavLink to="/" icon={<Icons.LayoutDashboard />}>Dashboard</NavLink>
                <NavLink to="/watchlist" icon={<Icons.Bookmark />}>Watchlist</NavLink>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end mr-4">
                <span className="text-sm font-medium text-slate-900">{user?.username}</span>
                <span className="text-xs text-emerald-600 font-bold uppercase tracking-wider">{user?.tier} Plan</span>
              </div>
              <button 
                onClick={handleLogout}
                className="text-sm text-slate-500 hover:text-red-600 font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/watchlist" element={<Watchlist />} />
          </Routes>
        </main>

        <footer className="bg-white border-t border-slate-200 py-8">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm text-slate-500">© 2024 ArbitrageScout. Real-time Amazon Intelligence for Pros.</p>
          </div>
        </footer>
      </div>
    </HashRouter>
  );
};

const NavLink: React.FC<{ to: string, icon: React.ReactNode, children: React.ReactNode }> = ({ to, icon, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link 
      to={to} 
      className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
        isActive 
          ? 'bg-emerald-50 text-emerald-700 font-semibold' 
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
};

export default App;
