import React, { useState, useEffect } from 'react';
import FlightCard from './FlightCard';
import { ArrowLeft, Loader2, ChevronDown } from 'lucide-react';
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

  const visibleFlights = flights.slice(0, visibleCount);
  const hasMore = visibleCount < flights.length;

  return (
    <div className="animate-fade-in">
      <div className="results-header">
        <div className="results-info">
          <h2>Select your flight</h2>
          <p>
            {searchData.from} → {searchData.to} &nbsp;•&nbsp; {searchData.date} &nbsp;•&nbsp; {searchData.passengers} Passenger(s)
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
                {flights.length} flights found
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
        <div className="flights-list">
          {visibleFlights.map((flight) => (
            <FlightCard
              key={flight.id}
              flight={flight}
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
                Show more flights ({flights.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FlightResults;
