import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 1. PASTE YOUR FIREBASE CONFIG HERE
const firebaseConfig = {
    apiKey: "AIzaSyBd-IxyiDnyfwv7XDntnfHesmqD4_p8fzo", // <--- CHECK THIS
    authDomain: "studio-merchan.firebaseapp.com",
    projectId: "studio-merchan",
    storageBucket: "studio-merchan.firebasestorage.app",
    messagingSenderId: "148020122490",
    appId: "1:148020122490:web:5c06af526e6b47a77b3cc3",
    measurementId: "G-QMC8J9PP9D"
};

// 2. Initialize
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 3. Handle LOGIN Page
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('auth-error');

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Success! Redirect to Dashboard
                window.location.href = "dashboard.html";
            })
            .catch((error) => {
                errorDiv.style.display = 'block';
                errorDiv.textContent = "Login Failed: " + error.message;
            });
    });
}

// 4. Handle SIGNUP Page
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const errorDiv = document.getElementById('auth-error');

        // Basic Validation
        if (password !== confirmPassword) {
            errorDiv.style.display = 'block';
            errorDiv.textContent = "Passwords do not match.";
            return;
        }

        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Success! Redirect to Profile Setup
                // We send them here first to get their Name/Phone before the dashboard
                window.location.href = "setup-profile.html";
            })
            .catch((error) => {
                errorDiv.style.display = 'block';
                errorDiv.textContent = "Error: " + error.message;
            });
    });
}

// 5. Auth State Listener (Optional Debugging)
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User is signed in:", user.uid);
    } else {
        console.log("No user signed in.");
    }
});