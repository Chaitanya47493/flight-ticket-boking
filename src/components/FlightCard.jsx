import React, { useState } from 'react';
import { Plane, Clock, Check } from 'lucide-react';

const FlightCard = ({ flight, tripType, onSelectClass }) => {
  const [selectedClass, setSelectedClass] = useState(null);

  const handleClassSelect = (cls) => {
    setSelectedClass(cls);
  };

  const handleBook = () => {
    if (selectedClass) {
      onSelectClass(flight, selectedClass);
    }
  };

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
                  background: 'rgba(99, 102, 241, 0.1)',
                  color: '#6366f1',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  border: '1px solid rgba(99, 102, 241, 0.2)'
                }}>
                  {flight.source.toUpperCase()}
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
              ₹{cls.price.toLocaleString()}
              {tripType === 'roundtrip' && <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'normal', marginTop: '2px' }}>Total for round trip</div>}
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
