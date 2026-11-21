import { useState } from 'react';
import { PlaneTakeoff, User as UserIcon, LogOut, Radar, ShieldCheck, Sun, Moon } from 'lucide-react';
import { isAdminUser } from '../config/admin';

const Header = ({ 
  onHomeClick,
  isHomeActive,
  isWelcome = false,
  onMyBookingsClick, 
  onRadarClick, 
  showRadar, 
  onLogoClick, 
  user, 
  onLoginClick, 
  onLogout,
  onAdminClick,
  showAdmin
}) => {
  const isAdmin = isAdminUser(user);
  const [currentTheme, setCurrentTheme] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.getAttribute('data-theme') || 'light';
    }
    return 'light';
  });

  const handleToggleTheme = () => {
    const next = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    setCurrentTheme(next);
    try {
      localStorage.setItem('theme', next);
    } catch {
      // Ignore private browsing storage errors
    }
  };

  return (
    <header className="header animate-fade-in">
      <div 
        className="logo" 
        onClick={onLogoClick} 
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.625rem' }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') onLogoClick(); }}
        aria-label="Aero Space home"
      >
        <PlaneTakeoff className="logo-icon" size={26} style={{ color: 'var(--accent-color)' }} />
        <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          Aero Space
        </span>
      </div>

      <nav style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
        {/* Home Navigation Button (Only shown once visitor has entered/chosen) */}
        {!isWelcome && (
          <button
            type="button"
            className="btn-secondary"
            onClick={onHomeClick}
            style={{
              borderColor: isHomeActive ? 'var(--accent-color)' : 'var(--surface-border)',
              background: isHomeActive ? 'var(--accent-subtle)' : 'var(--surface-color)',
              color: isHomeActive ? 'var(--accent-color)' : 'var(--text-primary)',
              fontWeight: isHomeActive ? 600 : 500,
              padding: '0.5rem 0.875rem'
            }}
          >
            <span>Home</span>
          </button>
        )}

        {/* Theme Toggle Button */}
        <button
          type="button"
          className="btn-secondary"
          onClick={handleToggleTheme}
          title={currentTheme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          aria-label={currentTheme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          style={{ padding: '0.5rem 0.75rem' }}
        >
          {currentTheme === 'dark' ? (
            <Sun size={16} style={{ color: '#FBBF24' }} />
          ) : (
            <Moon size={16} style={{ color: 'var(--text-secondary)' }} />
          )}
        </button>

        {/* Navigation Buttons (Only appear after user continues as guest or signs in) */}
        {!isWelcome && (
          <>
            {/* AeroRadar Navigation Button */}
            <button
              type="button"
              className="btn-secondary"
              onClick={onRadarClick}
              style={{
                borderColor: showRadar ? 'var(--accent-color)' : 'var(--surface-border)',
                background: showRadar ? 'var(--accent-subtle)' : 'var(--surface-color)',
                color: showRadar ? 'var(--accent-color)' : 'var(--text-primary)',
                fontWeight: showRadar ? 600 : 500,
                padding: '0.5rem 0.875rem'
              }}
            >
              <Radar size={16} style={{ color: showRadar ? 'var(--accent-color)' : 'var(--text-secondary)' }} />
              <span>AeroRadar</span>
            </button>

            {/* Admin Dashboard Button (Only visible to authorized admin emails) */}
            {isAdmin && (
              <button
                type="button"
                className="btn-secondary"
                onClick={onAdminClick}
                style={{
                  borderColor: showAdmin ? 'var(--warning-color)' : 'var(--surface-border)',
                  background: showAdmin ? 'var(--warning-bg)' : 'var(--surface-color)',
                  color: showAdmin ? 'var(--warning-color)' : 'var(--text-primary)',
                  fontWeight: 600,
                  padding: '0.5rem 0.875rem'
                }}
              >
                <ShieldCheck size={16} style={{ color: 'var(--warning-color)' }} />
                <span>Admin</span>
              </button>
            )}

            {/* My Bookings Button */}
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={onMyBookingsClick}
              style={{ padding: '0.5rem 0.875rem' }}
            >
              My Bookings
            </button>
          </>
        )}

        {user ? (
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              background: 'var(--surface-subtle)', 
              border: '1px solid var(--surface-border)',
              padding: '0.4rem 0.75rem', 
              borderRadius: 'var(--radius-md)' 
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 500 }}>
              <UserIcon size={14} style={{ color: 'var(--accent-color)' }} />
              {user.email.split('@')[0]}
            </span>
            <button 
              onClick={onLogout} 
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'var(--danger-color)', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center',
                padding: '2px'
              }} 
              title="Log out"
              aria-label="Log out"
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button 
            className="btn-primary" 
            onClick={onLoginClick} 
            style={{ padding: '0.5rem 1.125rem' }}
          >
            Sign In
          </button>
        )}
      </nav>
    </header>
  );
};

export default Header;
