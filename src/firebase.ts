import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCXoGd4k4q0U8BwS4BEHrST0oyYDzqFas8",
  authDomain: "agritech-logbook-live.firebaseapp.com",
  projectId: "agritech-logbook-live",
  storageBucket: "agritech-logbook-live.firebasestorage.app",
  messagingSenderId: "656885425519",
  appId: "1:656885425519:web:6a52a162e10030e05ab49a",
  measurementId: "G-W9W0QB6FF6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
getAnalytics(app);

// Export instances to use in the components
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);