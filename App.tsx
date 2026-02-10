
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
            <div className="nav-links">
              <Link to="/" className="brand">
                <div className="brand-icon">AS</div>
                <span>ArbitrageScout</span>
              </Link>
              <nav className="nav-links" style={{marginLeft: '2rem'}}>
                <NavLink to="/" icon={<Icons.LayoutDashboard />}>Dashboard</NavLink>
                <NavLink to="/watchlist" icon={<Icons.Bookmark />}>Watchlist</NavLink>
              </nav>
            </div>

            <div className="nav-links">
              <div style={{textAlign: 'right', marginRight: '1rem'}} className="hidden sm:inline-block">
                <div style={{fontSize: '0.875rem', fontWeight: 500}}>{user?.username}</div>
                <div style={{fontSize: '0.75rem', color: 'var(--emerald-600)', fontWeight: 800, textTransform: 'uppercase'}}>{user?.tier} Plan</div>
              </div>
              <button onClick={handleLogout} style={{fontSize: '0.875rem', color: 'var(--slate-500)', fontWeight: 500}}>
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="main-content max-width-wrapper">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/watchlist" element={<Watchlist />} />
          </Routes>
        </main>

        <footer className="footer">
          <div className="max-width-wrapper">
            <p>© 2024 ArbitrageScout. Real-time Amazon Intelligence for Pros.</p>
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
      <span>{children}</span>
    </Link>
  );
};

export default App;
