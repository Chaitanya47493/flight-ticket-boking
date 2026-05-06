import React, { useState } from 'react';
import { User, Phone, Mail, ArrowRight, ArrowLeft } from 'lucide-react';

const PassengerForm = ({ selectedFlight, onBack, onSubmit }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const [errors, setErrors] = useState({});

  const validate = (name, value) => {
    switch (name) {
      case 'firstName':
      case 'lastName':
        if (!/^[a-zA-Z\s'-]+$/.test(value)) return 'Only letters are allowed';
        if (value.trim().length < 2) return 'Must be at least 2 characters';
        return '';
      case 'phone':
        if (!/^\d+$/.test(value)) return 'Only digits are allowed';
        if (value.length !== 10) return 'Phone number must be exactly 10 digits';
        return '';
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Restrict phone to digits only and max 10 chars
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData({ ...formData, [name]: digitsOnly });
      setErrors({ ...errors, [name]: validate(name, digitsOnly) });
      return;
    }

    // Restrict names to letters only
    if (name === 'firstName' || name === 'lastName') {
      const lettersOnly = value.replace(/[^a-zA-Z\s'-]/g, '');
      setFormData({ ...formData, [name]: lettersOnly });
      setErrors({ ...errors, [name]: validate(name, lettersOnly) });
      return;
    }

    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: validate(name, value) });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Run all validations before submit
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const err = validate(key, formData[key]);
      if (err) newErrors[key] = err;
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSubmit(formData);
  };

  const inputStyle = (field) => ({
    paddingLeft: '1rem',
    borderColor: errors[field] ? '#f87171' : undefined,
    boxShadow: errors[field] ? '0 0 0 2px rgba(248,113,113,0.2)' : undefined,
  });

  return (
    <div className="passenger-form-container animate-fade-in">
      <div className="results-header">
        <div className="results-info">
          <h2>Passenger Details</h2>
          <p>Please enter details exactly as they appear on your passport.</p>
        </div>
      </div>

      <form className="glass-panel" onSubmit={handleSubmit}>
        {/* Personal Info */}
        <div className="form-section">
          <h3 className="form-section-title">
            <User size={20} className="logo-icon" />
            Personal Information
          </h3>
          <div className="form-grid">
            <div className="input-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                className="input-field"
                style={inputStyle('firstName')}
                placeholder="e.g. Rahul"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              {errors.firstName && (
                <span style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '4px' }}>
                  ⚠️ {errors.firstName}
                </span>
              )}
            </div>

            <div className="input-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                className="input-field"
                style={inputStyle('lastName')}
                placeholder="e.g. Sharma"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
              {errors.lastName && (
                <span style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '4px' }}>
                  ⚠️ {errors.lastName}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="form-section">
          <h3 className="form-section-title">
            <Phone size={20} className="logo-icon" />
            Contact Information
          </h3>
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
                  style={errors.email ? { borderColor: '#f87171', boxShadow: '0 0 0 2px rgba(248,113,113,0.2)' } : {}}
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
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
                  style={errors.phone ? { borderColor: '#f87171', boxShadow: '0 0 0 2px rgba(248,113,113,0.2)' } : {}}
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                  maxLength={10}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                {errors.phone
                  ? <span style={{ fontSize: '0.75rem', color: '#f87171' }}>⚠️ {errors.phone}</span>
                  : <span />}
                <span style={{ fontSize: '0.75rem', color: formData.phone.length === 10 ? '#4ade80' : '#64748b' }}>
                  {formData.phone.length}/10
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions" style={{ marginTop: '2rem' }}>
          <button type="button" className="btn-secondary" onClick={onBack}>
            <ArrowLeft size={18} style={{ marginRight: '8px' }} />
            Back to Flights
          </button>
          <button type="submit" className="btn-primary">
            Continue to Payment
            <ArrowRight size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default PassengerForm;
