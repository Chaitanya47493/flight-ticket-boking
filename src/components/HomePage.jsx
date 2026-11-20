import { useState, useRef } from 'react';
import { 
  Plane, 
  Search, 
  UserCheck, 
  Armchair, 
  Ticket, 
  Radar, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Compass,
  CheckCircle2,
  FileSearch
} from 'lucide-react';
import SearchForm from './SearchForm';
import { POPULAR_ROUTES } from '../config/routes';

const HOW_IT_WORKS_STEPS = [
  {
    stepNum: '01',
    title: 'Search Routes',
    desc: 'Select departure & arrival airports across India, travel dates, and passenger count.',
    icon: Search
  },
  {
    stepNum: '02',
    title: 'Compare & Select',
    desc: 'Review domestic airlines, flight duration, nonstop timings, and Economy or Business class.',
    icon: Plane
  },
  {
    stepNum: '03',
    title: 'Passenger Info',
    desc: 'Provide traveler names and travel preferences with validated input safeguards.',
    icon: UserCheck
  },
  {
    stepNum: '04',
    title: 'Select Seats',
    desc: 'Pick your seat on an interactive aircraft cabin map with real-time seat inventory.',
    icon: Armchair
  },
  {
    stepNum: '05',
    title: 'Instant E-Ticket',
    desc: 'Complete simulated card checkout to generate printable boarding passes and email delivery.',
    icon: Ticket
  }
];

const HomePage = ({
  onSearch,
  initialSearchData,
  onRadarClick,
  onMyBookingsClick,
  user
}) => {
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routeSeq, setRouteSeq] = useState(0);
  const [pnrInput, setPnrInput] = useState('');
  const [pnrError, setPnrError] = useState('');
  const searchFormRef = useRef(null);

  const handleRouteClick = (route) => {
    const nextSeq = routeSeq + 1;
    setRouteSeq(nextSeq);
    setSelectedRoute({ ...route, _ver: nextSeq });
    if (searchFormRef.current) {
      searchFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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

        {/* Embedded Flight Search Form (Reusing existing component) */}
        <div className="home-search-embed">
          <SearchForm 
            onSearch={onSearch} 
            initialSearchData={initialSearchData}
            externalRoute={selectedRoute}
            hideHeader={true}
          />
        </div>
      </section>

      {/* ── POPULAR ROUTES CORRIDORS ───────────────────────────────── */}
      <section className="home-section" id="popular-routes">
        <div className="home-section-header">
          <div className="home-section-badge">
            <Sparkles size={14} style={{ color: 'var(--accent-color)' }} />
            <span>Frequent Corridors</span>
          </div>
          <h2 className="home-section-title">Popular Domestic Routes</h2>
          <p className="home-section-desc">
            Direct connections between primary metropolitan hubs. Click any corridor to pre-fill your flight search.
          </p>
        </div>

        <div className="corridor-grid">
          {POPULAR_ROUTES.map((route) => (
            <button
              type="button"
              key={`${route.from}-${route.to}`}
              className="corridor-card"
              onClick={() => handleRouteClick(route)}
              aria-label={`Select route ${route.label}`}
            >
              <div className="corridor-card-top">
                <span className="corridor-city-codes">
                  <span className="corridor-code">{route.from}</span>
                  <span className="corridor-arrow">⇄</span>
                  <span className="corridor-code">{route.to}</span>
                </span>
                <span className="corridor-tag">Direct</span>
              </div>
              <div className="corridor-name">{route.label}</div>
              {route.desc && (
                <div className="corridor-airports">{route.desc}</div>
              )}
              <div className="corridor-card-action">
                <span>Select Route</span>
                <ArrowRight size={14} />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── HOW BOOKING WORKS (Horizontal Sequence) ───────────────── */}
      <section className="home-section" id="how-it-works">
        <div className="home-section-header">
          <div className="home-section-badge">
            <CheckCircle2 size={14} style={{ color: 'var(--accent-color)' }} />
            <span>5-Step Architecture</span>
          </div>
          <h2 className="home-section-title">How Booking Works</h2>
          <p className="home-section-desc">
            A transparent and realistic flight booking workflow from route search to boarding pass generation.
          </p>
        </div>

        <div className="steps-track">
          {HOW_IT_WORKS_STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={step.stepNum} className="step-track-item">
                <div className="step-card">
                  <div className="step-card-header">
                    <span className="step-number">{step.stepNum}</span>
                    <div className="step-icon-wrapper">
                      <Icon size={18} />
                    </div>
                  </div>
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-description">{step.desc}</p>
                </div>
                {idx < HOW_IT_WORKS_STEPS.length - 1 && (
                  <div className="step-track-arrow" aria-hidden="true">
                    <ArrowRight size={16} />
                  </div>
                )}
              </div>
            );
          })}
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
              <a href="#popular-routes" className="footer-link">Popular Corridors</a>
              <a href="#how-it-works" className="footer-link">How Booking Works</a>
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
