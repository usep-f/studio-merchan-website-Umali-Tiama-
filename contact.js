/* =========================================
   1. IMPORTS & CONFIG
   ========================================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- FIREBASE CONFIG ---
// (Same config as your admin.js/dashboard.js)
const firebaseConfig = {
    apiKey: "AIzaSyBd-IxyiDnyfwv7XDntnfHesmqD4_p8fzo",
    authDomain: "studio-merchan.firebaseapp.com",
    projectId: "studio-merchan",
    storageBucket: "studio-merchan.firebasestorage.app",
    messagingSenderId: "148020122490",
    appId: "1:148020122490:web:5c06af526e6b47a77b3cc3",
    measurementId: "G-QMC8J9PP9D"
};

// Initialize
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* =========================================
   2. FORM SUBMISSION LOGIC
   ========================================= */
const contactForm = document.getElementById('contact-form');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // UI Feedback
        const btn = document.getElementById('btn-send');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = 'SENDING... <span class="spinner-border spinner-border-sm ms-2"></span>';

        // Gather Data
        const formData = {
            name: document.getElementById('contact-name').value,
            email: document.getElementById('contact-email').value,
            subject: document.getElementById('contact-subject').value,
            message: document.getElementById('contact-message').value,
            timestamp: serverTimestamp(), // Server-side time
            status: 'unread' // Useful for Admin Panel later
        };

        try {
            // Save to Firestore Collection 'contact_messages'
            await addDoc(collection(db, "contact_messages"), formData);

            // Success State
            alert("Message sent successfully! We'll be in touch.");
            contactForm.reset();
            btn.innerHTML = 'MESSAGE SENT <i class="bi bi-check-lg"></i>';
            btn.classList.remove('btn-primary'); // Optional style change
            btn.style.backgroundColor = '#198754'; // Green color

            // Reset button after 3 seconds
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
                btn.style.backgroundColor = '#c9761c'; // Back to Orange
            }, 3000);

        } catch (error) {
            console.error("Error sending message: ", error);
            alert("Something went wrong. Please try again or email us directly.");
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}