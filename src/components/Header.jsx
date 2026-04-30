import React from 'react';
import { PlaneTakeoff } from 'lucide-react';

const Header = ({ onMyBookingsClick, onLogoClick }) => {
  return (
    <header className="header animate-fade-in">
      <div className="logo" onClick={onLogoClick} style={{ cursor: 'pointer' }}>
        <PlaneTakeoff className="logo-icon" size={32} />
        <span>AeroSpace</span>
      </div>
      <nav>
        <button className="btn-secondary" onClick={onMyBookingsClick}>My Bookings</button>
      </nav>
    </header>
  );
};

export default Header;
