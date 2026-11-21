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
          <h2>Review & Secure Payment</h2>
          <p>Customize travel add-ons, apply discounts, and complete your simulated checkout.</p>
        </div>
      </div>

      {/* ── TRAVEL ADD-ONS BOX ─────────────────────────────────────── */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Luggage size={20} className="logo-icon" /> Travel Add-Ons & Preferences (Optional)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {/* Meal Selection */}
          <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Utensils size={18} style={{ color: '#fbbf24' }} />
              <strong style={{ fontSize: '0.95rem' }}>In-Flight Meal</strong>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 0.75rem 0' }}>
              Fresh chef-prepared meal served warm on your flight.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setMealOption('none')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  border: mealOption === 'none' ? '2px solid var(--accent-color)' : '1px solid rgba(255,255,255,0.1)',
                  background: mealOption === 'none' ? 'rgba(99,102,241,0.2)' : 'transparent',
                  color: mealOption === 'none' ? '#fff' : '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                No Meal (₹0)
              </button>
              <button
                type="button"
                onClick={() => setMealOption('veg')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  border: mealOption === 'veg' ? '1px solid var(--success-color)' : '1px solid var(--surface-border)',
                  background: mealOption === 'veg' ? 'var(--success-bg)' : 'var(--surface-color)',
                  color: mealOption === 'veg' ? 'var(--success-color)' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                Veg (₹350/pax)
              </button>
              <button
                type="button"
                onClick={() => setMealOption('non-veg')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  border: mealOption === 'non-veg' ? '1px solid var(--danger-color)' : '1px solid var(--surface-border)',
                  background: mealOption === 'non-veg' ? 'var(--danger-bg)' : 'var(--surface-color)',
                  color: mealOption === 'non-veg' ? 'var(--danger-color)' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                Non-Veg (₹450/pax)
              </button>
            </div>
          </div>

          {/* Extra Baggage Toggle */}
          <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                  <Luggage size={18} style={{ color: '#38bdf8' }} />
                  <strong style={{ fontSize: '0.95rem' }}>Extra 10kg Baggage</strong>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 0.5rem 0' }}>
                  Pre-book additional checked baggage allowance and save up to 40% over airport rates.
                </p>
                <span style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 600 }}>+₹1,200 total</span>
              </div>
              <input
                type="checkbox"
                id="extraBaggageCheck"
                checked={extraBaggage}
                onChange={(e) => setExtraBaggage(e.target.checked)}
                style={{ width: '20px', height: '20px', accentColor: 'var(--accent-color)', cursor: 'pointer', marginTop: '4px' }}
              />
            </div>
          </div>

          {/* Travel Insurance Toggle */}
          <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                  <Shield size={18} style={{ color: '#4ade80' }} />
                  <strong style={{ fontSize: '0.95rem' }}>Comprehensive Insurance</strong>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 0.5rem 0' }}>
                  Covers medical emergencies, flight delays, trip cancellations & lost baggage.
                </p>
                <span style={{ fontSize: '0.85rem', color: '#4ade80', fontWeight: 600 }}>+₹249 per passenger</span>
              </div>
              <input
                type="checkbox"
                id="travelInsuranceCheck"
                checked={travelInsurance}
                onChange={(e) => setTravelInsurance(e.target.checked)}
                style={{ width: '20px', height: '20px', accentColor: 'var(--accent-color)', cursor: 'pointer', marginTop: '4px' }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="payment-layout">
        {/* Fare Summary & Breakdown Box */}
        <div className="glass-panel fare-breakdown-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Ticket size={18} className="logo-icon" /> Fare Summary
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#a5b4fc', background: 'rgba(99,102,241,0.15)', padding: '2px 8px', borderRadius: '4px' }}>
              {bookingData.flight?.airline} • {bookingData.selectedClass?.name}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.88rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Base Fare ({passengerCount} × ₹{basePricePerPerson.toLocaleString()}):</span>
              <strong>₹{flightSubtotal.toLocaleString()}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Seat Fees:</span>
              <strong style={{ color: seatFeeTotal > 0 ? '#38bdf8' : '#4ade80' }}>
                {seatFeeTotal > 0 ? `+₹${seatFeeTotal.toLocaleString()}` : 'Free'}
              </strong>
            </div>

            {/* Add-ons itemized if selected */}
            {addOnsTotal > 0 && (
              <div style={{ borderLeft: '2px solid rgba(99,102,241,0.4)', paddingLeft: '0.75rem', margin: '0.2rem 0', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#a5b4fc', fontWeight: 600, textTransform: 'uppercase' }}>Selected Add-Ons</span>
                {mealCost > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: '#cbd5e1' }}>• Meals ({mealOption === 'veg' ? 'Veg' : 'Non-Veg'} × {passengerCount}):</span>
                    <span>+₹{mealCost.toLocaleString()}</span>
                  </div>
                )}
                {baggageCost > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: '#cbd5e1' }}>• Extra Baggage (10kg):</span>
                    <span>+₹{baggageCost.toLocaleString()}</span>
                  </div>
                )}
                {insuranceCost > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: '#cbd5e1' }}>• Travel Insurance ({passengerCount} pax):</span>
                    <span>+₹{insuranceCost.toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}

            {/* Discount if applied */}
            {appliedPromo && discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4ade80' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Tag size={14} /> Discount ({appliedPromo.code}):
                </span>
                <strong>-₹{discount.toLocaleString()}</strong>
              </div>
            )}

            {/* Taxes & GST */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Taxes & GST (5%):</span>
              <strong style={{ color: '#cbd5e1' }}>+₹{taxesAndGst.toLocaleString()}</strong>
            </div>

            {/* Grand Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--surface-border)', paddingTop: '0.75rem', marginTop: '0.4rem', fontSize: '1.15rem' }}>
              <span style={{ fontWeight: 600 }}>Grand Total:</span>
              <strong style={{ color: 'var(--accent-color)', fontSize: '1.35rem', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>₹{grandTotal.toLocaleString()}</strong>
            </div>
          </div>

          {/* ── PROMO CODE INPUT BOX ───────────────────────────────── */}
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <label style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.5rem' }}>
              <Tag size={14} style={{ color: '#fbbf24' }} /> Have a Promo Code?
            </label>
            
            {!appliedPromo ? (
              <div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    placeholder="e.g. AERO10 or FLY500"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      background: 'rgba(15,23,42,0.6)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      textTransform: 'uppercase'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className="btn-secondary"
                    style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                  >
                    Apply
                  </button>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
                  Try <strong>AERO10</strong> (10% off base) or <strong>FLY500</strong> (flat ₹500 off)
                </div>
              </div>
            ) : (
              <div style={{
                background: 'rgba(34,197,94,0.12)',
                border: '1px solid rgba(34,197,94,0.3)',
                padding: '8px 12px',
                borderRadius: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#4ade80', fontSize: '0.85rem', fontWeight: 600 }}>
                  <Check size={16} />
                  <span>{appliedPromo.code} applied (-₹{discount.toLocaleString()})</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemovePromo}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
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
                color: promoMessage.type === 'success' ? '#4ade80' : '#f87171'
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
