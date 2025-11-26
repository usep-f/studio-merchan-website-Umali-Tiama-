/* =========================================
   1. SUPABASE CONFIGURATION
   ========================================= */
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// KEYS
const supabaseUrl = 'https://cishguvndzwtlbchhqbf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpc2hndXZuZHp3dGxiY2hocWJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NTg0NjMsImV4cCI6MjA3OTMzNDQ2M30.kKcLTk5BTTyDF_tcwTORM93vp-3rDtCpSmj9ypoZECY'
const supabase = createClient(supabaseUrl, supabaseKey)

/* =========================================
   2. VARIABLES & ELEMENTS
   ========================================= */
// Global Objects
let studioCalendar, liveCalendar;
let studioBookedRanges = [];
let liveBookedRanges = [];

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
   3. INITIALIZATION
   ========================================= */
document.addEventListener('DOMContentLoaded', function() {
    
    // A. Init Studio Calendar
    var studioCalEl = document.getElementById('calendar-studio');
    studioCalendar = new FullCalendar.Calendar(studioCalEl, {
        initialView: 'dayGridMonth',
        validRange: { start: new Date().toISOString().split('T')[0] },
        headerToolbar: { left: 'prev,next today', center: 'title', right: '' },
        dateClick: function(info) { handleDateClick(info.dateStr, 'studio'); },
        events: []
    });
    studioCalendar.render();

    // B. Init Live Calendar
    var liveCalEl = document.getElementById('calendar-live');
    liveCalendar = new FullCalendar.Calendar(liveCalEl, {
        initialView: 'dayGridMonth',
        validRange: { start: new Date().toISOString().split('T')[0] },
        headerToolbar: { left: 'prev,next today', center: 'title', right: '' },
        eventDisplay: 'block', // Shows event as a block with title (time)
        dateClick: function(info) { handleDateClick(info.dateStr, 'live'); },
        events: []
    });
    liveCalendar.render();

    // C. Fetch Initial Data
    fetchStudioBookings('Studio A'); // Default
    fetchLiveBookings();

    // D. Listeners
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

    // Tab Switching Listener (via custom event from HTML)
    window.addEventListener('switchBookingTab', (e) => {
        toggleSection(e.detail.mode);
    });
});

/* =========================================
   4. UI LOGIC (TABS)
   ========================================= */
function toggleSection(mode) {
    showMessage('', 'none'); // Clear messages
    
    if (mode === 'studio') {
        // SHOW STUDIO: Remove hidden class, add flex class
        studioSection.classList.remove('d-none');
        studioSection.classList.add('d-flex');
        
        // HIDE LIVE: Remove flex class, add hidden class
        liveSection.classList.remove('d-flex');
        liveSection.classList.add('d-none');
        
        // Update Tabs
        tabStudio.classList.add('active');
        tabLive.classList.remove('active');
        
        studioCalendar.updateSize(); 
    } else {
        // HIDE STUDIO
        studioSection.classList.remove('d-flex');
        studioSection.classList.add('d-none');
        
        // SHOW LIVE
        liveSection.classList.remove('d-none');
        liveSection.classList.add('d-flex');
        
        // Update Tabs
        tabStudio.classList.remove('active');
        tabLive.classList.add('active');
        
        liveCalendar.updateSize(); 
    }
}

/* =========================================
   5. STUDIO BOOKING FUNCTIONS
   ========================================= */

async function fetchStudioBookings(studioName) {
    studioCalendar.removeAllEvents();
    studioBookedRanges = [];

    const { data, error } = await supabase
        .from('bookings')
        .select('start_date, end_date')
        .eq('studio', studioName);

    if (error) {
        console.error('Studio Fetch Error:', error);
        return;
    }

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
        status: 'Pending'
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
    // Conflict Check
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
   6. LIVE BOOKING FUNCTIONS
   ========================================= */

async function fetchLiveBookings() {
    liveCalendar.removeAllEvents();
    liveBookedRanges = [];

    // Assuming table name 'live_bookings' exists
    const { data, error } = await supabase
        .from('live_bookings')
        .select('start_time, end_time, event_type');

    if (error) {
        console.error('Live Fetch Error:', error);
        return;
    }

    const events = data.map(booking => {
        liveBookedRanges.push({
            start: new Date(booking.start_time),
            end: new Date(booking.end_time)
        });
        
        return {
            start: booking.start_time,
            end: booking.end_time,
            title: 'Booked: ' + booking.event_type,
            color: '#c8761d' // Orange for Live
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
        status: 'Pending'
    };

    if (!validateLiveBooking(booking)) return;

    // Assuming table 'live_bookings'
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

    // Conflict Check (Time based)
    for (let range of liveBookedRanges) {
        // Overlap logic: (StartA < EndB) and (EndA > StartB)
        if (start < range.end && end > range.start) {
            showMessage('That time slot is already booked.', 'error');
            return false;
        }
    }
    return true;
}

/* =========================================
   7. SHARED HELPERS
   ========================================= */

function handleDateClick(dateStr, mode) {
    if (mode === 'studio') {
        startDateInput.value = dateStr;
        endDateInput.value = dateStr;
        studioForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        // For Live, we autofill the date part of datetime-local
        // dateStr is usually YYYY-MM-DD
        // We set default times: Start 12:00, End 16:00
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