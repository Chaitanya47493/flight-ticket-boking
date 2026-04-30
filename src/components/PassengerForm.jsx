import React, { useState } from 'react';
import { User, Phone, Mail, ArrowRight, ArrowLeft } from 'lucide-react';

const PassengerForm = ({ selectedFlight, onBack, onSubmit }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="passenger-form-container animate-fade-in">
      <div className="results-header">
        <div className="results-info">
          <h2>Passenger Details</h2>
          <p>Please enter details exactly as they appear on your passport.</p>
        </div>
      </div>
      
      <form className="glass-panel" onSubmit={handleSubmit}>
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
                style={{paddingLeft: '1rem'}}
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="lastName">Last Name</label>
              <input 
                type="text" 
                id="lastName" 
                name="lastName"
                className="input-field" 
                style={{paddingLeft: '1rem'}}
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>
        
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
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="input-group">
              <label htmlFor="phone">Mobile Number</label>
              <div className="input-wrapper">
                <Phone className="input-icon" size={18} />
                <input 
                  type="tel" 
                  id="phone" 
                  name="phone"
                  className="input-field" 
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>
        </div>
        
          <div className="form-actions" style={{ marginTop: '2rem' }}>
            <button type="button" className="btn-secondary" onClick={onBack}>
              <ArrowLeft size={18} style={{marginRight: '8px'}}/>
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
