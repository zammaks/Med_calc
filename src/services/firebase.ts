import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC8lZ0FNgngM69sE4es0yDlxPV51gqGVzI",
  authDomain: "medical-calculator-93207.firebaseapp.com",
  projectId: "medical-calculator-93207",
  storageBucket: "medical-calculator-93207.firebasestorage.app",
  messagingSenderId: "800702780139",
  appId: "1:800702780139:web:2d5bf2836e629b0482e4ae",
  measurementId: "G-6SHZJD4YDT"
};

const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);
