import { useState } from 'react';
import { User, Phone, Mail, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';

const PassengerForm = ({ searchData, onBack, onSubmit }) => {
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

  return (
    <div className="passenger-form-container animate-fade-in">
      <div className="results-header">
        <div className="results-info">
          <h2>Passenger Details</h2>
          <p>
            Please enter details exactly as they appear on government IDs / passports.
            <span className="badge badge-info" style={{ marginLeft: '0.625rem' }}>
              {passengerCount} {passengerCount === 1 ? 'Passenger' : 'Passengers'}
            </span>
          </p>
        </div>
      </div>

      <form className="glass-panel" onSubmit={handleSubmit} style={{ padding: '1.75rem 1.75rem 2rem' }}>
        {/* Passenger Cards */}
        {passengers.map((passenger, index) => {
          const isPrimary = index === 0;
          return (
            <div
              key={passenger.id}
              className="form-section passenger-card-block"
              style={{
                marginBottom: '1.5rem',
                paddingBottom: '1.25rem',
                borderBottom: index < passengers.length - 1 ? '1px solid var(--surface-border)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                <h3 className="form-section-title" style={{ margin: 0, paddingBottom: 0, border: 'none' }}>
                  <User size={18} style={{ color: 'var(--accent-color)' }} />
                  <span>Passenger {passenger.id}</span>
                  {isPrimary && (
                    <span className="badge badge-info" style={{ marginLeft: '0.5rem', fontSize: '0.6875rem' }}>
                      Primary Traveler
                    </span>
                  )}
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
                      height: '46px',
                      background: 'var(--surface-subtle)',
                      color: 'var(--text-primary)'
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
                    style={{
                      height: '46px',
                      borderColor: errors[`p_${index}_firstName`] ? 'var(--danger-color)' : undefined
                    }}
                    placeholder="e.g. Rahul"
                    value={passenger.firstName}
                    onChange={(e) => handlePassengerChange(index, 'firstName', e.target.value)}
                    required
                  />
                  {errors[`p_${index}_firstName`] && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--danger-color)', marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={12} />
                      <span>{errors[`p_${index}_firstName`]}</span>
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
                    style={{
                      height: '46px',
                      borderColor: errors[`p_${index}_lastName`] ? 'var(--danger-color)' : undefined
                    }}
                    placeholder="e.g. Sharma"
                    value={passenger.lastName}
                    onChange={(e) => handlePassengerChange(index, 'lastName', e.target.value)}
                    required
                  />
                  {errors[`p_${index}_lastName`] && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--danger-color)', marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={12} />
                      <span>{errors[`p_${index}_lastName`]}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Primary Contact Information */}
        <div className="form-section" style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '1.25rem' }}>
          <h3 className="form-section-title" style={{ border: 'none', paddingBottom: '0.25rem' }}>
            <Phone size={18} style={{ color: 'var(--accent-color)' }} />
            <span>Booking Contact & E-Ticket Delivery</span>
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: '1rem' }}>
            We'll send flight updates, e-tickets, and boarding passes to this contact.
          </p>

          <div className="form-grid">
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={16} />
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="input-field"
                  style={{
                    height: '46px',
                    paddingLeft: '2.5rem',
                    borderColor: errors.email ? 'var(--danger-color)' : undefined
                  }}
                  placeholder="name@example.com"
                  value={contactInfo.email}
                  onChange={handleContactChange}
                  required
                />
              </div>
              {errors.email && (
                <span style={{ fontSize: '0.75rem', color: 'var(--danger-color)', marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} />
                  <span>{errors.email}</span>
                </span>
              )}
            </div>

            <div className="input-group">
              <label htmlFor="phone">
                Mobile Number
                <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.4rem' }}>(10 digits)</span>
              </label>
              <div className="input-wrapper">
                <Phone className="input-icon" size={16} />
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="input-field"
                  style={{
                    height: '46px',
                    paddingLeft: '2.5rem',
                    borderColor: errors.phone ? 'var(--danger-color)' : undefined
                  }}
                  placeholder="9876543210"
                  value={contactInfo.phone}
                  onChange={handleContactChange}
                  maxLength={10}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                {errors.phone ? (
                  <span style={{ fontSize: '0.75rem', color: 'var(--danger-color)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} />
                    <span>{errors.phone}</span>
                  </span>
                ) : <span />}
                <span style={{ fontSize: '0.75rem', color: contactInfo.phone.length === 10 ? 'var(--success-color)' : 'var(--text-muted)' }}>
                  {contactInfo.phone.length}/10
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions" style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'space-between' }}>
          <button type="button" className="btn-secondary" onClick={onBack}>
            <ArrowLeft size={16} />
            <span>Back to Flights</span>
          </button>
          <button type="submit" className="btn-primary">
            <span>Continue to Seat Selection</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default PassengerForm;
