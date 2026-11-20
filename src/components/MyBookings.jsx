import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, where, doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { Loader2, Calendar, MapPin, Ticket, Printer, Armchair, Search, X, AlertTriangle, AlertCircle, CheckCircle2, XCircle, Radar } from 'lucide-react';
import BoardingPassModal from './BoardingPassModal';

const MyBookings = ({ user, onTrackFlight, initialPnr = '' }) => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialPnr);
  const [prevInitialPnr, setPrevInitialPnr] = useState(initialPnr);
  const [selectedBookingForPass, setSelectedBookingForPass] = useState(null);

  // Sync initial PNR query if navigated from Home Manage Trip
  if (initialPnr !== prevInitialPnr) {
    setPrevInitialPnr(initialPnr);
    if (initialPnr) {
      setSearchQuery(initialPnr);
    }
  }

  // Cancellation Modal state
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const q = query(
          collection(db, "bookings"), 
          where("userId", "==", user?.uid || null)
        );
        const querySnapshot = await getDocs(q);
        const fetchedBookings = [];
        querySnapshot.forEach((docSnap) => {
          fetchedBookings.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        fetchedBookings.sort((a, b) => {
          const timeA = a.createdAt ? (a.createdAt.seconds || 0) : 0;
          const timeB = b.createdAt ? (b.createdAt.seconds || 0) : 0;
          return timeB - timeA;
        });
        
        setBookings(fetchedBookings);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  // Search Filter: matches 6-character PNR, full ID, cities, airlines, or passengers
  const filteredBookings = bookings.filter(b => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    const pnr = b.id.substring(0, 6).toLowerCase();
    const origin = (b.flight?.origin || '').toLowerCase();
    const dest = (b.flight?.destination || '').toLowerCase();
    const airline = (b.flight?.airline || '').toLowerCase();
    const flightNumber = (b.flight?.flightNumber || '').toLowerCase();
    const passengers = (b.passengers?.list || []).map(p => `${p.firstName} ${p.lastName}`.toLowerCase()).join(' ');
    const singlePassenger = `${b.passengers?.firstName || ''} ${b.passengers?.lastName || ''}`.toLowerCase();

    return pnr.includes(q) ||
           origin.includes(q) ||
           dest.includes(q) ||
           airline.includes(q) ||
           flightNumber.includes(q) ||
           passengers.includes(q) ||
           singlePassenger.includes(q);
  });

  // Handle Cancellation Confirmation
  const handleConfirmCancellation = async () => {
    if (!bookingToCancel) return;
    setIsCancelling(true);

    try {
      const passengerCount = bookingToCancel.searchData?.passengers || bookingToCancel.passengers?.list?.length || 1;
      const totalPaid = bookingToCancel.payment?.totalAmountPaid || ((bookingToCancel.selectedClass?.price || 0) * passengerCount + (bookingToCancel.seatFee || 0));
      const refundAmount = Math.round(totalPaid * 0.8);

      // 1. Update Firestore booking document to CANCELLED
      await updateDoc(doc(db, 'bookings', bookingToCancel.id), {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        refundAmount
      });

      // 2. Remove booked seats from seatInventory so they become available to other travelers
      const isRoundTrip = bookingToCancel.searchData?.tripType === 'roundtrip' && !!bookingToCancel.searchData?.returnDate;
      const flightNum = bookingToCancel.flight?.flightNumber || 'FL100';
      const outboundDate = bookingToCancel.searchData?.date;

      if (isRoundTrip && bookingToCancel.selectedSeats?.outbound && bookingToCancel.selectedSeats?.return) {
        const outboundSeatIds = Object.values(bookingToCancel.selectedSeats.outbound).map(s => s.id).filter(Boolean);
        const returnSeatIds = Object.values(bookingToCancel.selectedSeats.return).map(s => s.id).filter(Boolean);

        const outboundDocId = `${flightNum}_${outboundDate}`;
        const returnDocId = `${flightNum}-RT_${bookingToCancel.searchData.returnDate}`;

        if (outboundSeatIds.length > 0) {
          await updateDoc(doc(db, 'seatInventory', outboundDocId), {
            occupiedSeats: arrayRemove(...outboundSeatIds)
          }).catch(() => {});
        }
        if (returnSeatIds.length > 0) {
          await updateDoc(doc(db, 'seatInventory', returnDocId), {
            occupiedSeats: arrayRemove(...returnSeatIds)
          }).catch(() => {});
        }
      } else {
        const flatSeats = bookingToCancel.selectedSeats?.outbound || bookingToCancel.selectedSeats || {};
        const bookedSeats = Object.values(flatSeats).map(s => s.id).filter(Boolean);
        const docId = `${flightNum}_${outboundDate}`;
        if (bookedSeats.length > 0) {
          await updateDoc(doc(db, 'seatInventory', docId), {
            occupiedSeats: arrayRemove(...bookedSeats)
          }).catch(() => {});
        }
      }

      // 3. Update local state
      setBookings(prev => prev.map(b => b.id === bookingToCancel.id ? {
        ...b,
        status: 'CANCELLED',
        cancelledAt: { seconds: Math.floor(Date.now() / 1000) },
        refundAmount
      } : b));

      setBookingToCancel(null);
    } catch (err) {
      console.error("Cancellation error:", err);
      alert("Failed to cancel booking. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0' }}>
        <Loader2 size={40} className="animate-spin" style={{ color: 'var(--primary-color)', marginBottom: '1rem' }} />
        <p style={{ color: 'var(--text-light)' }}>Loading your bookings...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ padding: '1.5rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>My Bookings</h2>

        {/* PNR & City Search Bar */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by 6-char PNR or city..."
            style={{
              width: '100%',
              padding: '8px 36px 8px 36px',
              background: 'var(--surface-color)',
              border: '1px solid var(--surface-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {bookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-glass)', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
          <h3>No bookings found</h3>
          <p style={{ color: 'var(--text-light)' }}>Looks like you haven't booked any flights yet.</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-glass)', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
          <h3>No matching bookings</h3>
          <p style={{ color: 'var(--text-light)' }}>No bookings match "{searchQuery}". Check the PNR or city name.</p>
          <button type="button" className="btn-secondary" onClick={() => setSearchQuery('')} style={{ marginTop: '1rem' }}>
            Clear Search
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {filteredBookings.map((booking) => {
            const passengerCount = booking.searchData?.passengers || booking.passengers?.list?.length || 1;
            const totalPaid = booking.payment?.totalAmountPaid || ((booking.selectedClass?.price || 0) * passengerCount + (booking.seatFee || 0));
            
            // Format seat display (support round-trip and one-way)
            const seatList = (booking.selectedSeats?.outbound && booking.selectedSeats?.return)
              ? `Out: ${Object.values(booking.selectedSeats.outbound).map(s => s.id).join(', ')} | Ret: ${Object.values(booking.selectedSeats.return).map(s => s.id).join(', ')}`
              : Object.values(booking.selectedSeats?.outbound || booking.selectedSeats || {}).map(s => s.id).join(', ');

            const pnrCode = booking.id.slice(0, 6).toUpperCase();
            const isCancelled = booking.status === 'CANCELLED';

            return (
              <div
                key={booking.id}
                className="glass-panel"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  borderColor: isCancelled ? 'rgba(239,68,68,0.25)' : 'var(--border-color)',
                  opacity: isCancelled ? 0.85 : 1
                }}
              >
                {/* Header row with PNR, Status Badge, and Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.15rem' }}>
                      <Ticket size={20} style={{ color: 'var(--primary-color)' }} />
                      PNR: <span style={{ color: 'var(--accent-color)', letterSpacing: '1px' }}>{pnrCode}</span>
                    </div>

                    {/* Status Badge */}
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      letterSpacing: '0.5px',
                      background: isCancelled ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                      color: isCancelled ? '#ef4444' : '#22c55e',
                      border: `1px solid ${isCancelled ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`
                    }}>
                      {isCancelled ? <XCircle size={13} /> : <CheckCircle2 size={13} />}
                      {isCancelled ? 'CANCELLED' : 'CONFIRMED'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>
                      {booking.createdAt ? (booking.createdAt.seconds ? new Date(booking.createdAt.seconds * 1000).toLocaleDateString() : 'Confirmed') : 'Confirmed'}
                    </span>

                    {/* Boarding Pass button */}
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setSelectedBookingForPass(booking)}
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Printer size={15} />
                      Boarding Pass
                    </button>

                    {/* Track in AeroRadar Button */}
                    <button
                      type="button"
                      onClick={() => onTrackFlight && onTrackFlight(booking)}
                      style={{
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: 'var(--accent-subtle)',
                        color: 'var(--accent-color)',
                        border: '1px solid var(--accent-color)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      <Radar size={15} style={{ color: 'var(--accent-color)' }} />
                      Track in AeroRadar
                    </button>

                    {/* Cancel Booking Button */}
                    {!isCancelled ? (
                      <button
                        type="button"
                        onClick={() => setBookingToCancel(booking)}
                        style={{
                          padding: '0.4rem 0.85rem',
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          background: 'rgba(239, 68, 68, 0.12)',
                          color: '#f87171',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        <XCircle size={15} />
                        Cancel
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#f87171', fontStyle: 'italic' }}>
                        Refunded: ₹{(booking.refundAmount || Math.round(totalPaid * 0.8)).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Flight Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <h4 style={{ color: 'var(--text-light)', marginBottom: '0.5rem', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <MapPin size={14} /> Route
                    </h4>
                    <p style={{ fontWeight: '600', margin: 0 }}>
                      {booking.flight?.origin} → {booking.flight?.destination}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', margin: '2px 0 0 0' }}>
                      {booking.flight?.airline} • {booking.flight?.flightNumber}
                    </p>
                  </div>
                  
                  <div>
                    <h4 style={{ color: 'var(--text-light)', marginBottom: '0.5rem', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Calendar size={14} /> Flight Details
                    </h4>
                    <p style={{ fontWeight: '600', margin: 0 }}>
                      {booking.searchData?.date}
                      {booking.searchData?.returnDate ? ` (Ret: ${booking.searchData.returnDate})` : ''}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', margin: '2px 0 0 0' }}>
                      {booking.flight?.departureTime} - {booking.flight?.arrivalTime} ({booking.flight?.duration})
                    </p>
                  </div>
                  
                  <div>
                    <h4 style={{ color: 'var(--text-light)', marginBottom: '0.5rem', fontSize: '0.88rem' }}>Passengers & Class</h4>
                    <p style={{ fontWeight: '600', margin: 0 }}>{passengerCount} Passenger(s)</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', margin: '2px 0 0 0' }}>
                      Class: {booking.selectedClass?.name}
                    </p>
                    {seatList && (
                      <p style={{ fontSize: '0.8rem', color: isCancelled ? '#94a3b8' : '#4ade80', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '3px' }}>
                        <Armchair size={12} /> {seatList}
                      </p>
                    )}
                  </div>

                  <div>
                    <h4 style={{ color: 'var(--text-light)', marginBottom: '0.5rem', fontSize: '0.88rem' }}>Total Paid</h4>
                    <p style={{ fontWeight: '700', color: isCancelled ? '#94a3b8' : 'var(--accent-color)', fontSize: '1.25rem', margin: 0, textDecoration: isCancelled ? 'line-through' : 'none' }}>
                      ₹{totalPaid.toLocaleString()}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', margin: '2px 0 0 0' }}>
                      {booking.searchData?.tripType === 'roundtrip' ? 'Round Trip' : 'One Way'}
                      {booking.fareBreakdown?.promoCode ? ` • Promo: ${booking.fareBreakdown.promoCode}` : ''}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CANCELLATION CONFIRMATION MODAL ───────────────────────── */}
      {bookingToCancel && (
        <div className="boarding-pass-modal-overlay animate-fade-in" onClick={() => !isCancelling && setBookingToCancel(null)}>
          <div
            className="glass-panel"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '480px',
              width: '90%',
              padding: '2rem',
              borderRadius: '16px',
              background: '#0f172a',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#f87171' }}>
              <AlertTriangle size={28} />
              <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#fff' }}>Cancel Flight Booking?</h3>
            </div>

            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Are you sure you want to cancel booking <strong style={{ color: '#fff' }}>{bookingToCancel.id.slice(0, 6).toUpperCase()}</strong> ({bookingToCancel.flight?.origin} → {bookingToCancel.flight?.destination})?
            </p>

            {/* Refund Calculation Box */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              padding: '1rem',
              margin: '1.25rem 0',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              fontSize: '0.88rem'
            }}>
              {(() => {
                const count = bookingToCancel.searchData?.passengers || bookingToCancel.passengers?.list?.length || 1;
                const paid = bookingToCancel.payment?.totalAmountPaid || ((bookingToCancel.selectedClass?.price || 0) * count + (bookingToCancel.seatFee || 0));
                const refund = Math.round(paid * 0.8);
                const cancellationFee = paid - refund;

                return (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Total Amount Paid:</span>
                      <strong>₹{paid.toLocaleString()}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f87171' }}>
                      <span>Cancellation Fee (20%):</span>
                      <span>-₹{cancellationFee.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.5rem', marginTop: '0.2rem', color: '#4ade80', fontWeight: 700, fontSize: '1.05rem' }}>
                      <span>Estimated Refund (80%):</span>
                      <span>₹{refund.toLocaleString()}</span>
                    </div>
                  </>
                );
              })()}
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--warning-color)', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              <span>Your assigned seats will be released immediately into the real-time flight inventory for other travelers.</span>
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setBookingToCancel(null)}
                disabled={isCancelling}
                style={{ padding: '0.6rem 1.25rem' }}
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleConfirmCancellation}
                disabled={isCancelling}
                style={{
                  padding: '0.6rem 1.25rem',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: isCancelling ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {isCancelling ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                {isCancelling ? 'Processing...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Boarding Pass Modal */}
      {selectedBookingForPass && (
        <BoardingPassModal
          isOpen={!!selectedBookingForPass}
          onClose={() => setSelectedBookingForPass(null)}
          bookingData={selectedBookingForPass}
          bookingId={selectedBookingForPass.id}
        />
      )}
    </div>
  );
};

export default MyBookings;
