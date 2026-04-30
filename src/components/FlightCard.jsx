import React, { useState } from 'react';
import { Plane, Clock, Check } from 'lucide-react';

const FlightCard = ({ flight, onSelectClass }) => {
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
          <div className="airline-logo">
            <Plane size={24} className="logo-icon" />
          </div>
          <div>
            <div className="airline-name">{flight.airline}</div>
            <div className="flight-number">{flight.flightNumber}</div>
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
            <span>{flight.stops === 0 ? 'Direct' : `${flight.stops} Stop(s)`}</span>
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
            <div className="class-price">₹{cls.price}</div>
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
