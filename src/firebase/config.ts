import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// User's manual Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDrNaZyAs1IB3yomBOQTAQm0yTMHkLXJ5o",
  authDomain: "smartcrowd-lite.firebaseapp.com",
  projectId: "smartcrowd-lite",
  storageBucket: "smartcrowd-lite.firebasestorage.app",
  messagingSenderId: "116917351731",
  appId: "1:116917351731:web:745c03119a1dbe9b3c3a46",
  measurementId: "G-KL9ZSN29N4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and Auth
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { db, auth, app, googleProvider };

