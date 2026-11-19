import React, { useState } from 'react';
import { X, Printer, Download, Plane, QrCode, ShieldCheck } from 'lucide-react';

const BoardingPassModal = ({ isOpen, onClose, bookingData, bookingId }) => {
  if (!isOpen || !bookingData) return null;

  const { flight, selectedClass, passengers, selectedSeats, searchData } = bookingData;
  const pList = passengers?.list || [
    {
      id: 1,
      title: 'Mr',
      firstName: passengers?.firstName || 'Valued',
      lastName: passengers?.lastName || 'Passenger'
    }
  ];

  const [activePassengerIndex, setActivePassengerIndex] = useState(0);
  const activePassenger = pList[activePassengerIndex] || pList[0];

  const bookingRef = bookingId ? bookingId.substring(0, 6).toUpperCase() : 'AS9842';
  const assignedSeat = selectedSeats?.[activePassengerIndex]?.id || `${activePassengerIndex + 4}A`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="boarding-pass-modal-overlay animate-fade-in" onClick={onClose}>
      <div className="boarding-pass-modal-container" onClick={e => e.stopPropagation()}>
        {/* Header Actions */}
        <div className="modal-header-actions no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Plane size={24} className="logo-icon" />
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Official Digital Boarding Pass</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button type="button" className="btn-primary" onClick={handlePrint} style={{ padding: '0.5rem 1.25rem' }}>
              <Printer size={16} />
              Print / Save as PDF
            </button>
            <button type="button" className="modal-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Passenger Tabs if multi-passenger */}
        {pList.length > 1 && (
          <div className="passenger-tabs-bar no-print">
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Passenger:</span>
            {pList.map((p, idx) => (
              <button
                type="button"
                key={p.id || idx}
                className={`passenger-tab-btn ${activePassengerIndex === idx ? 'active' : ''}`}
                onClick={() => setActivePassengerIndex(idx)}
              >
                {p.firstName} {p.lastName} (Seat {selectedSeats?.[idx]?.id || `${idx + 4}A`})
              </button>
            ))}
          </div>
        )}

        {/* Physical Boarding Pass Visual for Screen & Print */}
        <div className="boarding-pass-card printable-ticket">
          {/* Main Boarding Pass Section */}
          <div className="pass-main">
            <div className="pass-header">
              <div className="pass-airline">
                {flight?.airlineLogo ? (
                  <img src={flight.airlineLogo} alt={flight.airline} className="pass-airline-logo" />
                ) : (
                  <Plane size={28} className="logo-icon" />
                )}
                <div>
                  <div className="airline-title">{flight?.airline || 'Aero Space Airline'}</div>
                  <div className="airline-sub">Flight {flight?.flightNumber || '6E 100'}</div>
                </div>
              </div>

              <div className="pass-cabin-badge">
                {selectedClass?.name?.toUpperCase() || 'ECONOMY'}
              </div>
            </div>

            <div className="pass-route-strip">
              <div className="route-point">
                <span className="route-iata">{flight?.origin || 'DEL'}</span>
                <span className="route-city">{searchData?.from || flight?.origin}</span>
                <span className="route-time">{flight?.departureTime || '10:00 AM'}</span>
              </div>

              <div className="route-flight-icon">
                <span className="route-duration">{flight?.duration || '2h 15m'}</span>
                <div className="route-line">
                  <Plane size={16} />
                </div>
                <span className="route-direct">Direct Flight</span>
              </div>

              <div className="route-point" style={{ textAlign: 'right' }}>
                <span className="route-iata">{flight?.destination || 'BOM'}</span>
                <span className="route-city">{searchData?.to || flight?.destination}</span>
                <span className="route-time">{flight?.arrivalTime || '12:15 PM'}</span>
              </div>
            </div>

            <div className="pass-details-grid">
              <div className="detail-item">
                <span className="detail-label">PASSENGER NAME</span>
                <strong className="detail-value">
                  {activePassenger.title ? `${activePassenger.title.toUpperCase()}. ` : ''}
                  {activePassenger.firstName?.toUpperCase()} {activePassenger.lastName?.toUpperCase()}
                </strong>
              </div>

              <div className="detail-item">
                <span className="detail-label">DATE</span>
                <strong className="detail-value">{searchData?.date || 'Confirmed'}</strong>
              </div>

              <div className="detail-item">
                <span className="detail-label">GATE</span>
                <strong className="detail-value">A{parseInt(flight?.flightNumber?.replace(/\D/g, '') || '12', 10) % 20 + 1}</strong>
              </div>

              <div className="detail-item">
                <span className="detail-label">BOARDING TIME</span>
                <strong className="detail-value" style={{ color: '#4338ca' }}>
                  {flight?.departureTime ? `${flight.departureTime} (T-45m)` : '45 mins before'}
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

            {/* Barcode & Security stamp */}
            <div className="pass-barcode-row">
              <div className="pass-barcode">
                {/* Synthetic realistic barcode stripes */}
                <div className="barcode-stripes" />
                <span className="barcode-numbers">M1{activePassenger.lastName?.toUpperCase()}/{activePassenger.firstName?.toUpperCase()} E{bookingRef} {flight?.origin}{flight?.destination}</span>
              </div>

              <div className="pass-qr-box">
                <div className="mock-qr">
                  <QrCode size={44} style={{ color: '#1e293b' }} />
                </div>
                <span style={{ fontSize: '0.65rem', color: '#64748b' }}>SECURE GATE PASS</span>
              </div>
            </div>
          </div>

          {/* Tear-off Stub */}
          <div className="pass-stub">
            <div className="stub-notch notch-top" />
            <div className="stub-notch notch-bottom" />

            <div className="stub-header">
              <span className="stub-brand">{flight?.airline || 'Aero Space'}</span>
              <span className="stub-class">{selectedClass?.name || 'Economy'}</span>
            </div>

            <div className="stub-content">
              <div className="stub-row">
                <span className="stub-label">NAME</span>
                <strong className="stub-val">{activePassenger.firstName?.slice(0, 10)} {activePassenger.lastName?.slice(0, 10)}</strong>
              </div>

              <div className="stub-row">
                <span className="stub-label">FLIGHT</span>
                <strong className="stub-val">{flight?.flightNumber}</strong>
              </div>

              <div className="stub-row">
                <span className="stub-label">DATE</span>
                <strong className="stub-val">{searchData?.date}</strong>
              </div>

              <div className="stub-row">
                <span className="stub-label">FROM → TO</span>
                <strong className="stub-val">{flight?.origin} → {flight?.destination}</strong>
              </div>

              <div className="stub-seat-highlight">
                <span className="stub-label">SEAT</span>
                <div className="stub-seat-val">{assignedSeat}</div>
              </div>
            </div>

            <div className="stub-footer">
              <QrCode size={36} style={{ color: '#334155', margin: '0 auto' }} />
              <span style={{ fontSize: '0.6rem', color: '#64748b', display: 'block', textAlign: 'center', marginTop: '4px' }}>{bookingRef}</span>
            </div>
          </div>
        </div>

        <div className="pass-footer-tip no-print">
          <ShieldCheck size={16} style={{ color: '#10b981' }} />
          <span>Present this digital boarding pass or printed copy at security and boarding gate. Valid with Govt. Photo ID.</span>
        </div>
      </div>
    </div>
  );
};

export default BoardingPassModal;
