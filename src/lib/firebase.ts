// ============================================================================
// FIREBASE CONFIGURATION AND INITIALIZATION
// ============================================================================
// This file serves as the bridge between our React application and the Firebase backend.
// It initializes the Firebase app instance and exports specific services (Auth, Firestore)
// so they can be easily imported and used throughout the application.

// 1. IMPORT FIREBASE SDKs
// ----------------------------------------------------------------------------
// We import the specific functions we need from the Firebase SDKs.
// 'firebase/app' is the core SDK that allows us to initialize an app instance.
import { initializeApp, getApps } from "firebase/app";

// 'firebase/auth' handles user authentication (Login, Register, Google Sign-in).
import { getAuth } from "firebase/auth";

// 'firebase/firestore' is the database we use to store tasks and user data.
import { getFirestore } from "firebase/firestore";

// 2. FIREBASE CONFIGURATION OBJECT
// ----------------------------------------------------------------------------
// This object contains the unique identifiers for our specific Firebase project.
// These values are obtained from the Firebase Console (Project Settings).
// NOTE: In a production app, these should ideally be stored in environment variables (.env.local)
// to keep them secure and separate from the codebase, but for this project they are hardcoded.
const firebaseConfig = {
  // Unique API key for authenticating requests from this app
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  // The domain where OAuth redirects happen (e.g. after Google Sign-in)
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  // The unique identifier for the Google Cloud project
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // The location where files (images, videos) would be stored (if we used Storage)
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  // Used for Firebase Cloud Messaging (Push Notifications)
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  // Unique ID for this specific web app within the Firebase project
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // Analytics ID for tracking user behavior
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// 3. INITIALIZATION AND EXPORTS
// ----------------------------------------------------------------------------
// Initialize the Firebase app.
// We use a safe check `getApps().length === 0` to prevent "Firebase App named '[DEFAULT]' already exists" errors.
// This is common in development environments where hot-reloading might trigger this file multiple times.
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Export the Authentication instance
// We will use this 'auth' object in our AuthContext to manage user sessions.
export const auth = getAuth(app);

// Export the Firestore Database instance
// We will use this 'db' object in our TaskContext to read/write task data.
export const db = getFirestore(app);
