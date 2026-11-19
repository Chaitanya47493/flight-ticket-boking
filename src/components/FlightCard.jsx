import React, { useState } from 'react';
import { Plane, Clock, Check } from 'lucide-react';

const FlightCard = ({ flight, tripType, passengers = 1, onSelectClass }) => {
  const [selectedClass, setSelectedClass] = useState(null);

  const handleClassSelect = (cls) => {
    setSelectedClass(cls);
  };

  const handleBook = () => {
    if (selectedClass) {
      onSelectClass(flight, selectedClass);
    }
  };

  const numPassengers = parseInt(passengers, 10) || 1;

  return (
    <div className="flight-card glass-panel animate-slide-up">
      <div className="flight-main-info">
        <div className="airline-info">
          <div className="airline-logo" style={{ overflow: 'hidden', background: 'white' }}>
            {flight.airlineLogo ? (
              <img src={flight.airlineLogo} alt={flight.airline} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <Plane size={24} className="logo-icon" />
            )}
          </div>
          <div>
            <div className="airline-name">{flight.airline}</div>
            <div className="flight-number">
              {flight.flightNumber}
              {flight.airplane && (
                <span style={{
                  marginLeft: '0.5rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#94a3b8',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  {flight.airplane}
                </span>
              )}
              {flight.terminal && (
                <span style={{
                  marginLeft: '0.5rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#94a3b8',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  TERMINAL {flight.terminal}
                </span>
              )}
              {flight.source && (
                <span style={{
                  marginLeft: '0.5rem',
                  background: flight.source.toLowerCase() === 'live' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(99, 102, 241, 0.1)',
                  color: flight.source.toLowerCase() === 'live' ? '#4ade80' : '#818cf8',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  border: flight.source.toLowerCase() === 'live' ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid rgba(99, 102, 241, 0.2)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {flight.source.toLowerCase() === 'live' ? '🟢 LIVE FLIGHT' : flight.source.toUpperCase()}
                </span>
              )}
              {tripType === 'roundtrip' && (
                <span style={{
                  marginLeft: '0.5rem',
                  background: 'rgba(56, 189, 248, 0.1)',
                  color: '#38bdf8',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: '1px solid rgba(56, 189, 248, 0.3)'
                }}>
                  Round Trip Included
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flight-times">
          <div className="time-block">
            <div className="time">{flight.departureTime}</div>
            <div className="airport">{flight.origin}</div>
          </div>
          
          <div className="flight-duration">
            <Clock size={14} />
            <span>{flight.duration}</span>
            <div className="duration-line">
              <Plane size={14} className="duration-plane" />
            </div>
            <span style={{ fontSize: flight.routePath && flight.routePath !== 'Direct' ? '0.75rem' : 'inherit', fontWeight: flight.routePath && flight.routePath !== 'Direct' ? '600' : 'normal', color: flight.routePath && flight.routePath !== 'Direct' ? '#f59e0b' : 'inherit' }}>
              {flight.stops === 0 ? 'Direct' : `${flight.stops} Stop(s)${flight.routePath ? ` • ${flight.routePath}` : ''}`}
            </span>
          </div>
          
          <div className="time-block">
            <div className="time">{flight.arrivalTime}</div>
            <div className="airport">{flight.destination}</div>
          </div>
        </div>
      </div>
      
      <div className="classes-grid">
        {flight.classes.map((cls) => (
          <div 
            key={cls.name}
            className={`class-card ${selectedClass?.name === cls.name ? 'selected' : ''}`}
            onClick={() => handleClassSelect(cls)}
          >
            <div className="class-name">{cls.name}</div>
            <div className="class-price">
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px' }}>
                <span style={{ fontSize: '1.35rem', fontWeight: 800 }}>₹{cls.price.toLocaleString()}</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>/ person</span>
              </div>
              {numPassengers > 1 && (
                <div style={{ fontSize: '0.75rem', color: '#a5b4fc', marginTop: '3px', fontWeight: 600 }}>
                  ₹{(cls.price * numPassengers).toLocaleString()} total ({numPassengers} travelers)
                </div>
              )}
              {tripType === 'roundtrip' && (
                <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 500, marginTop: '2px' }}>
                  Round trip included
                </div>
              )}
            </div>
            <div className="class-features">
              {cls.features.map(f => (
                <div key={f} style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'4px'}}>
                  <Check size={12} className="logo-icon"/> {f}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {selectedClass && (
        <div className="flight-actions animate-fade-in">
          <button className="btn-primary" onClick={handleBook}>
            Book {selectedClass.name}
          </button>
        </div>
      )}
    </div>
  );
};

export default FlightCard;
