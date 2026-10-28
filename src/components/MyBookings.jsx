import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { Loader2, Calendar, MapPin, Ticket, Printer, Armchair } from 'lucide-react';
import BoardingPassModal from './BoardingPassModal';

const MyBookings = ({ user }) => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBookingForPass, setSelectedBookingForPass] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const q = query(
          collection(db, "bookings"), 
          where("userId", "==", user?.uid || null)
        );
        const querySnapshot = await getDocs(q);
        const fetchedBookings = [];
        querySnapshot.forEach((doc) => {
          fetchedBookings.push({ id: doc.id, ...doc.data() });
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

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0' }}>
        <Loader2 size={40} className="animate-spin" style={{ color: 'var(--primary-color)', marginBottom: '1rem' }} />
        <p style={{ color: 'var(--text-light)' }}>Loading your bookings...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ padding: '2rem 0' }}>
      <h2 style={{ marginBottom: '2rem', fontSize: '2rem' }} className="gradient-text">My Bookings</h2>
      
      {bookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-glass)', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
          <h3>No bookings found</h3>
          <p style={{ color: 'var(--text-light)' }}>Looks like you haven't booked any flights yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {bookings.map((booking) => {
            const passengerCount = booking.searchData?.passengers || booking.passengers?.list?.length || 1;
            const totalPaid = booking.payment?.totalAmountPaid || ((booking.selectedClass?.price || 0) * passengerCount + (booking.seatFee || 0));
            const seatList = Object.values(booking.selectedSeats || {}).map(s => s.id).join(', ');

            return (
              <div key={booking.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.2rem' }}>
                    <Ticket size={20} style={{ color: 'var(--primary-color)' }} />
                    Booking ID: {booking.id.slice(0, 8).toUpperCase()}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
                      {booking.createdAt ? (booking.createdAt.seconds ? new Date(booking.createdAt.seconds * 1000).toLocaleDateString() : 'Confirmed') : 'Confirmed'}
                    </span>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setSelectedBookingForPass(booking)}
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Printer size={15} />
                      Boarding Pass
                    </button>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <h4 style={{ color: 'var(--text-light)', marginBottom: '0.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <MapPin size={14} /> Route
                    </h4>
                    <p style={{ fontWeight: '600' }}>
                      {booking.flight?.origin} → {booking.flight?.destination}
                    </p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                      {booking.flight?.airline} - {booking.flight?.flightNumber}
                    </p>
                  </div>
                  
                  <div>
                    <h4 style={{ color: 'var(--text-light)', marginBottom: '0.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Calendar size={14} /> Flight Details
                    </h4>
                    <p style={{ fontWeight: '600' }}>{booking.searchData?.date}</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                      {booking.flight?.departureTime} - {booking.flight?.arrivalTime} ({booking.flight?.duration})
                    </p>
                  </div>
                  
                  <div>
                    <h4 style={{ color: 'var(--text-light)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Passengers & Class</h4>
                    <p style={{ fontWeight: '600' }}>{passengerCount} Passenger(s)</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                      Class: {booking.selectedClass?.name}
                    </p>
                    {seatList && (
                      <p style={{ fontSize: '0.8rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '2px' }}>
                        <Armchair size={12} /> Seats: {seatList}
                      </p>
                    )}
                  </div>

                  <div>
                    <h4 style={{ color: 'var(--text-light)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Total Amount Paid</h4>
                    <p style={{ fontWeight: '700', color: 'var(--accent-color)', fontSize: '1.2rem' }}>
                      ₹{totalPaid.toLocaleString()}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                      {booking.searchData?.tripType === 'roundtrip' ? 'Round Trip' : 'One Way'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
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
