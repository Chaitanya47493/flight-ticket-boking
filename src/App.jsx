import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SearchForm from './components/SearchForm';
import FlightResults from './components/FlightResults';
import PassengerForm from './components/PassengerForm';
import PaymentForm from './components/PaymentForm';
import BookingConfirmation from './components/BookingConfirmation';
import MyBookings from './components/MyBookings';
import LoginPage from './components/LoginPage';
import { Search, Plane, User, CreditCard, CheckCircle } from 'lucide-react';
import { db, auth } from './firebase';
import { collection, addDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import emailjs from '@emailjs/browser';
import './App.css';

// Initialize EmailJS with your actual public key (Verified: capital 'I' after 'sg')
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
    payment: null,
  });

  const handleSearch = (data) => {
    setSearchData(data);
    setCurrentStep(2);
  };

  const handleSelectFlight = (flight, selectedClass) => {
    setBookingData({ ...bookingData, flight, selectedClass });
    setCurrentStep(3);
  };

  const handlePassengerSubmit = (passengers) => {
    setBookingData({ ...bookingData, passengers, searchData, createdAt: new Date() });
    setCurrentStep(4);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePaymentSubmit = async (paymentData) => {
    setIsSubmitting(true);
    const finalBookingData = {
      ...bookingData,
      payment: paymentData,
      userId: user.uid,
    };
    setBookingData(finalBookingData);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const docRef = await addDoc(collection(db, 'bookings'), finalBookingData);
      
      // Send Email Ticket
      const templateParams = {
        email: user.email,
        passenger_name: `${finalBookingData.passengers.firstName} ${finalBookingData.passengers.lastName}`,
        flight_number: `${finalBookingData.flight.airline} ${finalBookingData.flight.flightNumber}`,
        route: `${finalBookingData.flight.origin} to ${finalBookingData.flight.destination}`,
        departure_date: finalBookingData.searchData.date,
        departure_time: finalBookingData.flight.departureTime,
        arrival_time: finalBookingData.flight.arrivalTime,
        duration: finalBookingData.flight.duration,
        booking_ref: docRef.id.substring(0, 6).toUpperCase(),
        total_price: `₹${finalBookingData.selectedClass.price.toLocaleString()}`
      };

      emailjs.send(
        "service_j8vtled", // Your Service ID
        "template_ticket", // Your Template ID
        templateParams
      ).then(
        (response) => console.log('Email sent successfully!', response.status, response.text),
        (error) => console.error('Failed to send email:', error)
      );

      setCurrentStep(5);
    } catch (e) {
      console.error('Error adding document: ', e);
      alert('Failed to save booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSearchData(null);
    setBookingData({ flight: null, selectedClass: null, passengers: null, payment: null });
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
        <span style={{ color: '#94a3b8', fontSize: '1rem' }}>Loading SkyBook...</span>
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
            {/* Stepper */}
            {currentStep > 1 && currentStep < 5 && (
              <div className="stepper animate-fade-in">
                <div className={`step ${currentStep >= 2 ? 'completed' : ''}`}>
                  <div className="step-icon"><Search size={18} /></div>
                  <span>Search</span>
                </div>
                <div className="step-divider"></div>

                <div className={`step ${currentStep >= 2 ? (currentStep > 2 ? 'completed' : 'active') : ''}`}>
                  <div className="step-icon"><Plane size={18} /></div>
                  <span>Select Flight</span>
                </div>
                <div className="step-divider"></div>

                <div className={`step ${currentStep >= 3 ? (currentStep > 3 ? 'completed' : 'active') : ''}`}>
                  <div className="step-icon"><User size={18} /></div>
                  <span>Passenger Info</span>
                </div>
                <div className="step-divider"></div>

                <div className={`step ${currentStep >= 4 ? (currentStep > 4 ? 'completed' : 'active') : ''}`}>
                  <div className="step-icon"><CreditCard size={18} /></div>
                  <span>Payment</span>
                </div>
                <div className="step-divider"></div>

                <div className={`step ${currentStep === 5 ? 'completed' : ''}`}>
                  <div className="step-icon"><CheckCircle size={18} /></div>
                  <span>Confirmation</span>
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
                onBack={() => setCurrentStep(2)}
                onSubmit={handlePassengerSubmit}
              />
            )}

            {currentStep === 4 && (
              <PaymentForm
                bookingData={bookingData}
                onBack={() => setCurrentStep(3)}
                onSubmit={handlePaymentSubmit}
                isSubmitting={isSubmitting}
              />
            )}

            {currentStep === 5 && (
              <BookingConfirmation
                bookingData={bookingData}
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
