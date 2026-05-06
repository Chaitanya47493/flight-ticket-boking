import React, { useState, useEffect, useMemo } from 'react';
import FlightCard from './FlightCard';
import { ArrowLeft, Loader2, ChevronDown, Filter } from 'lucide-react';
import { fetchFlights } from '../utils/flightSimulator';

const PAGE_SIZE = 10;

const FlightResults = ({ searchData, onBack, onSelectFlight }) => {
  const [flights, setFlights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    setVisibleCount(PAGE_SIZE);

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

  const [filterStops, setFilterStops] = useState('all');
  const [filterAirlines, setFilterAirlines] = useState([]);
  const [filterTime, setFilterTime] = useState('all');

  const uniqueAirlines = useMemo(() => {
    return [...new Set(flights.map(f => f.airline))];
  }, [flights]);

  const filteredFlights = useMemo(() => {
    return flights.filter(f => {
      if (filterStops !== 'all') {
        if (filterStops === '0' && f.stops !== 0) return false;
        if (filterStops === '1' && f.stops !== 1) return false;
        if (filterStops === '2+' && f.stops < 2) return false;
      }
      if (filterAirlines.length > 0 && !filterAirlines.includes(f.airline)) return false;
      if (filterTime !== 'all') {
        const hour = parseInt(f.departureTime.split(':')[0], 10);
        const isPM = f.departureTime.includes('PM');
        let h24 = hour;
        if (isPM && hour !== 12) h24 += 12;
        if (!isPM && hour === 12) h24 = 0;
        
        if (filterTime === 'morning' && (h24 < 5 || h24 >= 12)) return false;
        if (filterTime === 'afternoon' && (h24 < 12 || h24 >= 18)) return false;
        if (filterTime === 'evening' && (h24 < 18)) return false;
      }
      return true;
    });
  }, [flights, filterStops, filterAirlines, filterTime]);

  const visibleFlights = filteredFlights.slice(0, visibleCount);
  const hasMore = visibleCount < filteredFlights.length;

  return (
    <div className="animate-fade-in">
      <div className="results-header">
        <div className="results-info">
          <h2>Select your flight</h2>
          <p>
            {searchData.from} {searchData.tripType === 'roundtrip' ? '↔' : '→'} {searchData.to} &nbsp;•&nbsp; 
            {searchData.date} {searchData.tripType === 'roundtrip' && ` - ${searchData.returnDate}`} &nbsp;•&nbsp; 
            {searchData.passengers} Passenger(s)
            {!isLoading && flights.length > 0 && (
              <span style={{
                marginLeft: '0.75rem',
                background: 'rgba(99,102,241,0.2)',
                color: '#a5b4fc',
                padding: '2px 10px',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 600
              }}>
                {filteredFlights.length} flights found
              </span>
            )}
          </p>
        </div>
        <button className="btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} style={{marginRight: '8px'}} />
          Change Search
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0' }}>
          <Loader2 size={40} className="animate-spin" style={{ color: 'var(--accent-color)', marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Searching airlines for the best flights in real-time...</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(255,50,50,0.1)', borderRadius: '1rem', border: '1px solid rgba(255,50,50,0.3)' }}>
          <h3 style={{ color: '#ff4d4d' }}>Error searching flights</h3>
          <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
        </div>
      ) : flights.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h3>No flights found</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Try changing your dates or destination.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Simulated Data Warning */}
          {flights.fallbackReason && (
            <div style={{ width: '100%', marginBottom: '1rem', padding: '1rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '0.5rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <strong>Offline Mode:</strong> {flights.fallbackReason} Showing offline simulated flights instead.
            </div>
          )}
          
          {/* Sidebar */}
          <div className="glass-panel" style={{ width: '100%', maxWidth: '280px', padding: '1.5rem', flexShrink: 0 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
              <Filter size={18} /> Filters
            </h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: '#94a3b8' }}>Stops</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {['all', '0', '1', '2+'].map(stop => (
                  <label key={stop} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input 
                      type="radio" 
                      name="stops" 
                      checked={filterStops === stop}
                      onChange={() => setFilterStops(stop)}
                    />
                    {stop === 'all' ? 'Any number of stops' : stop === '0' ? 'Non-stop only' : stop === '1' ? '1 stop or fewer' : '2+ stops'}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: '#94a3b8' }}>Departure Time</h4>
              <select 
                value={filterTime} 
                onChange={(e) => setFilterTime(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '0.5rem' }}
              >
                <option value="all">Any time</option>
                <option value="morning">Morning (5:00 AM - 11:59 AM)</option>
                <option value="afternoon">Afternoon (12:00 PM - 5:59 PM)</option>
                <option value="evening">Evening (6:00 PM onwards)</option>
              </select>
            </div>

            <div>
              <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: '#94a3b8' }}>Airlines</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {uniqueAirlines.map(airline => (
                  <label key={airline} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
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
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* List */}
          <div className="flights-list" style={{ flex: 1, minWidth: '300px' }}>
            {filteredFlights.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem' }}>
                <p>No flights match your filters.</p>
                <button onClick={() => { setFilterStops('all'); setFilterAirlines([]); setFilterTime('all'); }} className="btn-secondary" style={{ marginTop: '1rem' }}>Clear Filters</button>
              </div>
            ) : (
              <>
                {visibleFlights.map((flight) => (
                  <FlightCard
                    key={flight.id}
                    flight={flight}
                    tripType={searchData.tripType}
                    onSelectClass={onSelectFlight}
                  />
                ))}

                {hasMore && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
                    <button
                      className="btn-secondary"
                      onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2rem' }}
                    >
                      <ChevronDown size={18} />
                      Show more flights ({filteredFlights.length - visibleCount} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FlightResults;
