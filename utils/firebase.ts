import { initializeApp } from "firebase/app";
import { getFirestore, DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

// =================================================================================
// TODO: PASTE YOUR FIREBASE CONFIGURATION OBJECT HERE
// คุณสามารถหาค่าเหล่านี้ได้จากหน้า Project Settings ใน Firebase Console ของคุณ
// =================================================================================
const firebaseConfig = {
  apiKey: "AIzaSyCNhlBoxWAvuFxol5YZM5zbcS6MAxiusx0",
  authDomain: "tailek.firebaseapp.com",
  projectId: "tailek",
  storageBucket: "tailek.appspot.com",
  messagingSenderId: "532397147592",
  appId: "1:532397147592:web:708de36fcf69af95caacfd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a reference to the Firestore database service
export const db = getFirestore(app);

// Export types
export type { DocumentData, QueryDocumentSnapshot };
