import { useState, useRef, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  Armchair,
  Tag,
  Ticket,
  FileText,
  Radar,
  CloudSun,
  ArrowRight,
  User,
  Compass,
  X,
  Info,
  ShieldCheck,
  LogIn
} from 'lucide-react';

const CAPABILITIES = [
  {
    icon: Search,
    title: 'Domestic Route Search',
    description: 'Search one-way and round-trip routes between major Indian metropolitan airports with autocomplete and quick corridors.'
  },
  {
    icon: SlidersHorizontal,
    title: 'Airline & Cabin Filtering',
    description: 'Filter domestic carriers (IndiGo, Air India, SpiceJet, Vistara, Akasa Air) and select Economy, Premium, or Business class.'
  },
  {
    icon: Armchair,
    title: 'Interactive Cabin Seat Map',
    description: 'Reserve standard or extra-legroom seats on an aircraft cabin grid synchronized with real-time seat inventory.'
  },
  {
    icon: Tag,
    title: 'Promotional Discounts',
    description: 'Apply verified promotional coupon codes (AERO10 for 10% off or FLY500 for flat savings) at simulated checkout.'
  },
  {
    icon: Ticket,
    title: 'Printable Boarding Passes',
    description: 'Issue 6-character PNR references, render digital boarding passes with barcode simulation, and receive automated e-tickets.'
  },
  {
    icon: FileText,
    title: 'Trip Management & Cancellation',
    description: 'Review reservation history, look up trips by 6-character PNR, and cancel bookings with immediate seat release.'
  },
  {
    icon: Radar,
    title: 'AeroRadar 3D Surveillance',
    description: 'Track real-time civil aviation telemetry over Indian airspace (6°N–37°N | 68°E–98°E) via OpenSky Network ADS-B feeds.'
  },
  {
    icon: CloudSun,
    title: 'Airport Weather & Delay Risk',
    description: 'Predict flight delay probabilities and inspect real-time meteorological telemetry (temperature, wind, visibility) across Indian hubs via Open-Meteo.'
  }
];

const BOOKING_STEPS = [
  { num: '01', label: 'Search Route' },
  { num: '02', label: 'Select Airline & Class' },
  { num: '03', label: 'Passenger Details' },
  { num: '04', label: 'Choose Seats' },
  { num: '05', label: 'Simulated Checkout' },
  { num: '06', label: 'Boarding Pass' }
];

const WelcomePage = ({ onSignIn, onContinueGuest }) => {
  const [showModal, setShowModal] = useState(false);
  const triggerButtonRef = useRef(null);
  const modalRef = useRef(null);
  const firstOptionRef = useRef(null);
  const closeButtonRef = useRef(null);

  // Focus management and focus trap for accessible dialog
  useEffect(() => {
    if (showModal) {
      // Focus first option inside dialog
      firstOptionRef.current?.focus();

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          setShowModal(false);
          triggerButtonRef.current?.focus();
          return;
        }

        if (e.key === 'Tab') {
          if (!modalRef.current) return;
          const focusable = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length === 0) return;

          const firstEl = focusable[0];
          const lastEl = focusable[focusable.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === firstEl) {
              e.preventDefault();
              lastEl.focus();
            }
          } else {
            if (document.activeElement === lastEl) {
              e.preventDefault();
              firstEl.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showModal]);

  const handleCloseModal = () => {
    setShowModal(false);
    triggerButtonRef.current?.focus();
  };

  const handleSelectSignIn = () => {
    setShowModal(false);
    onSignIn();
  };

  const handleSelectGuest = () => {
    setShowModal(false);
    onContinueGuest();
  };

  return (
    <div className="welcome-page-container animate-fade-in">
      {/* ── HERO BANNER ────────────────────────────────────────────── */}
      <section className="welcome-hero-section">
        <div className="welcome-hero-badge">
          <Compass size={14} style={{ color: 'var(--accent-color)' }} />
          <span>AEROSPACE &bull; ALL-INDIA NETWORK</span>
        </div>

        <h1 className="welcome-hero-title">
          Explore Indian Aviation With Aero Space
        </h1>

        <p className="welcome-hero-lead">
          Aero Space is a full-featured domestic flight booking demonstration application.
          Search airline schedules across India, inspect cabin seat maps with real-time inventory,
          apply promotional discounts, and monitor live airspace telemetry in interactive 3D.
        </p>

        <div className="welcome-hero-actions">
          <button
            type="button"
            ref={triggerButtonRef}
            className="btn-primary welcome-cta-btn"
            onClick={() => setShowModal(true)}
            aria-haspopup="dialog"
            aria-expanded={showModal}
          >
            <span>Get Started</span>
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Truthful Note on Guest Access & Demo Simulation */}
        <div className="welcome-banner-notice">
          <div className="notice-item">
            <Info size={15} className="notice-icon" />
            <span>
              <strong>Guest Browsing:</strong> You can search routes, view flights, and compare fares without an account. Sign-in is only required when confirming passenger details and seats.
            </span>
          </div>
          <div className="notice-item">
            <ShieldCheck size={15} className="notice-icon" />
            <span>
              <strong>Simulated Demo:</strong> All airline listings, seat inventory reservations, and payment processing are simulated for demonstration purposes.
            </span>
          </div>
        </div>
      </section>

      {/* ── HOW BOOKING WORKS ───────────────────────────────────────── */}
      <section className="welcome-section" id="welcome-flow">
        <div className="welcome-section-header">
          <span className="welcome-section-tag">Booking Architecture</span>
          <h2 className="welcome-section-title">How It Works</h2>
          <p className="welcome-section-desc">
            A transparent 6-step flight booking flow engineered to reflect production travel platforms.
          </p>
        </div>

        <div className="welcome-flow-track">
          {BOOKING_STEPS.map((step, idx) => (
            <div key={step.num} className="welcome-flow-step">
              <div className="flow-step-badge">
                <span className="flow-step-num">{step.num}</span>
              </div>
              <span className="flow-step-label">{step.label}</span>
              {idx < BOOKING_STEPS.length - 1 && (
                <div className="flow-step-connector" aria-hidden="true">
                  <ArrowRight size={14} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── WHAT YOU CAN DO (Real Features Grid) ───────────────────── */}
      <section className="welcome-section" id="welcome-capabilities">
        <div className="welcome-section-header">
          <span className="welcome-section-tag">Feature Overview</span>
          <h2 className="welcome-section-title">What You Can Do</h2>
          <p className="welcome-section-desc">
            Every capability listed below is fully implemented and operational within this application.
          </p>
        </div>

        <div className="welcome-capabilities-grid">
          {CAPABILITIES.map((cap) => {
            const Icon = cap.icon;
            return (
              <div key={cap.title} className="capability-card">
                <div className="capability-icon-box">
                  <Icon size={20} />
                </div>
                <div className="capability-content">
                  <h3 className="capability-title">{cap.title}</h3>
                  <p className="capability-desc">{cap.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── GET STARTED MODAL DIALOG (Focus Trapped, WAI-ARIA) ───────── */}
      {showModal && (
        <div
          className="welcome-dialog-backdrop"
          onClick={handleCloseModal}
          role="presentation"
        >
          <div
            ref={modalRef}
            className="welcome-dialog animate-scale-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="get-started-title"
            aria-describedby="get-started-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-header">
              <div className="dialog-header-text">
                <h2 id="get-started-title" className="dialog-title">
                  Choose How to Start
                </h2>
                <p id="get-started-desc" className="dialog-subtitle">
                  Select your preferred entry mode to explore Aero Space.
                </p>
              </div>
              <button
                type="button"
                ref={closeButtonRef}
                className="dialog-close-btn"
                onClick={handleCloseModal}
                title="Close dialog (Escape)"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="dialog-options">
              {/* Option A: Sign In / Create Account */}
              <button
                type="button"
                ref={firstOptionRef}
                className="dialog-option-btn dialog-option-primary"
                onClick={handleSelectSignIn}
              >
                <div className="option-icon-box">
                  <LogIn size={20} />
                </div>
                <div className="option-text-group">
                  <div className="option-title-row">
                    <span className="option-title">Sign in or create account</span>
                    <ArrowRight size={16} className="option-arrow" />
                  </div>
                  <p className="option-description">
                    Access saved bookings, reserve passenger seats, issue printable boarding passes, and manage cancellations.
                  </p>
                </div>
              </button>

              {/* Option B: Continue as Guest */}
              <button
                type="button"
                className="dialog-option-btn dialog-option-secondary"
                onClick={handleSelectGuest}
              >
                <div className="option-icon-box">
                  <User size={20} />
                </div>
                <div className="option-text-group">
                  <div className="option-title-row">
                    <span className="option-title">Continue as guest</span>
                    <ArrowRight size={16} className="option-arrow" />
                  </div>
                  <p className="option-description">
                    Search routes, filter airline schedules, and compare cabin fares. Sign-in is only required when booking.
                  </p>
                </div>
              </button>
            </div>

            <div className="dialog-footer">
              <span className="dialog-disclaimer">
                Simulated flight booking demo &bull; No financial details required
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WelcomePage;
