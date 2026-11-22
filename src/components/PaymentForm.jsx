import { useState } from 'react';
import { CreditCard, Lock, ArrowLeft, ShieldCheck, Ticket, Utensils, Luggage, Shield, Tag, Check, X, AlertCircle } from 'lucide-react';

const PaymentForm = ({ bookingData, userEmail, onBack, onSubmit, isSubmitting }) => {
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: ''
  });

  const [errors, setErrors] = useState({});

  // ── Add-Ons State ────────────────────────────────────────────────
  const [mealOption, setMealOption] = useState('none'); // 'none' | 'veg' | 'non-veg'
  const [extraBaggage, setExtraBaggage] = useState(false); // boolean (+₹1,200)
  const [travelInsurance, setTravelInsurance] = useState(false); // boolean (+₹249 per passenger)

  // ── Promo Code State ─────────────────────────────────────────────
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoMessage, setPromoMessage] = useState({ type: '', text: '' });

  // ── Fare & Passenger Calculations ─────────────────────────────────
  const passengerCount = bookingData.searchData?.passengers || (bookingData.passengers?.list?.length) || 1;
  const basePricePerPerson = bookingData.selectedClass?.price || 0;
  const flightSubtotal = basePricePerPerson * passengerCount;
  const seatFeeTotal = bookingData.seatFee || 0;

  // Add-Ons Costs
  const mealCost = mealOption === 'veg' ? (350 * passengerCount) : mealOption === 'non-veg' ? (450 * passengerCount) : 0;
  const baggageCost = extraBaggage ? 1200 : 0;
  const insuranceCost = travelInsurance ? (249 * passengerCount) : 0;
  const addOnsTotal = mealCost + baggageCost + insuranceCost;

  // Promo Code Discount Calculation
  let discount = 0;
  if (appliedPromo) {
    if (appliedPromo.code === 'AERO10') {
      discount = Math.round(flightSubtotal * 0.10);
    } else if (appliedPromo.code === 'FLY500') {
      discount = Math.min(500, flightSubtotal);
    }
  }

  // Tax & Total Calculation (5% GST)
  const netTaxableAmount = Math.max(0, flightSubtotal + seatFeeTotal + addOnsTotal - discount);
  const taxesAndGst = Math.round(netTaxableAmount * 0.05);
  const grandTotal = netTaxableAmount + taxesAndGst;

  // ── Promo Code Handler ───────────────────────────────────────────
  const handleApplyPromo = (e) => {
    e.preventDefault();
    const code = promoInput.trim().toUpperCase();
    if (!code) return;

    if (code === 'AERO10') {
      const disc = Math.round(flightSubtotal * 0.10);
      setAppliedPromo({ code: 'AERO10', discount: disc, label: '10% off Base Fare' });
      setPromoMessage({ type: 'success', text: `Promo AERO10 applied! You save ₹${disc.toLocaleString()}.` });
    } else if (code === 'FLY500') {
      const disc = Math.min(500, flightSubtotal);
      setAppliedPromo({ code: 'FLY500', discount: disc, label: 'Flat ₹500 off' });
      setPromoMessage({ type: 'success', text: `Promo FLY500 applied! You save ₹${disc.toLocaleString()}.` });
    } else {
      setPromoMessage({ type: 'error', text: 'Invalid promo code. Use AERO10 (10% off) or FLY500 (₹500 off).' });
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput('');
    setPromoMessage({ type: '', text: '' });
  };

  // ── Card Validators ──────────────────────────────────────────────
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

  const handleChange = (e) => {
    let { name, value } = e.target;

    if (name === 'cardNumber') {
      const digits = value.replace(/\D/g, '').slice(0, 16);
      const formatted = digits.replace(/(.{4})/g, '$1 ').trim();
      setPaymentData({ ...paymentData, cardNumber: formatted });
      setErrors({ ...errors, cardNumber: validate('cardNumber', formatted) });
      return;
    }

    if (name === 'expiryDate') {
      let digits = value.replace(/\D/g, '').slice(0, 4);
      if (digits.length >= 3) {
        digits = digits.slice(0, 2) + '/' + digits.slice(2);
      }
      setPaymentData({ ...paymentData, expiryDate: digits });
      setErrors({ ...errors, expiryDate: validate('expiryDate', digits) });
      return;
    }

    if (name === 'cvv') {
      const digits = value.replace(/\D/g, '').slice(0, 4);
      setPaymentData({ ...paymentData, cvv: digits });
      setErrors({ ...errors, cvv: validate('cvv', digits) });
      return;
    }

    if (name === 'nameOnCard') {
      const lettersOnly = value.replace(/[^a-zA-Z\s'-]/g, '');
      setPaymentData({ ...paymentData, nameOnCard: lettersOnly });
      setErrors({ ...errors, nameOnCard: validate('nameOnCard', lettersOnly) });
      return;
    }

    setPaymentData({ ...paymentData, [name]: value });
  };

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
    const digitsOnly = paymentData.cardNumber.replace(/\D/g, '');
    const last4 = digitsOnly.slice(-4) || '1234';
    const cardBrand = digitsOnly.startsWith('4') ? 'Visa' : digitsOnly.startsWith('5') ? 'Mastercard' : 'Card';

    onSubmit({
      cardLast4: last4,
      cardBrand,
      maskedCardNumber: `•••• •••• •••• ${last4}`,
      nameOnCard: paymentData.nameOnCard.trim(),
      totalAmountPaid: grandTotal,
      passengerCount,
      baseFare: flightSubtotal,
      seatFee: seatFeeTotal,
      paymentMethod: 'card_simulation',
      status: 'completed',
      fareBreakdown: {
        baseFare: flightSubtotal,
        seatFees: seatFeeTotal,
        addOnsTotal,
        addOns: {
          meal: mealOption,
          mealCost,
          extraBaggage,
          baggageCost,
          travelInsurance,
          insuranceCost,
          totalAddOns: addOnsTotal
        },
        promoCode: appliedPromo ? appliedPromo.code : null,
        discount,
        taxes: taxesAndGst,
        taxesAndGst,
        grandTotal
      }
    });
  };

  const fieldStyle = (field) => ({
    paddingLeft: '1rem',
    letterSpacing: field === 'cardNumber' ? '2px' : undefined,
    borderColor: errors[field] ? 'var(--danger-color)' : undefined,
    boxShadow: errors[field] ? '0 0 0 2px var(--danger-bg)' : undefined,
  });

  const cardDigits = paymentData.cardNumber.replace(/\s/g, '');

  return (
    <div className="payment-form-container animate-fade-in" style={{ position: 'relative' }}>
      {isSubmitting && (
        <div className="payment-processing-overlay">
          <div className="payment-processing-spinner-box">
            <Lock className="animate-pulse" size={36} />
            <span>Processing Secure Payment of ₹{grandTotal.toLocaleString()}...</span>
            <span className="payment-processing-subtext">Generating E-Ticket & Boarding Pass</span>
          </div>
        </div>
      )}

      <div className="results-header">
        <div className="results-info">
          <h2>Review & Secure Payment</h2>
          <p>Customize travel add-ons, apply discounts, and complete your simulated checkout.</p>
        </div>
      </div>

      {/* ── TRAVEL ADD-ONS BOX ─────────────────────────────────────── */}
      <div className="glass-panel addons-panel">
        <h3 className="addons-panel-title">
          <Luggage size={20} className="logo-icon" /> Travel Add-Ons & Preferences (Optional)
        </h3>

        <div className="addons-grid">
          {/* Meal Selection */}
          <div className="addon-card">
            <div className="addon-card-header">
              <Utensils size={18} style={{ color: 'var(--warning-color)' }} />
              <strong className="addon-card-title">In-Flight Meal</strong>
            </div>
            <p className="addon-card-desc">
              Fresh chef-prepared meal served warm on your flight.
            </p>
            <div className="addon-meal-btn-group">
              <button
                type="button"
                onClick={() => setMealOption('none')}
                className={`addon-meal-btn ${mealOption === 'none' ? 'selected-none' : ''}`}
              >
                No Meal (₹0)
              </button>
              <button
                type="button"
                onClick={() => setMealOption('veg')}
                className={`addon-meal-btn ${mealOption === 'veg' ? 'selected-veg' : ''}`}
              >
                Veg (₹350/pax)
              </button>
              <button
                type="button"
                onClick={() => setMealOption('non-veg')}
                className={`addon-meal-btn ${mealOption === 'non-veg' ? 'selected-nonveg' : ''}`}
              >
                Non-Veg (₹450/pax)
              </button>
            </div>
          </div>

          {/* Extra Baggage Toggle */}
          <div
            className={`addon-card selectable ${extraBaggage ? 'active' : ''}`}
            onClick={() => setExtraBaggage(prev => !prev)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="addon-card-header">
                  <Luggage size={18} style={{ color: 'var(--accent-color)' }} />
                  <strong className="addon-card-title">Extra 10kg Baggage</strong>
                </div>
                <p className="addon-card-desc">
                  Pre-book additional checked baggage allowance and save up to 40% over airport rates.
                </p>
                <span className="addon-card-price">+₹1,200 total</span>
              </div>
              <input
                type="checkbox"
                id="extraBaggageCheck"
                checked={extraBaggage}
                onChange={(e) => {
                  e.stopPropagation();
                  setExtraBaggage(e.target.checked);
                }}
                onClick={(e) => e.stopPropagation()}
                style={{ width: '20px', height: '20px', accentColor: 'var(--accent-color)', cursor: 'pointer', marginTop: '4px' }}
              />
            </div>
          </div>

          {/* Travel Insurance Toggle */}
          <div
            className={`addon-card selectable ${travelInsurance ? 'active' : ''}`}
            onClick={() => setTravelInsurance(prev => !prev)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="addon-card-header">
                  <Shield size={18} style={{ color: 'var(--success-color)' }} />
                  <strong className="addon-card-title">Comprehensive Insurance</strong>
                </div>
                <p className="addon-card-desc">
                  Covers medical emergencies, flight delays, trip cancellations & lost baggage.
                </p>
                <span className="addon-card-price" style={{ color: 'var(--success-color)' }}>+₹249 per passenger</span>
              </div>
              <input
                type="checkbox"
                id="travelInsuranceCheck"
                checked={travelInsurance}
                onChange={(e) => {
                  e.stopPropagation();
                  setTravelInsurance(e.target.checked);
                }}
                onClick={(e) => e.stopPropagation()}
                style={{ width: '20px', height: '20px', accentColor: 'var(--accent-color)', cursor: 'pointer', marginTop: '4px' }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="payment-layout">
        {/* Fare Summary & Breakdown Box */}
        <div className="glass-panel fare-breakdown-card">
          <div className="fare-breakdown-header">
            <h3>
              <Ticket size={18} className="logo-icon" /> Fare Summary
            </h3>
            <span className="fare-summary-badge">
              {bookingData.flight?.airline} • {bookingData.selectedClass?.name}
            </span>
          </div>

          <div className="fare-breakdown-list">
            <div className="fare-row">
              <span className="fare-row-label">Base Fare ({passengerCount} × ₹{basePricePerPerson.toLocaleString()}):</span>
              <strong className="fare-row-value">₹{flightSubtotal.toLocaleString()}</strong>
            </div>

            <div className="fare-row">
              <span className="fare-row-label">Seat Fees:</span>
              <strong className={seatFeeTotal > 0 ? 'fare-row-highlight' : 'fare-row-success'}>
                {seatFeeTotal > 0 ? `+₹${seatFeeTotal.toLocaleString()}` : 'Free'}
              </strong>
            </div>

            {/* Add-ons itemized if selected */}
            {addOnsTotal > 0 && (
              <div className="fare-addons-breakdown">
                <span className="fare-addons-label">Selected Add-Ons</span>
                {mealCost > 0 && (
                  <div className="fare-addons-item">
                    <span>• Meals ({mealOption === 'veg' ? 'Veg' : 'Non-Veg'} × {passengerCount}):</span>
                    <span>+₹{mealCost.toLocaleString()}</span>
                  </div>
                )}
                {baggageCost > 0 && (
                  <div className="fare-addons-item">
                    <span>• Extra Baggage (10kg):</span>
                    <span>+₹{baggageCost.toLocaleString()}</span>
                  </div>
                )}
                {insuranceCost > 0 && (
                  <div className="fare-addons-item">
                    <span>• Travel Insurance ({passengerCount} pax):</span>
                    <span>+₹{insuranceCost.toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}

            {/* Discount if applied */}
            {appliedPromo && discount > 0 && (
              <div className="fare-row" style={{ color: 'var(--success-color)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Tag size={14} /> Discount ({appliedPromo.code}):
                </span>
                <strong>-₹{discount.toLocaleString()}</strong>
              </div>
            )}

            {/* Taxes & GST */}
            <div className="fare-row">
              <span className="fare-row-label">Taxes & GST (5%):</span>
              <strong className="fare-row-value">+₹{taxesAndGst.toLocaleString()}</strong>
            </div>

            {/* Grand Total */}
            <div className="fare-total-row">
              <span>Grand Total:</span>
              <strong className="fare-total-price">₹{grandTotal.toLocaleString()}</strong>
            </div>
          </div>

          {/* ── PROMO CODE INPUT BOX ───────────────────────────────── */}
          <div className="promo-box-container">
            <label className="promo-label">
              <Tag size={14} style={{ color: 'var(--warning-color)' }} /> Have a Promo Code?
            </label>
            
            {!appliedPromo ? (
              <div>
                <div className="promo-input-group">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    placeholder="e.g. AERO10 or FLY500"
                    className="promo-input-field"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className="btn-secondary"
                    style={{ padding: '8px 14px', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    Apply
                  </button>
                </div>
                <div className="promo-hint">
                  Try <strong>AERO10</strong> (10% off base) or <strong>FLY500</strong> (flat ₹500 off)
                </div>
              </div>
            ) : (
              <div className="promo-applied-box">
                <div className="promo-applied-text">
                  <Check size={16} />
                  <span>{appliedPromo.code} applied (-₹{discount.toLocaleString()})</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemovePromo}
                  className="promo-remove-btn"
                  title="Remove promo code"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {promoMessage.text && (
              <div style={{
                marginTop: '6px',
                fontSize: '0.75rem',
                color: promoMessage.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)'
              }}>
                {promoMessage.text}
              </div>
            )}
          </div>
        </div>

        {/* ── CARD PAYMENT FORM ────────────────────────────────────── */}
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
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.5rem' }}>(16 digits)</span>
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
                    <span style={{ fontSize: '0.75rem', color: 'var(--danger-color)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={12} />
                      <span>{errors.cardNumber}</span>
                    </span>
                  ) : <span />}
                  <span style={{ fontSize: '0.75rem', color: cardDigits.length === 16 ? 'var(--success-color)' : 'var(--text-muted)' }}>
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
                  <span style={{ fontSize: '0.75rem', color: 'var(--danger-color)', marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} />
                    <span>{errors.nameOnCard}</span>
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
                  <span style={{ fontSize: '0.75rem', color: 'var(--danger-color)', marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} />
                    <span>{errors.expiryDate}</span>
                  </span>
                )}
              </div>

              {/* CVV */}
              <div className="input-group">
                <label htmlFor="cvv">
                  CVV
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.4rem' }}>(3-4 digits)</span>
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
                  <span style={{ fontSize: '0.75rem', color: 'var(--danger-color)', marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} />
                    <span>{errors.cvv}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Security note */}
            <div style={{ marginTop: '1.25rem', padding: '0.625rem 0.875rem', background: 'var(--surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={16} style={{ color: 'var(--success-color)', flexShrink: 0 }} />
              <span>256-bit SSL encrypted. Simulated safe transaction sandbox.</span>
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

            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem' }}>
              E-Ticket & official boarding pass will be dispatched to <strong>{bookingData.passengers?.email || userEmail}</strong>.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;
