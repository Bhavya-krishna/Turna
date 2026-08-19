import React, { useState, useEffect } from 'react';
import {
  Building2,
  Stethoscope,
  CalendarCheck,
  Sun,
  Moon,
  LogIn,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeTab: 'hospitals' | 'doctors' | 'bookings';
  setActiveTab: (tab: 'hospitals' | 'doctors' | 'bookings') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('turna_theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('turna_theme', nextTheme);
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 900,
        background: 'var(--bg-surface)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: 'var(--glass-border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4.5rem' }}>
        {/* Brand Logo */}
        <div
          onClick={() => setActiveTab('hospitals')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent-emerald) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(0, 180, 216, 0.4)',
            }}
          >
            <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '1.4rem', fontFamily: 'var(--font-display)' }}>T</span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                Turna
              </span>
              <span className="badge badge-emerald" style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}>
                <Sparkles size={10} /> Live
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '-2px' }}>
              Your Time. Your Turn.
            </span>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="desktop-nav">
          <button
            onClick={() => setActiveTab('hospitals')}
            className={`btn ${activeTab === 'hospitals' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 'var(--radius-full)' }}
          >
            <Building2 size={18} />
            <span>Hospitals</span>
          </button>
          <button
            onClick={() => setActiveTab('doctors')}
            className={`btn ${activeTab === 'doctors' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 'var(--radius-full)' }}
          >
            <Stethoscope size={18} />
            <span>Doctors</span>
          </button>
          <button
            onClick={() => {
              if (!isAuthenticated) {
                openAuthModal('login');
              } else {
                setActiveTab('bookings');
              }
            }}
            className={`btn ${activeTab === 'bookings' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 'var(--radius-full)' }}
          >
            <CalendarCheck size={18} />
            <span>My Bookings</span>
          </button>
        </nav>

        {/* Action Controls (Theme Toggle + User Profile / Auth) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={toggleTheme}
            className="btn btn-ghost"
            style={{ width: '40px', height: '40px', padding: 0, borderRadius: 'var(--radius-full)' }}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={20} color="var(--color-accent-amber)" /> : <Moon size={20} color="var(--color-accent-indigo)" />}
          </button>

          {isAuthenticated && user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="btn btn-secondary"
                style={{ borderRadius: 'var(--radius-full)', padding: '0.4rem 0.9rem' }}
              >
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                  }}
                >
                  {(user.name || user.email)[0].toUpperCase()}
                </div>
                <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name || user.email.split('@')[0]}
                </span>
              </button>

              {isUserMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 8px)',
                    width: '230px',
                    background: 'var(--bg-surface-elevated)',
                    border: 'var(--glass-border)',
                    boxShadow: 'var(--shadow-lg)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem',
                    zIndex: 1000,
                    animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{user.name || 'Patient'}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.email}
                    </div>
                  </div>
                  <div style={{ padding: '0.5rem 0' }}>
                    <button
                      onClick={() => {
                        setActiveTab('bookings');
                        setIsUserMenuOpen(false);
                      }}
                      className="btn btn-ghost"
                      style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.88rem' }}
                    >
                      <CalendarCheck size={16} />
                      <span>My Bookings</span>
                    </button>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
                    <button
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="btn btn-danger btn-sm"
                      style={{ width: '100%', justifyContent: 'flex-start' }}
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={() => openAuthModal('login')}
                className="btn btn-ghost"
                style={{ fontSize: '0.9rem' }}
              >
                <LogIn size={16} />
                <span>Sign In</span>
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className="btn btn-emerald"
                style={{ fontSize: '0.9rem', borderRadius: 'var(--radius-full)' }}
              >
                <UserIcon size={16} />
                <span>Get Started</span>
              </button>
            </div>
          )}

          {/* Mobile menu hamburger toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="btn btn-ghost mobile-only"
            style={{ width: '40px', height: '40px', padding: 0 }}
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div
          style={{
            padding: '1rem 1.5rem',
            background: 'var(--bg-surface-elevated)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
          className="mobile-only"
        >
          <button
            onClick={() => {
              setActiveTab('hospitals');
              setIsMobileMenuOpen(false);
            }}
            className={`btn ${activeTab === 'hospitals' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ justifyContent: 'flex-start' }}
          >
            <Building2 size={18} />
            <span>Hospitals</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('doctors');
              setIsMobileMenuOpen(false);
            }}
            className={`btn ${activeTab === 'doctors' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ justifyContent: 'flex-start' }}
          >
            <Stethoscope size={18} />
            <span>Doctors</span>
          </button>
          <button
            onClick={() => {
              if (!isAuthenticated) openAuthModal('login');
              else setActiveTab('bookings');
              setIsMobileMenuOpen(false);
            }}
            className={`btn ${activeTab === 'bookings' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ justifyContent: 'flex-start' }}
          >
            <CalendarCheck size={18} />
            <span>My Bookings</span>
          </button>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-only { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-only { display: none !important; }
        }
      `}</style>
    </header>
  );
};
