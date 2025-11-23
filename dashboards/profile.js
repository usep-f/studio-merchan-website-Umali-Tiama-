import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// 1. FIREBASE CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyBd-IxyiDnyfwv7XDntnfHesmqD4_p8fzo", 
    authDomain: "studio-merchan.firebaseapp.com",
    projectId: "studio-merchan",
    storageBucket: "studio-merchan.firebasestorage.app",
    messagingSenderId: "148020122490",
    appId: "1:148020122490:web:5c06af526e6b47a77b3cc3",
    measurementId: "G-QMC8J9PP9D"
};

// 2. SUPABASE CONFIG
// ⚠️ PASTE YOUR SUPABASE KEYS HERE ⚠️
const supabaseUrl = 'YOUR_SUPABASE_URL_HERE';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY_HERE';

// Initialize
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const supabase = createClient(supabaseUrl, supabaseKey);

let currentUserUID = null;

// 3. CHECK AUTH STATE
// We need to make sure they are actually logged in before we let them save data.
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserUID = user.uid;
        console.log("User detected:", currentUserUID);
        
        // OPTIONAL CHECK: If they already have a profile, skip this page
        const { data } = await supabase.from('clients').select('*').eq('client_uid', currentUserUID).single();
        if (data) {
            window.location.href = "dashboard.html";
        }
    } else {
        // If not logged in, kick them back to login
        window.location.href = "login.html";
    }
});

// 4. HANDLE FORM SUBMIT
document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorDiv = document.getElementById('profile-error');
    errorDiv.style.display = 'none';

    if (!currentUserUID) {
        errorDiv.textContent = "Error: User not authenticated.";
        errorDiv.style.display = 'block';
        return;
    }

    // Collect Data
    const profileData = {
        client_uid: currentUserUID, // The crucial link!
        full_name: document.getElementById('full_name').value,
        phone_number: document.getElementById('phone_number').value,
        artist_name: document.getElementById('artist_name').value,
        role: document.getElementById('role').value
    };

    // Insert into Supabase
    const { error } = await supabase
        .from('clients')
        .insert([profileData]);

    if (error) {
        console.error(error);
        errorDiv.textContent = "Save Failed: " + error.message;
        errorDiv.style.display = 'block';
    } else {
        // Success! Send them to the Dashboard
        window.location.href = "dashboard.html";
    }
});