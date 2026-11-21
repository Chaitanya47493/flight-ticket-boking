import { useState, useRef, useEffect } from 'react';
import { MapPin, Calendar, Users, Search, ArrowLeftRight, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import iataMap from '../utils/airports.json';
import { POPULAR_ROUTES } from '../config/routes';

// Build a searchable list from the airports.json
const airportList = Object.entries(iataMap).map(([city, code]) => ({
  city: city.charAt(0).toUpperCase() + city.slice(1),
  code
}));

const AirportInput = ({ id, name, label, value, onChange, placeholder }) => {
  const [internalText, setInternalText] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  const airportMatch = value ? airportList.find(a => a.code.toUpperCase() === value.toUpperCase()) : null;
  const isSelected = Boolean(airportMatch && internalText === null);
  const displayValue = internalText !== null ? internalText : (airportMatch ? `${airportMatch.city} (${airportMatch.code})` : '');

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
    setInternalText(val);
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
    setInternalText(null);
    onChange({ target: { name, value: airport.code } });
    setShowDropdown(false);
    setSuggestions([]);
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (!isSelected && internalText !== null) {
        setInternalText(null);
        onChange({ target: { name, value: '' } });
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, 150);
  };

  return (
    <div className="input-group" ref={wrapperRef} style={{ position: 'relative' }}>
      <label htmlFor={id}>{label}</label>
      <div className="input-wrapper">
        <MapPin className="input-icon" size={18} />
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
          <span style={{ fontSize: '0.75rem', color: 'var(--danger-color)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <AlertCircle size={13} />
            <span>Please select a city from the list</span>
          </span>
        )}
        {isSelected && (
          <span style={{ fontSize: '0.75rem', color: 'var(--success-color)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={13} />
            <span>Airport confirmed</span>
          </span>
        )}
      </div>

      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'var(--surface-color)',
          border: '1px solid var(--surface-border)',
          borderRadius: 'var(--radius-md)',
          zIndex: 999,
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          marginTop: '4px'
        }}>
          {suggestions.map((airport) => (
            <div
              key={`${airport.city}-${airport.code}`}
              onMouseDown={() => handleSelect(airport)}
              style={{
                padding: '0.625rem 1rem',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--surface-border)',
                fontSize: '0.875rem',
                color: 'var(--text-primary)',
                transition: 'background 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-subtle)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ fontWeight: 500 }}>{airport.city}</span>
              <span style={{
                color: 'var(--accent-color)',
                fontSize: '0.75rem',
                fontWeight: 700,
                background: 'var(--accent-subtle)',
                padding: '2px 6px',
                borderRadius: 'var(--radius-sm)'
              }}>
                {airport.code}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SearchForm = ({ onSearch, initialSearchData, externalRoute, hideHeader = false }) => {
  const [formData, setFormData] = useState({
    from: initialSearchData?.from || '',
    to: initialSearchData?.to || '',
    date: initialSearchData?.date || '',
    returnDate: initialSearchData?.returnDate || '',
    passengers: initialSearchData?.passengers || 1,
  });

  const [tripType, setTripType] = useState(initialSearchData?.tripType || 'oneway');
  const [formError, setFormError] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [prevExternalRoute, setPrevExternalRoute] = useState(externalRoute);

  // Sync external route selection (e.g. from popular corridors on Home)
  if (externalRoute !== prevExternalRoute) {
    setPrevExternalRoute(externalRoute);
    if (externalRoute?.from && externalRoute?.to) {
      setFormData(prev => ({
        ...prev,
        from: externalRoute.from,
        to: externalRoute.to
      }));
      setFormError('');
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError('');
  };

  const handleSwap = () => {
    if (!formData.from && !formData.to) return;
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
      setFormError('Please select both departure and arrival airports from the dropdown.');
      return;
    }

    if (formData.from.toUpperCase() === formData.to.toUpperCase()) {
      setFormError('Departure and arrival airports cannot be the same.');
      return;
    }

    if (tripType === 'roundtrip' && !formData.returnDate) {
      setFormError('Please select a return date for round trip.');
      return;
    }

    if (tripType === 'roundtrip' && formData.returnDate < formData.date) {
      setFormError('Return date must be on or after the departure date.');
      return;
    }

    onSearch({ ...formData, tripType, passengers: parseInt(formData.passengers, 10) || 1 });
  };

  return (
    <div className="search-container animate-slide-up">
      {!hideHeader && (
        <>
          <h1 className="search-title">Find and book your flights</h1>
          <p className="search-subtitle">Simulated domestic flight search across major Indian airports.</p>
        </>
      )}

      {/* Segmented Trip Type Control */}
      <div style={{
        display: 'inline-flex',
        background: 'var(--surface-subtle)',
        border: '1px solid var(--surface-border)',
        borderRadius: 'var(--radius-md)',
        padding: '3px',
        marginBottom: '1.25rem'
      }}>
        <button 
          type="button"
          onClick={() => setTripType('oneway')}
          style={{
            padding: '0.45rem 1.125rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8125rem',
            fontWeight: tripType === 'oneway' ? 600 : 500,
            background: tripType === 'oneway' ? 'var(--surface-color)' : 'transparent',
            color: tripType === 'oneway' ? 'var(--text-primary)' : 'var(--text-secondary)',
            boxShadow: tripType === 'oneway' ? 'var(--shadow-sm)' : 'none',
            border: tripType === 'oneway' ? '1px solid var(--surface-border)' : '1px solid transparent',
            transition: 'all 0.15s ease'
          }}
        >
          One Way
        </button>
        <button 
          type="button"
          onClick={() => setTripType('roundtrip')}
          style={{
            padding: '0.45rem 1.125rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8125rem',
            fontWeight: tripType === 'roundtrip' ? 600 : 500,
            background: tripType === 'roundtrip' ? 'var(--surface-color)' : 'transparent',
            color: tripType === 'roundtrip' ? 'var(--text-primary)' : 'var(--text-secondary)',
            boxShadow: tripType === 'roundtrip' ? 'var(--shadow-sm)' : 'none',
            border: tripType === 'roundtrip' ? '1px solid var(--surface-border)' : '1px solid transparent',
            transition: 'all 0.15s ease'
          }}
        >
          Round Trip
        </button>
      </div>

      <form className="glass-panel" style={{ padding: '1.75rem 1.75rem 2rem' }} onSubmit={handleSubmit}>
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
                <ArrowLeftRight size={16} />
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
              <Calendar className="input-icon" size={18} />
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
                <Calendar className="input-icon" size={18} />
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
              <Users className="input-icon" size={18} />
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
            <Sparkles size={14} style={{ color: 'var(--accent-color)' }} />
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
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-color)',
            color: 'var(--danger-color)',
            padding: '0.625rem 0.875rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8125rem',
            marginTop: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <AlertCircle size={15} />
            <span>{formError}</span>
          </div>
        )}

        <div className="search-btn-container">
          <button type="submit" className="btn-primary">
            <Search size={18} />
            <span>Search Flights</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchForm;
