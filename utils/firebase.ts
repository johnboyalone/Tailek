import { initializeApp } from "firebase/app";
import { getFirestore, DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

// =================================================================================
// TODO: PASTE YOUR FIREBASE CONFIGURATION OBJECT HERE
// คุณสามารถหาค่าเหล่านี้ได้จากหน้า Project Settings ใน Firebase Console ของคุณ
// =================================================================================
// ใช้ Environment Variables เพื่อความปลอดภัย
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a reference to the Firestore database service
export const db = getFirestore(app);

// Export types
export type { DocumentData, QueryDocumentSnapshot };
