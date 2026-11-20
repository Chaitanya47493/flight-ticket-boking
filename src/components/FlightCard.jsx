import { useState } from 'react';
import { 
  Plane, Clock, Check, X, Wind, Eye, AlertTriangle, ShieldAlert, CheckCircle2, 
  Activity, Sun, CloudSun, CloudRain, CloudLightning, CloudFog, CloudDrizzle, CloudSnow 
} from 'lucide-react';

const WeatherGlyph = ({ iconName, size = 14, className = '', style = {} }) => {
  switch (iconName) {
    case 'Sun': return <Sun size={size} className={className} style={style} />;
    case 'CloudSun': return <CloudSun size={size} className={className} style={style} />;
    case 'CloudRain': return <CloudRain size={size} className={className} style={style} />;
    case 'CloudLightning': return <CloudLightning size={size} className={className} style={style} />;
    case 'CloudFog': return <CloudFog size={size} className={className} style={style} />;
    case 'CloudDrizzle': return <CloudDrizzle size={size} className={className} style={style} />;
    case 'CloudSnow': return <CloudSnow size={size} className={className} style={style} />;
    default: return <Sun size={size} className={className} style={style} />;
  }
};

const FlightCard = ({ flight, tripType, passengers = 1, onSelectClass, weatherData = null }) => {
  const [selectedClass, setSelectedClass] = useState(null);
  const [showWeatherPopover, setShowWeatherPopover] = useState(false);

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
          <div className="airline-logo" style={{ overflow: 'hidden' }}>
            {flight.airlineLogo ? (
              <img src={flight.airlineLogo} alt={flight.airline} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <Plane size={22} className="logo-icon" />
            )}
          </div>
          <div>
            <div className="airline-name">{flight.airline}</div>
            <div className="flight-number" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '3px' }}>
              <span>{flight.flightNumber}</span>
              {flight.airplane && (
                <span className="badge" style={{ background: 'var(--surface-subtle)', border: '1px solid var(--surface-border)', color: 'var(--text-secondary)' }}>
                  {flight.airplane}
                </span>
              )}
              {flight.terminal && (
                <span className="badge" style={{ background: 'var(--surface-subtle)', border: '1px solid var(--surface-border)', color: 'var(--text-secondary)' }}>
                  TERMINAL {flight.terminal}
                </span>
              )}
              {flight.source && (
                <span className={`badge ${flight.source.toLowerCase() === 'live' ? 'badge-success' : 'badge-info'}`}>
                  {flight.source.toLowerCase() === 'live' ? (
                    <>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                      <span>LIVE FLIGHT</span>
                    </>
                  ) : (
                    <span>{flight.source.toUpperCase()}</span>
                  )}
                </span>
              )}
              {tripType === 'roundtrip' && (
                <span className="badge badge-info">
                  Round Trip Included
                </span>
              )}
              {/* Delay Risk Badge & Expandable Popover */}
              {weatherData?.risk && (
                <div className="weather-risk-badge-wrapper">
                  <button
                    type="button"
                    className={`badge weather-risk-pill badge-risk-${weatherData.risk.level.toLowerCase()}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowWeatherPopover(prev => !prev);
                    }}
                    title="Click to view live weather telemetry & delay risk factors"
                    aria-label={`Delay risk level: ${weatherData.risk.level}, score: ${weatherData.risk.score}%`}
                  >
                    <span className="risk-pulse-dot" />
                    <span>{weatherData.risk.level} Delay Risk ({weatherData.risk.score}%)</span>
                  </button>

                  {showWeatherPopover && (
                    <div 
                      className="weather-risk-popover animate-scale-in"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="popover-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Activity size={14} style={{ color: 'var(--accent-color)' }} />
                          <span style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Flight Delay Risk Analysis</span>
                        </div>
                        <button 
                          type="button" 
                          className="popover-close-btn"
                          onClick={() => setShowWeatherPopover(false)}
                          aria-label="Close weather analysis"
                        >
                          <X size={12} />
                        </button>
                      </div>

                      <div className="popover-score-row">
                        <div className="popover-score-head">
                          <span className={`risk-grade-badge grade-${weatherData.risk.level.toLowerCase()}`}>
                            {weatherData.risk.level === 'Low' && <CheckCircle2 size={12} />}
                            {weatherData.risk.level === 'Moderate' && <AlertTriangle size={12} />}
                            {weatherData.risk.level === 'High' && <ShieldAlert size={12} />}
                            <span>{weatherData.risk.level} Risk</span>
                          </span>
                          <span className="popover-score-num">{weatherData.risk.score}% Risk Factor</span>
                        </div>
                        <div className="popover-progress-track">
                          <div 
                            className={`popover-progress-fill fill-${weatherData.risk.level.toLowerCase()}`} 
                            style={{ width: `${weatherData.risk.score}%` }} 
                          />
                        </div>
                        <p className="popover-reason-text">{weatherData.risk.reason}</p>
                        {flight.stops > 0 && (
                          <div className="layover-risk-alert">
                            <AlertTriangle size={12} />
                            <span>{flight.stops} intermediate connection{flight.stops > 1 ? 's' : ''} (+{flight.stops * 6}% layover risk)</span>
                          </div>
                        )}
                      </div>

                      <div className="popover-weather-grid">
                        <div className="popover-weather-box origin">
                          <div className="pwb-title">TAKEOFF &bull; {flight.origin}</div>
                          <div className="pwb-row">
                            <WeatherGlyph iconName={weatherData.originWeather?.iconName} size={15} style={{ color: 'var(--accent-color)' }} />
                            <strong className="pwb-temp">{weatherData.originWeather?.temperature ?? '--'}°C</strong>
                            <span className="pwb-cond">{weatherData.originWeather?.condition}</span>
                          </div>
                          <div className="pwb-stats">
                            <span><Wind size={10} /> {weatherData.originWeather?.windSpeed ?? '--'} km/h</span>
                            <span><Eye size={10} /> {weatherData.originWeather?.visibilityKm ?? '--'} km vis</span>
                          </div>
                        </div>

                        <div className="popover-weather-box destination">
                          <div className="pwb-title">LANDING &bull; {flight.destination}</div>
                          <div className="pwb-row">
                            <WeatherGlyph iconName={weatherData.destWeather?.iconName} size={15} style={{ color: 'var(--accent-color)' }} />
                            <strong className="pwb-temp">{weatherData.destWeather?.temperature ?? '--'}°C</strong>
                            <span className="pwb-cond">{weatherData.destWeather?.condition}</span>
                          </div>
                          <div className="pwb-stats">
                            <span><Wind size={10} /> {weatherData.destWeather?.windSpeed ?? '--'} km/h</span>
                            <span><Eye size={10} /> {weatherData.destWeather?.visibilityKm ?? '--'} km vis</span>
                          </div>
                        </div>
                      </div>

                      <div className="popover-footer-note">
                        <span>Live telemetry via Open-Meteo &bull; 15-min cache</span>
                      </div>
                    </div>
                  )}
                </div>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} />
              <span>{flight.duration}</span>
            </div>
            <div className="duration-line">
              <Plane size={13} className="duration-plane" />
            </div>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: flight.stops === 0 ? 600 : 500,
              color: flight.stops === 0 ? 'var(--success-color)' : 'var(--warning-color)'
            }}>
              {flight.stops === 0 ? 'Non-stop' : `${flight.stops} Stop(s)${flight.routePath ? ` • ${flight.routePath}` : ''}`}
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
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') handleClassSelect(cls); }}
          >
            <div className="class-name">{cls.name}</div>
            <div className="class-price">
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '3px' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>₹{cls.price.toLocaleString()}</span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>/ pax</span>
              </div>
              {numPassengers > 1 && (
                <div style={{ fontSize: '0.6875rem', color: 'var(--accent-color)', marginTop: '2px', fontWeight: 600 }}>
                  ₹{(cls.price * numPassengers).toLocaleString()} total ({numPassengers} travelers)
                </div>
              )}
              {tripType === 'roundtrip' && (
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '2px' }}>
                  Round trip included
                </div>
              )}
            </div>
            <div className="class-features">
              {cls.features.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <Check size={11} style={{ color: 'var(--accent-color)' }} />
                  <span>{f}</span>
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
