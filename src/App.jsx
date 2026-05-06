import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SearchForm from './components/SearchForm';
import FlightResults from './components/FlightResults';
import PassengerForm from './components/PassengerForm';
import PaymentForm from './components/PaymentForm';
import BookingConfirmation from './components/BookingConfirmation';
import MyBookings from './components/MyBookings';
import AuthModal from './components/AuthModal';
import { Search, Plane, User, CreditCard, CheckCircle } from 'lucide-react';
import { db, auth } from './firebase';
import { collection, addDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // Don't overwrite if we're using the demo user
      if (user?.uid !== 'demo-123') {
        setUser(currentUser);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const handleDemoLogin = () => {
    setUser({ uid: 'demo-123', email: 'demo@example.com' });
    setIsAuthModalOpen(false);
  };
  const [showMyBookings, setShowMyBookings] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [searchData, setSearchData] = useState(null);
  const [bookingData, setBookingData] = useState({
    flight: null,
    selectedClass: null,
    passengers: null,
    payment: null
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
      userId: user ? user.uid : null, // associate booking with user if logged in
    };
    setBookingData(finalBookingData);
    
    try {
      // Small simulated delay for realistic payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      await addDoc(collection(db, "bookings"), finalBookingData);
      setCurrentStep(5);
    } catch (e) {
      console.error("Error adding document: ", e);
      alert("Failed to save booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSearchData(null);
    setBookingData({ flight: null, selectedClass: null, passengers: null, payment: null });
    setCurrentStep(1);
  };

  return (
    <div className="app-container">
      <Header 
        onMyBookingsClick={() => {
          if (!user) {
            setIsAuthModalOpen(true);
          } else {
            setShowMyBookings(true);
          }
        }} 
        onLogoClick={() => setShowMyBookings(false)} 
        user={user}
        onLoginClick={() => setIsAuthModalOpen(true)}
        onLogout={() => {
          if (user?.uid === 'demo-123') {
            setUser(null);
          } else {
            signOut(auth);
          }
          setShowMyBookings(false);
        }}
      />
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onDemoLogin={handleDemoLogin}
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
        {currentStep === 1 && (
          <SearchForm onSearch={handleSearch} />
        )}
        
        {currentStep === 2 && (
          <FlightResults 
            searchData={searchData} 
            onBack={() => setCurrentStep(1)} 
            onSelectFlight={handleSelectFlight}
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
