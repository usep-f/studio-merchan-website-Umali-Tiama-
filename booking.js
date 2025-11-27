/* =========================================
   1. IMPORTS & CONFIG
   ========================================= */
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
// NEW: Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- FIREBASE CONFIG (Matches your admin/signup config) ---
const firebaseConfig = {
    apiKey: "AIzaSyBd-IxyiDnyfwv7XDntnfHesmqD4_p8fzo",
    authDomain: "studio-merchan.firebaseapp.com",
    projectId: "studio-merchan",
    storageBucket: "studio-merchan.firebasestorage.app",
    messagingSenderId: "148020122490",
    appId: "1:148020122490:web:5c06af526e6b47a77b3cc3",
    measurementId: "G-QMC8J9PP9D"
};

// --- SUPABASE CONFIG ---
const supabaseUrl = 'https://cishguvndzwtlbchhqbf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpc2hndXZuZHp3dGxiY2hocWJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NTg0NjMsImV4cCI6MjA3OTMzNDQ2M30.kKcLTk5BTTyDF_tcwTORM93vp-3rDtCpSmj9ypoZECY'

// Initialize
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const supabase = createClient(supabaseUrl, supabaseKey)

/* =========================================
   2. VARIABLES & ELEMENTS
   ========================================= */
// Global Objects
let studioCalendar, liveCalendar;
let studioBookedRanges = [];
let liveBookedRanges = [];
let currentUserUid = null; // <--- The Important Link Variable

// STUDIO Elements
const studioSection = document.getElementById('studio-section');
const studioForm = document.getElementById('studio-form');
const studioSelect = document.getElementById('studio');
const serviceSelect = document.getElementById('service_type');
const startDateInput = document.getElementById('start_date');
const endDateInput = document.getElementById('end_date');

// LIVE Elements
const liveSection = document.getElementById('live-section');
const liveForm = document.getElementById('live-form');
const liveStartInput = document.getElementById('live_start_time');
const liveEndInput = document.getElementById('live_end_time');

// Common
const msgBox = document.getElementById('message-box');
const tabStudio = document.getElementById('tab-studio');
const tabLive = document.getElementById('tab-live');

/* =========================================
   3. INITIALIZATION & AUTH LISTENER
   ========================================= */
document.addEventListener('DOMContentLoaded', function() {
    
    // A. Init Calendars
    initStudioCalendar();
    initLiveCalendar();

    // B. Fetch Bookings (Red Blocks)
    fetchStudioBookings('Studio A');
    fetchLiveBookings();

    // C. Setup Event Listeners
    setupEventListeners();

    // D. NEW: Auth State Listener (The "Brain")
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log("User Logged In:", user.email);
            currentUserUid = user.uid; // 1. Save the Link
            
            // 2. Fetch User Profile to Auto-Fill Forms
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('client_uid', currentUserUid)
                .single();
            
            if (data && !error) {
                console.log("Profile Found. Auto-filling forms...");
                // Auto-fill Studio Form
                document.getElementById('customer_name').value = data.full_name || '';
                document.getElementById('customer_address').value = data.phone_number || ''; // contact input
                
                // Auto-fill Live Form
                document.getElementById('live_customer_name').value = data.full_name || '';
                document.getElementById('live_contact').value = data.phone_number || '';
            }
        } else {
            console.log("Guest Mode (No User)");
            currentUserUid = null;
            // Optional: Clear fields if user logs out on this page, but usually unnecessary
        }
    });
});

/* =========================================
   4. CALENDAR SETUP FUNCTIONS
   ========================================= */
function initStudioCalendar() {
    var studioCalEl = document.getElementById('calendar-studio');
    studioCalendar = new FullCalendar.Calendar(studioCalEl, {
        initialView: 'dayGridMonth',
        validRange: { start: new Date().toISOString().split('T')[0] },
        headerToolbar: { left: 'prev,next today', center: 'title', right: '' },
        dateClick: function(info) { handleDateClick(info.dateStr, 'studio'); },
        events: []
    });
    studioCalendar.render();
}

function initLiveCalendar() {
    var liveCalEl = document.getElementById('calendar-live');
    liveCalendar = new FullCalendar.Calendar(liveCalEl, {
        initialView: 'dayGridMonth',
        validRange: { start: new Date().toISOString().split('T')[0] },
        headerToolbar: { left: 'prev,next today', center: 'title', right: '' },
        eventDisplay: 'block',
        dateClick: function(info) { handleDateClick(info.dateStr, 'live'); },
        events: []
    });
    liveCalendar.render();
}

function setupEventListeners() {
    // Studio Dropdown Logic
    studioSelect.addEventListener('change', (e) => fetchStudioBookings(e.target.value));
    
    // Mastering Logic
    serviceSelect.addEventListener('change', (e) => {
        if (e.target.value === 'Mastering') {
            studioSelect.value = 'Studio C';
            studioSelect.disabled = true;
            fetchStudioBookings('Studio C');
        } else {
            studioSelect.disabled = false;
        }
    });

    // Form Submits
    studioForm.addEventListener('submit', handleStudioSubmit);
    liveForm.addEventListener('submit', handleLiveSubmit);

    // Tabs
    window.addEventListener('switchBookingTab', (e) => toggleSection(e.detail.mode));
}

/* =========================================
   5. UI LOGIC (TABS)
   ========================================= */
function toggleSection(mode) {
    showMessage('', 'none'); 
    
    if (mode === 'studio') {
        studioSection.classList.remove('d-none');
        studioSection.classList.add('d-flex');
        
        liveSection.classList.remove('d-flex');
        liveSection.classList.add('d-none');
        
        tabStudio.classList.add('active');
        tabLive.classList.remove('active');
        studioCalendar.updateSize(); 
    } else {
        studioSection.classList.remove('d-flex');
        studioSection.classList.add('d-none');
        
        liveSection.classList.remove('d-none');
        liveSection.classList.add('d-flex');
        
        tabStudio.classList.remove('active');
        tabLive.classList.add('active');
        liveCalendar.updateSize(); 
    }
}

/* =========================================
   6. STUDIO BOOKING FUNCTIONS
   ========================================= */
async function fetchStudioBookings(studioName) {
    studioCalendar.removeAllEvents();
    studioBookedRanges = [];

    const { data, error } = await supabase
        .from('bookings')
        .select('start_date, end_date')
        .eq('studio', studioName);

    if (error) { console.error('Studio Fetch Error:', error); return; }

    const events = data.map(booking => {
        studioBookedRanges.push({
            start: new Date(booking.start_date),
            end: new Date(booking.end_date)
        });
        return {
            start: booking.start_date,
            end: addDays(booking.end_date, 1),
            display: 'background',
            color: '#8B0000',
            title: 'Booked'
        };
    });
    studioCalendar.addEventSource(events);
}

async function handleStudioSubmit(e) {
    e.preventDefault();
    showMessage('', 'none');

    const booking = {
        customer_name: document.getElementById('customer_name').value,
        customer_contact: document.getElementById('customer_address').value,
        service_type: serviceSelect.value,
        studio: studioSelect.value,
        start_date: startDateInput.value,
        end_date: endDateInput.value,
        status: 'Pending',
        // NEW: Attach the User ID (will be null if Guest)
        client_uid: currentUserUid 
    };

    if (!validateStudioBooking(booking)) return;

    const { error } = await supabase.from('bookings').insert([booking]);

    if (error) {
        showMessage('Booking failed. Please try again.', 'error');
    } else {
        showMessage('Studio Booking Successful!', 'success');
        studioForm.reset();
        studioSelect.disabled = false;
        fetchStudioBookings(booking.studio);
        // If user is still logged in, re-fill name/contact for convenience?
        // For now, let's leave it cleared to indicate success state clearly.
    }
}

function validateStudioBooking(b) {
    if (!b.start_date || !b.end_date) {
        showMessage('Please select dates.', 'error');
        return false;
    }
    if (b.end_date < b.start_date) {
        showMessage('End Date cannot be before Start Date.', 'error');
        return false;
    }
    if (b.start_date < new Date().toLocaleDateString('en-CA')) {
        showMessage('Cannot book past dates.', 'error');
        return false;
    }
    const start = new Date(b.start_date);
    const end = new Date(b.end_date);
    for (let range of studioBookedRanges) {
        if (start <= range.end && end >= range.start) {
            showMessage('Selected dates are already booked.', 'error');
            return false;
        }
    }
    return true;
}

/* =========================================
   7. LIVE BOOKING FUNCTIONS
   ========================================= */
async function fetchLiveBookings() {
    liveCalendar.removeAllEvents();
    liveBookedRanges = [];

    const { data, error } = await supabase
        .from('live_bookings')
        .select('start_time, end_time, event_type');

    if (error) { console.error('Live Fetch Error:', error); return; }

    const events = data.map(booking => {
        liveBookedRanges.push({
            start: new Date(booking.start_time),
            end: new Date(booking.end_time)
        });
        
        return {
            start: booking.start_time,
            end: booking.end_time,
            title: 'Booked: ' + booking.event_type,
            color: '#c8761d'
        };
    });
    liveCalendar.addEventSource(events);
}

async function handleLiveSubmit(e) {
    e.preventDefault();
    showMessage('', 'none');

    const booking = {
        customer_name: document.getElementById('live_customer_name').value,
        contact_number: document.getElementById('live_contact').value,
        event_type: document.getElementById('live_event_type').value,
        location: document.getElementById('live_location').value,
        package: document.getElementById('live_package').value,
        start_time: liveStartInput.value,
        end_time: liveEndInput.value,
        status: 'Pending',
        // NEW: Attach the User ID
        client_uid: currentUserUid 
    };

    if (!validateLiveBooking(booking)) return;

    const { error } = await supabase.from('live_bookings').insert([booking]);

    if (error) {
        console.error(error);
        showMessage('Live Booking failed. Check console.', 'error');
    } else {
        showMessage('Live Sound Booking Successful!', 'success');
        liveForm.reset();
        fetchLiveBookings();
    }
}

function validateLiveBooking(b) {
    if (!b.start_time || !b.end_time) {
        showMessage('Please select start and end times.', 'error');
        return false;
    }
    const start = new Date(b.start_time);
    const end = new Date(b.end_time);
    const now = new Date();

    if (end <= start) {
        showMessage('End time must be after start time.', 'error');
        return false;
    }
    if (start < now) {
        showMessage('Cannot book in the past.', 'error');
        return false;
    }
    for (let range of liveBookedRanges) {
        if (start < range.end && end > range.start) {
            showMessage('That time slot is already booked.', 'error');
            return false;
        }
    }
    return true;
}

/* =========================================
   8. SHARED HELPERS
   ========================================= */
function handleDateClick(dateStr, mode) {
    if (mode === 'studio') {
        startDateInput.value = dateStr;
        endDateInput.value = dateStr;
        studioForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        liveStartInput.value = `${dateStr}T12:00`;
        liveEndInput.value = `${dateStr}T16:00`;
        liveForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function showMessage(text, type) {
    msgBox.textContent = text;
    msgBox.style.display = type === 'none' ? 'none' : 'block';
    
    if (type === 'error') {
        msgBox.style.backgroundColor = '#f8d7da';
        msgBox.style.color = '#721c24';
        msgBox.style.border = '1px solid #f5c6cb';
    } else if (type === 'success') {
        msgBox.style.backgroundColor = '#d4edda';
        msgBox.style.color = '#155724';
        msgBox.style.border = '1px solid #c3e6cb';
    }
}

function addDays(dateStr, days) {
    const result = new Date(dateStr);
    result.setDate(result.getDate() + days);
    return result.toISOString().split('T')[0];
}