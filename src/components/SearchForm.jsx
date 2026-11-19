import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Calendar, Users, Search, ArrowLeftRight, Sparkles } from 'lucide-react';
import iataMap from '../utils/airports.json';

// Build a searchable list from the airports.json
const airportList = Object.entries(iataMap).map(([city, code]) => ({
  city: city.charAt(0).toUpperCase() + city.slice(1),
  code
}));

const POPULAR_ROUTES = [
  { from: 'DEL', to: 'BOM', label: 'Delhi ⇄ Mumbai' },
  { from: 'BLR', to: 'DEL', label: 'Bengaluru ⇄ Delhi' },
  { from: 'BOM', to: 'GOI', label: 'Mumbai ⇄ Goa' },
  { from: 'HYD', to: 'MAA', label: 'Hyderabad ⇄ Chennai' },
  { from: 'BLR', to: 'HYD', label: 'Bengaluru ⇄ Hyderabad' },
  { from: 'DEL', to: 'CCU', label: 'Delhi ⇄ Kolkata' },
];

const AirportInput = ({ id, name, label, value, onChange, placeholder }) => {
  // displayValue = what user sees while typing; value (IATA code) = what is stored
  const [displayValue, setDisplayValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSelected, setIsSelected] = useState(false); // true only after picking from dropdown
  const wrapperRef = useRef(null);

  // Sync display when external value changes (e.g. form reset, swap, or popular route click)
  useEffect(() => {
    if (!value) {
      setDisplayValue('');
      setIsSelected(false);
    } else {
      const match = airportList.find(a => a.code.toUpperCase() === value.toUpperCase());
      if (match) {
        setDisplayValue(`${match.city} (${match.code})`);
        setIsSelected(true);
      }
    }
  }, [value]);

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
    setDisplayValue(val);
    setIsSelected(false); // user is typing freely — not a valid selection yet
    // Clear the stored IATA code until they pick from dropdown
    onChange({ target: { name, value: '' } });

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
    setDisplayValue(`${airport.city} (${airport.code})`);
    setIsSelected(true);
    onChange({ target: { name, value: airport.code } }); // store IATA code
    setShowDropdown(false);
    setSuggestions([]);
  };

  // If user leaves without selecting, clear the field
  const handleBlur = () => {
    setTimeout(() => {
      if (!isSelected) {
        setDisplayValue('');
        onChange({ target: { name, value: '' } });
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, 150); // small delay so onMouseDown on suggestion fires first
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
          value={displayValue}
          onChange={handleInput}
          onBlur={handleBlur}
          onFocus={() => {
            if (displayValue.length > 0 && !isSelected) {
              setShowDropdown(suggestions.length > 0);
            }
          }}
          autoComplete="off"
          required
        />
      </div>

      {/* Validation hint with fixed min-height to prevent layout jump */}
      <div style={{ minHeight: '20px', marginTop: '4px' }}>
        {displayValue.length > 0 && !isSelected && (
          <span style={{ fontSize: '0.75rem', color: '#f87171', display: 'block' }}>
            ⚠️ Please select a city from the list
          </span>
        )}
        {isSelected && (
          <span style={{ fontSize: '0.75rem', color: '#4ade80', display: 'block' }}>
            ✓ Airport selected
          </span>
        )}
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
              key={`${airport.city}-${airport.code}`}
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
  const [tripType, setTripType] = useState('oneway');
  const [formError, setFormError] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    date: '',
    returnDate: '',
    passengers: 1
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSwap = () => {
    setIsSwapping(true);
    setFormData(prev => ({
      ...prev,
      from: prev.to,
      to: prev.from
    }));
    setTimeout(() => setIsSwapping(false), 300);
  };

  const handleSelectRoute = (route) => {
    setFormData(prev => ({
      ...prev,
      from: route.from,
      to: route.to
    }));
    setFormError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.from || !formData.to) {
      setFormError('Please select both origin and destination airports from the dropdown.');
      return;
    }
    if (formData.from === formData.to) {
      setFormError('Origin and destination airports cannot be the same.');
      return;
    }
    if (!formData.date || (tripType === 'roundtrip' && !formData.returnDate)) {
      setFormError('Please fill in all required date fields.');
      return;
    }
    const todayStr = new Date().toLocaleDateString('en-CA');
    if (formData.date < todayStr) {
      setFormError('Please select a current or future departure date.');
      return;
    }
    if (tripType === 'roundtrip' && formData.returnDate < formData.date) {
      setFormError('Return date cannot be before the departure date.');
      return;
    }
    onSearch({ ...formData, tripType, passengers: parseInt(formData.passengers, 10) || 1 });
  };

  return (
    <div className="search-container animate-slide-up">
      <h1 className="search-title gradient-text">Where will you go next?</h1>
      <p className="search-subtitle">Discover premium flights to amazing destinations in India.</p>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <button 
          type="button"
          className={`btn-secondary ${tripType === 'oneway' ? 'active-tab' : ''}`}
          onClick={() => setTripType('oneway')}
          style={{ background: tripType === 'oneway' ? 'rgba(99,102,241,0.2)' : 'transparent', border: tripType === 'oneway' ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.1)' }}
        >
          One Way
        </button>
        <button 
          type="button"
          className={`btn-secondary ${tripType === 'roundtrip' ? 'active-tab' : ''}`}
          onClick={() => setTripType('roundtrip')}
          style={{ background: tripType === 'roundtrip' ? 'rgba(99,102,241,0.2)' : 'transparent', border: tripType === 'roundtrip' ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.1)' }}
        >
          Round Trip
        </button>
      </div>

      <form className="glass-panel" style={{ padding: '2.25rem 2rem 2.75rem' }} onSubmit={handleSubmit}>
        <div className="search-grid" style={{ position: 'relative' }}>
          <div className="airport-row-wrapper">
            <div className="airport-col">
              <AirportInput
                id="from"
                name="from"
                label="Leaving from"
                value={formData.from}
                onChange={handleChange}
                placeholder="City or Airport (e.g. DEL)"
              />
            </div>

            <div className="swap-btn-container">
              <button
                type="button"
                className={`swap-btn ${isSwapping ? 'swapping' : ''}`}
                onClick={handleSwap}
                title="Swap Origin & Destination"
                aria-label="Swap departure and arrival airports"
              >
                <ArrowLeftRight size={18} />
              </button>
            </div>

            <div className="airport-col">
              <AirportInput
                id="to"
                name="to"
                label="Going to"
                value={formData.to}
                onChange={handleChange}
                placeholder="City or Airport (e.g. BOM)"
              />
            </div>
          </div>

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
                max="2099-12-31"
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {tripType === 'roundtrip' && (
            <div className="input-group animate-fade-in">
              <label htmlFor="returnDate">Return Date</label>
              <div className="input-wrapper">
                <Calendar className="input-icon" size={20} />
                <input
                  type="date"
                  id="returnDate"
                  name="returnDate"
                  className="input-field"
                  value={formData.returnDate}
                  min={formData.date || new Date().toLocaleDateString('en-CA')}
                  max="2099-12-31"
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          )}

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

        {/* Popular Routes Quick-Picks */}
        <div className="popular-routes-section">
          <div className="popular-routes-title">
            <Sparkles size={14} style={{ color: '#a5b4fc' }} />
            <span>Popular Routes:</span>
          </div>
          <div className="popular-chips">
            {POPULAR_ROUTES.map((route) => {
              const isActive = formData.from === route.from && formData.to === route.to;
              return (
                <button
                  type="button"
                  key={`${route.from}-${route.to}`}
                  className={`popular-chip ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectRoute(route)}
                >
                  {route.label}
                </button>
              );
            })}
          </div>
        </div>

        {formError && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#f87171',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            fontSize: '0.875rem',
            marginTop: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            ⚠️ {formError}
          </div>
        )}

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
