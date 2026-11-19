import React, { useState, useEffect, useMemo } from 'react';
import FlightCard from './FlightCard';
import { ArrowLeft, Loader2, ChevronDown, Filter, ArrowUpDown, Clock, DollarSign, Sunrise, Sunset, X } from 'lucide-react';
import { fetchFlights } from '../utils/flightSimulator';

const PAGE_SIZE = 50;

const FlightResults = ({ searchData, onBack, onSelectFlight }) => {
  const [flights, setFlights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [sortBy, setSortBy] = useState('cheapest'); // 'cheapest', 'fastest', 'earliest', 'latest'

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

  const hasActiveFilters = filterStops !== 'all' || filterAirlines.length > 0 || filterTime !== 'all';

  const clearAllFilters = () => {
    setFilterStops('all');
    setFilterAirlines([]);
    setFilterTime('all');
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
      return true;
    });
  }, [flights, filterStops, filterAirlines, filterTime]);

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
  const hasMore = visibleCount < sortedFlights.length;

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
                padding: '3px 12px',
                borderRadius: '999px',
                fontSize: '0.85rem',
                fontWeight: 600,
                border: '1px solid rgba(99,102,241,0.3)'
              }}>
                {sortedFlights.length} available flight{sortedFlights.length === 1 ? '' : 's'}
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0' }}>
          <Loader2 size={44} className="animate-spin" style={{ color: 'var(--accent-color)', marginBottom: '1rem' }} />
          <h3 style={{ marginBottom: '0.5rem', color: '#f8fafc' }}>Fetching Live Airline Flights</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', textAlign: 'center' }}>
            Checking all real-time carriers and exact prices on Google Flights for {searchData.from} → {searchData.to}...
          </p>
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
          {/* Sidebar */}
          <div className="glass-panel" style={{ width: '100%', maxWidth: '280px', padding: '1.5rem', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', margin: 0 }}>
                <Filter size={18} /> Filters
              </h3>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#f87171',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    padding: '2px 6px'
                  }}
                >
                  <X size={12} /> Clear all
                </button>
              )}
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: '#94a3b8' }}>Stops</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                      type="radio" 
                      name="stops" 
                      checked={filterStops === 'all'}
                      onChange={() => setFilterStops('all')}
                    />
                    Any stops
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({stopCounts.all})</span>
                </label>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                      type="radio" 
                      name="stops" 
                      checked={filterStops === '0'}
                      onChange={() => setFilterStops('0')}
                    />
                    Non-stop only
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({stopCounts.direct})</span>
                </label>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                      type="radio" 
                      name="stops" 
                      checked={filterStops === '1'}
                      onChange={() => setFilterStops('1')}
                    />
                    1 stop or fewer
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({stopCounts.direct + stopCounts.oneStop})</span>
                </label>
                {stopCounts.multiStop > 0 && (
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input 
                        type="radio" 
                        name="stops" 
                        checked={filterStops === '2+'}
                        onChange={() => setFilterStops('2+')}
                      />
                      2+ stops
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({stopCounts.multiStop})</span>
                  </label>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: '#94a3b8' }}>Departure Time</h4>
              <select 
                value={filterTime} 
                onChange={(e) => setFilterTime(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: '0.5rem' }}
              >
                <option value="all">Any departure time</option>
                <option value="morning">Morning (5:00 AM - 11:59 AM)</option>
                <option value="afternoon">Afternoon (12:00 PM - 5:59 PM)</option>
                <option value="evening">Evening (6:00 PM onwards)</option>
              </select>
            </div>

            <div>
              <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: '#94a3b8' }}>Airlines</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {uniqueAirlines.map(airline => (
                  <label key={airline} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '0.9rem' }}>
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
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({airlineCounts[airline] || 0})</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* List */}
          <div className="flights-list" style={{ flex: 1, minWidth: '300px' }}>
            {/* Sorting Toolbar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              padding: '0.85rem 1.25rem',
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                <ArrowUpDown size={16} style={{ color: '#818cf8' }} />
                <span>Sort by:</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setSortBy('cheapest')}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease',
                    background: sortBy === 'cheapest' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.03)',
                    color: sortBy === 'cheapest' ? '#a5b4fc' : '#94a3b8',
                    border: sortBy === 'cheapest' ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <DollarSign size={13} /> Lowest Price
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('fastest')}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease',
                    background: sortBy === 'fastest' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.03)',
                    color: sortBy === 'fastest' ? '#a5b4fc' : '#94a3b8',
                    border: sortBy === 'fastest' ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <Clock size={13} /> Fastest
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('earliest')}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease',
                    background: sortBy === 'earliest' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.03)',
                    color: sortBy === 'earliest' ? '#a5b4fc' : '#94a3b8',
                    border: sortBy === 'earliest' ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <Sunrise size={13} /> Earliest Dep
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('latest')}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease',
                    background: sortBy === 'latest' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.03)',
                    color: sortBy === 'latest' ? '#a5b4fc' : '#94a3b8',
                    border: sortBy === 'latest' ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <Sunset size={13} /> Latest Dep
                </button>
              </div>
            </div>

            {sortedFlights.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem' }}>
                <p>No flights match your filters.</p>
                <button onClick={clearAllFilters} className="btn-secondary" style={{ marginTop: '1rem' }}>Clear Filters</button>
              </div>
            ) : (
              <>
                {visibleFlights.map((flight) => (
                  <FlightCard
                    key={flight.id}
                    flight={flight}
                    tripType={searchData.tripType}
                    passengers={searchData.passengers}
                    onSelectClass={onSelectFlight}
                  />
                ))}

                {hasMore && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                    <button
                      className="btn-secondary"
                      onClick={() => setVisibleCount(c => c + 25)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.75rem' }}
                    >
                      <ChevronDown size={18} />
                      Show more ({sortedFlights.length - visibleCount} remaining)
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => setVisibleCount(sortedFlights.length)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.75rem', background: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.3)' }}
                    >
                      Show all {sortedFlights.length} flights
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
