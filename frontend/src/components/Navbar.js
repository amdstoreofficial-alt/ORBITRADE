import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, LogOut, Menu, X, ArrowLeftRight, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { isAuthenticated, user, logout, isAdmin, isDemoMode, switchAccountMode } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const handleLogout = () => { logout(); window.location.href = '/'; };

  const handleSwitch = async () => {
    setSwitching(true);
    try {
      const newMode = isDemoMode ? 'real' : 'demo';
      await switchAccountMode(newMode);
      toast.success(`Switched to ${newMode.toUpperCase()} account`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to switch');
    } finally { setSwitching(false); }
  };

  const formatBalance = (balance) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(balance || 0);
  };

  const navLink = (path, label, testId) => (
    <Link to={path}
      className={`text-sm transition-colors ${location.pathname === path ? 'text-white font-medium' : 'text-gray-500 hover:text-gray-300'}`}
      data-testid={testId}>{label}</Link>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#080c14]/90 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-[1800px] mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-12 sm:h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" data-testid="logo">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-electric to-cyan-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-[#080c14]" />
            </div>
            <span className="font-bold text-white text-base sm:text-lg tracking-tight">ORBITAL</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4 lg:gap-5">
            {isAuthenticated ? (
              <>
                {navLink('/dashboard', 'Dashboard', 'nav-dashboard')}
                {navLink('/deposit', 'Deposit', 'nav-deposit')}
                {!isDemoMode && navLink('/withdraw', 'Withdraw', 'nav-withdraw')}
                {!isDemoMode && navLink('/affiliate', 'Affiliate', 'nav-affiliate')}
                {isAdmin && navLink('/admin', 'Admin', 'nav-admin')}

                {/* Account Mode Toggle */}
                <button onClick={handleSwitch} disabled={switching}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all text-xs font-bold"
                  style={{
                    borderColor: isDemoMode ? 'rgba(251,191,36,0.3)' : 'rgba(16,185,129,0.3)',
                    background: isDemoMode ? 'rgba(251,191,36,0.06)' : 'rgba(16,185,129,0.06)',
                    color: isDemoMode ? '#fbbf24' : '#10b981'
                  }}
                  data-testid="account-mode-toggle"
                >
                  <ArrowLeftRight className="w-3 h-3" />
                  {switching ? '...' : isDemoMode ? 'DEMO' : 'REAL'}
                </button>

                {/* Balance */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                  {isDemoMode && <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-amber-400/20 text-amber-400">DEMO</span>}
                  <span className="font-mono text-sm text-white" data-testid="nav-balance">{formatBalance(user?.balance)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Link to="/profile" className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors" data-testid="nav-profile">
                    <User className="w-4 h-4" />
                  </Link>
                  <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors" data-testid="logout-btn">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/" className={`text-sm ${location.pathname === '/' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>Home</Link>
                <Link to="/auth" className="px-4 py-1.5 rounded-lg bg-electric text-white text-sm font-medium hover:shadow-lg hover:shadow-electric/20 transition-all" data-testid="nav-login">Start Trading</Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-1.5 rounded-lg hover:bg-white/5" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0a0f1a] border-t border-white/5 absolute w-full">
          <div className="px-4 py-3 space-y-1">
            {isAuthenticated ? (
              <>
                {/* Balance + Mode */}
                <div className="flex items-center justify-between mb-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {isDemoMode && <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-amber-400/20 text-amber-400">DEMO</span>}
                      <span className="text-[10px] text-gray-600 uppercase">Balance</span>
                    </div>
                    <span className="font-mono text-lg text-white font-semibold">{formatBalance(user?.balance)}</span>
                  </div>
                  <button onClick={() => { handleSwitch(); setMobileMenuOpen(false); }} disabled={switching}
                    className="px-3 py-1.5 rounded-lg border text-xs font-bold"
                    style={{
                      borderColor: isDemoMode ? 'rgba(251,191,36,0.3)' : 'rgba(16,185,129,0.3)',
                      background: isDemoMode ? 'rgba(251,191,36,0.08)' : 'rgba(16,185,129,0.08)',
                      color: isDemoMode ? '#fbbf24' : '#10b981'
                    }}
                    data-testid="mobile-mode-toggle"
                  >
                    <ArrowLeftRight className="w-3 h-3 inline mr-1" />
                    {isDemoMode ? 'Switch to Real' : 'Switch to Demo'}
                  </button>
                </div>

                {[
                  { to: '/dashboard', label: 'Dashboard' },
                  { to: '/profile', label: 'Profile' },
                  { to: '/deposit', label: 'Deposit' },
                  ...(!isDemoMode ? [{ to: '/withdraw', label: 'Withdraw' }, { to: '/affiliate', label: 'Affiliate' }] : []),
                  ...(isAdmin ? [{ to: '/admin', label: 'Admin' }] : []),
                ].map(link => (
                  <Link key={link.to} to={link.to}
                    className={`block px-3 py-2 rounded-lg text-sm ${location.pathname === link.to ? 'text-white bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'}`}
                    onClick={() => setMobileMenuOpen(false)}>{link.label}</Link>
                ))}
                <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-white/[0.03]">Logout</button>
              </>
            ) : (
              <>
                <Link to="/" className="block px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Home</Link>
                <Link to="/auth" className="block px-3 py-2 rounded-lg bg-electric text-white text-sm text-center font-medium" onClick={() => setMobileMenuOpen(false)}>Start Trading</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
