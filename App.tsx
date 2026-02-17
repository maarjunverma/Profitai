
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
      <div className="app-container">
        <header className="site-header">
          <div className="max-width-wrapper header-inner">
            <div className="flex items-center gap-2">
              <Link to="/" className="brand">
                <div className="brand-icon">AS</div>
                <span className="hidden-mobile">ArbitrageScout</span>
              </Link>
            </div>
            
            <nav className="nav-links">
              <NavLink to="/" icon={<Icons.LayoutDashboard />}>Dash</NavLink>
              <NavLink to="/watchlist" icon={<Icons.Bookmark />}>List</NavLink>
              
              <div style={{marginLeft: '0.5rem', borderLeft: '1px solid var(--slate-200)', paddingLeft: '0.5rem'}} className="flex items-center gap-2">
                <div className="hidden-mobile" style={{textAlign: 'right'}}>
                  <div style={{fontSize: '0.75rem', fontWeight: 600}}>{user?.username}</div>
                  <div style={{fontSize: '0.65rem', color: 'var(--emerald-600)', fontWeight: 800}}>{user?.tier}</div>
                </div>
                <button onClick={handleLogout} className="nav-link" style={{padding: '0.5rem'}}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                </button>
              </div>
            </nav>
          </div>
        </header>

        <main className="main-content max-width-wrapper">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/watchlist" element={<Watchlist />} />
          </Routes>
        </main>

        <footer style={{padding: '2rem 0', textAlign: 'center', color: 'var(--slate-400)', fontSize: '0.75rem'}}>
          <div className="max-width-wrapper">
            <p>© 2024 ArbitrageScout. Real-time Amazon Intelligence.</p>
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
    <Link to={to} className={`nav-link ${isActive ? 'nav-link-active' : ''}`}>
      {icon}
      <span className="hidden-mobile">{children}</span>
    </Link>
  );
};

export default App;
