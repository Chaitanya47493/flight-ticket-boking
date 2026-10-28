import React, { useState } from 'react';
import { CreditCard, Lock, ArrowLeft, ShieldCheck, Ticket } from 'lucide-react';

const PaymentForm = ({ bookingData, userEmail, onBack, onSubmit, isSubmitting }) => {
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: ''
  });

  const [errors, setErrors] = useState({});

  // ── Multi-passenger & Seat pricing calculation ───────────────────
  const passengerCount = bookingData.searchData?.passengers || (bookingData.passengers?.list?.length) || 1;
  const basePricePerPerson = bookingData.selectedClass?.price || 0;
  const flightSubtotal = basePricePerPerson * passengerCount;
  const seatFeeTotal = bookingData.seatFee || 0;
  const grandTotal = flightSubtotal + seatFeeTotal;

  // ── Validators ──────────────────────────────────────────────────
  const validate = (name, value) => {
    switch (name) {
      case 'cardNumber': {
        const digits = value.replace(/\s/g, '');
        if (!/^\d+$/.test(digits)) return 'Card number must contain only digits';
        if (digits.length !== 16) return 'Card number must be exactly 16 digits';
        return '';
      }
      case 'expiryDate': {
        if (!/^\d{2}\/\d{2}$/.test(value)) return 'Format must be MM/YY';
        const [mm, yy] = value.split('/').map(Number);
        if (mm < 1 || mm > 12) return 'Month must be between 01 and 12';
        
        const now = new Date();
        const currentYear = now.getFullYear() % 100;
        const currentMonth = now.getMonth() + 1; // 1-12

        if (yy < currentYear) {
          return 'Card has expired';
        }
        if (yy === currentYear && mm < currentMonth) {
          return 'Card has expired';
        }
        return '';
      }
      case 'cvv':
        if (!/^\d+$/.test(value)) return 'CVV must contain only digits';
        if (value.length < 3 || value.length > 4) return 'CVV must be 3 or 4 digits';
        return '';
      case 'nameOnCard':
        if (!/^[a-zA-Z\s'-]+$/.test(value)) return 'Name must contain only letters';
        if (value.trim().length < 2) return 'Enter the full name on your card';
        return '';
      default:
        return '';
    }
  };

  // ── Input handlers with live formatting ─────────────────────────
  const handleChange = (e) => {
    let { name, value } = e.target;

    // Card number: digits only, auto-add space every 4 digits
    if (name === 'cardNumber') {
      const digits = value.replace(/\D/g, '').slice(0, 16);
      const formatted = digits.replace(/(.{4})/g, '$1 ').trim();
      setPaymentData({ ...paymentData, cardNumber: formatted });
      setErrors({ ...errors, cardNumber: validate('cardNumber', formatted) });
      return;
    }

    // Expiry: auto-insert slash after MM
    if (name === 'expiryDate') {
      let digits = value.replace(/\D/g, '').slice(0, 4);
      if (digits.length >= 3) {
        digits = digits.slice(0, 2) + '/' + digits.slice(2);
      }
      setPaymentData({ ...paymentData, expiryDate: digits });
      setErrors({ ...errors, expiryDate: validate('expiryDate', digits) });
      return;
    }

    // CVV: digits only, max 4
    if (name === 'cvv') {
      const digits = value.replace(/\D/g, '').slice(0, 4);
      setPaymentData({ ...paymentData, cvv: digits });
      setErrors({ ...errors, cvv: validate('cvv', digits) });
      return;
    }

    // Name on card: letters only
    if (name === 'nameOnCard') {
      const lettersOnly = value.replace(/[^a-zA-Z\s'-]/g, '');
      setPaymentData({ ...paymentData, nameOnCard: lettersOnly });
      setErrors({ ...errors, nameOnCard: validate('nameOnCard', lettersOnly) });
      return;
    }

    setPaymentData({ ...paymentData, [name]: value });
  };

  // ── Submit ───────────────────────────────────────────────────────
  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    Object.keys(paymentData).forEach(key => {
      const err = validate(key, paymentData[key]);
      if (err) newErrors[key] = err;
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSubmit({
      ...paymentData,
      totalAmountPaid: grandTotal,
      passengerCount,
      baseFare: flightSubtotal,
      seatFee: seatFeeTotal
    });
  };

  const fieldStyle = (field) => ({
    paddingLeft: '1rem',
    letterSpacing: field === 'cardNumber' ? '2px' : undefined,
    borderColor: errors[field] ? '#f87171' : undefined,
    boxShadow: errors[field] ? '0 0 0 2px rgba(248,113,113,0.2)' : undefined,
  });

  const cardDigits = paymentData.cardNumber.replace(/\s/g, '');

  return (
    <div className="payment-form-container animate-fade-in" style={{ position: 'relative' }}>
      {isSubmitting && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.85)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '1rem', backdropFilter: 'blur(4px)' }}>
          <div style={{ color: 'var(--accent-color)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexDirection: 'column' }}>
            <Lock className="animate-pulse" size={36} />
            <span>Processing Secure Payment of ₹{grandTotal.toLocaleString()}...</span>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Generating E-Ticket & Boarding Pass</span>
          </div>
        </div>
      )}

      <div className="results-header">
        <div className="results-info">
          <h2>Secure Payment</h2>
          <p>Please enter your payment details to confirm your flight reservation.</p>
        </div>
      </div>

      <div className="payment-layout">
        {/* Fare Summary Box */}
        <div className="glass-panel fare-breakdown-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Ticket size={18} className="logo-icon" /> Fare Summary
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#a5b4fc', background: 'rgba(99,102,241,0.15)', padding: '2px 8px', borderRadius: '4px' }}>
              {bookingData.flight?.airline} • {bookingData.selectedClass?.name}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Base Fare ({passengerCount} × ₹{basePricePerPerson.toLocaleString()}):</span>
              <strong>₹{flightSubtotal.toLocaleString()}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Seat Selection Charges:</span>
              <strong style={{ color: seatFeeTotal > 0 ? '#38bdf8' : '#4ade80' }}>
                {seatFeeTotal > 0 ? `+₹${seatFeeTotal.toLocaleString()}` : 'Free'}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.75rem', marginTop: '0.5rem', fontSize: '1.15rem' }}>
              <span style={{ fontWeight: 600 }}>Total Amount:</span>
              <strong style={{ color: '#818cf8', fontSize: '1.3rem' }}>₹{grandTotal.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <form className="glass-panel" onSubmit={handlePaymentSubmit} style={{ padding: '2rem' }}>
          <div className="form-section">
            <h3 className="form-section-title" style={{ marginBottom: '1.5rem' }}>
              <CreditCard size={20} className="logo-icon" />
              Debit / Credit Card
            </h3>

            <div className="form-grid">
              {/* Card Number */}
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="cardNumber">
                  Card Number
                  <span style={{ color: '#64748b', fontWeight: 400, marginLeft: '0.5rem' }}>(16 digits)</span>
                </label>
                <input
                  type="text"
                  id="cardNumber"
                  name="cardNumber"
                  className="input-field"
                  style={fieldStyle('cardNumber')}
                  placeholder="0000 0000 0000 0000"
                  value={paymentData.cardNumber}
                  onChange={handleChange}
                  maxLength={19}
                  required
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  {errors.cardNumber ? (
                    <span style={{ fontSize: '0.75rem', color: '#f87171' }}>⚠️ {errors.cardNumber}</span>
                  ) : <span />}
                  <span style={{ fontSize: '0.75rem', color: cardDigits.length === 16 ? '#4ade80' : '#64748b' }}>
                    {cardDigits.length}/16
                  </span>
                </div>
              </div>

              {/* Name on Card */}
              <div className="input-group">
                <label htmlFor="nameOnCard">Name on Card</label>
                <input
                  type="text"
                  id="nameOnCard"
                  name="nameOnCard"
                  className="input-field"
                  style={fieldStyle('nameOnCard')}
                  placeholder="e.g. Rahul Sharma"
                  value={paymentData.nameOnCard}
                  onChange={handleChange}
                  required
                />
                {errors.nameOnCard && (
                  <span style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '4px' }}>
                    ⚠️ {errors.nameOnCard}
                  </span>
                )}
              </div>

              {/* Expiry Date */}
              <div className="input-group">
                <label htmlFor="expiryDate">Expiry Date</label>
                <input
                  type="text"
                  id="expiryDate"
                  name="expiryDate"
                  className="input-field"
                  style={fieldStyle('expiryDate')}
                  placeholder="MM/YY"
                  value={paymentData.expiryDate}
                  onChange={handleChange}
                  maxLength={5}
                  required
                />
                {errors.expiryDate && (
                  <span style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '4px' }}>
                    ⚠️ {errors.expiryDate}
                  </span>
                )}
              </div>

              {/* CVV */}
              <div className="input-group">
                <label htmlFor="cvv">
                  CVV
                  <span style={{ color: '#64748b', fontWeight: 400, marginLeft: '0.5rem' }}>(3-4 digits)</span>
                </label>
                <input
                  type="password"
                  id="cvv"
                  name="cvv"
                  className="input-field"
                  style={fieldStyle('cvv')}
                  placeholder="•••"
                  value={paymentData.cvv}
                  onChange={handleChange}
                  maxLength={4}
                  required
                />
                {errors.cvv && (
                  <span style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '4px' }}>
                    ⚠️ {errors.cvv}
                  </span>
                )}
              </div>
            </div>

            {/* Security note */}
            <div style={{ marginTop: '1.5rem', padding: '0.75rem 1rem', background: 'rgba(99,102,241,0.08)', borderRadius: '0.5rem', border: '1px solid rgba(99,102,241,0.2)', fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={16} style={{ color: '#4ade80', flexShrink: 0 }} />
              256-bit SSL encrypted. Simulated safe transaction sandbox.
            </div>

            <div className="form-actions" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
              <button type="button" className="btn-secondary" onClick={onBack} disabled={isSubmitting}>
                <ArrowLeft size={18} style={{ marginRight: '8px' }} />
                Back to Seats
              </button>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                <Lock size={18} />
                Pay ₹{grandTotal.toLocaleString()}
              </button>
            </div>

            <p style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', marginTop: '1rem' }}>
              E-Ticket & official boarding pass will be dispatched to <strong>{bookingData.passengers?.email || userEmail}</strong>.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;
