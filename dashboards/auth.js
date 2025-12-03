import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* 1. Firebase Configuration and Initialization */
const firebaseConfig = {
    apiKey: "AIzaSyBd-IxyiDnyfwv7XDntnfHesmqD4_p8fzo",
    authDomain: "studio-merchan.firebaseapp.com",
    projectId: "studio-merchan",
    storageBucket: "studio-merchan.firebasestorage.app",
    messagingSenderId: "148020122490",
    appId: "1:148020122490:web:5c06af526e6b47a77b3cc3",
    measurementId: "G-QMC8J9PP9D"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

/* 2. Login Form Submission Handler
   This function handles the asynchronous sign-in process and redirects 
   the user to the dashboard upon successful authentication. */
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('auth-error');

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                window.location.href = "dashboard.html";
            })
            .catch((error) => {
                errorDiv.style.display = 'block';
                errorDiv.textContent = "Login Failed: " + error.message;
            });
    });
}

/* 3. Signup Form Submission Handler
   This function handles new user registration, including password 
   confirmation, and redirects to the profile setup page upon success. */
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const errorDiv = document.getElementById('auth-error');

        if (password !== confirmPassword) {
            errorDiv.style.display = 'block';
            errorDiv.textContent = "Passwords do not match.";
            return;
        }

        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                window.location.href = "setup-profile.html";
            })
            .catch((error) => {
                errorDiv.style.display = 'block';
                errorDiv.textContent = "Error: " + error.message;
            });
    });
}

/* 4. Auth State Listener
   This listener provides real-time console feedback on the user's 
   authentication state for debugging purposes. */
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User is signed in:", user.uid);
    } else {
        console.log("No user signed in.");
    }
});