import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Check, Sparkles, User, AlertCircle, Lock, Crown, Shield, RefreshCw, Plane, RotateCcw } from 'lucide-react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const SEAT_LETTERS_BUSINESS = ['A', 'C', 'D', 'F'];
const SEAT_LETTERS_ECONOMY = ['A', 'B', 'C', 'D', 'E', 'F'];

// Fallback pre-occupied seats if flight has no Firestore inventory record yet
const DEFAULT_OCCUPIED = new Set([
  '1A', '2D', '4B', '4C', '5E', '6A', '6B', '7C', '8D', '8E', '9F', '10A', '11C', '12B'
]);

const SeatSelection = ({ selectedFlight, selectedClass, passengers, searchData, onBack, onConfirmSeats }) => {
  const passengerList = passengers?.list || [
    { id: 1, firstName: passengers?.firstName || 'Passenger', lastName: passengers?.lastName || '1' }
  ];

  const isRoundTrip = searchData?.tripType === 'roundtrip' && !!searchData?.returnDate;
  const [activeLeg, setActiveLeg] = useState('outbound'); // 'outbound' | 'return'

  const [activePassengerIndex, setActivePassengerIndex] = useState(0);
  const [cabinWarning, setCabinWarning] = useState('');

  // Selected seats: passengerIndex -> seatObj
  const [outboundSeats, setOutboundSeats] = useState({});
  const [returnSeats, setReturnSeats] = useState({});

  // Dynamic Occupied Seats loaded from Firestore seatInventory
  const [occupiedSeatsMap, setOccupiedSeatsMap] = useState({
    outbound: new Set(DEFAULT_OCCUPIED),
    return: new Set(DEFAULT_OCCUPIED)
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Firestore Document IDs per leg: ${flightNumber}_${date}
  const outboundDocId = `${selectedFlight?.flightNumber || 'FL100'}_${searchData?.date || 'default'}`;
  const returnDocId = `${selectedFlight?.flightNumber || 'FL100'}-RT_${searchData?.returnDate || 'default'}`;

  useEffect(() => {
    if (!selectedFlight) return;

    // Real-Time listener for Outbound Seat Inventory
    const unsubOutbound = onSnapshot(doc(db, 'seatInventory', outboundDocId), (docSnap) => {
      if (docSnap.exists() && Array.isArray(docSnap.data()?.occupiedSeats)) {
        const remoteSeats = docSnap.data().occupiedSeats;
        setOccupiedSeatsMap(prev => ({
          ...prev,
          outbound: new Set(remoteSeats.length > 0 ? remoteSeats : DEFAULT_OCCUPIED)
        }));
      } else {
        setOccupiedSeatsMap(prev => ({
          ...prev,
          outbound: new Set(DEFAULT_OCCUPIED)
        }));
      }
      setIsSyncing(false);
    }, (err) => {
      console.warn('Seat inventory sync error (outbound), using defaults:', err.message);
      setOccupiedSeatsMap(prev => ({ ...prev, outbound: new Set(DEFAULT_OCCUPIED) }));
      setIsSyncing(false);
    });

    let unsubReturn = () => {};
    if (isRoundTrip) {
      // Real-Time listener for Return Seat Inventory
      unsubReturn = onSnapshot(doc(db, 'seatInventory', returnDocId), (docSnap) => {
        if (docSnap.exists() && Array.isArray(docSnap.data()?.occupiedSeats)) {
          const remoteSeats = docSnap.data().occupiedSeats;
          setOccupiedSeatsMap(prev => ({
            ...prev,
            return: new Set(remoteSeats.length > 0 ? remoteSeats : DEFAULT_OCCUPIED)
          }));
        } else {
          setOccupiedSeatsMap(prev => ({
            ...prev,
            return: new Set(DEFAULT_OCCUPIED)
          }));
        }
      }, (err) => {
        console.warn('Seat inventory sync error (return), using defaults:', err.message);
        setOccupiedSeatsMap(prev => ({ ...prev, return: new Set(DEFAULT_OCCUPIED) }));
      });
    }

    return () => {
      unsubOutbound();
      unsubReturn();
    };
  }, [outboundDocId, returnDocId, isRoundTrip, selectedFlight]);

  // Current active selections and occupied set based on active tab
  const currentSeats = activeLeg === 'outbound' ? outboundSeats : returnSeats;
  const currentOccupied = occupiedSeatsMap[activeLeg] || DEFAULT_OCCUPIED;

  const classNameLower = (selectedClass?.name || '').toLowerCase();
  const isClassBusiness = classNameLower.includes('business') || classNameLower.includes('first') || classNameLower.includes('club') || classNameLower.includes('suite');

  // Check if this flight actually has a Business Class cabin
  const flightHasBusinessClass = selectedFlight?.classes?.some(c => {
    const name = (c.name || '').toLowerCase();
    return name.includes('business') || name.includes('first') || name.includes('club') || name.includes('suite');
  });

  const businessRows = [1, 2, 3];
  const economyRows = [4, 5, 6, 7, 8, 9, 10, 11, 12];

  const getSeatPrice = (row, letter) => {
    if (isClassBusiness) return 0;
    if (!flightHasBusinessClass && row <= 3) return 350;
    if (row === 4 || row === 7) return 350;
    if ((letter === 'A' || letter === 'F' || letter === 'C' || letter === 'D') && row <= 6) return 150;
    return 0;
  };

  const updateActiveSeats = (newSeats) => {
    if (activeLeg === 'outbound') {
      setOutboundSeats(newSeats);
    } else {
      setReturnSeats(newSeats);
    }
  };

  const handleSeatClick = (seatId, row, letter) => {
    if (flightHasBusinessClass) {
      if (isClassBusiness && row > 3) {
        setCabinWarning(`Seat ${seatId} is locked: You booked Business Class (${selectedClass?.name}). You can ONLY select seats from Rows 1–3.`);
        return;
      }
      if (!isClassBusiness && row <= 3) {
        setCabinWarning(`Seat ${seatId} is locked: Rows 1–3 are exclusively for Business Class passengers. Please select your seats from Rows 4–12.`);
        return;
      }
    }

    if (currentOccupied.has(seatId)) {
      setCabinWarning(`Seat ${seatId} is currently occupied on the ${activeLeg === 'outbound' ? 'Outbound' : 'Return'} flight. Please choose another seat.`);
      return;
    }

    setCabinWarning('');

    // Check if another passenger in this group already has this seat on this leg
    const existingIndex = Object.keys(currentSeats).find(idx => currentSeats[idx]?.id === seatId);
    const price = getSeatPrice(row, letter);
    const newSeatObj = { id: seatId, row, letter, price };

    if (existingIndex !== undefined) {
      if (parseInt(existingIndex, 10) === activePassengerIndex) {
        // Deselect if clicking own seat
        const updated = { ...currentSeats };
        delete updated[activePassengerIndex];
        updateActiveSeats(updated);
        return;
      } else {
        setCabinWarning(`Seat ${seatId} is already assigned to Passenger ${parseInt(existingIndex, 10) + 1} on this leg.`);
        return;
      }
    }

    const updated = {
      ...currentSeats,
      [activePassengerIndex]: newSeatObj
    };
    updateActiveSeats(updated);

    // Auto-advance to next unassigned passenger if any on this leg
    const nextUnassigned = passengerList.findIndex((_, idx) => idx !== activePassengerIndex && !updated[idx]);
    if (nextUnassigned !== -1) {
      setActivePassengerIndex(nextUnassigned);
    }
  };

  const getAutoAssignedSeatsForLeg = (legKey, current = {}) => {
    const occupied = occupiedSeatsMap[legKey] || DEFAULT_OCCUPIED;
    const available = [];
    let rows;
    let letters;

    if (!flightHasBusinessClass) {
      rows = [...businessRows, ...economyRows];
      letters = SEAT_LETTERS_ECONOMY;
    } else if (isClassBusiness) {
      rows = businessRows;
      letters = SEAT_LETTERS_BUSINESS;
    } else {
      rows = economyRows;
      letters = SEAT_LETTERS_ECONOMY;
    }

    for (const r of rows) {
      for (const l of letters) {
        const id = `${r}${l}`;
        if (!occupied.has(id)) {
          available.push({ id, row: r, letter: l, price: getSeatPrice(r, l) });
        }
      }
    }

    const updated = { ...current };
    let availIdx = 0;
    for (let i = 0; i < passengerList.length; i++) {
      if (!updated[i]) {
        while (availIdx < available.length && Object.values(updated).some(s => s.id === available[availIdx].id)) {
          availIdx++;
        }
        if (availIdx < available.length) {
          updated[i] = available[availIdx];
          availIdx++;
        }
      }
    }
    return updated;
  };

  const handleAutoAssign = () => {
    const newSeats = getAutoAssignedSeatsForLeg(activeLeg, {});
    updateActiveSeats(newSeats);
    setCabinWarning('');
  };

  const outboundFee = Object.values(outboundSeats).reduce((sum, s) => sum + (s?.price || 0), 0);
  const returnFee = Object.values(returnSeats).reduce((sum, s) => sum + (s?.price || 0), 0);
  const totalSeatFee = isRoundTrip ? (outboundFee + returnFee) : outboundFee;

  const outboundAllAssigned = passengerList.every((_, idx) => !!outboundSeats[idx]);
  const returnAllAssigned = isRoundTrip ? passengerList.every((_, idx) => !!returnSeats[idx]) : true;

  const handleProceed = () => {
    let finalOutbound = { ...outboundSeats };
    if (!outboundAllAssigned) {
      finalOutbound = getAutoAssignedSeatsForLeg('outbound', outboundSeats);
      setOutboundSeats(finalOutbound);
    }

    let finalReturn = { ...returnSeats };
    if (isRoundTrip && !returnAllAssigned) {
      finalReturn = getAutoAssignedSeatsForLeg('return', returnSeats);
      setReturnSeats(finalReturn);
    }

    const calcOutboundFee = Object.values(finalOutbound).reduce((sum, s) => sum + (s?.price || 0), 0);
    const calcReturnFee = isRoundTrip ? Object.values(finalReturn).reduce((sum, s) => sum + (s?.price || 0), 0) : 0;
    const finalFee = calcOutboundFee + calcReturnFee;

    const finalPayload = isRoundTrip
      ? {
          outbound: finalOutbound,
          return: finalReturn,
          // Flat keys for backwards compatibility with single-leg views
          ...finalOutbound,
          isRoundTrip: true
        }
      : finalOutbound;

    onConfirmSeats(finalPayload, finalFee);
  };

  return (
    <div className="seat-selection-container animate-fade-in">
      <div className="results-header" style={{ marginBottom: '1.25rem' }}>
        <div className="results-info">
          <h2>Select Your Seats</h2>
          <p>
            {selectedFlight?.airline} {selectedFlight?.flightNumber} &nbsp;•&nbsp;
            {selectedFlight?.origin} ⇄ {selectedFlight?.destination} &nbsp;•&nbsp;
            <span className={isClassBusiness ? 'badge badge-warning' : 'badge badge-info'} style={{ marginLeft: '6px' }}>
              {selectedClass?.name} Cabin
            </span>
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isSyncing && (
            <span style={{ fontSize: '0.8rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <RefreshCw size={12} className="animate-spin" /> Syncing live seats...
            </span>
          )}
          <button type="button" className="btn-secondary" onClick={handleAutoAssign} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={16} style={{ color: '#a5b4fc' }} />
            Auto-Assign ({activeLeg === 'outbound' ? 'Outbound' : 'Return'})
          </button>
        </div>
      </div>

      {/* Round-Trip Flight Leg Tabs */}
      {isRoundTrip && (
        <div className="trip-leg-tabs" style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <button
            type="button"
            className={`trip-leg-tab ${activeLeg === 'outbound' ? 'active' : ''}`}
            onClick={() => { setActiveLeg('outbound'); setCabinWarning(''); }}
            style={{
              padding: '0.875rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: activeLeg === 'outbound' ? '2px solid var(--accent-color)' : '1px solid var(--surface-border)',
              background: activeLeg === 'outbound' ? 'var(--accent-subtle)' : 'var(--surface-color)',
              color: 'var(--text-primary)',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-color)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Plane size={13} />
                <span>Leg 1: Outbound</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginTop: '2px' }}>
                {selectedFlight?.origin} → {selectedFlight?.destination}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {searchData?.date} • {selectedFlight?.flightNumber}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className={`badge ${Object.keys(outboundSeats).length === passengerList.length ? 'badge-success' : 'badge-warning'}`}>
                {Object.keys(outboundSeats).length}/{passengerList.length} Seats
              </span>
            </div>
          </button>

          <button
            type="button"
            className={`trip-leg-tab ${activeLeg === 'return' ? 'active' : ''}`}
            onClick={() => { setActiveLeg('return'); setCabinWarning(''); }}
            style={{
              padding: '0.875rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: activeLeg === 'return' ? '2px solid var(--accent-color)' : '1px solid var(--surface-border)',
              background: activeLeg === 'return' ? 'var(--accent-subtle)' : 'var(--surface-color)',
              color: 'var(--text-primary)',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-color)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <RotateCcw size={13} />
                <span>Leg 2: Return</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginTop: '2px' }}>
                {selectedFlight?.destination} → {selectedFlight?.origin}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {searchData?.returnDate} • {selectedFlight?.flightNumber}-RT
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className={`badge ${Object.keys(returnSeats).length === passengerList.length ? 'badge-success' : 'badge-warning'}`}>
                {Object.keys(returnSeats).length}/{passengerList.length} Seats
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Cabin Guidance Banner */}
      <div style={{
        background: 'var(--surface-subtle)',
        border: '1px solid var(--surface-border)',
        borderRadius: 'var(--radius-md)',
        padding: '0.75rem 1.25rem',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontSize: '0.875rem'
      }}>
        {!flightHasBusinessClass ? (
          <>
            <Sparkles size={18} style={{ color: 'var(--accent-color)', flexShrink: 0 }} />
            <span style={{ color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>All-Economy Aircraft:</strong> All seats across Rows 1–12 are available.
            </span>
          </>
        ) : isClassBusiness ? (
          <>
            <Crown size={18} style={{ color: 'var(--warning-color)', flexShrink: 0 }} />
            <span style={{ color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--warning-color)' }}>Business Class Privilege:</strong> You have exclusive access to Rows 1–3 with extra-wide seating.
            </span>
          </>
        ) : (
          <>
            <Shield size={18} style={{ color: 'var(--accent-color)', flexShrink: 0 }} />
            <span style={{ color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Economy Booking:</strong> Please choose your seats from Main Cabin (Rows 4–12). Rows 1–3 are reserved for Business Class.
            </span>
          </>
        )}
      </div>

      {/* Inline Cabin Warning Alert */}
      {cabinWarning && (
        <div style={{
          background: 'var(--danger-bg)',
          border: '1px solid var(--danger-color)',
          color: 'var(--danger-color)',
          padding: '0.625rem 0.875rem',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.8125rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem'
        }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          <span>{cabinWarning}</span>
        </div>
      )}

      <div className="seat-selection-layout">
        {/* Airplane Fuselage Map */}
        <div className="airplane-fuselage glass-panel">
          {/* Plane Nose / Cockpit */}
          <div className="airplane-nose">
            <div className="cockpit-windows">
              <span className="cockpit-window" />
              <span className="cockpit-window" />
            </div>
            <span className="nose-label">
              {selectedFlight?.airline || 'Aero Space'} • {activeLeg === 'outbound' ? 'Outbound' : 'Return'} ({activeLeg === 'outbound' ? selectedFlight?.origin : selectedFlight?.destination} → {activeLeg === 'outbound' ? selectedFlight?.destination : selectedFlight?.origin})
            </span>
          </div>

          {/* Seat Legend */}
          <div className="seat-legend">
            <div className="legend-item">
              <span className="seat-sample seat-available" />
              <span>Available</span>
            </div>
            <div className="legend-item">
              <span className="seat-sample seat-selected" />
              <span>Selected</span>
            </div>
            <div className="legend-item">
              <span className="seat-sample seat-occupied" />
              <span>Occupied</span>
            </div>
            {flightHasBusinessClass && (
              <div className="legend-item">
                <span className="seat-sample seat-locked-sample" />
                <span>Other Class (Locked)</span>
              </div>
            )}
          </div>

          {/* Business Class / Front Row Section */}
          <div className={`cabin-section ${flightHasBusinessClass && !isClassBusiness ? 'cabin-disabled-section' : ''}`}>
            <div className="cabin-section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {!flightHasBusinessClass ? (
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>Front Rows / Extra Legroom (Rows 1–3)</span>
              ) : isClassBusiness ? (
                <>
                  <Crown size={15} style={{ color: '#fbbf24' }} />
                  <span style={{ color: '#fbbf24' }}>Business Class (Rows 1–3) — Your Cabin</span>
                </>
              ) : (
                <>
                  <Lock size={14} style={{ color: '#94a3b8' }} />
                  <span style={{ color: '#94a3b8' }}>Business Class (Rows 1–3) — Locked for Economy Bookings</span>
                </>
              )}
            </div>

            <div className="seat-grid business-grid">
              {businessRows.map(row => (
                <div key={row} className="seat-row">
                  <span className="row-number">{row}</span>
                  <div className="seat-group">
                    {['A', 'C'].map(letter => {
                      const id = `${row}${letter}`;
                      const isOccupied = currentOccupied.has(id);
                      const assignedIdx = Object.keys(currentSeats).find(idx => currentSeats[idx]?.id === id);
                      const isSelected = assignedIdx !== undefined;
                      const isLocked = flightHasBusinessClass && !isClassBusiness;

                      return (
                        <button
                          key={id}
                          type="button"
                          className={`seat business-seat ${isOccupied ? 'occupied' : isSelected ? 'selected' : isLocked ? 'seat-cabin-locked' : 'available'}`}
                          onClick={() => handleSeatClick(id, row, letter)}
                          disabled={isOccupied}
                          title={isLocked ? `Seat ${id} - Locked (Business Class only)` : `Seat ${id} - ${flightHasBusinessClass ? 'Business Class' : 'Front Row Extra Legroom (+₹350)'}`}
                        >
                          {isSelected ? (parseInt(assignedIdx, 10) + 1) : isLocked ? <Lock size={12} style={{ opacity: 0.4 }} /> : letter}
                        </button>
                      );
                    })}
                  </div>

                  <div className="aisle">AISLE</div>

                  <div className="seat-group">
                    {['D', 'F'].map(letter => {
                      const id = `${row}${letter}`;
                      const isOccupied = currentOccupied.has(id);
                      const assignedIdx = Object.keys(currentSeats).find(idx => currentSeats[idx]?.id === id);
                      const isSelected = assignedIdx !== undefined;
                      const isLocked = flightHasBusinessClass && !isClassBusiness;

                      return (
                        <button
                          key={id}
                          type="button"
                          className={`seat business-seat ${isOccupied ? 'occupied' : isSelected ? 'selected' : isLocked ? 'seat-cabin-locked' : 'available'}`}
                          onClick={() => handleSeatClick(id, row, letter)}
                          disabled={isOccupied}
                          title={isLocked ? `Seat ${id} - Locked (Business Class only)` : `Seat ${id} - ${flightHasBusinessClass ? 'Business Class' : 'Front Row Extra Legroom (+₹350)'}`}
                        >
                          {isSelected ? (parseInt(assignedIdx, 10) + 1) : isLocked ? <Lock size={12} style={{ opacity: 0.4 }} /> : letter}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="galley-divider">
            <span>GALLEY & RESTROOMS</span>
          </div>

          {/* Economy Class Section */}
          <div className={`cabin-section ${flightHasBusinessClass && isClassBusiness ? 'cabin-disabled-section' : ''}`}>
            <div className="cabin-section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {!flightHasBusinessClass ? (
                <span style={{ color: '#a5b4fc' }}>Main Cabin (Rows 4–12)</span>
              ) : !isClassBusiness ? (
                <span style={{ color: '#a5b4fc' }}>Main Cabin / Economy (Rows 4–12) — Your Cabin</span>
              ) : (
                <>
                  <Lock size={14} style={{ color: '#f59e0b' }} />
                  <span style={{ color: '#f59e0b', fontWeight: 600 }}>Economy Cabin (Rows 4–12) — Locked for Business Bookings</span>
                </>
              )}
            </div>

            <div className="seat-grid economy-grid">
              {economyRows.map(row => {
                const isExitRow = row === 7;
                return (
                  <div key={row} className={`seat-row ${isExitRow ? 'exit-row' : ''}`}>
                    <span className="row-number">{row}</span>
                    <div className="seat-group">
                      {['A', 'B', 'C'].map(letter => {
                        const id = `${row}${letter}`;
                        const isOccupied = currentOccupied.has(id);
                        const assignedIdx = Object.keys(currentSeats).find(idx => currentSeats[idx]?.id === id);
                        const isSelected = assignedIdx !== undefined;
                        const isExtra = !isClassBusiness && (isExitRow || row === 4);
                        const isLocked = flightHasBusinessClass && isClassBusiness;

                        return (
                          <button
                            key={id}
                            type="button"
                            className={`seat economy-seat ${isOccupied ? 'occupied' : isSelected ? 'selected' : isLocked ? 'seat-cabin-locked' : isExtra ? 'extra-legroom' : 'available'}`}
                            onClick={() => handleSeatClick(id, row, letter)}
                            disabled={isOccupied}
                            title={isLocked ? `Seat ${id} - Locked (You booked Business Class)` : `Seat ${id} ${isExtra ? '(Extra Legroom +₹350)' : '(Standard)'}`}
                          >
                            {isSelected ? (parseInt(assignedIdx, 10) + 1) : isLocked ? <Lock size={11} style={{ opacity: 0.35 }} /> : letter}
                          </button>
                        );
                      })}
                    </div>

                    <div className="aisle">AISLE</div>

                    <div className="seat-group">
                      {['D', 'E', 'F'].map(letter => {
                        const id = `${row}${letter}`;
                        const isOccupied = currentOccupied.has(id);
                        const assignedIdx = Object.keys(currentSeats).find(idx => currentSeats[idx]?.id === id);
                        const isSelected = assignedIdx !== undefined;
                        const isExtra = !isClassBusiness && (isExitRow || row === 4);
                        const isLocked = flightHasBusinessClass && isClassBusiness;

                        return (
                          <button
                            key={id}
                            type="button"
                            className={`seat economy-seat ${isOccupied ? 'occupied' : isSelected ? 'selected' : isLocked ? 'seat-cabin-locked' : isExtra ? 'extra-legroom' : 'available'}`}
                            onClick={() => handleSeatClick(id, row, letter)}
                            disabled={isOccupied}
                            title={isLocked ? `Seat ${id} - Locked (You booked Business Class)` : `Seat ${id} ${isExtra ? '(Extra Legroom +₹350)' : '(Standard)'}`}
                          >
                            {isSelected ? (parseInt(assignedIdx, 10) + 1) : isLocked ? <Lock size={11} style={{ opacity: 0.35 }} /> : letter}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Seat Summary & Passenger Assignment Sidebar */}
        <div className="seat-sidebar glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={20} className="logo-icon" />
            Passenger Seats ({activeLeg === 'outbound' ? 'Outbound' : 'Return'})
          </h3>

          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
            Click a traveler below to assign their {activeLeg === 'outbound' ? 'outbound' : 'return'} seat:
          </p>

          <div className="passenger-seat-list">
            {passengerList.map((passenger, idx) => {
              const seat = currentSeats[idx];
              const isActive = activePassengerIndex === idx;

              return (
                <div
                  key={passenger.id || idx}
                  className={`passenger-seat-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActivePassengerIndex(idx)}
                >
                  <div className="passenger-badge">{idx + 1}</div>
                  <div className="passenger-info">
                    <div className="passenger-name">
                      {passenger.firstName} {passenger.lastName}
                    </div>
                    <div className="seat-badge-text">
                      {seat ? (
                        <span style={{ color: '#4ade80', fontWeight: 600 }}>
                          Seat {seat.id} {seat.price > 0 ? `(+₹${seat.price})` : '(Free)'}
                        </span>
                      ) : (
                        <span style={{ color: '#f59e0b' }}>
                          Select {isClassBusiness ? 'Business' : 'Economy'} Seat
                        </span>
                      )}
                    </div>
                  </div>
                  {seat && <Check size={18} style={{ color: '#4ade80' }} />}
                </div>
              );
            })}
          </div>

          {/* Pricing summary */}
          <div className="seat-fee-summary" style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              <span style={{ color: '#94a3b8' }}>Booked Cabin:</span>
              <strong style={{ color: isClassBusiness ? '#fbbf24' : '#e2e8f0' }}>{selectedClass?.name}</strong>
            </div>

            {isRoundTrip && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                  <span style={{ color: '#94a3b8' }}>Outbound Seat Fee:</span>
                  <span style={{ color: outboundFee > 0 ? '#38bdf8' : '#4ade80' }}>
                    {outboundFee > 0 ? `+₹${outboundFee.toLocaleString()}` : 'Free'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                  <span style={{ color: '#94a3b8' }}>Return Seat Fee:</span>
                  <span style={{ color: returnFee > 0 ? '#38bdf8' : '#4ade80' }}>
                    {returnFee > 0 ? `+₹${returnFee.toLocaleString()}` : 'Free'}
                  </span>
                </div>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', marginBottom: '0.5rem', borderTop: isRoundTrip ? '1px dashed rgba(255,255,255,0.08)' : 'none', paddingTop: isRoundTrip ? '0.4rem' : '0' }}>
              <span style={{ color: '#94a3b8' }}>Total Seat Fees:</span>
              <strong style={{ color: totalSeatFee > 0 ? '#38bdf8' : '#4ade80' }}>
                {totalSeatFee > 0 ? `+₹${totalSeatFee.toLocaleString()}` : 'Complimentary'}
              </strong>
            </div>

            {((!outboundAllAssigned && activeLeg === 'outbound') || (!returnAllAssigned && activeLeg === 'return')) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.75rem' }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                <span>Unselected seats will be auto-assigned in your cabin.</span>
              </div>
            )}
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button type="button" className="btn-primary" onClick={handleProceed} style={{ width: '100%' }}>
              Confirm Seats & Continue
              <ArrowRight size={18} />
            </button>
            <button type="button" className="btn-secondary" onClick={onBack} style={{ width: '100%', justifyContent: 'center' }}>
              <ArrowLeft size={18} />
              Back to Passenger Info
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatSelection;
