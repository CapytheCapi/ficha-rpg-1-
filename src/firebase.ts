import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDvUg4fxdOMKjXeuSA-PezqO4LeinIcnoc",
  authDomain: "ficha-rpg-c9d30.firebaseapp.com",
  projectId: "ficha-rpg-c9d30",
  storageBucket: "ficha-rpg-c9d30.firebasestorage.app",
  messagingSenderId: "725937555508",
  appId: "1:725937555508:web:51ef13bd52eaef326e2261",
  measurementId: "G-BCPVCSVDD5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); 