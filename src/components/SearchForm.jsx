import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Calendar, Users, Search } from 'lucide-react';
import iataMap from '../utils/airports.json';

// Build a searchable list from the airports.json
const airportList = Object.entries(iataMap).map(([city, code]) => ({
  city: city.charAt(0).toUpperCase() + city.slice(1),
  code
}));

const AirportInput = ({ id, name, label, value, onChange, placeholder }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    onChange(e);
    if (val.length < 1) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    const lower = val.toLowerCase();
    const matched = airportList.filter(
      (a) =>
        a.city.toLowerCase().includes(lower) ||
        a.code.toLowerCase().includes(lower)
    ).slice(0, 8);
    setSuggestions(matched);
    setShowDropdown(matched.length > 0);
  };

  const handleSelect = (airport) => {
    onChange({ target: { name, value: airport.code } });
    setShowDropdown(false);
    setSuggestions([]);
  };

  return (
    <div className="input-group" ref={wrapperRef} style={{ position: 'relative' }}>
      <label htmlFor={id}>{label}</label>
      <div className="input-wrapper">
        <MapPin className="input-icon" size={20} />
        <input
          type="text"
          id={id}
          name={name}
          className="input-field"
          placeholder={placeholder}
          value={value}
          onChange={handleInput}
          onFocus={() => value.length > 0 && setShowDropdown(suggestions.length > 0)}
          autoComplete="off"
          required
        />
      </div>
      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: '#0f172a',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '0.75rem',
          zIndex: 999,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          marginTop: '4px'
        }}>
          {suggestions.map((airport) => (
            <div
              key={airport.code}
              onMouseDown={() => handleSelect(airport)}
              style={{
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                transition: 'background 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{airport.city}</span>
              <span style={{
                background: 'rgba(99,102,241,0.3)',
                color: '#a5b4fc',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '1px'
              }}>{airport.code}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SearchForm = ({ onSearch }) => {
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    date: '',
    passengers: 1
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.from || !formData.to || !formData.date) {
      alert("Please fill in all fields.");
      return;
    }
    const todayStr = new Date().toLocaleDateString('en-CA');
    if (formData.date < todayStr) {
      alert("Please select a current or future date.");
      return;
    }
    onSearch(formData);
  };

  return (
    <div className="search-container animate-slide-up">
      <h1 className="search-title gradient-text">Where will you go next?</h1>
      <p className="search-subtitle">Discover premium flights to amazing destinations worldwide.</p>

      <form className="glass-panel" style={{ padding: '2rem' }} onSubmit={handleSubmit}>
        <div className="search-grid">
          <AirportInput
            id="from"
            name="from"
            label="Leaving from"
            value={formData.from}
            onChange={handleChange}
            placeholder="City or Airport (e.g. DEL)"
          />

          <AirportInput
            id="to"
            name="to"
            label="Going to"
            value={formData.to}
            onChange={handleChange}
            placeholder="City or Airport (e.g. BOM)"
          />

          <div className="input-group">
            <label htmlFor="date">Departure Date</label>
            <div className="input-wrapper">
              <Calendar className="input-icon" size={20} />
              <input
                type="date"
                id="date"
                name="date"
                className="input-field"
                value={formData.date}
                min={new Date().toLocaleDateString('en-CA')}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="passengers">Passengers</label>
            <div className="input-wrapper">
              <Users className="input-icon" size={20} />
              <input
                type="number"
                id="passengers"
                name="passengers"
                min="1"
                max="9"
                className="input-field"
                value={formData.passengers}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        <div className="search-btn-container">
          <button type="submit" className="btn-primary">
            <Search size={20} />
            Search Flights
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchForm;
