import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { collection, getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain:process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:  process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId:  process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Auth
const auth = getAuth(app);
const db = getFirestore(app);
const usersCollection = collection(db, "users");

export { app, auth, db, usersCollection };


