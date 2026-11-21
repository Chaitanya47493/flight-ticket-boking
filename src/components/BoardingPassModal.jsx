import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Printer, Plane, QrCode, ShieldCheck, AlertCircle, RotateCcw, 
  Wind, Eye, ShieldAlert, CheckCircle2, AlertTriangle, Activity 
} from 'lucide-react';
import { fetchRouteWeather, predictDelayRisk } from '../utils/weatherRisk';

const computeBoardingTime = (depTimeStr) => {
  if (!depTimeStr) return '45 mins before';
  try {
    const match = depTimeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return `${depTimeStr} (T-45m)`;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3] ? match[3].toUpperCase() : null;

    let totalMinutes = hours * 60 + minutes;
    if (ampm === 'PM' && hours < 12) totalMinutes += 12 * 60;
    if (ampm === 'AM' && hours === 12) totalMinutes = minutes;

    let boardingMinutes = totalMinutes - 45;
    if (boardingMinutes < 0) boardingMinutes += 24 * 60;

    const bHours = Math.floor(boardingMinutes / 60);
    const bMins = boardingMinutes % 60;
    const bMinsStr = bMins < 10 ? `0${bMins}` : `${bMins}`;

    if (ampm) {
      const bAmpm = bHours >= 12 ? 'PM' : 'AM';
      let bHours12 = bHours % 12;
      if (bHours12 === 0) bHours12 = 12;
      return `${bHours12}:${bMinsStr} ${bAmpm} (T-45m)`;
    } else {
      const bHours24 = bHours < 10 ? `0${bHours}` : `${bHours}`;
      return `${bHours24}:${bMinsStr} (T-45m)`;
    }
  } catch {
    return `${depTimeStr} (T-45m)`;
  }
};

const BoardingPassModal = ({ isOpen, onClose, bookingData, bookingId }) => {
  const [activePassengerIndex, setActivePassengerIndex] = useState(0);
  const [activeLeg, setActiveLeg] = useState('outbound');
  const [routeWeather, setRouteWeather] = useState(null);

  const flight = bookingData?.flight;
  const selectedClass = bookingData?.selectedClass;
  const passengers = bookingData?.passengers;
  const selectedSeats = bookingData?.selectedSeats;
  const searchData = bookingData?.searchData;
  const status = bookingData?.status;

  const isCancelled = status === 'CANCELLED';
  const isRoundTrip = searchData?.tripType === 'roundtrip' && (!!searchData?.returnDate || !!selectedSeats?.return);

  const pList = passengers?.list || [
    {
      id: 1,
      title: 'Mr',
      firstName: passengers?.firstName || 'Valued',
      lastName: passengers?.lastName || 'Passenger'
    }
  ];

  const activePassenger = pList[activePassengerIndex] || pList[0];
  const bookingRef = bookingId ? bookingId.substring(0, 6).toUpperCase() : 'AS9842';

  // Leg-specific details
  const isReturnLeg = isRoundTrip && activeLeg === 'return';
  const legFlightNumber = isReturnLeg ? `${flight?.flightNumber || 'FL100'}-RT` : (flight?.flightNumber || '6E 100');
  const legOriginIata = isReturnLeg ? (flight?.destination || 'BOM') : (flight?.origin || 'DEL');
  const legDestIata = isReturnLeg ? (flight?.origin || 'DEL') : (flight?.destination || 'BOM');
  const legOriginCity = isReturnLeg ? (searchData?.to || flight?.destination) : (searchData?.from || flight?.origin);
  const legDestCity = isReturnLeg ? (searchData?.from || flight?.origin) : (searchData?.to || flight?.destination);
  const legDate = isReturnLeg ? (searchData?.returnDate || searchData?.date || 'Confirmed') : (searchData?.date || 'Confirmed');

  // Robust seat resolution
  const getAssignedSeat = (index, isReturn) => {
    try {
      if (isReturn) {
        const retSeats = selectedSeats?.return;
        if (!retSeats) return `${index + 4}C`;
        if (Array.isArray(retSeats)) {
          return retSeats[index]?.id || retSeats[index] || `${index + 4}C`;
        }
        if (typeof retSeats === 'object') {
          const vals = Object.values(retSeats);
          const s = vals[index] || retSeats[index];
          return s?.id || (typeof s === 'string' ? s : `${index + 4}C`);
        }
        return `${index + 4}C`;
      } else {
        const outSeats = selectedSeats?.outbound || selectedSeats;
        if (!outSeats) return `${index + 4}A`;
        if (Array.isArray(outSeats)) {
          return outSeats[index]?.id || outSeats[index] || `${index + 4}A`;
        }
        if (typeof outSeats === 'object') {
          const vals = Object.values(outSeats);
          const s = vals[index] || outSeats[index];
          return s?.id || (typeof s === 'string' ? s : `${index + 4}A`);
        }
        return `${index + 4}A`;
      }
    } catch {
      return `${index + 4}A`;
    }
  };

  const assignedSeat = getAssignedSeat(activePassengerIndex, isReturnLeg);
  const gateNumber = `A${(parseInt(flight?.flightNumber?.replace(/\D/g, '') || '12', 10) % 20) + 1}`;
  const boardingTime = computeBoardingTime(flight?.departureTime);

  const passengerTitle = activePassenger.title ? `${activePassenger.title.toUpperCase()}. ` : '';
  const passengerFullName = `${passengerTitle}${activePassenger.firstName?.toUpperCase() || 'VALUED'} ${activePassenger.lastName?.toUpperCase() || 'PASSENGER'}`.trim();
  const stubName = `${activePassenger.firstName || 'Valued'} ${activePassenger.lastName || 'Passenger'}`.trim();

  useEffect(() => {
    let isMounted = true;
    if (isOpen && legOriginIata && legDestIata) {
      fetchRouteWeather(legOriginIata, legDestIata)
        .then(data => {
          if (isMounted) setRouteWeather(data);
        })
        .catch(() => {});
    }
    return () => { isMounted = false; };
  }, [isOpen, legOriginIata, legDestIata]);

  const legRisk = routeWeather 
    ? predictDelayRisk(routeWeather.originWeather, routeWeather.destWeather, flight?.stops || 0)
    : { level: 'Low', score: 12, reason: 'Normal operations with calm airspace' };

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !bookingData) return null;

  const handlePrint = () => {
    window.print();
  };

  const modalContent = (
    <div className="boarding-pass-modal-overlay animate-fade-in" onClick={onClose}>
      <div className="boarding-pass-modal-container" onClick={e => e.stopPropagation()}>
        
        {/* Top Header Action Bar with Prominent Print Option */}
        <div className="modal-header-actions no-print">
          <div className="modal-header-brand">
            <div className="modal-header-icon-wrap">
              <Plane size={20} />
            </div>
            <div>
              <h2 className="modal-header-title">Official Digital Boarding Pass</h2>
              <div className="modal-header-meta">
                <span>PNR: <strong>{bookingRef}</strong></span>
                <span>•</span>
                <span>{flight?.airline || 'Aero Space'} ({legFlightNumber})</span>
              </div>
            </div>
          </div>

          <div className="modal-header-btns">
            <button
              type="button"
              className="btn-print-prominent"
              onClick={handlePrint}
              title="Print or Save as PDF"
            >
              <Printer size={18} />
              <span>Print / Save as PDF</span>
            </button>
            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              aria-label="Close Boarding Pass"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Cancellation Notice Banner */}
        {isCancelled && (
          <div className="no-print" style={{
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-color)',
            color: 'var(--danger-color)',
            borderRadius: 'var(--radius-md)',
            padding: '0.625rem 1rem',
            fontSize: '0.8125rem',
            textAlign: 'center',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} />
            <span>THIS BOOKING HAS BEEN CANCELLED. Boarding pass is VOID and not valid for flight check-in or gate entry.</span>
          </div>
        )}

        {/* Round Trip Leg Switcher Tabs */}
        {isRoundTrip && (
          <div className="no-print" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => setActiveLeg('outbound')}
              style={{
                padding: '0.45rem 1rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                border: activeLeg === 'outbound' ? '1px solid var(--accent-color)' : '1px solid var(--surface-border)',
                background: activeLeg === 'outbound' ? 'var(--accent-subtle)' : 'var(--surface-color)',
                color: activeLeg === 'outbound' ? 'var(--accent-color)' : 'var(--text-secondary)'
              }}
            >
              <Plane size={14} />
              <span>Outbound: {flight?.origin} → {flight?.destination}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveLeg('return')}
              style={{
                padding: '0.45rem 1rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                border: activeLeg === 'return' ? '1px solid var(--accent-color)' : '1px solid var(--surface-border)',
                background: activeLeg === 'return' ? 'var(--accent-subtle)' : 'var(--surface-color)',
                color: activeLeg === 'return' ? 'var(--accent-color)' : 'var(--text-secondary)'
              }}
            >
              <RotateCcw size={14} />
              <span>Return: {flight?.destination} → {flight?.origin}</span>
            </button>
          </div>
        )}

        {/* Passenger Tabs if multi-passenger */}
        {pList.length > 1 && (
          <div className="passenger-tabs-bar no-print">
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Passenger:</span>
            {pList.map((p, idx) => {
              const currentLegSeat = getAssignedSeat(idx, isReturnLeg);
              return (
                <button
                  type="button"
                  key={p.id || idx}
                  className={`passenger-tab-btn ${activePassengerIndex === idx ? 'active' : ''}`}
                  onClick={() => setActivePassengerIndex(idx)}
                >
                  {p.firstName} {p.lastName} (Seat {currentLegSeat})
                </button>
              );
            })}
          </div>
        )}

        {/* Physical Boarding Pass Visual for Screen & Print */}
        <div className="boarding-pass-card printable-ticket">
          {/* Cancelled Watermark */}
          {isCancelled && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) rotate(-22deg)',
              fontSize: '3.5rem',
              fontWeight: 900,
              color: 'rgba(239, 68, 68, 0.28)',
              border: '6px solid rgba(239, 68, 68, 0.35)',
              padding: '0.4rem 2rem',
              borderRadius: '12px',
              letterSpacing: '5px',
              pointerEvents: 'none',
              zIndex: 10,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap'
            }}>
              VOID / CANCELLED
            </div>
          )}

          {/* Main Boarding Pass Section */}
          <div className="pass-main">
            <div className="pass-header">
              <div className="pass-airline">
                {flight?.airlineLogo ? (
                  <img src={flight.airlineLogo} alt={flight.airline} className="pass-airline-logo" />
                ) : (
                  <div className="pass-default-logo">
                    <Plane size={22} />
                  </div>
                )}
                <div>
                  <div className="airline-title">{flight?.airline || 'Aero Space Airline'}</div>
                  <div className="airline-sub">Flight {legFlightNumber} · Operated by {flight?.airline || 'Aero Space'}</div>
                </div>
              </div>

              <div className="pass-header-badges">
                <span className="pass-cabin-badge">
                  {selectedClass?.name?.toUpperCase() || 'ECONOMY'}
                </span>
                <span className="pass-type-badge">
                  BOARDING PASS
                </span>
              </div>
            </div>

            {/* Route & Times Strip */}
            <div className="pass-route-strip">
              <div className="route-point">
                <span className="route-iata">{legOriginIata}</span>
                <span className="route-city">{legOriginCity}</span>
                <span className="route-time">{flight?.departureTime || '10:00 AM'}</span>
                <span className="route-terminal">Departure</span>
              </div>

              <div className="route-flight-icon">
                <span className="route-duration">{flight?.duration || '2h 15m'}</span>
                <div className="route-line-wrap">
                  <span className="route-dot start" />
                  <div className="route-dashed-line" />
                  <Plane size={16} className="route-plane" />
                  <span className="route-dot end" />
                </div>
                <span className="route-direct">Direct Flight</span>
              </div>

              <div className="route-point destination">
                <span className="route-iata">{legDestIata}</span>
                <span className="route-city">{legDestCity}</span>
                <span className="route-time">{flight?.arrivalTime || '12:15 PM'}</span>
                <span className="route-terminal">Arrival</span>
              </div>
            </div>

            {/* Structured Passenger & Flight Details Grid */}
            <div className="pass-details-grid">
              <div className="detail-item passenger-col">
                <span className="detail-label">PASSENGER NAME</span>
                <strong className="detail-value name-value">
                  {passengerFullName}
                </strong>
              </div>

              <div className="detail-item">
                <span className="detail-label">FLIGHT</span>
                <strong className="detail-value">{legFlightNumber}</strong>
              </div>

              <div className="detail-item">
                <span className="detail-label">DATE</span>
                <strong className="detail-value">{legDate}</strong>
              </div>

              <div className="detail-item">
                <span className="detail-label">GATE</span>
                <strong className="detail-value gate-value">{gateNumber}</strong>
              </div>

              <div className="detail-item">
                <span className="detail-label">BOARDING TIME</span>
                <strong className="detail-value time-value">
                  {boardingTime}
                </strong>
              </div>

              <div className="detail-item seat-highlight-box">
                <span className="detail-label">SEAT</span>
                <strong className="detail-value seat-number">{assignedSeat}</strong>
              </div>

              <div className="detail-item">
                <span className="detail-label">BOOKING REF (PNR)</span>
                <strong className="detail-value pnr-text">{bookingRef}</strong>
              </div>
            </div>

            {/* Live Weather & Delay Status Section */}
            <div className="pass-weather-status-strip">
              <div className="pass-weather-header">
                <span className="pwh-title">
                  <Activity size={12} style={{ color: '#4338ca' }} />
                  <span>LIVE FLIGHT DISPATCH & WEATHER TELEMETRY</span>
                </span>
                <span className={`pass-risk-pill risk-${legRisk.level.toLowerCase()}`}>
                  {legRisk.level === 'Low' && <CheckCircle2 size={11} />}
                  {legRisk.level === 'Moderate' && <AlertTriangle size={11} />}
                  {legRisk.level === 'High' && <ShieldAlert size={11} />}
                  <span>{legRisk.level.toUpperCase()} DELAY RISK ({legRisk.score}%)</span>
                </span>
              </div>
              <div className="pass-weather-content">
                <div className="pass-weather-col origin">
                  <span className="pwc-label">DEPARTURE ({legOriginIata})</span>
                  <div className="pwc-main">
                    <strong>{routeWeather?.originWeather?.temperature ?? 26}°C</strong>
                    <span className="pwc-cond">{routeWeather?.originWeather?.condition || 'Fair Skies'}</span>
                  </div>
                  <div className="pwc-sub">
                    <span><Wind size={10} /> {routeWeather?.originWeather?.windSpeed ?? 10} km/h</span>
                    <span><Eye size={10} /> {routeWeather?.originWeather?.visibilityKm ?? 10} km vis</span>
                  </div>
                </div>

                <div className="pass-weather-col reason">
                  <span className="pwc-label">CORRIDOR OUTLOOK</span>
                  <p className="pwc-reason-text">{legRisk.reason}</p>
                </div>

                <div className="pass-weather-col destination">
                  <span className="pwc-label">ARRIVAL ({legDestIata})</span>
                  <div className="pwc-main">
                    <strong>{routeWeather?.destWeather?.temperature ?? 25}°C</strong>
                    <span className="pwc-cond">{routeWeather?.destWeather?.condition || 'Fair Skies'}</span>
                  </div>
                  <div className="pwc-sub">
                    <span><Wind size={10} /> {routeWeather?.destWeather?.windSpeed ?? 12} km/h</span>
                    <span><Eye size={10} /> {routeWeather?.destWeather?.visibilityKm ?? 10} km vis</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Barcode & Security stamp */}
            <div className="pass-barcode-row">
              <div className="pass-barcode-col">
                <div className="barcode-stripes" />
                <span className="barcode-numbers">
                  M1{activePassenger.lastName?.toUpperCase() || 'PASSENGER'}/{activePassenger.firstName?.toUpperCase() || 'VALUED'} E{bookingRef} {legOriginIata}{legDestIata} {legFlightNumber} {assignedSeat}
                </span>
              </div>

              <div className="pass-qr-box">
                <QrCode size={46} style={{ color: '#0f172a' }} />
                <span className="qr-caption">SECURE GATE PASS</span>
              </div>
            </div>
          </div>

          {/* Tear-off Stub (Right Side) */}
          <div className="pass-stub">
            <div className="stub-notch notch-top" />
            <div className="stub-notch notch-bottom" />

            <div>
              <div className="stub-header">
                <span className="stub-brand">{flight?.airline || 'Aero Space'}</span>
                <span className="stub-class">{selectedClass?.name?.toUpperCase() || 'ECONOMY'}</span>
              </div>

              <div className="stub-route-pill">
                <span>{legOriginIata}</span>
                <Plane size={13} style={{ color: '#0284c7' }} />
                <span>{legDestIata}</span>
              </div>

              <div className="stub-content">
                <div className="stub-row">
                  <span className="stub-label">PASSENGER</span>
                  <strong className="stub-val">{stubName}</strong>
                </div>

                <div className="stub-row">
                  <span className="stub-label">FLIGHT</span>
                  <strong className="stub-val">{legFlightNumber}</strong>
                </div>

                <div className="stub-row">
                  <span className="stub-label">DATE</span>
                  <strong className="stub-val">{legDate}</strong>
                </div>

                <div className="stub-row">
                  <span className="stub-label">TIME</span>
                  <strong className="stub-val">{flight?.departureTime || '10:00 AM'}</strong>
                </div>

                <div className="stub-row">
                  <span className="stub-label">GATE</span>
                  <strong className="stub-val">{gateNumber}</strong>
                </div>

                <div className="stub-seat-highlight">
                  <span className="stub-label">SEAT</span>
                  <div className="stub-seat-val">{assignedSeat}</div>
                </div>
              </div>
            </div>

            <div className="stub-footer">
              <QrCode size={40} style={{ color: '#0f172a', margin: '0 auto', display: 'block' }} />
              <span className="stub-pnr">PNR: {bookingRef}</span>
              <span className="stub-receipt-tag">PASSENGER RECEIPT</span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="modal-bottom-actions no-print">
          <div className="pass-footer-tip">
            <ShieldCheck size={18} style={{ color: '#10b981', flexShrink: 0 }} />
            <span>Present this digital boarding pass or printed copy at security and boarding gate. Valid with Govt. Photo ID.</span>
          </div>
          <button
            type="button"
            className="btn-print-prominent"
            onClick={handlePrint}
            style={{ padding: '0.45rem 1rem', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}
          >
            <Printer size={15} />
            <span>Print Pass</span>
          </button>
        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};

export default BoardingPassModal;
