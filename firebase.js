// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeAuth, getReactNativePersistence, getAuth, browserLocalPersistence, setPersistence, browserSessionPersistence, inMemoryPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA600hE7owqcST-so_io-IJ4-fP1CwRlwE",
  authDomain: "tournament-2fdf4.firebaseapp.com",
  projectId: "tournament-2fdf4",
  storageBucket: "tournament-2fdf4.firebasestorage.app",
  messagingSenderId: "230059253546",
  appId: "1:230059253546:web:4b1f54a2cfa54cac438853",
  measurementId: "G-TZ3LRYC066"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth based on Platform
let auth;

if (Platform.OS === 'web') {
  auth = getAuth(app);
  setPersistence(auth, browserSessionPersistence);
} else {
  try {
    // Essaie de récupérer l'instance existante (pour éviter le crash au rechargement)
    auth = getAuth(app);
  } catch (e) {
    // Si elle n'existe pas, on l'initialise avec la persistance en mémoire (déconnexion à la fermeture)
    auth = initializeAuth(app, {
      persistence: inMemoryPersistence
    });
  }
}

export { auth };
export const db = getFirestore(app);