import { useState } from 'react';
import { Check, Home, Ticket } from 'lucide-react';
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

  const isRoundTrip = searchData?.tripType === 'roundtrip' || selectedSeats?.isRoundTrip;
  let assignedSeatsStr = 'Auto-Assigned at Check-in';
  if (selectedSeats) {
    if (isRoundTrip && (selectedSeats.outbound || selectedSeats.return)) {
      const outSeats = Object.values(selectedSeats.outbound || {}).map(s => s?.id).filter(Boolean);
      const retSeats = Object.values(selectedSeats.return || {}).map(s => s?.id).filter(Boolean);
      const parts = [];
      if (outSeats.length) parts.push(`Outbound: ${outSeats.join(', ')}`);
      if (retSeats.length) parts.push(`Return: ${retSeats.join(', ')}`);
      assignedSeatsStr = parts.join(' | ') || 'Auto-Assigned at Check-in';
    } else {
      const seats = Object.values(selectedSeats)
        .filter(s => s && typeof s === 'object' && s.id)
        .map(s => s.id);
      if (seats.length) assignedSeatsStr = seats.join(', ');
    }
  }

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

          {bookingData?.fareBreakdown && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Fare & Charges Breakdown
              </div>
              <div className="summary-row" style={{ fontSize: '0.88rem' }}>
                <span className="summary-label">Base Fare ({passengerCount} passenger{passengerCount > 1 ? 's' : ''})</span>
                <span className="summary-value">₹{bookingData.fareBreakdown.baseFare?.toLocaleString()}</span>
              </div>
              {bookingData.fareBreakdown.seatFees > 0 && (
                <div className="summary-row" style={{ fontSize: '0.88rem' }}>
                  <span className="summary-label">Seat Fees</span>
                  <span className="summary-value">₹{bookingData.fareBreakdown.seatFees?.toLocaleString()}</span>
                </div>
              )}
              {bookingData.fareBreakdown.addOnsTotal > 0 && (
                <div className="summary-row" style={{ fontSize: '0.88rem' }}>
                  <span className="summary-label">
                    Travel Add-Ons
                    {bookingData.fareBreakdown.addOns?.meal && bookingData.fareBreakdown.addOns.meal !== 'none' ? ` (${bookingData.fareBreakdown.addOns.meal} Meal)` : ''}
                    {bookingData.fareBreakdown.addOns?.extraBaggage ? ' (10kg Baggage)' : ''}
                    {bookingData.fareBreakdown.addOns?.insurance ? ' (Insurance)' : ''}
                  </span>
                  <span className="summary-value">₹{bookingData.fareBreakdown.addOnsTotal?.toLocaleString()}</span>
                </div>
              )}
              {bookingData.fareBreakdown.discount > 0 && (
                <div className="summary-row" style={{ fontSize: '0.88rem', color: '#4ade80' }}>
                  <span className="summary-label">Promo Discount ({bookingData.fareBreakdown.promoCode})</span>
                  <span className="summary-value">-₹{bookingData.fareBreakdown.discount?.toLocaleString()}</span>
                </div>
              )}
              <div className="summary-row" style={{ fontSize: '0.88rem' }}>
                <span className="summary-label">Taxes & GST (5%)</span>
                <span className="summary-value">₹{bookingData.fareBreakdown.taxes?.toLocaleString()}</span>
              </div>
            </div>
          )}

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
