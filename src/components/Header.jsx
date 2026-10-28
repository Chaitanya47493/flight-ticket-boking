import React from 'react';
import { PlaneTakeoff, User as UserIcon, LogOut } from 'lucide-react';

const Header = ({ onMyBookingsClick, onLogoClick, user, onLoginClick, onLogout }) => {
  return (
    <header className="header animate-fade-in">
      <div className="logo" onClick={onLogoClick} style={{ cursor: 'pointer' }}>
        <PlaneTakeoff className="logo-icon" size={32} />
        <span>Aero Space</span>
      </div>
      <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="btn-secondary" onClick={onMyBookingsClick}>My Bookings</button>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '2rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
              <UserIcon size={16} />
              {user.email.split('@')[0]}
            </span>
            <button onClick={onLogout} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Log out">
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <button className="btn-primary" onClick={onLoginClick} style={{ padding: '0.5rem 1.5rem' }}>Sign In</button>
        )}
      </nav>
    </header>
  );
};

export default Header;
