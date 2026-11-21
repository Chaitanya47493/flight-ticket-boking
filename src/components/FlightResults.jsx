import { useState, useEffect, useMemo } from 'react';
import FlightCard from './FlightCard';
import FarePredictorStrip from './FarePredictorStrip';
import { 
  ArrowLeft, Loader2, ChevronDown, Filter, ArrowUpDown, Clock, DollarSign, 
  Sunrise, Sunset, X, Sun, CloudSun, CloudRain, CloudLightning, CloudFog, 
  CloudDrizzle, CloudSnow, Wind, Eye, ShieldAlert, CheckCircle2, AlertTriangle, Activity 
} from 'lucide-react';
import { fetchFlights, getLastPriceInsights } from '../utils/flightSimulator';
import { fetchRouteWeather, predictDelayRisk } from '../utils/weatherRisk';
import { generateWeeklyFareForecast } from '../utils/pricePredictor';

const PAGE_SIZE = 50;

const WeatherGlyph = ({ iconName, size = 16, className = '', style = {} }) => {
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

const FlightResults = ({ searchData, onBack, onSelectFlight, onDateChange }) => {
  const [flights, setFlights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [sortBy, setSortBy] = useState('cheapest'); // 'cheapest', 'fastest', 'earliest', 'latest'

  // Route weather and delay risk state
  const [routeWeather, setRouteWeather] = useState({ originWeather: null, destWeather: null, isLoading: true });
  const [filterLowRiskOnly, setFilterLowRiskOnly] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetchFlights(searchData)
      .then(data => {
        if (isMounted) {
          setFlights(data);
          setIsLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        if (isMounted) {
          setError(err.message || "Failed to fetch flights");
          setIsLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, [searchData]);

  const routeKey = `${searchData.from}->${searchData.to}`;
  const [prevRouteKey, setPrevRouteKey] = useState(routeKey);
  if (prevRouteKey !== routeKey) {
    setPrevRouteKey(routeKey);
    setRouteWeather({ originWeather: null, destWeather: null, isLoading: true });
  }

  // Fetch real-time airport weather for origin & destination
  useEffect(() => {
    let isMounted = true;
    if (searchData.from && searchData.to) {
      fetchRouteWeather(searchData.from, searchData.to)
        .then(({ originWeather, destWeather }) => {
          if (isMounted) {
            setRouteWeather({ originWeather, destWeather, isLoading: false });
          }
        })
        .catch(() => {
          if (isMounted) {
            setRouteWeather(prev => ({ ...prev, isLoading: false }));
          }
        });
    }
    return () => { isMounted = false; };
  }, [searchData.from, searchData.to]);

  const [filterStops, setFilterStops] = useState('all');
  const [filterAirlines, setFilterAirlines] = useState([]);
  const [filterTime, setFilterTime] = useState('all');

  const baseRouteRisk = useMemo(() => {
    return predictDelayRisk(routeWeather.originWeather, routeWeather.destWeather, 0);
  }, [routeWeather.originWeather, routeWeather.destWeather]);

  const uniqueAirlines = useMemo(() => {
    return [...new Set(flights.map(f => f.airline))];
  }, [flights]);

  const airlineCounts = useMemo(() => {
    const counts = {};
    flights.forEach(f => {
      counts[f.airline] = (counts[f.airline] || 0) + 1;
    });
    return counts;
  }, [flights]);

  const stopCounts = useMemo(() => {
    return {
      all: flights.length,
      direct: flights.filter(f => f.stops === 0).length,
      oneStop: flights.filter(f => f.stops === 1).length,
      multiStop: flights.filter(f => f.stops >= 2).length,
    };
  }, [flights]);

  const lowRiskCount = useMemo(() => {
    if (!routeWeather.originWeather || !routeWeather.destWeather) return flights.length;
    return flights.filter(f => {
      const risk = predictDelayRisk(routeWeather.originWeather, routeWeather.destWeather, f.stops);
      return risk.level === 'Low';
    }).length;
  }, [flights, routeWeather.originWeather, routeWeather.destWeather]);

  // Lowest available baseline fare across loaded flights
  const lowestCurrentPrice = useMemo(() => {
    if (!flights || flights.length === 0) return 0;
    let min = Infinity;
    flights.forEach(f => {
      const p = f.classes?.[0]?.price || f.price || 0;
      if (p > 0 && p < min) min = p;
    });
    return min === Infinity ? 0 : min;
  }, [flights]);

  const searchDate = searchData?.date;
  const searchFrom = searchData?.from;
  const searchTo = searchData?.to;

  // 7-day smart fare forecast
  const fareForecast = useMemo(() => {
    if (!searchDate || lowestCurrentPrice === 0) return null;
    const insights = flights.priceInsights || getLastPriceInsights();
    return generateWeeklyFareForecast(
      searchDate,
      lowestCurrentPrice,
      searchFrom,
      searchTo,
      insights
    );
  }, [searchDate, lowestCurrentPrice, searchFrom, searchTo, flights]);

  const hasActiveFilters = filterStops !== 'all' || filterAirlines.length > 0 || filterTime !== 'all' || filterLowRiskOnly;

  const clearAllFilters = () => {
    setFilterStops('all');
    setFilterAirlines([]);
    setFilterTime('all');
    setFilterLowRiskOnly(false);
  };

  const filteredFlights = useMemo(() => {
    return flights.filter(f => {
      if (filterStops !== 'all') {
        if (filterStops === '0' && f.stops !== 0) return false;
        if (filterStops === '1' && f.stops !== 1) return false;
        if (filterStops === '2+' && f.stops < 2) return false;
      }
      if (filterAirlines.length > 0 && !filterAirlines.includes(f.airline)) return false;
      if (filterTime !== 'all') {
        const h24 = Math.floor((f.departureMinutes || 600) / 60);
        if (filterTime === 'morning' && (h24 < 5 || h24 >= 12)) return false;
        if (filterTime === 'afternoon' && (h24 < 12 || h24 >= 18)) return false;
        if (filterTime === 'evening' && (h24 < 18)) return false;
      }
      if (filterLowRiskOnly) {
        const flightRisk = predictDelayRisk(routeWeather.originWeather, routeWeather.destWeather, f.stops);
        if (flightRisk.level !== 'Low') return false;
      }
      return true;
    });
  }, [flights, filterStops, filterAirlines, filterTime, filterLowRiskOnly, routeWeather]);

  const sortedFlights = useMemo(() => {
    const list = [...filteredFlights];
    if (sortBy === 'cheapest') {
      return list.sort((a, b) => (a.classes[0]?.price || 0) - (b.classes[0]?.price || 0));
    }
    if (sortBy === 'fastest') {
      return list.sort((a, b) => (a.durationMinutes || 999) - (b.durationMinutes || 999));
    }
    if (sortBy === 'earliest') {
      return list.sort((a, b) => (a.departureMinutes || 0) - (b.departureMinutes || 0));
    }
    if (sortBy === 'latest') {
      return list.sort((a, b) => (b.departureMinutes || 0) - (a.departureMinutes || 0));
    }
    return list;
  }, [filteredFlights, sortBy]);

  const visibleFlights = sortedFlights.slice(0, visibleCount);

  return (
    <div className="results-container animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <div className="results-header">
        <div className="results-info">
          <h2>Available Flights</h2>
          <p>
            {searchData.from} → {searchData.to} &bull; {searchData.date}
            {searchData.returnDate && ` to ${searchData.returnDate}`} &bull; {searchData.passengers} Passenger(s)
            {!isLoading && (
              <span style={{ marginLeft: '8px', color: 'var(--accent-color)', fontWeight: 600 }}>
                ({sortedFlights.length} found)
              </span>
            )}
          </p>
        </div>
        <button className="btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Change Search</span>
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0' }}>
          <Loader2 size={36} className="animate-spin" style={{ color: 'var(--accent-color)', marginBottom: '1rem' }} />
          <h3 style={{ marginBottom: '0.35rem', color: 'var(--text-primary)' }}>Scanning Carrier Schedules</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', textAlign: 'center', fontSize: '0.875rem' }}>
            Retrieving real-time fares and seat availability for {searchData.from} → {searchData.to}...
          </p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '2.5rem', background: 'var(--danger-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--danger-color)' }}>
          <h3 style={{ color: 'var(--danger-color)', marginBottom: '0.5rem' }}>Error searching flights</h3>
          <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
        </div>
      ) : flights.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>No flights found</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Try changing your dates or departure airport.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Sidebar */}
          <div className="glass-panel" style={{ width: '100%', maxWidth: '280px', padding: '1.25rem', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', margin: 0 }}>
                <Filter size={16} style={{ color: 'var(--accent-color)' }} /> 
                <span>Filters</span>
              </h3>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--danger-color)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    padding: '2px 4px',
                    fontWeight: 600
                  }}
                >
                  <X size={12} /> Clear all
                </button>
              )}
            </div>
            
            {/* Stops */}
            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ marginBottom: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Stops
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                      type="radio" 
                      name="stops" 
                      checked={filterStops === 'all'}
                      onChange={() => setFilterStops('all')}
                    />
                    Any stops
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({stopCounts.all})</span>
                </label>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                      type="radio" 
                      name="stops" 
                      checked={filterStops === '0'}
                      onChange={() => setFilterStops('0')}
                    />
                    Non-stop only
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({stopCounts.direct})</span>
                </label>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                      type="radio" 
                      name="stops" 
                      checked={filterStops === '1'}
                      onChange={() => setFilterStops('1')}
                    />
                    1 stop or fewer
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({stopCounts.direct + stopCounts.oneStop})</span>
                </label>
                {stopCounts.multiStop > 0 && (
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '0.875rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input 
                        type="radio" 
                        name="stops" 
                        checked={filterStops === '2+'}
                        onChange={() => setFilterStops('2+')}
                      />
                      2+ stops
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({stopCounts.multiStop})</span>
                  </label>
                )}
              </div>
            </div>

            {/* Departure Time */}
            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ marginBottom: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Departure Time
              </h4>
              <select 
                value={filterTime} 
                onChange={(e) => setFilterTime(e.target.value)}
                className="input-field"
                style={{ width: '100%', padding: '0.5rem', fontSize: '0.8125rem' }}
              >
                <option value="all">Any departure time</option>
                <option value="morning">Morning (5:00 AM - 11:59 AM)</option>
                <option value="afternoon">Afternoon (12:00 PM - 5:59 PM)</option>
                <option value="evening">Evening (6:00 PM onwards)</option>
              </select>
            </div>

            {/* Delay Risk Filter */}
            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ marginBottom: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Activity size={13} style={{ color: 'var(--accent-color)' }} />
                <span>Delay Risk</span>
              </h4>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '0.875rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="checkbox" 
                    checked={filterLowRiskOnly}
                    onChange={(e) => setFilterLowRiskOnly(e.target.checked)}
                  />
                  <span>Low Delay Risk Only</span>
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({lowRiskCount})</span>
              </label>
            </div>

            {/* Airlines */}
            <div>
              <h4 style={{ marginBottom: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Airlines
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {uniqueAirlines.map(airline => (
                  <label key={airline} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '0.875rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input 
                        type="checkbox" 
                        checked={filterAirlines.includes(airline)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilterAirlines([...filterAirlines, airline]);
                          } else {
                            setFilterAirlines(filterAirlines.filter(a => a !== airline));
                          }
                        }}
                      />
                      {airline}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({airlineCounts[airline] || 0})</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* List */}
          <div className="flights-list" style={{ flex: 1, minWidth: '300px' }}>
            {/* Live Route Weather & Delay Risk Banner */}
            {routeWeather.isLoading ? (
              <div className="route-weather-banner loading-pulse" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', color: 'var(--text-secondary)', fontSize: '0.8125rem', padding: '0.5rem 0' }}>
                  <Loader2 size={16} className="animate-spin" style={{ color: 'var(--accent-color)' }} />
                  <span>Retrieving live airport weather & corridor delay risk for {searchData.from} → {searchData.to}...</span>
                </div>
              </div>
            ) : (routeWeather.originWeather && routeWeather.destWeather) && (
              <div className="route-weather-banner" style={{ marginBottom: '1rem' }}>
                <div className="weather-banner-grid">
                  {/* Origin Station */}
                  <div className="weather-station-box origin">
                    <div className="station-role">DEPARTURE HUB</div>
                    <div className="station-airport">
                      <span className="station-iata">{routeWeather.originWeather.iata}</span>
                      <span className="station-city">{routeWeather.originWeather.city}</span>
                    </div>
                    <div className="station-weather-row">
                      <WeatherGlyph iconName={routeWeather.originWeather.iconName} size={18} style={{ color: 'var(--accent-color)' }} />
                      <span className="station-temp">{routeWeather.originWeather.temperature}°C</span>
                      <span className="station-cond">{routeWeather.originWeather.condition}</span>
                    </div>
                    <div className="station-details">
                      <span><Wind size={11} /> {routeWeather.originWeather.windSpeed} km/h</span>
                      <span><Eye size={11} /> {routeWeather.originWeather.visibilityKm} km vis</span>
                    </div>
                  </div>

                  {/* Delay Risk Outlook */}
                  <div className="weather-risk-center">
                    <div className={`risk-outlook-badge risk-${baseRouteRisk.level.toLowerCase()}`}>
                      {baseRouteRisk.level === 'Low' && <CheckCircle2 size={13} />}
                      {baseRouteRisk.level === 'Moderate' && <AlertTriangle size={13} />}
                      {baseRouteRisk.level === 'High' && <ShieldAlert size={13} />}
                      <span>{baseRouteRisk.level} Delay Risk ({baseRouteRisk.score}%)</span>
                    </div>
                    <div className="risk-reason-line">{baseRouteRisk.reason}</div>
                    <div className="risk-live-indicator">
                      <span className={`live-pulse-dot ${routeWeather.originWeather.source === 'live' ? 'is-live' : 'is-cached'}`} />
                      <span>{routeWeather.originWeather.source === 'live' ? 'Real-time Open-Meteo Telemetry' : 'Cached Meteorological Feed (15m)'}</span>
                    </div>
                  </div>

                  {/* Destination Station */}
                  <div className="weather-station-box destination">
                    <div className="station-role">ARRIVAL HUB</div>
                    <div className="station-airport">
                      <span className="station-iata">{routeWeather.destWeather.iata}</span>
                      <span className="station-city">{routeWeather.destWeather.city}</span>
                    </div>
                    <div className="station-weather-row">
                      <WeatherGlyph iconName={routeWeather.destWeather.iconName} size={18} style={{ color: 'var(--accent-color)' }} />
                      <span className="station-temp">{routeWeather.destWeather.temperature}°C</span>
                      <span className="station-cond">{routeWeather.destWeather.condition}</span>
                    </div>
                    <div className="station-details">
                      <span><Wind size={11} /> {routeWeather.destWeather.windSpeed} km/h</span>
                      <span><Eye size={11} /> {routeWeather.destWeather.visibilityKm} km vis</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Smart Best-Day Fare Predictor Strip */}
            <FarePredictorStrip
              forecast={fareForecast}
              onChangeDate={onDateChange}
              isLoading={isLoading}
            />

            {/* Sorting Toolbar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
              padding: '0.625rem 1rem',
              background: 'var(--surface-color)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--surface-border)',
              marginBottom: '1rem',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 600 }}>
                <ArrowUpDown size={15} style={{ color: 'var(--accent-color)' }} />
                <span>Sort by:</span>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {[
                  { id: 'cheapest', label: 'Lowest Price', icon: DollarSign },
                  { id: 'fastest', label: 'Fastest', icon: Clock },
                  { id: 'earliest', label: 'Earliest Dep', icon: Sunrise },
                  { id: 'latest', label: 'Latest Dep', icon: Sunset },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSortBy(id)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                      background: sortBy === id ? 'var(--accent-subtle)' : 'var(--surface-subtle)',
                      color: sortBy === id ? 'var(--accent-color)' : 'var(--text-secondary)',
                      border: sortBy === id ? '1px solid var(--accent-color)' : '1px solid var(--surface-border)'
                    }}
                  >
                    <Icon size={12} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {sortedFlights.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', background: 'var(--surface-color)', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)' }}>
                <p style={{ color: 'var(--text-secondary)' }}>No flights match your active filters.</p>
                <button onClick={clearAllFilters} className="btn-secondary" style={{ marginTop: '0.875rem' }}>
                  Clear Filters
                </button>
              </div>
            ) : (
              visibleFlights.map((flight) => {
                const flightRisk = predictDelayRisk(routeWeather.originWeather, routeWeather.destWeather, flight.stops);
                return (
                  <FlightCard 
                    key={flight.id} 
                    flight={flight} 
                    tripType={searchData.tripType} 
                    passengers={searchData.passengers}
                    onSelectClass={(fl, cls) => onSelectFlight(fl, cls)}
                    weatherData={{
                      originWeather: routeWeather.originWeather,
                      destWeather: routeWeather.destWeather,
                      risk: flightRisk
                    }}
                  />
                );
              })
            )}

            {visibleCount < sortedFlights.length && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.25rem' }}>
                <button 
                  className="btn-secondary" 
                  onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <span>Show More Flights</span>
                  <ChevronDown size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FlightResults;
