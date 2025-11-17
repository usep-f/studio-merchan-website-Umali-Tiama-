// 1. Import the functions you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
// You can also export other tools if you need them later (like Auth)

// 2. Your Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBd-IxyiDnyfwv7XDntnfHesmqD4_p8fzo",
  authDomain: "studio-merchan.firebaseapp.com",
  projectId: "studio-merchan",
  storageBucket: "studio-merchan.firebasestorage.app",
  messagingSenderId: "148020122490",
  appId: "1:148020122490:web:5c06af526e6b47a77b3cc3",
  measurementId: "G-QMC8J9PP9D"
};

// 3. Initialize and EXPORT the database
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); // <--- Notice the word 'export'