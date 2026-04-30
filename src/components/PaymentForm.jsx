import React, { useState } from 'react';
import { CreditCard, Lock, ArrowLeft, ArrowRight } from 'lucide-react';

const PaymentForm = ({ bookingData, onBack, onSubmit, isSubmitting }) => {
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: ''
  });

  const handleChange = (e) => {
    setPaymentData({
      ...paymentData,
      [e.target.name]: e.target.value
    });
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    onSubmit(paymentData);
  };

  return (
    <div className="payment-form-container animate-fade-in" style={{ position: 'relative' }}>
      {isSubmitting && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.7)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '1rem' }}>
          <div style={{ color: 'var(--accent-color)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lock className="animate-pulse" /> Processing Payment...
          </div>
        </div>
      )}

      <div className="results-header">
        <div className="results-info">
          <h2>Secure Payment</h2>
          <p>Please enter your payment details to confirm your booking.</p>
        </div>
      </div>
      
      <form className="glass-panel" onSubmit={handlePaymentSubmit}>
        <div className="form-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="form-section-title" style={{ margin: 0 }}>
              <CreditCard size={20} className="logo-icon" /> 
              Card Details
            </h3>
            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--accent-color)' }}>
              Total: ₹{bookingData.selectedClass.price}
            </div>
          </div>

          <div className="form-grid">
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="cardNumber">Card Number</label>
              <input 
                type="text" 
                id="cardNumber" 
                name="cardNumber"
                className="input-field" 
                style={{ paddingLeft: '1rem', letterSpacing: '2px' }}
                placeholder="0000 0000 0000 0000"
                value={paymentData.cardNumber}
                onChange={handleChange}
                maxLength="19"
                required
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="nameOnCard">Name on Card</label>
              <input 
                type="text" 
                id="nameOnCard" 
                name="nameOnCard"
                className="input-field" 
                style={{ paddingLeft: '1rem' }}
                placeholder="John Doe"
                value={paymentData.nameOnCard}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="expiryDate">Expiry Date</label>
              <input 
                type="text" 
                id="expiryDate" 
                name="expiryDate"
                className="input-field" 
                style={{ paddingLeft: '1rem' }}
                placeholder="MM/YY"
                value={paymentData.expiryDate}
                onChange={handleChange}
                maxLength="5"
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="cvv">CVV</label>
              <input 
                type="password" 
                id="cvv" 
                name="cvv"
                className="input-field" 
                style={{ paddingLeft: '1rem' }}
                placeholder="123"
                value={paymentData.cvv}
                onChange={handleChange}
                maxLength="4"
                required
              />
            </div>
          </div>
          
          <div className="form-actions" style={{ marginTop: '2rem' }}>
            <button type="button" className="btn-secondary" onClick={onBack} disabled={isSubmitting}>
              <ArrowLeft size={18} style={{ marginRight: '8px' }}/>
              Back to Passengers
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              <Lock size={18} />
              Pay ₹{bookingData.selectedClass.price}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm;
