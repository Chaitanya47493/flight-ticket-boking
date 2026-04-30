import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDW020jyZCNj_2OuJKBPq9MX9r7koABaT4",
  authDomain: "flight-ticket-booking-e8331.firebaseapp.com",
  projectId: "flight-ticket-booking-e8331",
  storageBucket: "flight-ticket-booking-e8331.firebasestorage.app",
  messagingSenderId: "904730325863",
  appId: "1:904730325863:web:c4ff9638508d5350aff5c2",
  measurementId: "G-NQF05Q33SH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
