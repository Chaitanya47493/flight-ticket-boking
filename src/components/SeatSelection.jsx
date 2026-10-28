import React, { useState } from 'react';
import { Plane, ArrowLeft, ArrowRight, Check, Sparkles, User, AlertCircle, Lock, Crown, Shield } from 'lucide-react';

const SEAT_LETTERS_BUSINESS = ['A', 'C', 'D', 'F'];
const SEAT_LETTERS_ECONOMY = ['A', 'B', 'C', 'D', 'E', 'F'];

// Pre-occupied realistic seats simulation
const DEFAULT_OCCUPIED = new Set([
  '1A', '2D', '4B', '4C', '5E', '6A', '6B', '7C', '8D', '8E', '9F', '10A', '11C', '12B'
]);

const SeatSelection = ({ selectedFlight, selectedClass, passengers, onBack, onConfirmSeats }) => {
  const passengerList = passengers?.list || [
    { id: 1, firstName: passengers?.firstName || 'Passenger', lastName: passengers?.lastName || '1' }
  ];

  const [activePassengerIndex, setActivePassengerIndex] = useState(0);
  const [cabinWarning, setCabinWarning] = useState('');

  // Map of passengerIndex -> seatId (e.g. 0 -> { id: '4A', ... }, 1 -> { id: '4B', ... })
  const [selectedSeats, setSelectedSeats] = useState({});

  const classNameLower = (selectedClass?.name || '').toLowerCase();
  const isClassBusiness = classNameLower.includes('business') || classNameLower.includes('first') || classNameLower.includes('club') || classNameLower.includes('suite');

  // Check if this flight actually has a Business Class cabin
  const flightHasBusinessClass = selectedFlight?.classes?.some(c => {
    const name = (c.name || '').toLowerCase();
    return name.includes('business') || name.includes('first') || name.includes('club') || name.includes('suite');
  });

  // Business / Front rows: 1 to 3
  // Economy / Main cabin: rows 4 to 12
  const businessRows = [1, 2, 3];
  const economyRows = [4, 5, 6, 7, 8, 9, 10, 11, 12];

  const getSeatPrice = (row, letter) => {
    // In Business class, all seats are complimentary
    if (isClassBusiness) return 0;
    // On All-Economy flights, rows 1-3 are front-row extra legroom
    if (!flightHasBusinessClass && row <= 3) return 350;
    // Row 4 is front row, Row 7 is emergency exit (extra legroom)
    if (row === 4 || row === 7) return 350;
    // Window or Aisle in front rows
    if ((letter === 'A' || letter === 'F' || letter === 'C' || letter === 'D') && row <= 6) return 150;
    return 0; // standard complimentary seat
  };

  const handleSeatClick = (seatId, row, letter) => {
    // Strictly Enforce Cabin Class restriction ONLY IF the aircraft has a Business Class cabin
    if (flightHasBusinessClass) {
      if (isClassBusiness && row > 3) {
        setCabinWarning(`🔒 Seat ${seatId} is Locked: You booked Business Class (${selectedClass?.name}). You can ONLY select seats from Rows 1–3. Economy seats (Rows 4–12) cannot be booked.`);
        return;
      }
      if (!isClassBusiness && row <= 3) {
        setCabinWarning(`🔒 Seat ${seatId} is Locked: You booked Economy Class. Rows 1–3 are exclusively for Business Class passengers. Please select your seats from Rows 4–12.`);
        return;
      }
    }

    if (DEFAULT_OCCUPIED.has(seatId)) {
      setCabinWarning(`Seat ${seatId} is already occupied by another passenger. Please choose an available seat.`);
      return;
    }

    setCabinWarning('');

    // Check if another passenger in this group already has this seat
    const existingIndex = Object.keys(selectedSeats).find(idx => selectedSeats[idx]?.id === seatId);

    const price = getSeatPrice(row, letter);
    const newSeatObj = { id: seatId, row, letter, price };

    if (existingIndex !== undefined) {
      if (parseInt(existingIndex, 10) === activePassengerIndex) {
        // Deselect if clicking own seat
        const updated = { ...selectedSeats };
        delete updated[activePassengerIndex];
        setSelectedSeats(updated);
        return;
      } else {
        setCabinWarning(`Seat ${seatId} is already assigned to Passenger ${parseInt(existingIndex, 10) + 1}.`);
        return;
      }
    }

    // Assign seat to active passenger
    const updated = {
      ...selectedSeats,
      [activePassengerIndex]: newSeatObj
    };
    setSelectedSeats(updated);

    // Auto-advance to next unassigned passenger if any
    const nextUnassigned = passengerList.findIndex((_, idx) => idx !== activePassengerIndex && !updated[idx]);
    if (nextUnassigned !== -1) {
      setActivePassengerIndex(nextUnassigned);
    }
  };

  const getAutoAssignedSeats = (current = selectedSeats) => {
    const available = [];
    let rows;
    let letters;

    if (!flightHasBusinessClass) {
      // All-Economy plane: any row 1-12 is bookable
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
        if (!DEFAULT_OCCUPIED.has(id)) {
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
    const newSeats = getAutoAssignedSeats({});
    setSelectedSeats(newSeats);
    setCabinWarning('');
  };

  // Calculate total extra seat fees
  const totalSeatFee = Object.values(selectedSeats).reduce((sum, s) => sum + (s?.price || 0), 0);
  const allAssigned = passengerList.every((_, idx) => !!selectedSeats[idx]);

  const handleProceed = () => {
    let finalSeats = { ...selectedSeats };
    if (!allAssigned) {
      finalSeats = getAutoAssignedSeats(selectedSeats);
      setSelectedSeats(finalSeats);
    }
    const finalFee = Object.values(finalSeats).reduce((sum, s) => sum + (s?.price || 0), 0);
    onConfirmSeats(finalSeats, finalFee);
  };

  return (
    <div className="seat-selection-container animate-fade-in">
      <div className="results-header" style={{ marginBottom: '1.25rem' }}>
        <div className="results-info">
          <h2>Select Your Seats</h2>
          <p>
            {selectedFlight?.airline} {selectedFlight?.flightNumber} &nbsp;•&nbsp;
            {selectedFlight?.origin} → {selectedFlight?.destination} &nbsp;•&nbsp;
            <span style={{
              background: isClassBusiness ? 'linear-gradient(135deg, rgba(234,179,8,0.2), rgba(245,158,11,0.2))' : 'rgba(99,102,241,0.2)',
              color: isClassBusiness ? '#fbbf24' : '#a5b4fc',
              padding: '2px 8px',
              borderRadius: '4px',
              fontWeight: 700,
              marginLeft: '4px'
            }}>
              {selectedClass?.name} Cabin
            </span>
          </p>
        </div>
        <button type="button" className="btn-secondary" onClick={handleAutoAssign} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={16} style={{ color: '#a5b4fc' }} />
          Auto-Assign {selectedClass?.name} Seats
        </button>
      </div>

      {/* Cabin Guidance Banner */}
      <div style={{
        background: !flightHasBusinessClass ? 'rgba(56,189,248,0.08)' : isClassBusiness ? 'rgba(234,179,8,0.08)' : 'rgba(99,102,241,0.08)',
        border: !flightHasBusinessClass ? '1px solid rgba(56,189,248,0.25)' : isClassBusiness ? '1px solid rgba(234,179,8,0.25)' : '1px solid rgba(99,102,241,0.25)',
        borderRadius: '12px',
        padding: '0.85rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontSize: '0.875rem'
      }}>
        {!flightHasBusinessClass ? (
          <>
            <Sparkles size={20} style={{ color: '#38bdf8', flexShrink: 0 }} />
            <span style={{ color: '#bae6fd' }}>
              <strong>All-Economy Aircraft:</strong> This {selectedFlight?.airline} flight operates a single-class cabin. All seats across Rows 1–12 are available.
            </span>
          </>
        ) : isClassBusiness ? (
          <>
            <Crown size={20} style={{ color: '#fbbf24', flexShrink: 0 }} />
            <span style={{ color: '#fef08a' }}>
              <strong>Business Class Privilege:</strong> You have exclusive access to Rows 1–3 with extra-wide seating. Main Cabin seats are locked for your comfort.
            </span>
          </>
        ) : (
          <>
            <Shield size={20} style={{ color: '#818cf8', flexShrink: 0 }} />
            <span style={{ color: '#cbd5e1' }}>
              <strong>Economy Booking:</strong> Please choose your seats from Main Cabin (Rows 4–12). Rows 1–3 are reserved for Business Class.
            </span>
          </>
        )}
      </div>

      {/* Inline Cabin Warning Alert */}
      {cabinWarning && (
        <div style={{
          background: 'rgba(239,68,68,0.12)',
          border: '1px solid rgba(239,68,68,0.3)',
          color: '#fca5a5',
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          fontSize: '0.85rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
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
            <span className="nose-label">{selectedFlight?.airline || 'Aero Space'} • Boeing 737 / Airbus A320</span>
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
                      const isOccupied = DEFAULT_OCCUPIED.has(id);
                      const assignedIdx = Object.keys(selectedSeats).find(idx => selectedSeats[idx]?.id === id);
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
                      const isOccupied = DEFAULT_OCCUPIED.has(id);
                      const assignedIdx = Object.keys(selectedSeats).find(idx => selectedSeats[idx]?.id === id);
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
                        const isOccupied = DEFAULT_OCCUPIED.has(id);
                        const assignedIdx = Object.keys(selectedSeats).find(idx => selectedSeats[idx]?.id === id);
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
                        const isOccupied = DEFAULT_OCCUPIED.has(id);
                        const assignedIdx = Object.keys(selectedSeats).find(idx => selectedSeats[idx]?.id === id);
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
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={20} className="logo-icon" />
            Passenger Seats
          </h3>

          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
            Click a traveler to select or change their seat:
          </p>

          <div className="passenger-seat-list">
            {passengerList.map((passenger, idx) => {
              const seat = selectedSeats[idx];
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
              <span style={{ color: '#94a3b8' }}>Booked Class:</span>
              <strong style={{ color: isClassBusiness ? '#fbbf24' : '#e2e8f0' }}>{selectedClass?.name}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              <span style={{ color: '#94a3b8' }}>Allowed Rows:</span>
              <strong style={{ color: '#a5b4fc' }}>
                {flightHasBusinessClass ? (isClassBusiness ? 'Rows 1–3 (Business)' : 'Rows 4–12 (Economy)') : 'Rows 1–12 (All-Economy)'}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              <span style={{ color: '#94a3b8' }}>Seat Fees:</span>
              <strong style={{ color: totalSeatFee > 0 ? '#38bdf8' : '#4ade80' }}>
                {totalSeatFee > 0 ? `+₹${totalSeatFee.toLocaleString()}` : 'Complimentary'}
              </strong>
            </div>

            {!allAssigned && (
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
