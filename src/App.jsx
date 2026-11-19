import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SearchForm from './components/SearchForm';
import FlightResults from './components/FlightResults';
import PassengerForm from './components/PassengerForm';
import SeatSelection from './components/SeatSelection';
import PaymentForm from './components/PaymentForm';
import BookingConfirmation from './components/BookingConfirmation';
import MyBookings from './components/MyBookings';
import LoginPage from './components/LoginPage';
import { Search, Plane, User, Armchair, CreditCard, CheckCircle } from 'lucide-react';
import { db, auth } from './firebase';
import { collection, addDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import emailjs from '@emailjs/browser';
import './App.css';

// Initialize EmailJS with public key
emailjs.init("twDo3sgI5ca605MeZ");

function App() {
  const [user, setUser] = useState(undefined); // undefined = still loading

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const [showMyBookings, setShowMyBookings] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [searchData, setSearchData] = useState(null);
  const [bookingData, setBookingData] = useState({
    flight: null,
    selectedClass: null,
    passengers: null,
    selectedSeats: null,
    seatFee: 0,
    payment: null,
  });

  const handleSearch = (data) => {
    setSearchData(data);
    setCurrentStep(2);
  };

  const handleSelectFlight = (flight, selectedClass) => {
    setBookingData(prev => ({ ...prev, flight, selectedClass }));
    setCurrentStep(3);
  };

  const handlePassengerSubmit = (passengersData) => {
    setBookingData(prev => ({
      ...prev,
      passengers: passengersData,
      searchData,
      createdAt: new Date()
    }));
    setCurrentStep(4);
  };

  const handleSeatConfirm = (selectedSeats, seatFee) => {
    setBookingData(prev => ({
      ...prev,
      selectedSeats,
      seatFee: seatFee || 0
    }));
    setCurrentStep(5);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState('');

  const handlePaymentSubmit = async (paymentData) => {
    setIsSubmitting(true);
    const passengerCount = searchData?.passengers || bookingData.passengers?.list?.length || 1;
    const basePrice = bookingData.selectedClass?.price || 0;
    const calculatedTotal = (basePrice * passengerCount) + (bookingData.seatFee || 0);

    const finalBookingData = {
      ...bookingData,
      payment: paymentData,
      totalAmountPaid: paymentData.totalAmountPaid || calculatedTotal,
      userId: user.uid,
      createdAt: new Date()
    };
    setBookingData(finalBookingData);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const docRef = await addDoc(collection(db, 'bookings'), finalBookingData);
      setBookingId(docRef.id);

      // Extract seat tags & passenger names
      const assignedSeatsStr = Object.values(finalBookingData.selectedSeats || {}).map(s => s.id).join(', ') || 'Auto-Assigned';
      const passengerNamesStr = finalBookingData.passengers?.list 
        ? finalBookingData.passengers.list.map(p => `${p.firstName} ${p.lastName}`).join(', ')
        : `${finalBookingData.passengers?.firstName || ''} ${finalBookingData.passengers?.lastName || ''}`;

      const companyLogo = "https://img.icons8.com/nolan/64/airplane-take-off.png";
      
      const htmlContent = `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
          <div style="background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px;">Aero Space <span style="color: #6366f1;">Bookings</span></h1>
            <p style="color: #a5b4fc; margin-top: 5px; font-size: 14px;">Your Premium Travel Experience</p>
          </div>
          
          <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #1e293b; margin: 0 0 10px 0;">Booking Confirmed! ✈️</h2>
              <p style="color: #64748b; margin: 0; font-size: 16px;">Hi ${finalBookingData.passengers.firstName}, you're all set for your trip.</p>
            </div>

            <div style="background: #f8fafc; border-radius: 12px; padding: 25px; border: 1px dashed #cbd5e1; margin-bottom: 30px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <img src="${finalBookingData.flight.airlineLogo}" alt="${finalBookingData.flight.airline}" style="height: 40px; object-fit: contain;" />
                <div style="text-align: right;">
                  <span style="display: block; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600;">Booking Ref</span>
                  <strong style="color: #6366f1; font-size: 20px; letter-spacing: 2px;">${docRef.id.substring(0, 6).toUpperCase()}</strong>
                </div>
              </div>

              <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <tr>
                  <td style="padding-bottom: 15px; width: 50%;">
                    <span style="display: block; color: #64748b; font-size: 12px; text-transform: uppercase;">Flight</span>
                    <strong style="color: #0f172a; font-size: 16px;">${finalBookingData.flight.airline} ${finalBookingData.flight.flightNumber}</strong>
                  </td>
                  <td style="padding-bottom: 15px; width: 50%;">
                    <span style="display: block; color: #64748b; font-size: 12px; text-transform: uppercase;">Class & Seats</span>
                    <strong style="color: #0f172a; font-size: 16px;">${finalBookingData.selectedClass.name} (Seats: ${assignedSeatsStr})</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 15px;">
                    <span style="display: block; color: #64748b; font-size: 12px; text-transform: uppercase;">Departure</span>
                    <strong style="color: #0f172a; font-size: 16px;">${finalBookingData.flight.origin}</strong>
                    <div style="color: #475569; font-size: 14px; margin-top: 4px;">${finalBookingData.flight.departureTime}</div>
                  </td>
                  <td style="padding-bottom: 15px;">
                    <span style="display: block; color: #64748b; font-size: 12px; text-transform: uppercase;">Arrival</span>
                    <strong style="color: #0f172a; font-size: 16px;">${finalBookingData.flight.destination}</strong>
                    <div style="color: #475569; font-size: 14px; margin-top: 4px;">${finalBookingData.flight.arrivalTime}</div>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top: 10px; border-top: 1px solid #e2e8f0;">
                    <span style="display: block; color: #64748b; font-size: 12px; text-transform: uppercase;">Passengers (${passengerCount})</span>
                    <strong style="color: #0f172a; font-size: 15px;">${passengerNamesStr}</strong>
                  </td>
                </tr>
              </table>
            </div>

            <div style="background: #e0e7ff; border-radius: 8px; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #3730a3; font-weight: 600;">Total Paid</span>
              <strong style="color: #312e81; font-size: 20px;">₹${calculatedTotal.toLocaleString()}</strong>
            </div>
          </div>
          
          <div style="background: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 13px;">
            <p style="margin: 0;">Thank you for flying with Aero Space.</p>
            <p style="margin: 5px 0 0 0;">Safe travels! 🌍</p>
          </div>
        </div>
      `;

      const recipientEmail = finalBookingData.passengers?.email || user.email;

      const templateParams = {
        email: recipientEmail,
        to_email: recipientEmail,
        user_email: user.email,
        passenger_name: passengerNamesStr,
        flight_number: `${finalBookingData.flight.airline} ${finalBookingData.flight.flightNumber}`,
        route: `${finalBookingData.flight.origin} to ${finalBookingData.flight.destination}`,
        departure_date: finalBookingData.searchData.date,
        departure_time: finalBookingData.flight.departureTime,
        arrival_time: finalBookingData.flight.arrivalTime,
        duration: finalBookingData.flight.duration,
        seats: assignedSeatsStr,
        booking_ref: docRef.id.substring(0, 6).toUpperCase(),
        total_price: `₹${calculatedTotal.toLocaleString()}`,
        airline_logo: finalBookingData.flight.airlineLogo,
        company_logo: companyLogo,
        html_ticket: htmlContent
      };

      emailjs.send(
        "service_j8vtled",
        "template_ticket",
        templateParams
      ).then(
        (response) => console.log('Email sent successfully!', response.status, response.text),
        (error) => console.error('Failed to send email:', error)
      );

      setCurrentStep(6);
    } catch (e) {
      console.error('Error adding document: ', e);
      alert('Failed to save booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSearchData(null);
    setBookingData({
      flight: null,
      selectedClass: null,
      passengers: null,
      selectedSeats: null,
      seatFee: 0,
      payment: null
    });
    setBookingId('');
    setCurrentStep(1);
  };

  // ── Loading splash ──────────────────────────────────────────────
  if (user === undefined) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
        color: '#6366f1',
        fontSize: '1.5rem',
        gap: '1rem',
        flexDirection: 'column',
      }}>
        <Plane size={48} style={{ animation: 'spin 1.5s linear infinite' }} />
        <span style={{ color: '#94a3b8', fontSize: '1rem' }}>Loading Aero Space...</span>
      </div>
    );
  }

  // ── Not logged in → show Login Page ────────────────────────────
  if (!user) {
    return <LoginPage />;
  }

  // ── Logged in → show booking app ───────────────────────────────
  return (
    <div className="app-container">
      <Header
        onMyBookingsClick={() => setShowMyBookings(true)}
        onLogoClick={() => setShowMyBookings(false)}
        user={user}
        onLogout={() => {
          signOut(auth);
          setShowMyBookings(false);
          handleReset();
        }}
      />

      <main className="main-content">
        {showMyBookings ? (
          <MyBookings user={user} />
        ) : (
          <>
            {/* 6-Step Stepper */}
            {currentStep > 1 && currentStep < 6 && (
              <div className="stepper animate-fade-in">
                <div className={`step ${currentStep >= 2 ? 'completed' : ''}`}>
                  <div className="step-icon"><Search size={16} /></div>
                  <span>Search</span>
                </div>
                <div className="step-divider"></div>

                <div className={`step ${currentStep >= 2 ? (currentStep > 2 ? 'completed' : 'active') : ''}`}>
                  <div className="step-icon"><Plane size={16} /></div>
                  <span>Flights</span>
                </div>
                <div className="step-divider"></div>

                <div className={`step ${currentStep >= 3 ? (currentStep > 3 ? 'completed' : 'active') : ''}`}>
                  <div className="step-icon"><User size={16} /></div>
                  <span>Passengers</span>
                </div>
                <div className="step-divider"></div>

                <div className={`step ${currentStep >= 4 ? (currentStep > 4 ? 'completed' : 'active') : ''}`}>
                  <div className="step-icon"><Armchair size={16} /></div>
                  <span>Seats</span>
                </div>
                <div className="step-divider"></div>

                <div className={`step ${currentStep >= 5 ? (currentStep > 5 ? 'completed' : 'active') : ''}`}>
                  <div className="step-icon"><CreditCard size={16} /></div>
                  <span>Payment</span>
                </div>
                <div className="step-divider"></div>

                <div className={`step ${currentStep === 6 ? 'completed' : ''}`}>
                  <div className="step-icon"><CheckCircle size={16} /></div>
                  <span>Confirmed</span>
                </div>
              </div>
            )}

            {/* Step Content */}
            {currentStep === 1 && <SearchForm onSearch={handleSearch} />}

            {currentStep === 2 && (
              <FlightResults
                searchData={searchData}
                onBack={() => setCurrentStep(1)}
                onSelectFlight={handleSelectFlight}
                user={user}
              />
            )}

            {currentStep === 3 && (
              <PassengerForm
                selectedFlight={bookingData.flight}
                searchData={searchData}
                onBack={() => setCurrentStep(2)}
                onSubmit={handlePassengerSubmit}
              />
            )}

            {currentStep === 4 && (
              <SeatSelection
                selectedFlight={bookingData.flight}
                selectedClass={bookingData.selectedClass}
                passengers={bookingData.passengers}
                onBack={() => setCurrentStep(3)}
                onConfirmSeats={handleSeatConfirm}
              />
            )}

            {currentStep === 5 && (
              <PaymentForm
                bookingData={bookingData}
                userEmail={user.email}
                onBack={() => setCurrentStep(4)}
                onSubmit={handlePaymentSubmit}
                isSubmitting={isSubmitting}
              />
            )}

            {currentStep === 6 && (
              <BookingConfirmation
                bookingData={bookingData}
                bookingId={bookingId}
                onReset={handleReset}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
