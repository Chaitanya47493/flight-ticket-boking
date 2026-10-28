import React, { useState } from 'react';
import { User, Phone, Mail, ArrowRight, ArrowLeft, Users, ShieldCheck } from 'lucide-react';

const PassengerForm = ({ selectedFlight, searchData, onBack, onSubmit }) => {
  const passengerCount = searchData?.passengers || 1;

  // Initialize array of passengers based on count
  const [passengers, setPassengers] = useState(() => {
    return Array.from({ length: passengerCount }, (_, i) => ({
      id: i + 1,
      title: 'Mr',
      firstName: '',
      lastName: '',
      gender: 'Male',
      ageCategory: 'Adult'
    }));
  });

  const [contactInfo, setContactInfo] = useState({
    email: '',
    phone: ''
  });

  const [errors, setErrors] = useState({});

  const validateField = (name, value) => {
    switch (name) {
      case 'firstName':
      case 'lastName':
        if (!/^[a-zA-Z\s'-]+$/.test(value)) return 'Only letters are allowed';
        if (value.trim().length < 2) return 'Must be at least 2 characters';
        return '';
      case 'phone':
        if (!/^\d+$/.test(value)) return 'Only digits are allowed';
        if (value.length !== 10) return 'Phone must be exactly 10 digits';
        return '';
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address';
        return '';
      default:
        return '';
    }
  };

  const handlePassengerChange = (index, field, value) => {
    let cleanVal = value;
    if (field === 'firstName' || field === 'lastName') {
      cleanVal = value.replace(/[^a-zA-Z\s'-]/g, '');
    }

    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: cleanVal };
    setPassengers(updated);

    const errorKey = `p_${index}_${field}`;
    const err = validateField(field, cleanVal);
    setErrors(prev => ({ ...prev, [errorKey]: err }));
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    let cleanVal = value;

    if (name === 'phone') {
      cleanVal = value.replace(/\D/g, '').slice(0, 10);
    }

    setContactInfo(prev => ({ ...prev, [name]: cleanVal }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, cleanVal) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    // Validate each passenger
    passengers.forEach((p, i) => {
      const firstErr = validateField('firstName', p.firstName);
      if (firstErr) newErrors[`p_${i}_firstName`] = firstErr;

      const lastErr = validateField('lastName', p.lastName);
      if (lastErr) newErrors[`p_${i}_lastName`] = lastErr;
    });

    // Validate contact info
    const emailErr = validateField('email', contactInfo.email);
    if (emailErr) newErrors['email'] = emailErr;

    const phoneErr = validateField('phone', contactInfo.phone);
    if (phoneErr) newErrors['phone'] = phoneErr;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit structured multi-passenger data with backward-compatible top-level properties
    onSubmit({
      primaryContact: contactInfo,
      list: passengers,
      firstName: passengers[0].firstName,
      lastName: passengers[0].lastName,
      email: contactInfo.email,
      phone: contactInfo.phone
    });
  };

  const inputStyle = (errKey, hasIcon = false) => ({
    paddingLeft: hasIcon ? '3rem' : '1rem',
    height: '52px',
    boxSizing: 'border-box',
    borderColor: errors[errKey] ? '#f87171' : undefined,
    boxShadow: errors[errKey] ? '0 0 0 2px rgba(248,113,113,0.2)' : undefined,
  });

  return (
    <div className="passenger-form-container animate-fade-in">
      <div className="results-header">
        <div className="results-info">
          <h2>Passenger Details</h2>
          <p>
            Please enter details exactly as they appear on government IDs / passports.
            <span style={{
              marginLeft: '0.75rem',
              background: 'rgba(99,102,241,0.2)',
              color: '#a5b4fc',
              padding: '2px 10px',
              borderRadius: '999px',
              fontSize: '0.8rem',
              fontWeight: 600
            }}>
              {passengerCount} {passengerCount === 1 ? 'Passenger' : 'Passengers'}
            </span>
          </p>
        </div>
      </div>

      <form className="glass-panel" onSubmit={handleSubmit} style={{ padding: '2rem' }}>
        {/* Passenger Cards */}
        {passengers.map((passenger, index) => {
          const isPrimary = index === 0;
          return (
            <div
              key={passenger.id}
              className="form-section passenger-card-block"
              style={{
                marginBottom: '2rem',
                paddingBottom: '1.5rem',
                borderBottom: index < passengers.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 className="form-section-title" style={{ margin: 0 }}>
                  <User size={20} className="logo-icon" />
                  Passenger {passenger.id} {isPrimary && <span style={{ fontSize: '0.75rem', color: '#818cf8', background: 'rgba(99,102,241,0.15)', padding: '2px 8px', borderRadius: '4px', marginLeft: '0.5rem' }}>Primary Traveler</span>}
                </h3>
              </div>

              <div className="passenger-row-grid">
                {/* Title */}
                <div className="input-group">
                  <label htmlFor={`title_${index}`}>Title</label>
                  <select
                    id={`title_${index}`}
                    className="input-field"
                    style={{
                      paddingLeft: '0.75rem',
                      paddingRight: '0.75rem',
                      height: '52px',
                      boxSizing: 'border-box',
                      background: 'rgba(15,23,42,0.6)',
                      color: 'white'
                    }}
                    value={passenger.title}
                    onChange={(e) => handlePassengerChange(index, 'title', e.target.value)}
                  >
                    <option value="Mr">Mr.</option>
                    <option value="Ms">Ms.</option>
                    <option value="Mrs">Mrs.</option>
                    <option value="Dr">Dr.</option>
                  </select>
                </div>

                {/* First Name */}
                <div className="input-group">
                  <label htmlFor={`firstName_${index}`}>First Name</label>
                  <input
                    type="text"
                    id={`firstName_${index}`}
                    className="input-field"
                    style={inputStyle(`p_${index}_firstName`, false)}
                    placeholder="e.g. Rahul"
                    value={passenger.firstName}
                    onChange={(e) => handlePassengerChange(index, 'firstName', e.target.value)}
                    required
                  />
                  {errors[`p_${index}_firstName`] && (
                    <span style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '4px' }}>
                      ⚠️ {errors[`p_${index}_firstName`]}
                    </span>
                  )}
                </div>

                {/* Last Name */}
                <div className="input-group">
                  <label htmlFor={`lastName_${index}`}>Last Name</label>
                  <input
                    type="text"
                    id={`lastName_${index}`}
                    className="input-field"
                    style={inputStyle(`p_${index}_lastName`, false)}
                    placeholder="e.g. Sharma"
                    value={passenger.lastName}
                    onChange={(e) => handlePassengerChange(index, 'lastName', e.target.value)}
                    required
                  />
                  {errors[`p_${index}_lastName`] && (
                    <span style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '4px' }}>
                      ⚠️ {errors[`p_${index}_lastName`]}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Primary Contact Information */}
        <div className="form-section" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.5rem' }}>
          <h3 className="form-section-title">
            <Phone size={20} className="logo-icon" />
            Booking Contact & E-Ticket Delivery
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>
            We'll send flight updates, e-tickets, and boarding passes to this contact.
          </p>

          <div className="form-grid">
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="input-field"
                  style={inputStyle('email', true)}
                  placeholder="name@example.com"
                  value={contactInfo.email}
                  onChange={handleContactChange}
                  required
                />
              </div>
              {errors.email && (
                <span style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '4px' }}>
                  ⚠️ {errors.email}
                </span>
              )}
            </div>

            <div className="input-group">
              <label htmlFor="phone">
                Mobile Number
                <span style={{ color: '#64748b', fontWeight: 400, marginLeft: '0.5rem' }}>(10 digits)</span>
              </label>
              <div className="input-wrapper">
                <Phone className="input-icon" size={18} />
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="input-field"
                  style={inputStyle('phone', true)}
                  placeholder="9876543210"
                  value={contactInfo.phone}
                  onChange={handleContactChange}
                  maxLength={10}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                {errors.phone ? (
                  <span style={{ fontSize: '0.75rem', color: '#f87171' }}>⚠️ {errors.phone}</span>
                ) : <span />}
                <span style={{ fontSize: '0.75rem', color: contactInfo.phone.length === 10 ? '#4ade80' : '#64748b' }}>
                  {contactInfo.phone.length}/10
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
          <button type="button" className="btn-secondary" onClick={onBack}>
            <ArrowLeft size={18} style={{ marginRight: '8px' }} />
            Back to Flights
          </button>
          <button type="submit" className="btn-primary">
            Continue to Seat Selection
            <ArrowRight size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default PassengerForm;
