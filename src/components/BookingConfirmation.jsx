import React from 'react';
import { Check, Home } from 'lucide-react';

// bookingId is the real Firestore document ID passed from App.jsx
const BookingConfirmation = ({ bookingData, onReset, bookingId }) => {
  const { flight, selectedClass, passengers, payment, searchData } = bookingData;
  // Use real Firestore doc ID for a stable, unique reference
  const bookingRef = bookingId ? bookingId.substring(0, 6).toUpperCase() : '------';

  return (
    <div className="confirmation-container animate-scale-in">
      <div style={{ padding: '2rem', borderRadius: '1rem', background: 'var(--bg-color)' }}>
        <div className="success-icon-wrapper" style={{ margin: '0 auto' }}>
          <Check size={48} />
        </div>
        
        <h2 className="gradient-text" style={{ textAlign: 'center', marginTop: '1rem' }}>Booking Confirmed!</h2>
        <p style={{ textAlign: 'center' }}>Your flight has been successfully booked. Have a great trip!</p>
        
        <div className="booking-ref-card">
          <span className="ref-label">Booking Reference</span>
          <span className="ref-number">{bookingRef}</span>
        </div>
        
        <div className="glass-panel summary-card" style={{ marginTop: '2rem' }}>
          <div className="summary-row">
            <span className="summary-label">Passenger Name</span>
            <span className="summary-value">{passengers.firstName} {passengers.lastName}</span>
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
            <span className="summary-label">Departure Date</span>
            <span className="summary-value">{searchData?.date}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Departure Time</span>
            <span className="summary-value">{flight.departureTime}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Class</span>
            <span className="summary-value">{selectedClass.name}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Payment Card</span>
            <span className="summary-value">**** **** **** {payment?.cardNumber?.slice(-4) || '0000'}</span>
          </div>

          <div className="summary-row">
            <span className="summary-label">Total Amount Paid</span>
            <span className="summary-value" style={{color: 'var(--accent-color)'}}>₹{selectedClass.price.toLocaleString()}</span>
          </div>
        </div>
      </div>
      
      <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem'}}>
        <button className="btn-primary" onClick={onReset}>
          <Home size={18} />
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default BookingConfirmation;
