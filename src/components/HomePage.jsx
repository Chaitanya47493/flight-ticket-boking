import { useState, useRef } from 'react';
import { 
  Plane, 
  Radar, 
  ArrowRight, 
  ShieldCheck, 
  Compass,
  CheckCircle2,
  FileSearch
} from 'lucide-react';
import SearchForm from './SearchForm';

const HomePage = ({
  onSearch,
  initialSearchData,
  onRadarClick,
  onMyBookingsClick,
  user
}) => {
  const [pnrInput, setPnrInput] = useState('');
  const [pnrError, setPnrError] = useState('');
  const searchFormRef = useRef(null);

  const handlePnrLookup = (e) => {
    e.preventDefault();
    const cleanPnr = pnrInput.trim().toUpperCase();
    if (!cleanPnr) {
      setPnrError('Please enter a booking PNR code.');
      return;
    }
    setPnrError('');
    onMyBookingsClick(cleanPnr);
  };

  return (
    <div className="home-page-container animate-fade-in">
      {/* ── HERO SECTION: Headline + Embedded SearchForm ─────────── */}
      <section className="home-hero-section" ref={searchFormRef}>
        <div className="home-hero-header">
          <div className="home-hero-badge">
            <Compass size={14} className="home-badge-icon" />
            <span>Simulated Indian Aviation Experience</span>
          </div>
          <h1 className="home-hero-title">
            Fly Across India With Precision
          </h1>
          <p className="home-hero-subtitle">
            Simulated domestic flight search and booking across major Indian airports.
          </p>
        </div>

        {/* Embedded Flight Search Form */}
        <div className="home-search-embed">
          <SearchForm 
            onSearch={onSearch} 
            initialSearchData={initialSearchData}
            hideHeader={true}
          />
        </div>
      </section>

      {/* ── LIVE AERORADAR TEASER SECTION ──────────────────────────── */}
      <section className="home-section" id="aeroradar">
        <div className="radar-teaser-card">
          <div className="radar-teaser-content">
            <div className="radar-teaser-badge">
              <Radar size={15} className="radar-pulse-icon" />
              <span>AeroRadar Airspace Telemetry</span>
            </div>
            <h2 className="radar-teaser-title">
              Track Live Indian Airspace in 3D
            </h2>
            <p className="radar-teaser-desc">
              Monitor real-time civil aviation telemetry over the subcontinent (6°N–37°N | 68°E–98°E).
              Inspect aircraft altitude, track specific domestic flight corridors, or locate your booked aircraft in real-time.
            </p>
            <ul className="radar-teaser-features">
              <li>
                <CheckCircle2 size={16} className="feature-check" />
                <span>Live OpenSky Network ADS-B telemetry & simulated flight corridors</span>
              </li>
              <li>
                <CheckCircle2 size={16} className="feature-check" />
                <span>Interactive 3D Three.js globe with tactical Indian airspace centering</span>
              </li>
              <li>
                <CheckCircle2 size={16} className="feature-check" />
                <span>One-click flight tracking for your confirmed bookings</span>
              </li>
            </ul>
            <div className="radar-teaser-action">
              <button
                type="button"
                className="btn-primary"
                onClick={onRadarClick}
                style={{ padding: '0.75rem 1.75rem' }}
              >
                <Radar size={18} />
                <span>Launch AeroRadar</span>
              </button>
            </div>
          </div>
          <div className="radar-teaser-visual">
            <div className="radar-circle-outer">
              <div className="radar-circle-middle">
                <div className="radar-circle-inner">
                  <Radar size={54} className="radar-beacon-icon" />
                </div>
              </div>
            </div>
            <div className="radar-visual-tag">
              <span>6°N-37°N &bull; 68°E-98°E</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── MANAGE YOUR TRIP / PNR LOOKUP ─────────────────────────── */}
      <section className="home-section" id="manage-trip">
        <div className="manage-trip-card">
          <div className="manage-trip-header">
            <div className="manage-trip-badge">
              <FileSearch size={14} style={{ color: 'var(--accent-color)' }} />
              <span>Traveler Portal</span>
            </div>
            <h2 className="manage-trip-title">Manage Your Trip</h2>
            <p className="manage-trip-desc">
              Have an existing booking? Look up your reservation with your 6-character PNR reference code or access your saved trips.
            </p>
          </div>

          <form className="pnr-lookup-form" onSubmit={handlePnrLookup}>
            <div className="pnr-input-wrapper">
              <input
                type="text"
                placeholder="Enter 6-char PNR (e.g. A3F89C)"
                value={pnrInput}
                onChange={(e) => {
                  setPnrInput(e.target.value.toUpperCase());
                  setPnrError('');
                }}
                maxLength={6}
                className="pnr-input"
                aria-label="Booking PNR Reference"
              />
              <button type="submit" className="btn-primary pnr-submit-btn">
                <span>Find Booking</span>
                <ArrowRight size={16} />
              </button>
            </div>
            {pnrError && (
              <p className="pnr-error-msg">{pnrError}</p>
            )}
          </form>

          <div className="manage-trip-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onMyBookingsClick('')}
            >
              <span>{user ? 'View All My Bookings' : 'Sign In to View Bookings'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* ── SITE FOOTER ───────────────────────────────────────────── */}
      <footer className="site-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo">
              <Plane size={20} style={{ color: 'var(--accent-color)' }} />
              <span className="footer-title">Aero Space</span>
            </div>
            <p className="footer-desc">
              Simulated flight booking system built with React 19, Firebase Firestore, and real-time airspace telemetry.
            </p>
          </div>

          <div className="footer-links-group">
            <div className="footer-links-col">
              <div className="footer-col-title">Navigation</div>
              <button 
                type="button" 
                onClick={onRadarClick} 
                className="footer-link-button"
              >
                AeroRadar 3D
              </button>
              <button 
                type="button" 
                onClick={() => onMyBookingsClick('')} 
                className="footer-link-button"
              >
                My Bookings
              </button>
            </div>

            <div className="footer-links-col footer-disclaimer-col">
              <div className="footer-col-title">Demo Disclaimer</div>
              <p className="footer-disclaimer-text">
                This application is a demonstration portfolio project. Flight schedules, seat availability, card transactions, and tickets are entirely simulated.
              </p>
            </div>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <div className="footer-bottom-text">
            &copy; {new Date().getFullYear()} Aero Space. Developed for evaluation and demonstration.
          </div>
          <div className="footer-security-note">
            <ShieldCheck size={14} style={{ color: 'var(--accent-color)' }} />
            <span>Simulated Checkout &bull; No Real Financial Data Collected</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
