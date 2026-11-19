import React, { useState } from 'react';
import { Check, Home, Ticket, Download, ArrowRight } from 'lucide-react';
import BoardingPassModal from './BoardingPassModal';

// bookingId is the real Firestore document ID passed from App.jsx
const BookingConfirmation = ({ bookingData, onReset, bookingId }) => {
  const [showBoardingPass, setShowBoardingPass] = useState(false);
  const { flight, selectedClass, passengers, payment, searchData, selectedSeats, seatFee } = bookingData;

  // Use real Firestore doc ID for a stable, unique reference
  const bookingRef = bookingId ? bookingId.substring(0, 6).toUpperCase() : 'AS9842';
  const passengerCount = searchData?.passengers || passengers?.list?.length || 1;
  const totalAmount = payment?.totalAmountPaid || ((selectedClass.price * passengerCount) + (seatFee || 0));

  const pList = passengers?.list || [
    { id: 1, firstName: passengers?.firstName || 'Traveler', lastName: passengers?.lastName || '' }
  ];

  const assignedSeatsStr = Object.values(selectedSeats || {})
    .map(s => s.id)
    .join(', ') || 'Auto-Assigned at Check-in';

  return (
    <div className="confirmation-container animate-scale-in">
      <div style={{ padding: '2.5rem', borderRadius: '1rem', background: 'var(--bg-color)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="success-icon-wrapper" style={{ margin: '0 auto' }}>
          <Check size={48} />
        </div>
        
        <h2 className="gradient-text" style={{ textAlign: 'center', marginTop: '1rem', fontSize: '2rem' }}>Booking Confirmed!</h2>
        <p style={{ textAlign: 'center', color: '#94a3b8' }}>
          Your flight ticket has been issued and confirmed. Have a safe journey!
        </p>
        
        <div className="booking-ref-card" style={{ maxWidth: '300px', margin: '1.5rem auto' }}>
          <span className="ref-label">Booking Reference (PNR)</span>
          <span className="ref-number">{bookingRef}</span>
        </div>

        {/* View Boarding Pass Banner Button */}
        <div style={{ textAlign: 'center', margin: '1.5rem 0' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowBoardingPass(true)}
            style={{ padding: '0.85rem 2rem', fontSize: '1.05rem', boxShadow: '0 0 25px rgba(99,102,241,0.4)' }}
          >
            <Ticket size={20} />
            View & Print Boarding Pass
          </button>
        </div>
        
        <div className="glass-panel summary-card" style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
          <div className="summary-row">
            <span className="summary-label">Passengers ({passengerCount})</span>
            <span className="summary-value">
              {pList.map(p => `${p.firstName} ${p.lastName}`).join(', ')}
            </span>
          </div>

          <div className="summary-row">
            <span className="summary-label">Assigned Seat(s)</span>
            <span className="summary-value" style={{ color: '#4ade80', fontWeight: 600 }}>
              {assignedSeatsStr}
            </span>
          </div>

          <div className="summary-row">
            <span className="summary-label">Flight</span>
            <span className="summary-value">{flight.airline} {flight.flightNumber}</span>
          </div>

          <div className="summary-row">
            <span className="summary-label">Route</span>
            <span className="summary-value">{flight.origin} → {flight.destination}</span>
          </div>

          <div className="summary-row">
            <span className="summary-label">Departure Date & Time</span>
            <span className="summary-value">{searchData?.date} at {flight.departureTime}</span>
          </div>

          <div className="summary-row">
            <span className="summary-label">Cabin Class</span>
            <span className="summary-value">{selectedClass.name}</span>
          </div>

          <div className="summary-row">
            <span className="summary-label">Payment Method</span>
            <span className="summary-value">Card ending in **** {payment?.cardNumber?.slice(-4) || '0000'}</span>
          </div>

          <div className="summary-row" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
            <span className="summary-label" style={{ fontWeight: 600 }}>Total Amount Paid</span>
            <span className="summary-value" style={{ color: '#818cf8', fontSize: '1.25rem', fontWeight: 700 }}>
              ₹{totalAmount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
        <button className="btn-secondary" onClick={onReset}>
          <Home size={18} />
          Book Another Flight
        </button>
      </div>

      {/* Boarding Pass Modal */}
      <BoardingPassModal
        isOpen={showBoardingPass}
        onClose={() => setShowBoardingPass(false)}
        bookingData={bookingData}
        bookingId={bookingId}
      />
    </div>
  );
};

export default BookingConfirmation;
